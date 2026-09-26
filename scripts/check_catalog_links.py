"""Check every published static catalog file URL and its response type."""

import json
import sys
import urllib.error
import urllib.request
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def check(item):
    url = item["file"]
    expected = item["fileType"]
    for attempt in range(2):
        try:
            request = urllib.request.Request(url, method="HEAD", headers={"User-Agent": "PDR-Kampus-Catalog-Check/1.0"})
            with urllib.request.urlopen(request, timeout=30) as response:
                kind = response.headers.get("Content-Type", "").split(";")[0].lower()
                size = int(response.headers.get("Content-Length", "0"))
                accepted = kind == ("application/pdf" if expected == "PDF" else "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
                return item["id"], response.status == 200 and accepted and size > 0, response.status, kind, size
        except (urllib.error.URLError, TimeoutError, ValueError) as error:
            if attempt:
                return item["id"], False, str(error), "", 0


def main():
    files = [ROOT / "data/forms.json", ROOT / "data/library.json"]
    records = [record for path in files for record in json.loads(path.read_text(encoding="utf-8"))]
    with ThreadPoolExecutor(max_workers=8) as executor:
        results = list(executor.map(check, records))
    bad = [result for result in results if not result[1]]
    print(f"Checked {len(results)} files: {len(results) - len(bad)} OK, {len(bad)} failed")
    for result in bad:
        print("FAILED", *result, file=sys.stderr)
    return 1 if bad else 0


if __name__ == "__main__":
    raise SystemExit(main())
