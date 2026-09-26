#!/usr/bin/env python3
"""Import verified, individually linked MEB files from two inventory source pages.

Run from the repository root: python scripts/import_official_batches.py
The fixed row mapping is guarded by page counts and PDF filenames. Missing or
non-PDF responses are omitted and reported, never turned into catalogue cards.
"""
import csv
import json
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path
from urllib.parse import urljoin, urlsplit
from urllib.request import Request, urlopen

from lxml import html

ROOT = Path(__file__).resolve().parents[1]
QUEUE = ROOT / 'inventory-review/review-queue.csv'
CATALOG = ROOT / 'data/library.json'
REPORT = ROOT / 'docs/verified-batch-2026-09-26.json'
SOCIAL = 'https://orgm.meb.gov.tr/www/sosyal-duygusal-beceriler/icerik/3121'
BULLYING = 'https://orgm.meb.gov.tr/www/akran-zorbaligi/icerik/3132'
CLASS = 'https://orgm.meb.gov.tr/www/sinifrehberliketkinlikleri/icerik/1952'
CYBER = 'https://orgm.meb.gov.tr/www/siber-zorbalik/icerik/2086'
CAREER = 'https://orgm.meb.gov.tr/www/mesleki-rehberlik-programlari/icerik/3138'
BROCHURES = 'https://orgm.meb.gov.tr/www/brosurler/icerik/1364'


def links(page):
    with urlopen(Request(page, headers={'User-Agent': 'PDRKampusCatalog/1.0'}), timeout=25) as response:
        doc = html.fromstring(response.read())
    return [(urljoin(page, link.get('href')).replace('/mebpanel/5/meb_iys_dosyalar/', '/meb_iys_dosyalar/'), ' '.join(link.text_content().split()))
            for link in doc.xpath('//a[@href]')
            if urlsplit(link.get('href')).path.lower().endswith('.pdf')
            and 'ilkyardimokulukahramanlar' not in link.get('href').lower()]


def check_file(url):
    try:
        with urlopen(Request(url, method='HEAD', headers={'User-Agent': 'PDRKampusCatalog/1.0'}), timeout=25) as response:
            content_type = response.headers.get('Content-Type', '').lower()
            size = int(response.headers.get('Content-Length', '0'))
            if response.status == 200 and 'pdf' in content_type and size > 0:
                return True, size
            return False, f'{response.status} {content_type} {size}'
    except Exception as error:
        return False, str(error)


def row_record(row, url, page, prefix, area=None, topic=None):
    title = row['title']
    level = row['level'].replace('Okul Öncesi', 'Okul öncesi').replace('Tüm Kademeler', 'Tüm kademeler')
    kind = row['material_type'].strip()
    kind = {'Hikâye Kitabı': 'Hikâye kitabı', 'Kuramsal Kitapçık': 'Kılavuz',
            'Oyun Temelli Etkinlik Kitabı': 'Etkinlik kitabı',
            'Farkındalık Programı': 'Farkındalık programı',
            'Psikoeğitim Programı': 'Psikoeğitim programı',
            'Bireysel Müdahale Programı': 'Bireysel müdahale programı',
            'Kuramsal kitap': 'Kılavuz', 'Psikoeğitim': 'Psikoeğitim programı',
            'Hikâye kitabı': 'Hikâye kitabı'}.get(kind, kind)
    if not area:
        area = 'Veli' if 'Veli' in title or 'Aile' in title else 'Öğretmen' if 'Öğretmen' in title else 'Sosyal-duygusal'
    record = {'id': f'{prefix}-{row["row"]}', 'title': title, 'type': kind,
            'level': level, 'area': area, 'topic': topic or 'Sosyal duygusal beceriler',
            'source': 'MEB ÖRGM', 'sourcePage': page, 'file': url,
            'fileType': 'PDF', 'sourceType': 'official'}
    if ' / ' in level:
        record['levels'] = level.split(' / ')
    return record


