# -*- coding: utf-8 -*-
"""Append gated resources only to the collector's supplementary public catalogue."""
import argparse
import hashlib
import json
import re
from datetime import datetime
from pathlib import Path
from collect_resources import ROOT, allowed, canonical, source_title, extension, INSPECTION_VERSION
from seo_engine import protected
from resource_seo import page_path, build_pages


def publishable(row, known, hashes):
    fields = ('publicationApproved', 'licenseVerified', 'reviewStatus')
    if any(key in row for key in fields) and not (row.get('publicationApproved') is True and row.get('licenseVerified') is True and row.get('reviewStatus') == 'approved'): return False
    gate = row.get('inspection', {})
    if row.get('status') != 'review_ready' or not gate.get('eligible') or gate.get('review_reasons') or gate.get('version') != INSPECTION_VERSION: return False
    if gate.get('method') != 'full_readable_document_text_and_source_metadata' or gate.get('text_characters', 0) < 120: return False
    if not allowed(row.get('file_url', ''), ['meb.gov.tr', 'meb.k12.tr']): return False
    if not row['file_url'].startswith('https://') or not row.get('source_pages'): return False
    if not all(allowed(u, ['meb.gov.tr', 'meb.k12.tr']) and u.startswith('https://') for u in row['source_pages']): return False
    if canonical(row['file_url']) in known or row.get('sha256') in hashes: return False
    if extension(row['file_url']).upper() != row.get('file_type') or row['file_type'] not in ('PDF', 'DOC', 'DOCX', 'PPT', 'PPTX', 'XLS', 'XLSX', 'PNG', 'JPG', 'JPEG', 'WEBP'): return False
    if not gate.get('topics') or gate.get('material_type') in (None, 'Belirtilmiyor'): return False
    return bool(row.get('sha256') and len(row['sha256']) == 64 and row.get('access_verified_at'))


def append_resources(existing, candidates, catalogue, limit=300):
    before = json.dumps(existing, ensure_ascii=False, sort_keys=True)
    result = [dict(row) for row in existing]; known = {canonical(r['file']) for r in catalogue + existing}; hashes = {r.get('contentSha256') for r in existing}
    additions = []; text_hashes = {r.get('documentTextSha256') for r in existing if r.get('documentTextSha256')}
    for row in sorted(candidates, key=lambda r: (r['discovered_at'], r['id'])):
        if len(additions) >= limit: break
        if not publishable(row, known, hashes): continue
        gate = row['inspection']; levels = gate['levels']
        if gate.get('text_sha256') in text_hashes: continue
        entry = {'id': 'collected-' + row['id'], 'title': row['title'], 'type': gate['material_type'], 'level': levels[0] if len(levels) == 1 else ' / '.join(levels) if levels else 'Belirtilmiyor', 'area': 'Rehberlik', 'topic': gate['topics'][0], 'source': 'MEB · ' + row['source_host'], 'sourcePage': row['source_pages'][0], 'file': row['file_url'], 'fileType': row['file_type'], 'sourceType': 'official', 'contentSha256': row['sha256'], 'collectedAt': row['discovered_at'], 'checkedAt': row['access_verified_at']}
        if len(levels) > 1: entry['levels'] = levels
        entry['pagePath'] = page_path(entry)
        entry['documentInfo'] = gate.get('document_info', {})
        entry['documentWords'] = gate.get('word_count', 0)
        entry['documentTextSha256'] = gate.get('text_sha256')
        parts = re.split(r'\s+[|–-]\s+', row.get('source_title', ''))
        if len(parts) > 1 and len(parts[-1]) < 180: entry['source'] = parts[-1]
        result.append(entry); additions.append(entry['id']); known.add(canonical(entry['file'])); hashes.add(row['sha256']); text_hashes.add(gate.get('text_sha256'))
    assert json.dumps(result[:len(existing)], ensure_ascii=False, sort_keys=True) == before
    return result, additions


def main():
    parser = argparse.ArgumentParser(description=__doc__); parser.add_argument('--state', type=Path, required=True); parser.add_argument('--apply', action='store_true'); args = parser.parse_args()
    if not protected(ROOT)['pass']: raise ValueError('Original-file protection failed; publication refused')
    path = ROOT / 'data/collected-resources.json'; original = {p: hashlib.sha256((ROOT / p).read_bytes()).hexdigest() for p in ['data/library.json', 'data/forms.json']}
    existing = json.loads(path.read_text()); state = json.loads(args.state.read_text()); catalogue = json.loads((ROOT / 'data/library.json').read_text()) + json.loads((ROOT / 'data/forms.json').read_text())
    run_time = datetime.fromisoformat(state['last_run'].replace('Z','+00:00'))
    candidates = []
    for row in state['candidates']:
        try:
            checked = datetime.fromisoformat(row.get('access_verified_at', '').replace('Z','+00:00'))
            if 0 <= (run_time-checked).total_seconds() <= 172800: candidates.append(row)
        except ValueError: continue
    result, additions = append_resources(existing, candidates, catalogue)
    if args.apply and additions:
        path.write_text(json.dumps(result, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
        build_pages(ROOT, result)
    assert original == {p: hashlib.sha256((ROOT / p).read_bytes()).hexdigest() for p in original}
    print(json.dumps({'added': len(additions), 'ids': additions, 'applied': args.apply, 'target': 'data/collected-resources.json', 'original_catalogue_writes': 0, 'database_writes': 0}))


if __name__ == '__main__': main()
