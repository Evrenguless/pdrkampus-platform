#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Collect official public resources into a persistent, unpublished review queue."""
import argparse
import collections
import csv
from datetime import datetime, timezone
import hashlib
import html
from html.parser import HTMLParser
import io
import json
from pathlib import Path
import re
import time
import threading
from concurrent.futures import ThreadPoolExecutor
import unicodedata
from urllib.error import HTTPError
from urllib.parse import quote, unquote, urljoin, urlsplit, urlunsplit
from urllib.request import HTTPRedirectHandler, Request, build_opener
from urllib.robotparser import RobotFileParser
import zipfile

ROOT = Path(__file__).resolve().parents[1]
INSPECTION_VERSION = 3
EXTENSIONS = {'pdf', 'doc', 'docx', 'ppt', 'pptx', 'xls', 'xlsx', 'png', 'jpg', 'jpeg', 'webp'}


def fold(text):
    text = str(text).lower().replace('ı', 'i')
    return unicodedata.normalize('NFKD', text).encode('ascii', 'ignore').decode()


def canonical(url):
    parts = urlsplit(url)
    if parts.scheme not in ('https', 'http') or not parts.hostname or parts.username or parts.password:
        raise ValueError('Invalid public URL')
    if parts.port not in (None, 80, 443):
        raise ValueError('Nonstandard port')
    path = quote(unquote(parts.path or '/'), safe='/@:+,;=-._~')
    # File identity excludes only fragment; query may identify a different document.
    return urlunsplit((parts.scheme.lower(), parts.netloc.lower(), path, quote(parts.query, safe='=&?/:;+,%'), ''))


def allowed(url, domains):
    try:
        host = urlsplit(canonical(url)).hostname
        return any(host == d or host.endswith('.' + d) for d in domains)
    except ValueError:
        return False


def extension(url):
    return unquote(urlsplit(url).path).rsplit('.', 1)[-1].lower()


def resource_link(url, anchor):
    name = fold(unquote(urlsplit(url).path.rsplit('/', 1)[-1])).replace(' ', '').replace('_', '').replace('-', '')
    if any(word in name for word in ['sinavtakvim', 'sinavprogram', 'ogrencilist', 'personellist', 'notcizel', 'notlist']):
        return False
    if extension(url) in ('png', 'jpg', 'jpeg', 'webp'):
        if urlsplit(url).path.rsplit('/', 1)[-1].startswith('k_'): return False
        return any(word in fold(anchor + ' ' + unquote(url)) for word in ['pano', 'afis', 'poster'])
    return True


def source_title(anchor, filename):
    anchor = re.sub(r'\s+(?:için\s+)?tıklayınız\s*[.!]*\s*$', '', anchor, flags=re.I).strip()
    anchor = re.sub(r'^\d{8}[_ -]*', '', anchor).strip()
    generic = re.sub(r'[^a-z ]', '', fold(anchor)).strip()
    if len(anchor) >= 5 and '/' not in anchor and generic not in ('indir', 'tiklayiniz', 'dosya', 'buraya tiklayiniz', 'buradan indirebilirsiniz', 'tiklayin'):
        return anchor[:240]
    name = re.sub(r'^(?:[a-fA-F0-9]{8,}[_ -]+|\d{8}[_ -]*)', '', filename.rsplit('.', 1)[0])
    return re.sub(r'[_-]+', ' ', name)[:240]


class Links(HTMLParser):
    def __init__(self, source):
        super().__init__(); self.links = []; self.current = None; self.title = ''; self.in_title = False
        self.feed(source)

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if tag == 'title': self.in_title = True
        if tag == 'a': self.current = [attrs.get('href', ''), []]
        if tag == 'img' and self.current: self.current[1].append(attrs.get('alt', ''))

    def handle_data(self, data):
        if self.current: self.current[1].append(data)
        if self.in_title: self.title += data

    def handle_endtag(self, tag):
        if tag == 'title': self.in_title = False
        if tag == 'a' and self.current:
            self.links.append((self.current[0], ' '.join(' '.join(self.current[1]).split())))
            self.current = None


class OfficialRedirects(HTTPRedirectHandler):
    def __init__(self, domains): self.domains = domains

    def redirect_request(self, req, fp, code, msg, headers, newurl):
        if not allowed(newurl, self.domains): raise ValueError('Redirect leaves allowed official domains')
        return super().redirect_request(req, fp, code, msg, headers, newurl)


