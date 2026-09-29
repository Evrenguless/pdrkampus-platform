#!/usr/bin/env python3
from pathlib import Path
import json
import re
import sys
import xml.etree.ElementTree as ET

BASE = "https://pdrkampus.com/"
LEGACY_BASE = "https://evrenguless.github.io/pdrkampus-platform/"
ROOT = Path(__file__).resolve().parents[1]
SITEMAP = ROOT / "sitemap.xml"

def url_to_file(url: str) -> Path:
    rel = url.removeprefix(BASE)
    if rel == "":
        return ROOT / "index.html"
    if rel.endswith("/"):
        return ROOT / rel / "index.html"
    return ROOT / rel

def grab(pattern: str, html: str):
    m = re.search(pattern, html, flags=re.I | re.S)
    return m.group(1).strip() if m else None

tree = ET.parse(SITEMAP)
ns = {"s": "http://www.sitemaps.org/schemas/sitemap/0.9"}
urls = [n.text.strip() for n in tree.findall(".//s:loc", ns) if n.text]

errors = []
warnings = []
titles = {}
descriptions = {}

if (ROOT / "CNAME").read_text(encoding="utf-8").strip() != "pdrkampus.com":
    errors.append("CNAME ana alan adıyla uyuşmuyor")
if f"Sitemap: {BASE}sitemap.xml" not in (ROOT / "robots.txt").read_text(encoding="utf-8"):
    errors.append("robots.txt yeni alan adındaki sitemap'i göstermiyor")

for url in urls:
    if not url.startswith(BASE):
        errors.append(f"Sitemap farklı alan adında: {url}")
        continue
    path = url_to_file(url)
    if not path.exists():
        errors.append(f"Sitemap URL dosyası yok: {url} -> {path.relative_to(ROOT)}")
        continue

    html = path.read_text(encoding="utf-8")
    if LEGACY_BASE in html:
        errors.append(f"Eski alan adı kaldı: {path.relative_to(ROOT)}")
    title = grab(r"<title>(.*?)</title>", html)
    desc = grab(r'<meta\s+name=["\']description["\']\s+content=["\'](.*?)["\']', html)
    canonical = grab(r'<link\s+rel=["\']canonical["\']\s+href=["\'](.*?)["\']', html)
    og_url = grab(r'<meta\s+property=["\']og:url["\']\s+content=["\'](.*?)["\']', html)
    robots = grab(r'<meta\s+name=["\']robots["\']\s+content=["\'](.*?)["\']', html)
    h1_count = len(re.findall(r"<h1(?:\s[^>]*)?>.*?</h1>", html, flags=re.I | re.S))

    if not title:
        errors.append(f"Title eksik: {path.relative_to(ROOT)}")
    else:
        titles.setdefault(title, []).append(str(path.relative_to(ROOT)))

    if not desc:
        errors.append(f"Meta description eksik: {path.relative_to(ROOT)}")
    else:
        descriptions.setdefault(desc, []).append(str(path.relative_to(ROOT)))

    if not canonical:
        errors.append(f"Canonical eksik: {path.relative_to(ROOT)}")
    elif canonical != url:
        errors.append(
            f"Canonical/sitemap uyumsuz: {path.relative_to(ROOT)} | sitemap={url} | canonical={canonical}"
        )

    if robots and "noindex" in robots.lower():
        errors.append(f"Sitemap sayfasında noindex var: {path.relative_to(ROOT)}")

    if h1_count != 1:
        errors.append(f"H1 sayısı {h1_count}: {path.relative_to(ROOT)}")

    if not og_url:
        warnings.append(f"og:url eksik: {path.relative_to(ROOT)}")
    elif canonical and og_url != canonical:
        errors.append(
            f"og:url/canonical uyumsuz: {path.relative_to(ROOT)} | canonical={canonical} | og:url={og_url}"
        )

