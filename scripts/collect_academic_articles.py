#!/usr/bin/env python3
"""Türkçe akademik makale adaylarını OpenAlex üzerinden keşfeder.
Kurulum: pip install httpx
Kullanım: python scripts/collect_academic_articles.py --pages 2
OPENALEX_API_KEY ortam değişkeni desteklenir. Mevcut kütüphane değiştirilmez.
"""
import argparse
import hashlib
import json
import os
import sqlite3
import time
import unicodedata
from pathlib import Path
from urllib.parse import urlparse
import httpx

ROOT = Path(__file__).resolve().parents[1]
QUERIES = {
    "Psikolojik danışmanlık": ["psikolojik danışmanlık", "okul psikolojik danışmanlığı", "rehberlik servisi"],
    "Psikoloji": ["çocuk psikolojisi", "ergen psikolojisi", "psikolojik sağlamlık", "öz şefkat"],
    "Kriz ve risk": ["akran zorbalığı", "siber zorbalık", "okul terki", "travma sonrası stres"],
    "Kariyer rehberliği": ["kariyer danışmanlığı", "mesleki rehberlik"],
    "Öğrenci gelişimi": ["sınav kaygısı", "akademik motivasyon", "öz düzenleme"],
    "Özel eğitim": ["kapsayıcı eğitim", "özel eğitim", "bireyselleştirilmiş eğitim programı"],
    "Aile": ["ebeveyn tutumları", "aile danışmanlığı"],
}
def norm(s):
    return " ".join(unicodedata.normalize("NFKD", str(s).casefold()).split())
def doi_key(s):
    return str(s or "").lower().replace("https://doi.org/", "").replace("http://dx.doi.org/", "").strip()
def existing_keys():
    keys = set()
    for name in ("library.json", "new-resources-batch.json", "collected-resources.json"):
        p = ROOT / "data" / name
        if not p.exists(): continue
        try: data = json.loads(p.read_text(encoding="utf-8"))
        except (ValueError, OSError): continue
        if isinstance(data, dict): data = data.get("resources", data.get("items", []))
        if not isinstance(data, list): continue
        for row in data:
            if not isinstance(row, dict): continue
            if row.get("doi"): keys.add("doi:" + doi_key(row["doi"]))
            if row.get("title"): keys.add("title:" + norm(row["title"]))
    return keys
def pdf_check(client, url):
    if not url or urlparse(url).scheme != "https": return False
    try:
        with client.stream("GET", url, headers={"Range":"bytes=0-1023", "Accept":"application/pdf"}, follow_redirects=True) as r:
            if r.status_code not in (200, 206): return False
            if "pdf" in r.headers.get("content-type", "").lower(): return True
            return next(r.iter_bytes(1024), b"").startswith(b"%PDF-")
    except (httpx.HTTPError, ValueError): return False
def candidate(work, area, topic, client, verify_pdf):
    if work.get("language") != "tr" or work.get("type") not in ("article", "review"): return None
    title = work.get("display_name") or work.get("title") or ""
    if not title.strip(): return None
    locs = [work.get("best_oa_location"), work.get("primary_location")] + (work.get("locations") or [])
    locs = [x for x in locs if isinstance(x, dict)]
    page = next((x.get("landing_page_url") for x in locs if x.get("landing_page_url")), None) or work.get("doi") or work.get("id")
    pdf = next((x.get("pdf_url") for x in locs if x.get("is_oa") and x.get("pdf_url")), None)
    verified = pdf_check(client, pdf) if verify_pdf and pdf else False
    authors = [x.get("author", {}).get("display_name") for x in work.get("authorships", []) if x.get("author", {}).get("display_name")]
    doi = doi_key(work.get("doi"))
    key = doi or work.get("id") or title
    source = next((x.get("source", {}).get("display_name") for x in locs if x.get("source") and x["source"].get("display_name")), "Akademik yayın")
    return {
        "id": "academic-" + hashlib.sha256(key.encode()).hexdigest()[:16],
        "title": title, "type": "Makale", "level": "Tüm kademeler",
        "area": area, "topic": topic, "source": source,
        "sourcePage": page, "file": pdf if verified else None,
        "fileType": "PDF" if verified else "Kaynak sayfası",
        "sourceType": "academic", "authors": authors,
        "publicationYear": work.get("publication_year"),
        "doi": doi or None, "language": "tr",
        "openAccess": bool(work.get("open_access", {}).get("is_oa")),
        "downloadStatus": "verified" if verified else ("verification-pending" if pdf else "not-available"),
        "directDownload": verified, "candidatePdf": pdf if not verified else None,
        "languageVerification": "metadata-only",
        "academicSourceId": work.get("id")
    }