class Fetcher:
    def __init__(self, config):
        self.config = config; self.robots = {}; self.last = {}; self.delays = {}; self.guard = threading.Lock(); self.host_locks = {}

    def lock(self, url):
        host = urlsplit(url).hostname
        with self.guard: return self.host_locks.setdefault(host, threading.RLock())

    def wait(self, url):
        with self.lock(url):
            host = urlsplit(url).hostname
            time.sleep(max(0, max(self.config['host_delay_seconds'], self.delays.get(host, 0)) - (time.monotonic() - self.last.get(host, 0))))
            self.last[host] = time.monotonic()

    def robot(self, url):
        with self.lock(url): return self._robot(url)

    def _robot(self, url):
        parts = urlsplit(url); origin = parts.scheme + '://' + parts.netloc
        if origin not in self.robots:
            robot = RobotFileParser(origin + '/robots.txt')
            self.wait(url)
            try:
                request = Request(robot.url, headers={'User-Agent': self.config['user_agent']})
                with build_opener(OfficialRedirects(self.config['allowed_domains'])).open(request, timeout=self.config['timeout_seconds']) as response:
                    robot.parse(response.read(256000).decode('utf-8', 'replace').splitlines())
            except HTTPError as error:
                if error.code in (404, 410): robot.parse([])
                else: robot.disallow_all = True
            except Exception: robot.disallow_all = True
            self.robots[origin] = robot
            self.delays[parts.hostname] = robot.crawl_delay(self.config['user_agent']) or robot.crawl_delay('*') or 0
        return self.robots[origin].can_fetch(self.config['user_agent'], url)

    def get(self, url, limit):
        url = canonical(url)
        if not allowed(url, self.config['allowed_domains']): raise ValueError('Nonofficial URL')
        if not self.robot(url): raise ValueError('Robots denied or unavailable')
        self.wait(url)
        request = Request(url, headers={'User-Agent': self.config['user_agent']})
        with build_opener(OfficialRedirects(self.config['allowed_domains'])).open(request, timeout=self.config['timeout_seconds']) as response:
            final_url = canonical(response.url)
            # Redirect target must independently permit collection.
            if not self.robot(final_url): raise ValueError('Redirect target robots denied')
            body = response.read(limit + 1)
            if len(body) > limit: raise ValueError('Response exceeds size limit')
            return body, dict(response.headers), final_url


def file_signature(body, ext):
    if ext == 'pdf': return body.startswith(b'%PDF-')
    if ext in ('doc', 'xls', 'ppt'): return body.startswith(bytes.fromhex('d0cf11e0a1b11ae1'))
    if ext in ('docx', 'xlsx', 'pptx'):
        try:
            with zipfile.ZipFile(io.BytesIO(body)) as archive:
                names = set(archive.namelist())
                return '[Content_Types].xml' in names and {'docx': 'word/document.xml', 'xlsx': 'xl/workbook.xml', 'pptx': 'ppt/presentation.xml'}[ext] in names
        except (zipfile.BadZipFile, OSError): return False
    if ext == 'png': return body.startswith(b'\x89PNG\r\n\x1a\n')
    if ext in ('jpg', 'jpeg'): return body.startswith(b'\xff\xd8\xff')
    if ext == 'webp': return body.startswith(b'RIFF') and body[8:12] == b'WEBP'
    return False


def classify(title, config):
    text = fold(title)
    topics = [topic for topic, words in config['topic_keywords'].items() if any((re.search(r'\b' + re.escape(word) + r'\b', text) if len(word) <= 3 else word in text) for word in words)]
    kinds = [('Envanter', ['envanter']), ('Form', ['form', 'anket', 'tutanak', 'gozlem', 'sosyometri', 'beyan']),
             ('Sunum', ['sunum', 'sunu']), ('Pano', ['pano', 'afis', 'poster']),
             ('Broşür', ['brosur', 'bulten']), ('Yıllık plan', ['calisma plani', 'calismaplani', 'rehberlikplani', 'rehberlik plani', 'yillikplan', 'yillik_plan', 'yillik plan']), ('Kılavuz', ['kilavuz', 'rehber kitap']), ('Rapor', ['arastirma rapor']), ('Etkinlik', ['etkinlik', 'psikoegitim', 'program'])]
    kind = next((kind for kind, words in kinds if any(word in text for word in words)), 'Belirtilmiyor')
    levels = [label for label, word in [('Okul öncesi', 'okuloncesi'), ('İlkokul', 'ilkokul'), ('Ortaokul', 'ortaokul'), ('Lise', 'lise')] if word in text.replace(' ', '')]
    grade_text = text.replace('_', ' ')
    grades = {int(g) for g in re.findall(r'(?<!\d)(1[0-2]|[1-9])\s*\.?\s*sinif', grade_text)}
    # Printed plan templates use an empty branch field: "2/…… SINIFI".
    grades.update(int(g) for g in re.findall(r'(?<!\d)(1[0-2]|[1-9])\s*/\s*[.\u2026_]+\s*sinif', grade_text))
    for first, last in re.findall(r'(?<!\d)(1[0-2]|[1-9])\s*[-–]\s*(1[0-2]|[1-9])\s*\.?\s*sinif', grade_text):
        if int(first) <= int(last): grades.update(range(int(first), int(last)+1))
    for grade in sorted(grades):
        label = 'İlkokul' if grade <= 4 else 'Ortaokul' if grade <= 8 else 'Lise'
        if label not in levels: levels.append(label)
    return {'topics': topics, 'material_type': kind, 'levels': levels, 'classification_basis': 'source_anchor_and_filename_keywords', 'classification_review_required': True}


