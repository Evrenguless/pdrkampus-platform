import json
import os
import time
import argparse
from pathlib import Path
from datetime import datetime, timezone
from urllib.parse import urlparse

import requests


BASE = Path(__file__).resolve().parents[1] / "data"
SCAN_STATE = Path(__file__).resolve().parents[1] / ".academic-scans"
JSON_FILE = BASE / "academic-articles-tr.json"
BACKUP_FILE = SCAN_STATE / "academic-articles-tr-dergipark-backup.json"
LOG_FILE = SCAN_STATE / "dergipark-tarama-log.jsonl"

DELAY = 15
TIMEOUT = 30


def now():
    return datetime.now(timezone.utc).isoformat()


def is_dergipark(url):
    if not isinstance(url, str):
        return False

    try:
        parsed = urlparse(url)

        return (
            parsed.scheme == "https"
            and parsed.hostname == "dergipark.org.tr"
            and not parsed.username
            and not parsed.password
        )
    except ValueError:
        return False


def load_data():
    with JSON_FILE.open("r", encoding="utf-8") as f:
        data = json.load(f)

    if not isinstance(data, list):
        raise ValueError("JSON dosyasının kökü liste olmalı.")

    return data


def save_data(data):
    temp = JSON_FILE.with_suffix(".json.tmp")

    with temp.open("w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
        f.flush()
        os.fsync(f.fileno())

    os.replace(temp, JSON_FILE)


def write_log(article, status, url, detail=""):
    record = {
        "time": now(),
        "id": article.get("id"),
        "title": article.get("title"),
        "status": status,
        "url": url,
        "detail": detail,
    }

    with LOG_FILE.open("a", encoding="utf-8") as f:
        f.write(json.dumps(record, ensure_ascii=False) + "\n")


def verify_pdf(session, url):
    try:
        # İndirme bağlantısını yalnızca DergiPark alan adında
        # doğrula. Başka siteye yönlendirmeyi otomatik izleme.
        with session.get(
            url,
            headers={"Range": "bytes=0-1023"},
            timeout=TIMEOUT,
            stream=True,
            allow_redirects=False,
        ) as response:

            status = response.status_code

            if status == 429:
                return (
                    "rate-limited",
                    None,
                    response.headers.get("Retry-After", "")
                )

            if status == 403:
                return "access-denied", None, ""

            if status in (301, 302, 303, 307, 308):
                target = response.headers.get("Location", "")
                return "redirect-unchecked", None, target

            if status == 404:
                return "not-found", None, ""

            if status not in (200, 206):
                return f"http-{status}", None, ""

            first_bytes = next(
                response.iter_content(chunk_size=1024),
                b""
            )

            if first_bytes.startswith(b"%PDF-"):
                return "verified", url, ""

            content_type = response.headers.get(
                "Content-Type", ""
            ).lower()

            if "text/html" in content_type:
                return "html-response", None, ""

            return "not-pdf", None, ""

    except requests.exceptions.SSLError as error:
        return "ssl-error", None, str(error)

    except requests.exceptions.RequestException as error:
        return "network-error", None, str(error)


def main():
    parser = argparse.ArgumentParser()

    parser.add_argument(
        "--limit",
        type=int,
        default=10,
        help="Kontrol edilecek en fazla bağlantı sayısı"
    )

    args = parser.parse_args()

    if args.limit < 1:
        parser.error("--limit en az 1 olmalı.")

    data = load_data()
    SCAN_STATE.mkdir(exist_ok=True)

    if not BACKUP_FILE.exists():
        BACKUP_FILE.write_bytes(JSON_FILE.read_bytes())

    session = requests.Session()

    session.headers.update({
        "User-Agent": "PDRKampusAcademicLibrary/1.0",
        "Accept": "application/pdf,*/*",
    })

    processed = 0
    found = 0
    stopped = False

    eligible = [
        article for article in data
        if article.get("directDownload") is not True
        and is_dergipark(article.get("candidatePdf"))
        and not article.get("dergiparkCheck")
    ]

    print("=" * 55)
    print("PDR KAMPÜS - DERGİPARK PDF DOĞRULAMA")
    print("=" * 55)
    print("Toplam makale:", len(data))
    print("Kontrol bekleyen DergiPark adayı:", len(eligible))
    print("Bu çalıştırmanın sınırı:", args.limit)

    for article in eligible[:args.limit]:
        url = article["candidatePdf"]

        print("\nMakale:", article.get("title", "")[:90])
        print("PDF adayı:", url)

        status, verified_url, detail = verify_pdf(session, url)

        article["dergiparkCheck"] = {
            "status": status,
            "checkedAt": now(),
            "detail": detail,
        }

        if status == "verified":
            article["file"] = verified_url
            article["fileType"] = "PDF"
            article["directDownload"] = True
            article["downloadStatus"] = "verified"
            article["candidatePdf"] = None

            found += 1
            print("✓ PDF doğrulandı")

        else:
            print("Durum:", status)

        save_data(data)
        write_log(article, status, url, detail)

        processed += 1

        # Erişim sınırı geldiğinde yeni istek gönderme.
        if status in ("rate-limited", "access-denied"):
            stopped = True
            print("\nSunucu erişimi sınırladı. Tarama durduruldu.")

            if status == "rate-limited" and detail:
                print("Retry-After:", detail)

            break

        if processed < min(args.limit, len(eligible)):
            print(f"{DELAY} saniye bekleniyor...")
            time.sleep(DELAY)

    verified_total = sum(
        x.get("directDownload") is True
        for x in data
    )

    print("\n" + "=" * 55)
    print("DERGİPARK TARAMA SONUCU")
    print("=" * 55)
    print("İşlenen:", processed)
    print("Yeni doğrulanan PDF:", found)
    print("Toplam doğrulanmış PDF:", verified_total)
    print("Erişim sınırı nedeniyle durdu:", "Evet" if stopped else "Hayır")
    print("JSON:", JSON_FILE)
    print("Yedek:", BACKUP_FILE)


if __name__ == "__main__":
    main()