#!/usr/bin/env python3
"""Refresh library-format static cards after replacing the article catalogue."""
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
def esc(value):
    return html.escape(str(value or ''), quote=True)
def card(a):
    source = safe_url(a.get('sourcePage')) or safe_url(a.get('doi'))
    title = f'<a href="{esc(source)}" target="_blank" rel="noopener noreferrer">{esc(a.get("title"))}</a>' if source else esc(a.get('title'))
    action = f'<a href="{esc(source)}" target="_blank" rel="noopener noreferrer">Kaynak sayfasını aç ↗</a>' if source else '<p>Kaynak bağlantısı bulunmuyor.</p>'
    authors = f'<p class="resource-detail">{esc(", ".join(a["authors"]))}</p>' if a.get('authors') else ''
    return f'<article class="document-card library-document resource-card surface-card"><div class="resource-card-cover"><span class="resource-format-tile">MAKALE<small>Akademik yayın</small></span></div><div class="resource-content"><div class="document-card-meta"><span>{esc(a.get("publicationYear"))}</span><span>Makale</span></div><h3>{title}</h3><p class="library-source">{esc(a.get("source"))}</p>{authors}</div><div class="resource-actions">{action}</div></article>'
articles = json.loads((ROOT / 'data/academic-articles-tr.json').read_text())
articles.sort(key=lambda a: (str(a.get('publicationDate') or a.get('publicationYear') or ''), str(a.get('title'))), reverse=True)
page = ROOT / 'makaleler.html'
s = page.read_text()
s = re.sub(r'(<div id="articleGrid" class="document-results library-results">).*?(</div><button id="articleMore")', lambda m: m[1]+''.join(card(a) for a in articles[:24])+m[2], s, flags=re.S)
s = re.sub(r'(<span id="articleCount"[^>]*>).*?(</span>)', lambda m: m[1]+f'{len(articles):,}'.replace(',', '.')+' makale'+m[2], s)
page.write_text(s)
print(f'{len(articles)} articles; 24 static library cards')