def main():
    inventory = {int(row['row']): row for row in csv.DictReader(QUEUE.open(encoding='utf-8-sig'))}
    catalog = json.loads(CATALOG.read_text(encoding='utf-8'))
    known = {item['file'] for item in catalog if item.get('file')}
    social, bullying, class_links = links(SOCIAL), links(BULLYING), links(CLASS)
    cyber, career, brochures = links(CYBER), links(CAREER), links(BROCHURES)
    assert len(social) == 57 and 'sosyalduygusalbecerilerkitapcigi' in social[0][0] and 'velibireyselmudahaleprogrami' in social[-1][0], 'Social page changed; review mapping'
    assert len(bullying) == 29 and 'kuramsalkitap' in bullying[0][0] and 'obenimsirrimdi' in bullying[-1][0], 'Bullying page changed; review mapping'
    assert len(class_links) >= 4 and all('2021_09' in pair[0] for pair in class_links[:4]), 'Class page changed; review mapping'
    assert len(cyber) == 15 and 'Kuramsal_Kitap' in cyber[0][0] and 'Maceras' in cyber[-1][0], 'Cyber page changed; review mapping'
    assert len(career) == 3 and 'kagep' in career[1][0], 'Career page changed; review mapping'
    assert len(brochures) >= 18 and 'SYBER_ZORBALIK' in brochures[16][0], 'Brochures page changed; review mapping'

    # The page groups preschool and primary storybooks between grade-specific program blocks.
    social_rows = ([*range(547, 560)] + [*range(594, 599)] + [*range(560, 572)]
                   + [*range(599, 604)] + [*range(572, 583)] + [*range(583, 594)])
    assert len(social_rows) == len(social)
    bullying_rows = {0: 27, 1: 28, 2: 33, 3: 38, 4: 43,
                     5: 29, 7: 34, 8: 39, 9: 44,
                     10: 30, 12: 35, 13: 40, 14: 45,
                     15: 56, 16: 57,
                     17: 31, 18: 36, 19: 41, 20: 46,
                     21: 32, 22: 37, 23: 42, 24: 47,
                     25: 48, 26: 52, 27: 53, 28: 55}
    candidates = []
    for (url, _), number in zip(social, social_rows):
        candidates.append(row_record(inventory[number], url, SOCIAL, 'sdb'))
    for index, (url, _) in enumerate(bullying):
        if index in bullying_rows:
            candidates.append(row_record(inventory[bullying_rows[index]], url, BULLYING, 'akran', topic='Akran zorbalığı'))
        else:
            subject = 'Zorbalık yapan' if index == 6 else 'Zorbalığa maruz kalan'
            candidates.append({'id': f'akran-veli-bulteni-{index}', 'title': f'{subject} okul öncesi öğrencilerin velilerine yönelik bülten',
                               'type': 'Bülten', 'level': 'Okul öncesi', 'area': 'Veli', 'topic': 'Akran zorbalığı',
                               'source': 'MEB ÖRGM', 'sourcePage': BULLYING, 'file': url,
                               'fileType': 'PDF', 'sourceType': 'official'})
    for index, (url, _) in enumerate(class_links[:4]):
        level, grades = [('Okul öncesi', []), ('İlkokul', [1,2,3,4]),
                         ('Ortaokul', [5,6,7,8]), ('Lise', [9,10,11,12])][index]
        record = {'id': f'sinif-etkinlikleri-cilt-{index}', 'title': f'Sınıf Rehberlik Etkinlikleri · {level}',
                  'type': 'Etkinlik kitabı', 'level': level, 'area': 'Sosyal-duygusal',
                  'topic': 'Sınıf rehberliği', 'source': 'MEB ÖRGM', 'sourcePage': CLASS,
                  'file': url, 'fileType': 'PDF', 'sourceType': 'official'}
        if grades:
            record['grades'] = grades
        candidates.append(record)
    for index, (url, _) in enumerate(career):
        item = row_record(inventory[90 + index], url, CAREER, 'kariyer', area='Kariyer', topic='Kariyer')
        if index == 0:
            item['grades'] = [7, 8]
        candidates.append(item)
    cyber_titles = ['Siber Zorbalık Kuramsal Kitabı', 'Siber Zorbalık Afişi',
                    'Siber Zorbalık Veli Broşürü', 'Siber Zorbalık Öğretmen Broşürü',
                    'Siber Zorbalık Öğretmen Sunumu · İlkokul', 'Siber Zorbalık Öğretmen Sunumu · Ortaokul', 'Siber Zorbalık Öğretmen Sunumu · Lise',
                    'Siber Zorbalık Veli Sunumu · İlkokul', 'Siber Zorbalık Veli Sunumu · Ortaokul', 'Siber Zorbalık Veli Sunumu · Lise',
                    'Siber Zorbalık Psikoeğitim Programı · İlkokul', 'Siber Zorbalık Psikoeğitim Programı · Ortaokul', 'Siber Zorbalık Psikoeğitim Programı · Lise',
                    'İkizlerin Hikâyesi', "Kahraman'ın Macerası"]
    for index, (url, _) in enumerate(cyber):
        level = 'Tüm kademeler' if index < 4 else ['İlkokul', 'Ortaokul', 'Lise'][(index - 4) % 3] if index < 13 else 'İlkokul'
        kind = 'Kılavuz' if index == 0 else 'Afiş' if index == 1 else 'Broşür' if index < 4 else 'Sunum' if index < 10 else 'Psikoeğitim programı' if index < 13 else 'Hikâye kitabı'
        area = 'Veli' if index in (2,7,8,9) else 'Öğretmen' if index in (3,4,5,6) else 'Sosyal-duygusal'
        candidates.append({'id': f'siber-2022-{index+1:02d}', 'title': cyber_titles[index], 'type': kind,
                           'level': level, 'area': area, 'topic': 'Siber zorbalık', 'source': 'MEB ÖRGM',
                           'sourcePage': CYBER, 'file': url, 'fileType': 'PDF', 'sourceType': 'official'})
    for index, number in [(16,112),(17,113)]:
        candidates.append(row_record(inventory[number], brochures[index][0], BROCHURES, 'brosur', topic='Dijital güvenlik'))

    candidates = [row for row in candidates if row['file'] not in known]
    assert len({row['file'] for row in candidates}) == len(candidates), 'Duplicate candidate URL'
    checked, rejected = [], []
    with ThreadPoolExecutor(max_workers=8) as pool:
        futures = {pool.submit(check_file, row['file']): row for row in candidates}
        for future in as_completed(futures):
            row = futures[future]
            success, detail = future.result()
            if success:
                checked.append((row, detail))
            else:
                rejected.append({'id': row['id'], 'file': row['file'], 'reason': detail})
    verified = [row for row, _ in sorted(checked, key=lambda item: item[0]['id'])]
    CATALOG.write_text(json.dumps(catalog + verified, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    prior = json.loads(REPORT.read_text(encoding='utf-8')) if REPORT.exists() else {}
    report = {'source_pages': [SOCIAL, BULLYING, CLASS, CYBER, CAREER, BROCHURES],
              'before': prior.get('before', len(catalog)),
              'added': prior.get('added', 0) + len(verified), 'after': len(catalog) + len(verified),
              'verified_bytes': prior.get('verified_bytes', 0) + sum(size for _, size in checked),
              'rejected': [item for item in prior.get('rejected', []) if item['id'] not in {x['id'] for x in verified}] + rejected,
              'added_ids': prior.get('added_ids', []) + [row['id'] for row in verified]}
    # A previously rejected URL can be retried; keep each unresolved ID once.
    report['rejected'] = list({item['id']: item for item in report['rejected']}.values())
    REPORT.write_text(json.dumps(report, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    print(f'Added {len(verified)} verified files; catalogue now has {len(catalog) + len(verified)} entries')
    print(f'Rejected: {len(rejected)}; report: {REPORT}')


if __name__ == '__main__':
    main()
