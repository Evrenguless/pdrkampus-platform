"""Read-only editorial audit. Never writes to public catalogues or publishes files."""
import argparse
import csv
import hashlib
import json
import re
import unicodedata
from collections import Counter
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
TOPICS = {
    'Özel Eğitim ve BEP', 'Rehberlik Etkinlikleri', 'Akran Zorbalığı',
    'Sosyal ve Duygusal Beceriler', 'Kariyer Rehberliği', 'Kriz ve Psikososyal Destek',
    'YKS', 'Okula Uyum ve Selamlaşma', 'LGS', 'Ergenlik', 'İhmal ve İstismar',
    'Teknoloji Bağımlılığı', 'Devamsızlık', 'Sınav Kaygısı',
    'Öğrenme ve Çalışma Becerileri', 'Veli Görüşmeleri', 'Öğrenci Görüşmeleri',
}


def normalized(value):
    return ''.join(c for c in unicodedata.normalize('NFKD', value.casefold().replace('ı', 'i'))
                   if not unicodedata.combining(c))


def audit(rows, existing):
    issues = []
    ids = Counter(r['id'] for r in rows)
    hashes = Counter(r['sha256'] for r in rows)
    files = {r['file'] for r in existing}
    for r in rows:
        reasons = []
        title = r.get('title', '')
        text = normalized(title)
        if r.get('topic') not in TOPICS:
            reasons.append('unknown_category')
        if len(title.strip()) < 12 or text.strip() in {'indir', 'dosya', 'dokuman', 'sunum', 'form', 'etkinlik'}:
            reasons.append('short_or_generic_title')
        if re.search(r'\d{8}|\.(pdf|docx?|pptx?)\b|tiklay|tıklay|indirmek|\ufffd|\u0307', title, re.I):
            reasons.append('title_artifact')
        if r.get('topic') == 'Özel Eğitim ve BEP' and not any(t in text for t in ('ozel egitim', 'bep', 'engell', 'otizm', 'kaynas', 'butunles', 'yetersiz', 'ram', 'destek egitim')):
            reasons.append('special_education_title_needs_category_review')
        if r.get('level') == 'Belirtilmemiş' or ',' in r.get('level', ''):
            reasons.append('level_needs_normalization_before_publication')
        if ids[r['id']] > 1 or hashes[r['sha256']] > 1 or r['file'] in files:
            reasons.append('duplicate_identity_hash_or_existing_url')
        if reasons:
            issues.append({'id': r['id'], 'title': title, 'topic': r.get('topic'), 'reasons': reasons})
    return {'total': len(rows), 'public_additions': 0,
            'category_counts': dict(Counter(r['topic'] for r in rows)),
            'reason_counts': dict(Counter(x for issue in issues for x in issue['reasons'])),
            'flagged_records': len(issues), 'issues': issues,
            'note': 'Heuristic flags are review prompts, not confirmed content errors. All records require editorial and license review.'}


def validate_staging(rows):
    if not isinstance(rows, list) or len(rows) != 1787:
        raise ValueError('Expected exactly 1787 staged records')
    for r in rows:
        if (r.get('publicationApproved') is not False or r.get('licenseVerified') is not False
                or r.get('reviewStatus') != 'editorial_review_required'):
            raise ValueError('Staging approval flags changed: ' + str(r.get('id')))


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--output', type=Path, required=True, help='Local directory outside the repository')
    args = parser.parse_args()
    output = args.output.resolve()
    if output == ROOT or ROOT in output.parents:
        parser.error('Review exports must be outside the repository/public site')
    path = ROOT / '_staging/resources-1787.json'
    rows = json.loads(path.read_text(encoding='utf-8'))
    validate_staging(rows)
    existing = []
    for name in ('library', 'forms', 'collected-resources'):
        existing.extend(json.loads((ROOT / f'data/{name}.json').read_text(encoding='utf-8')))
    report = audit(rows, existing)
    report['input_sha256'] = hashlib.sha256(path.read_bytes()).hexdigest()
    output.mkdir(parents=True, exist_ok=True)
    (output / 'editorial-review.json').write_text(json.dumps(report, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    with (output / 'editorial-review.csv').open('w', encoding='utf-8-sig', newline='') as stream:
        writer = csv.DictWriter(stream, fieldnames=['id', 'title', 'topic', 'reasons'])
        writer.writeheader()
        for issue in report['issues']:
            # Prevent spreadsheet formula execution when reviewing imported titles.
            row = {k: '; '.join(v) if isinstance(v, list) else str(v or '') for k, v in issue.items()}
            writer.writerow({k: "'" + v if v.lstrip().startswith(('=', '+', '-', '@')) else v for k, v in row.items()})
    print(json.dumps({k: v for k, v in report.items() if k != 'issues'}, ensure_ascii=False))


if __name__ == '__main__':
    main()