def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--pages", type=int, default=1, help="Her sorgu için en fazla sayfa")
    ap.add_argument("--per-page", type=int, default=25)
    ap.add_argument("--verify-pdf", action="store_true", help="PDF'leri HTTP ile doğrula")
    ap.add_argument("--output", default="data/academic-articles-tr.json")
    ap.add_argument("--db", default="data/academic-articles-progress.sqlite")
    args = ap.parse_args()
    if args.pages < 1 or not 1 <= args.per_page <= 200: ap.error("Sayfa sayısı >=1, per-page 1..200 olmalı")
    db = ROOT / args.db; db.parent.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(db)
    conn.execute("CREATE TABLE IF NOT EXISTS works (key TEXT PRIMARY KEY, payload TEXT NOT NULL)")
    conn.execute("CREATE TABLE IF NOT EXISTS checkpoints (query TEXT, page INTEGER, PRIMARY KEY(query,page))")
    seen = existing_keys()
    with httpx.Client(timeout=25, headers={"User-Agent":"PDRKampusAcademicCollector/1.0 (public metadata)"}) as client:
        for area, topics in QUERIES.items():
            for topic in topics:
                for page in range(1, args.pages + 1):
                    if conn.execute("SELECT 1 FROM checkpoints WHERE query=? AND page=?", (topic,page)).fetchone(): continue
                    params = {"search":topic, "filter":"language:tr,from_publication_date:2020-01-01,to_publication_date:2026-12-31", "per_page":args.per_page, "page":page}
                    if os.getenv("OPENALEX_API_KEY"): params["api_key"] = os.environ["OPENALEX_API_KEY"]
                    try:
                        response = client.get("https://api.openalex.org/works", params=params)
                        response.raise_for_status()
                        results = response.json().get("results", [])
                    except (httpx.HTTPError, ValueError) as exc:
                        print(f"Atlandı: {topic} / {page}: {exc}"); continue
                    count = 0
                    for work in results:
                        row = candidate(work, area, topic, client, args.verify_pdf)
                        if not row: continue
                        keys = {"title:" + norm(row["title"])}
                        if row["doi"]: keys.add("doi:" + row["doi"])
                        if keys & seen: continue
                        seen.update(keys)
                        conn.execute("INSERT OR IGNORE INTO works VALUES (?,?)", (row["id"], json.dumps(row, ensure_ascii=False)))
                        count += 1
                    conn.execute("INSERT OR IGNORE INTO checkpoints VALUES (?,?)", (topic,page))
                    conn.commit()
                    print(f"{topic}: sayfa {page}, {count} yeni aday")
                    time.sleep(0.3)
    rows = [json.loads(r[0]) for r in conn.execute("SELECT payload FROM works")]
    rows.sort(key=lambda x: (-(x.get("publicationYear") or 0), x["title"]))
    output = ROOT / args.output; output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(json.dumps(rows, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"Toplam {len(rows)} aday -> {output}")
    print("NOT: language=tr yalnızca metadata filtresidir; tam metin Türkçe doğrulaması ayrıca gereklidir.")
if __name__ == "__main__": main()
