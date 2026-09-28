"""Check published catalog URLs without treating server MIME quirks as broken links."""

import json
import sys
import time
import urllib.error
import urllib.request
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CATALOGS = (ROOT / "data/forms.json", ROOT / "data/library.json")
BINARY_TYPES = {"PDF", "XLSX", "MP4", "PPTX", "DOCX", "DOC", "JPEG", "JPG", "PNG", "ZIP", "PPT"}

def open_url(url, method="HEAD"):
    headers = {
        "User-Agent": "Mozilla/5.0 (compatible; PDR-Kampus-Link-Check/2.0; +https://evrenguless.github.io/pdrkampus-platform/)"
    }
    if method == "GET":
        headers["Range"] = "bytes=0-1023"
    request = urllib.request.Request(url, method=method, headers=headers)
    return urllib.request.urlopen(request, timeout=25)

def check(item):
    url = item.get("file", "")
    expected = str(item.get("fileType", "")).upper()
    if not url:
        return item.get("id", "?"), False, "missing-url", "", 0, url

    last_error = ""
    for attempt in range(3):
        for method in ("HEAD", "GET"):
            try:
                with open_url(url, method) as response:
                    status = getattr(response, "status", 200)
                    kind = response.headers.get("Content-Type", "").split(";")[0].lower()
                    size_raw = response.headers.get("Content-Length", "0")
                    try:
                        size = int(size_raw or 0)
                    except ValueError:
                        size = 0

                    if not (200 <= status < 400):
                        last_error = f"http-{status}"
                        continue

                    # A binary catalog entry resolving to a normal HTML page is usually
                    # a removed file, login page or error wrapper, so flag it.
                    if expected in BINARY_TYPES and kind in {"text/html", "application/xhtml+xml"}:
                        return item.get("id", "?"), False, "html-instead-of-file", kind, size, url

                    return item.get("id", "?"), True, status, kind, size, url
            except urllib.error.HTTPError as error:
                last_error = f"http-{error.code}"
                # Some public servers reject HEAD while serving GET normally.
                if method == "HEAD" and error.code in {400, 403, 405, 406}:
                    continue
            except (urllib.error.URLError, TimeoutError, ValueError, ConnectionError) as error:
                last_error = str(error)

        if attempt < 2:
            time.sleep(1 + attempt)

    return item.get("id", "?"), False, last_error or "unreachable", "", 0, url

def main():
    records = [
        record
        for path in CATALOGS
        for record in json.loads(path.read_text(encoding="utf-8"))
    ]

    with ThreadPoolExecutor(max_workers=10) as executor:
        results = list(executor.map(check, records))

    bad = [result for result in results if not result[1]]
    ok = len(results) - len(bad)
    print(f"Checked {len(results)} catalog links: {ok} reachable, {len(bad)} failed")

    for item_id, _, reason, kind, size, url in bad:
        print(
            f"FAILED id={item_id} reason={reason} content_type={kind or '-'} size={size} url={url}",
            file=sys.stderr,
        )

    return 1 if bad else 0

if __name__ == "__main__":
    raise SystemExit(main())
