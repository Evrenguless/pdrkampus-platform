#!/usr/bin/env python3
"""Refresh the first 24 static article cards after replacing the catalogue."""
from pathlib import Path
from urllib.parse import urlparse
import json, re, html
ROOT = Path(__file__).resolve().parents[1]
def safe_url(value):
    try:
        p = urlparse(value or '')
        return value if p.scheme in ('https', 'http') and p.hostname and not p.username and not p.password else ''
    except ValueError:
        return ''
def pdf(a):
    return safe_url(a.get('file')) if a.get('directDownload') is True and a.get('downloadStatus') == 'verified' else ''
def esc(value):
    return html.escape(str(value or ''), quote=True)
def card(a):
    file = pdf(a)
    source = safe_url(a.get('sourcePage')) or safe_url(a.get('doi'))
    links = ''.join(f'<a href="{esc(url)}" target="_blank" rel="noopener noreferrer">{label}</a>' for url, label in [(file, 'PDF’yi aç ↗'), (source, 'Kaynağı incele ↗')] if url)
    return f'<article class="article-card"><div class="article-card-meta"><span>{esc(a.get("publicationYear"))}</span><span class="{"article-pdf-badge" if file else "article-source-badge"}">{"PDF bağlantısı doğrulandı" if file else "Kaynak sayfası"}</span></div><h2>{esc(a.get("title"))}</h2><p class="article-authors">{esc(", ".join(a.get("authors") or []) or "Yazar bilgisi kaynakta incelenebilir.")}</p><p class="article-journal">{esc(a.get("source"))}</p><div class="article-actions">{links or "Kaynak bağlantısı bulunmuyor."}</div></article>'
articles = json.loads((ROOT / 'data/academic-articles-tr.json').read_text())
articles.sort(key=lambda a: (str(a.get('publicationDate') or a.get('publicationYear') or ''), str(a.get('title'))), reverse=True)
page = ROOT / 'makaleler.html'
s = page.read_text()
s = re.sub(r'(<div id="articleGrid" class="articles-grid">).*?(</div><button id="articleMore")', lambda m: m[1]+''.join(card(a) for a in articles[:24])+m[2], s, flags=re.S)
s = re.sub(r'(<strong id="articleTotal">).*?(</strong>)', lambda m: m[1]+f'{len(articles):,}'.replace(',', '.')+m[2],s)
s = re.sub(r'(<strong id="articlePdfTotal">).*?(</strong>)', lambda m: m[1]+str(sum(bool(pdf(a)) for a in articles))+m[2],s)
page.write_text(s)
print(f'{len(articles)} articles; {sum(bool(pdf(a)) for a in articles)} verified PDF links; 24 static cards')