for value, paths in titles.items():
    if len(paths) > 1:
        warnings.append(f"Aynı title ({len(paths)}): {value} -> {', '.join(paths)}")

for value, paths in descriptions.items():
    if len(paths) > 1:
        warnings.append(f"Aynı description ({len(paths)}): {value} -> {', '.join(paths)}")



# Validate published topic dictionary entries against actual topic pages and sitemap.
topics_path = ROOT / "data/topics.json"
if topics_path.exists():
    try:
        topic_data = json.loads(topics_path.read_text(encoding="utf-8"))
        topic_rows = topic_data.get("topics", [])
        topic_urls = set(urls)
        published_by_slug = {}

        for topic in topic_rows:
            if not topic.get("indexable") or topic.get("contentStatus") != "published":
                continue
            slug = str(topic.get("slug", "")).strip()
            canonical_path = str(topic.get("canonicalPath", "")).strip()
            if not slug:
                errors.append("Published topic slug eksik")
                continue
            if slug in published_by_slug:
                errors.append(f"Duplicate published topic slug: {slug}")
            published_by_slug[slug] = topic

            expected_path = f"/konu/{slug}/"
            expected_url = BASE.rstrip("/") + expected_path
            if canonical_path != expected_path:
                errors.append(
                    f"Topic canonicalPath uyumsuz: {slug} | beklenen={expected_path} | bulunan={canonical_path or '-'}"
                )
            if expected_url not in topic_urls:
                errors.append(f"Published topic sitemap'te yok: {slug} -> {expected_url}")
            topic_file = ROOT / "konu" / slug / "index.html"
            if not topic_file.exists():
                errors.append(f"Published topic dosyası yok: konu/{slug}/index.html")

        for topic_file in (ROOT / "konu").glob("*/index.html"):
            slug = topic_file.parent.name
            if slug not in published_by_slug:
                errors.append(f"Konu sayfası sözlükte published değil: konu/{slug}/index.html")
    except Exception as exc:
        errors.append(f"data/topics.json doğrulanamadı: {exc}")

# Validate direct PDR Kampüs Library deep links such as kutuphane.html#resource-id.
library_ids = set()
for catalog_name in ("data/library.json", "data/forms.json"):
    catalog_path = ROOT / catalog_name
    if catalog_path.exists():
        try:
            rows = json.loads(catalog_path.read_text(encoding="utf-8"))
            library_ids.update(str(row.get("id")) for row in rows if row.get("id"))
        except Exception as exc:
            errors.append(f"Katalog okunamadı: {catalog_name} | {exc}")

for html_path in ROOT.rglob("*.html"):
    html = html_path.read_text(encoding="utf-8")
    for match in re.finditer(r'href=["\'][^"\']*kutuphane\.html#([^"\']+)["\']', html, flags=re.I):
        resource_id = match.group(1)
        if resource_id not in library_ids:
            errors.append(
                f"Kütüphane kaynak ID bulunamadı: {html_path.relative_to(ROOT)} -> {resource_id}"
            )

for personal in ("profil.html", "calisma-alani.html", "araclar.html", "belgeler.html", "bildirimler.html", "gonderi.html", "hesap.html", "kaynak-yonetimi.html", "platform.html", "soru.html", "topluluk-yonetimi.html"):
    p = ROOT / personal
    if p.exists():
        html = p.read_text(encoding="utf-8")
        robots = grab(r'<meta\s+name=["\']robots["\']\s+content=["\'](.*?)["\']', html)
        if not robots or "noindex" not in robots.lower():
            errors.append(f"Kişisel sayfa noindex değil: {personal}")

print(f"SEO audit: {len(urls)} sitemap URL kontrol edildi.")
for w in warnings:
    print("WARN:", w)
for e in errors:
    print("ERROR:", e)

if errors:
    print(f"\n{len(errors)} kritik SEO hatası bulundu.")
    sys.exit(1)

print(f"Başarılı. Kritik hata yok; {len(warnings)} uyarı var.")
