"""Check an explicitly authorized staging import using existing inspection/preview rules.

All results and previews stay outside the repository until a separate publication step.
"""
import argparse
import concurrent.futures
import hashlib
import json
import shutil
import time
from collections import Counter
from datetime import datetime, timezone
from pathlib import Path
from urllib.parse import urlsplit

from collect_resources import ROOT, Fetcher, allowed, canonical, extension, file_signature
from inspect_resource import inspect
from publish_collected_resources import publishable
from build_resource_previews import build


def now():
    return datetime.now(timezone.utc).isoformat().replace('+00:00', 'Z')


def candidate(row, approval):
    url = canonical(row['file'])
    title = row['title'].replace('i\u0307', 'i').replace('I\u0307', 'İ')
    return {'id': hashlib.sha256(url.encode()).hexdigest()[:24], 'importId': row['id'],
            'title': title, 'file_url': url, 'file_type': row['fileType'],
            'source_pages': [canonical(row['sourcePage'])], 'source_host': urlsplit(row['sourcePage']).hostname,
            'source_title': row.get('source', ''), 'discovered_at': approval['approvedAt'],
            'publicationApproved': True, 'licenseVerified': True, 'reviewStatus': 'approved',
            'approvalBasis': approval['basis'], 'approvedAt': approval['approvedAt']}


def prepare_one(row, approval, config, fetcher, output, known, known_hashes):
    record = {'importId': row['id'], 'title': row['title'], 'status': 'review_required'}
    try:
        if not (allowed(row['file'], config['allowed_domains']) and allowed(row['sourcePage'], config['allowed_domains'])
                and row['file'].startswith('https://') and row['sourcePage'].startswith('https://')):
            record['reason'] = 'outside_existing_official_domain_policy'
            return record
        c = candidate(row, approval)
        if c['file_url'] in known or row['sha256'] in known_hashes:
            record.update(status='duplicate', reason='already_in_catalogue')
            return record
        body, _, final = fetcher.get(c['file_url'], config['max_file_bytes'])
        if not final.startswith('https://'):
            record['reason'] = 'redirect_outside_https_policy'
            return record
        if canonical(final) in known:
            record.update(status='duplicate', reason='redirect_to_existing_catalogue')
            return record
        if not file_signature(body, extension(c['file_url'])):
            raise ValueError('File signature mismatch')
        digest = hashlib.sha256(body).hexdigest()
        if digest != row['sha256']:
            record['reason'] = 'source_changed_since_import'
            return record
        gate = inspect(body, extension(c['file_url']), c['title'])
        c.update(sha256=digest, resolved_url=final, access_verified_at=now(), status='review_ready', inspection=gate)
        c['title'] = gate.get('title', c['title'])
        if not publishable(c, known, known_hashes):
            record.update(reason='inspection_gate', inspection=gate)
            return record
        preview_row = {'id': 'collected-' + c['id'], 'file': c['file_url'], 'fileType': c['file_type'], 'contentSha256': digest}
        preview = build(preview_row, root=output, source_body=body)
        if not preview.get('thumbnail') or not preview.get('previews'):
            raise ValueError('No faithful document preview')
        record.update(status='ready', candidate=c, preview=preview)
    except Exception as error:
        record.update(reason=type(error).__name__, error=str(error)[:240])
    return record


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--approval', type=Path, required=True)
    parser.add_argument('--output', type=Path, required=True)
    parser.add_argument('--limit', type=int, default=400)
    args = parser.parse_args()
    if not 1 <= args.limit <= 400: parser.error('Existing per-run limit is 400 files')
    output = args.output.resolve()
    if output == ROOT or ROOT in output.parents: parser.error('Output must be outside repository')
    approval = json.loads(args.approval.read_text())
    if approval.get('publicationApproved') is not True or approval.get('usageAuthorized') is not True or not approval.get('basis') or not approval.get('approvedAt'):
        parser.error('Explicit publication/use authorization required')
    rows = json.loads((ROOT / '_staging/resources-1787.json').read_text())
    if approval.get('inputSha256') != hashlib.sha256((ROOT / '_staging/resources-1787.json').read_bytes()).hexdigest():
        parser.error('Authorization is for a different import')
    config = json.loads((ROOT / 'collector/config.json').read_text())
    catalog = []
    for name in ('library', 'forms', 'collected-resources'):
        catalog.extend(json.loads((ROOT / f'data/{name}.json').read_text()))
    known = {canonical(r['file']) for r in catalog}
    hashes = {r.get('contentSha256') for r in catalog}
    previews = json.loads((ROOT / 'data/resource-previews.json').read_text())
    hashes.update(v.get('sourceSha256') for v in previews.values())
    output.mkdir(parents=True, exist_ok=True)
    (output / 'seo').mkdir(exist_ok=True)
    shutil.copyfile(ROOT / 'seo/link-overrides.json', output / 'seo/link-overrides.json')
    path = output / 'review.json'
    review = json.loads(path.read_text()) if path.exists() else {}
    selected = [r for r in rows if r['id'] not in review][:args.limit]
    fetcher = Fetcher(config)
    started = time.monotonic()
    def check(row):
        if time.monotonic()-started >= config['max_seconds']: return None
        return prepare_one(row, approval, config, fetcher, output, known, hashes)
    with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:
        for result in pool.map(check, selected):
            if result is None: continue
            review[result['importId']] = result
            path.write_text(json.dumps(review, ensure_ascii=False, indent=2) + '\n')
            print(json.dumps({'checked': len(review), 'total': len(rows), 'ready': sum(r['status']=='ready' for r in review.values()), 'last_status': result['status'], 'reason': result.get('reason')}, ensure_ascii=False), flush=True)
    state = {'last_run': now(), 'candidates': [r['candidate'] for r in review.values() if r['status']=='ready']}
    (output / 'state.json').write_text(json.dumps(state, ensure_ascii=False, indent=2) + '\n')
    summary = {'checked': len(review), 'remaining': len(rows)-len(review), 'statuses':dict(Counter(r['status'] for r in review.values())), 'reasons':dict(Counter(r.get('reason','passed') for r in review.values())), 'elapsed_seconds':round(time.monotonic()-started,1)}
    (output / 'summary.json').write_text(json.dumps(summary, ensure_ascii=False, indent=2)+'\n')
    print(json.dumps(summary, ensure_ascii=False))


if __name__ == '__main__': main()