def parallel_pages(queue, visited, config, start, fetch):
    workers = max(1, min(8, config.get('page_workers', 1)))
    def request(entry):
        page, depth = entry
        try: return page, depth, fetch(page, 2000000), None
        except Exception as error: return page, depth, None, error
    with ThreadPoolExecutor(max_workers=workers) as pool:
        while queue and len(visited) < config['max_pages'] and time.monotonic()-start < config['max_seconds']*.55:
            batch = []
            while queue and len(batch) < workers and len(visited) < config['max_pages']:
                page, depth = queue.popleft()
                if page in visited: continue
                visited.add(page); batch.append((page, depth))
            yield from pool.map(request, batch)


def parallel_documents(rows, config, start, fetch, now):
    def request(row):
        if time.monotonic()-start >= config['max_seconds']: return row, None
        try:
            body, headers, final = fetch(row['file_url'], config['max_file_bytes'])
            if not file_signature(body, row['file_type'].lower()): raise ValueError('File signature does not match extension')
            from inspect_resource import inspect
            return row, {'sha256': hashlib.sha256(body).hexdigest(), 'byte_size': len(body), 'resolved_url': final,
                         'status': 'review_ready', 'access_verified_at': now, 'last_checked_at': now,
                         'inspection': inspect(body, row['file_type'].lower(), row['title'])}
        except Exception as error: return row, {'status': 'retry', 'last_checked_at': now, 'error': str(error)[:240]}
    workers = max(1, min(4, config.get('document_workers', 1)))
    with ThreadPoolExecutor(max_workers=workers) as pool:
        # Keep only one small batch of document bodies/subprocesses in flight.
        for index in range(0, len(rows), workers):
            if time.monotonic()-start >= config['max_seconds']: break
            yield from pool.map(request, rows[index:index+workers])


