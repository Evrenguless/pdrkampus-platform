#!/usr/bin/env python3
"""Add separately published RİBA school/class results sheets, without form duplicates."""
import csv
import gzip
import json
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path
from urllib.parse import urljoin, urlsplit
from urllib.request import Request, urlopen
from lxml import html

ROOT = Path(__file__).resolve().parents[1]
SOURCE = 'https://golcukram.meb.k12.tr/icerikler/rehberlikihtiyacbelirlemeanketlerininribagonderilmesi_17459085.html'
CATALOG = ROOT / 'data/library.json'
REPORT = ROOT / 'docs/verified-batch-2026-09-26.json'
QUEUE = ROOT / 'inventory-review/review-queue.csv.gz'


def check(url):
    try:
        with urlopen(Request(url, method='HEAD'), timeout=25) as response:
            kind = response.headers.get('Content-Type', '').lower()
            size = int(response.headers.get('Content-Length', 0))
            return response.status == 200 and 'spreadsheetml.sheet' in kind and size > 0, size
    except Exception as error:
        return False, str(error)


def main():
    with urlopen(SOURCE, timeout=25) as response:
        page = html.fromstring(response.read())
    links = [urljoin(SOURCE, a.get('href')) for a in page.xpath('//a[@href]')
             if urlsplit(a.get('href')).path.lower().endswith(('.pdf', '.xlsx'))]
    assert len(links) == 19 and 'Okul-Sonuc-Cizelgesi' in links[2] and 'Lise-Okul-Sonuc-Cizelgesi' in links[-1], 'RİBA page changed; review mapping'
    with gzip.open(QUEUE, 'rt', encoding='utf-8-sig') as source:
        inventory = {int(row['row']): row for row in csv.DictReader(source)}
    existing = json.loads(CATALOG.read_text(encoding='utf-8'))
    known = {row['file'] for row in existing if row.get('file')}
    indices = [(2,530),(3,531),(7,535),(8,536),(12,540),(13,541),(17,545),(18,546)]
    candidates = []
    for index, number in indices:
        row = inventory[number]
        level = row['level'].replace('Okul Öncesi', 'Okul öncesi')
        candidates.append({'id': f'riba-cizelge-{number}', 'title': row['title'],
                           'type': 'Sonuç çizelgesi', 'level': level, 'area': 'Bireyi Tanıma',
                           'topic': 'RİBA', 'source': 'Gölcük RAM / Konak RAM',
                           'sourcePage': SOURCE, 'file': links[index],
                           'fileType': 'XLSX', 'sourceType': 'official'})
    candidates = [row for row in candidates if row['file'] not in known]
    with ThreadPoolExecutor(max_workers=4) as pool:
        results = list(pool.map(check, [row['file'] for row in candidates]))
    verified = [row for row, (ok, _) in zip(candidates, results) if ok]
    rejected = [{'id': row['id'], 'file': row['file'], 'reason': detail}
                for row, (ok, detail) in zip(candidates, results) if not ok]
    CATALOG.write_text(json.dumps(existing + verified, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    report = json.loads(REPORT.read_text(encoding='utf-8'))
    if SOURCE not in report['source_pages']:
        report['source_pages'].append(SOURCE)
    report['added'] += len(verified)
    report['after'] = len(existing) + len(verified)
    report['verified_bytes'] += sum(size for ok, size in results if ok)
    report['added_ids'].extend(row['id'] for row in verified)
    report['rejected'].extend(rejected)
    REPORT.write_text(json.dumps(report, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    print(f'Added {len(verified)} RİBA XLSX sheets, rejected {len(rejected)}; library now {len(existing) + len(verified)}')


if __name__ == '__main__':
    main()