def collect(config, catalogue, previous, fetch, now=None):
    now = now or time.strftime('%Y-%m-%dT%H:%M:%SZ', time.gmtime())
    start = time.monotonic()
    known = {canonical(row['file']) for row in catalogue if row.get('file')}
    seeds = set(config['seed_pages'])
    for row in catalogue:
        page = row.get('sourcePage')
        if page and allowed(page, config['allowed_domains']):
            seeds.add(canonical(page))
            parts = urlsplit(page); seeds.add(parts.scheme + '://' + parts.netloc + '/')
    seeds = sorted(seeds); cursor = previous.get('cursor', 0) % max(1, len(seeds))
    batch = [seeds[(cursor + i) % len(seeds)] for i in range(min(config['seed_batch'], len(seeds)))]
    # New official topical pages stay in the rotating frontier across runs.
    frontier = [u for u in previous.get('frontier', []) if allowed(u, config['allowed_domains'])]
    queue = collections.deque((u, 0) for u in batch)
    queue.extend((u, 1) for u in frontier[:config['max_pages'] // 4])
    frontier = frontier[config['max_pages'] // 4:]
    rows = {row['id']: dict(row) for row in previous.get('candidates', []) if allowed(row.get('file_url', ''), config['allowed_domains']) and resource_link(row['file_url'], row.get('anchor_text', '')) and all(allowed(u, config['allowed_domains']) for u in row.get('source_pages', [])) and row.get('source_pages')}
    known_hashes = dict(previous.get('known_hashes', {}))
    for row in catalogue:
        if row.get('contentSha256'): known_hashes[canonical(row['file'])] = {'sha256': row['contentSha256'], 'text_sha256': row.get('documentTextSha256')}
    for row in rows.values():
        filename = unquote(urlsplit(row['file_url']).path.rsplit('/', 1)[-1])
        row['title'] = source_title(row.get('anchor_text', ''), filename)
        if row.get('inspection', {}).get('eligible'): row['title'] = row['inspection'].get('title', row['title'])
        row.update(classify(row.get('anchor_text', '') + ' ' + filename, config))
        if canonical(row['file_url']) in known: row['status'] = 'already_catalogued'
    errors = []; visited = set(); discovered = 0; known_skipped = 0
    words = [word for values in config['topic_keywords'].values() for word in values] + ['rehber', 'dokuman', 'materyal', 'sunum', 'form', 'envanter', 'brosur']
    for original_page, depth, payload, error in parallel_pages(queue, visited, config, start, fetch):
        page = original_page
        try:
            if error: raise error
            body, headers, page = payload
            if 'html' not in headers.get('Content-Type', headers.get('content-type', '')).lower(): continue
            charset = re.search(r'charset=([\w-]+)', headers.get('Content-Type', ''), re.I)
            parsed = Links(body.decode(charset.group(1) if charset else 'utf-8', 'replace'))
            for link, anchor in parsed.links:
                try: url = canonical(urljoin(page, link))
                except ValueError: continue
                if not allowed(url, config['allowed_domains']): continue
                ext = extension(url)
                if ext in EXTENSIONS:
                    if not resource_link(url, anchor): continue
                    if url in known: known_skipped += 1; continue
                    # Navigation pictures and generic attachments are not learning resources.
                    name = unquote(urlsplit(url).path.rsplit('/', 1)[-1])
                    evidence = anchor + ' ' + name
                    if not any(word in fold(evidence) for word in words): continue
                    identity = hashlib.sha256(url.encode()).hexdigest()[:24]
                    if identity in rows:
                        sources = rows[identity].setdefault('source_pages', [])
                        if page not in sources: sources.append(page)
                        continue
                    if len(rows) >= config['max_candidates']: continue
                    title = source_title(anchor, name)
                    rows[identity] = {'id': identity, 'title': title[:240], 'file_url': url, 'file_type': ext.upper(), 'source_pages': [page], 'source_title': parsed.title.strip()[:240], 'source_host': urlsplit(page).hostname, 'discovered_at': now, 'status': 'pending_check', 'published': False, 'anchor_text': anchor[:240], **classify(evidence, config)}
                    discovered += 1
                elif depth < config['max_depth'] and urlsplit(url).hostname == urlsplit(page).hostname:
                    if '/icerikler/etiket__' in url or ('.' in urlsplit(url).path.rsplit('/', 1)[-1] and extension(url) not in ('html', 'htm', 'php')): continue
                    if any(word in fold(unquote(url) + ' ' + anchor) for word in words) and not re.search(r'(login|giris|arama|search|\.php\?)', url, re.I):
                        queue.append((url, depth + 1))
        except Exception as error: errors.append({'url': page, 'stage': 'page', 'error': str(error)[:240]})
    frontier.extend(url for url, _ in queue if url not in visited)
    checked = 0; baseline_checked = 0; baseline_errors = []
    # Index an incremental sample of existing files without writing their records.
    originals = sorted({canonical(row['file']): row for row in catalogue if row.get('file') and not row.get('contentSha256') and allowed(row['file'], config['allowed_domains']) and extension(row['file']) in EXTENSIONS}.items())
    known_cursor = previous.get('known_cursor', 0) % max(1, len(originals))
    overrides = json.loads((ROOT/'seo/link-overrides.json').read_text())['entries'] if (ROOT/'seo/link-overrides.json').exists() else {}
    for i in range(min(config.get('known_file_checks', 0), len(originals))):
        if time.monotonic() - start >= config['max_seconds'] * .75: break
        url, original = originals[(known_cursor+i) % len(originals)]
        if known_hashes.get(url, {}).get('inspection_version') == INSPECTION_VERSION: continue
        entry = overrides.get(original['file'], {})
        if entry.get('status') == 'unavailable': continue
        actual = entry.get('replacement_url') or original['file']
        baseline_checked += 1
        try:
            body, _, final = fetch(actual, config['max_file_bytes'])
            if not file_signature(body, extension(actual)): raise ValueError('Original signature unavailable')
            from inspect_resource import inspect
            evidence = inspect(body, extension(actual), original.get('title', ''))
            known_hashes[url] = {'sha256': hashlib.sha256(body).hexdigest(), 'text_sha256': evidence.get('text_sha256'), 'inspection_version': INSPECTION_VERSION}
        except Exception as error: baseline_errors.append({'url': url, 'error': str(error)[:240]})
    hashes = {row['sha256']: row['id'] for row in rows.values() if row.get('sha256') and row['status'] != 'duplicate'}
    original_byte_hashes = {r['sha256'] for r in known_hashes.values() if r.get('sha256')}
    original_text_hashes = {r['text_sha256'] for r in known_hashes.values() if r.get('text_sha256')}
    selected = []
    for row in sorted(rows.values(), key=lambda row: (row.get('last_checked_at', ''), row['discovered_at'], row['id'])):
        last = row.get('access_verified_at', '')
        try: stale = (datetime.fromisoformat(now.replace('Z','+00:00'))-datetime.fromisoformat(last.replace('Z','+00:00'))).total_seconds() > 86400
        except ValueError: stale = True
        if row['status'] in ('pending_check', 'retry') or (row['status'] == 'review_ready' and (row.get('inspection', {}).get('version') != INSPECTION_VERSION or stale)):
            selected.append(row)
        if len(selected) >= config['max_file_checks']: break
    for row, result in parallel_documents(selected, config, start, fetch, now):
        if result is None: continue
        checked += 1; row.update(result)
        if row['status'] != 'review_ready': continue
        row.pop('error', None); digest = row['sha256']
        if row['resolved_url'] in known: row.update(status='already_catalogued')
        elif digest in hashes and hashes[digest] != row['id']: row.update(status='duplicate', duplicate_of=hashes[digest])
        else: hashes[digest] = row['id']
        if row['status'] == 'review_ready':
            if row['inspection'].get('eligible'): row['title'] = row['inspection'].get('title', row['title'])
            if digest in original_byte_hashes or row['inspection'].get('text_sha256') in original_text_hashes:
                row.update(status='duplicate', duplicate_of='existing_catalogue_content')
    # Previously inspected candidates must also benefit from the growing original-file index.
    for row in rows.values():
        if row['status'] == 'review_ready' and (row.get('sha256') in original_byte_hashes or row.get('inspection', {}).get('text_sha256') in original_text_hashes):
            row.update(status='duplicate', duplicate_of='existing_catalogue_content')
    state = {'version': 1, 'last_run': now, 'cursor': (cursor + len(batch)) % max(1, len(seeds)), 'known_cursor': (known_cursor+config.get('known_file_checks', 0)) % max(1, len(originals)), 'known_hashes': known_hashes, 'frontier': list(dict.fromkeys(frontier))[:2000], 'candidates': sorted(rows.values(), key=lambda row: row['id'])}
    report = {'run_at': now, 'seed_pages': len(seeds), 'seed_batch': len(batch), 'visited_pages': len(visited), 'new_candidates': discovered, 'known_links_skipped': known_skipped, 'file_checks': checked, 'statuses': dict(collections.Counter(row['status'] for row in rows.values())), 'publication_eligible': sum(bool(row.get('inspection', {}).get('eligible')) for row in rows.values() if row['status'] == 'review_ready'), 'published_unique_resources': len(known), 'target_resources': config.get('target_resources', 5000), 'remaining_to_target': max(0, config.get('target_resources', 5000) - len(known)), 'errors': errors, 'catalogue_writes': 0, 'database_writes': 0, 'publication_writes': 0, 'elapsed_seconds': round(time.monotonic() - start, 2)}
    report.update(original_file_checks=baseline_checked, original_hashes_indexed=len(known_hashes), original_index_errors=baseline_errors)
    return state, report


def write_outputs(output, state, report):
    output.mkdir(parents=True)
    for name, value in [('state.json', state), ('report.json', report)]:
        (output / name).write_text(json.dumps(value, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    fields = ['id', 'status', 'title', 'material_type', 'topics', 'levels', 'file_type', 'file_url', 'source_pages', 'sha256', 'access_verified_at']
    with (output / 'review.csv').open('w', encoding='utf-8-sig', newline='') as stream:
        writer = csv.DictWriter(stream, fieldnames=fields); writer.writeheader()
        for row in state['candidates']:
            values = {k: ' | '.join(row.get(k, [])) if isinstance(row.get(k), list) else row.get(k, '') for k in fields}
            # A source title is untrusted spreadsheet text, never a formula.
            values = {k: "'" + str(v) if str(v).lstrip().startswith(('=', '+', '-', '@')) else v for k, v in values.items()}
            writer.writerow(values)
    cards = []
    esc = html.escape
    labels = {'review_ready': 'İncelemeye hazır', 'pending_check': 'Dosya kontrolü bekliyor', 'retry': 'Erişim kontrolü tekrarlanacak', 'duplicate': 'Yinelenen dosya', 'already_catalogued': 'Katalogda mevcut'}
    order = {status: n for n, status in enumerate(labels)}
    for row in sorted(state['candidates'], key=lambda row: (order.get(row['status'], 9), fold(row['title']))):
        source = row['source_pages'][0]
        cards.append('<article><h2>' + esc(row['title']) + '</h2><p>' + esc(labels.get(row['status'], row['status'])) + ' · ' + esc(row['material_type']) + ' · ' + esc(', '.join(row['topics']) or 'Konu incelemesi gerekli') + '</p><p>' + esc(', '.join(row['levels']) or 'Kademe kaynakta net değil') + '</p><a target="_blank" rel="noopener noreferrer" href="' + esc(source, quote=True) + '">Resmî kaynak sayfası</a> · <a target="_blank" rel="noopener noreferrer" href="' + esc(row['file_url'], quote=True) + '">Dosyayı incele</a></article>')
    (output / 'index.html').write_text('<!doctype html><html lang="tr"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><title>PDR Kampüs kaynak inceleme kuyruğu</title><style>body{font:16px system-ui;max-width:1000px;margin:auto;padding:24px;background:#f6f5f0;color:#172e2a}article{background:white;border:1px solid #ddd;padding:20px;margin:16px 0;border-radius:12px}a{color:#146453}h2{font-size:20px}</style><h1>Kaynak inceleme kuyruğu</h1><p>Dosya erişimi, içerik uygunluğu veya kullanım hakkı onayı değildir. Konu ve kademe önerilerini belgeyle karşılaştırın. Bu kayıtlar henüz yayımlanmadı.</p><p>Tarama: ' + esc(report['run_at']) + ' · Yeni aday: ' + str(report['new_candidates']) + '</p><p><a href="review.csv">CSV indir</a> · <a href="state.json">JSON indir</a> · <a href="https://pdrkampus.com/kaynak-yonetimi.html" target="_blank" rel="noopener">Kaynak yönetimini aç</a></p>' + ''.join(cards) + '</html>', encoding='utf-8')


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--config', type=Path, default=ROOT / 'collector/config.json')
    parser.add_argument('--previous', type=Path)
    parser.add_argument('--output', type=Path, required=True)
    parser.add_argument('--seed-batch', type=int)
    parser.add_argument('--max-pages', type=int)
    parser.add_argument('--max-file-checks', type=int)
    args = parser.parse_args(); output = args.output.resolve()
    if output == ROOT or ROOT in output.parents or output.exists(): raise ValueError('Output must be a new directory outside the project')
    config = json.loads(args.config.read_text(encoding='utf-8'))
    inventory_sources = ROOT / 'inventory-review/source-pages.csv'
    if inventory_sources.exists():
        with inventory_sources.open(encoding='utf-8-sig', newline='') as stream:
            for row in csv.DictReader(stream):
                page = row.get('source_url', '')
                if allowed(page, config['allowed_domains']) and extension(page) not in EXTENSIONS:
                    config['seed_pages'].append(canonical(page))
    for key in ('seed_batch', 'max_pages', 'max_file_checks'):
        value = getattr(args, key)
        if value is not None:
            if value < 1: raise ValueError('Limits must be positive')
            config[key] = value
    previous = json.loads(args.previous.read_text(encoding='utf-8')) if args.previous and args.previous.exists() else {}
    catalogue = json.loads((ROOT / 'data/library.json').read_text()) + json.loads((ROOT / 'data/forms.json').read_text())
    supplementary = ROOT / 'data/collected-resources.json'
    if supplementary.exists(): catalogue += json.loads(supplementary.read_text())
    state, report = collect(config, catalogue, previous, Fetcher(config).get)
    write_outputs(output, state, report)
    print(json.dumps(report, ensure_ascii=False))
    return 0 if report['visited_pages'] > len(report['errors']) else 1


if __name__ == '__main__':
    raise SystemExit(main())
