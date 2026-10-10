# -*- coding: utf-8 -*-
"""Build source-grounded resource pages without altering the original catalogue."""
import hashlib
import html
import json
from pathlib import Path
import re
import unicodedata
import xml.etree.ElementTree as ET

BASE = 'https://pdrkampus.com'
HUB = '/kaynak/yeni/'


def page_path(row):
    """Kaynağa özgü, değişmeyen ve çakışmasız kütüphane adresi."""
    import hashlib

    def slug(value):
        value = str(value).replace("ı", "i").replace("İ", "I")
        value = unicodedata.normalize("NFKD", value)
        value = value.encode("ascii", "ignore").decode().lower()
        return re.sub(r"[^a-z0-9]+", "-", value).strip("-")

    title = slug(row.get("title", ""))[:65].strip("-")
    source = slug(row.get("source", ""))[:28].strip("-")
    identity = str(row["id"])
    suffix = hashlib.sha256(identity.encode("utf-8")).hexdigest()[:12]

    parts = [part for part in (title, source, suffix) if part]
    return "/kutuphane/" + "-".join(parts) + "/"


def build_pages(root, resources):
    esc = html.escape; template = (root / 'konu/akran-zorbaligi/index.html').read_text()
    header = re.search(r'<header.*?</header>.*?</nav>', template, re.S).group().replace(' data-section-current="true"', '')
    footer = re.search(r'<footer.*?</footer>', template, re.S).group()
    outputs = {}
    def page(route, title, description, body, schema=None, noindex=False):
        url = BASE + route
        nodes = [{'@context': 'https://schema.org', '@type': 'WebPage', 'name': title, 'url': url, 'inLanguage': 'tr'}, {'@context': 'https://schema.org', '@type': 'BreadcrumbList', 'itemListElement': [{'@type': 'ListItem', 'position': 1, 'name': 'Kütüphane', 'item': BASE + '/kutuphane.html'}, {'@type': 'ListItem', 'position': 2, 'name': 'Yeni kaynaklar', 'item': BASE + HUB}]}]
        if schema: nodes.append(schema)
        structured = json.dumps(nodes, ensure_ascii=False).replace('<', '\\u003c')
        outputs[route.lstrip('/') + 'index.html'] = f'<!doctype html><html lang="tr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>{esc(title)}</title><meta name="description" content="{esc(description, quote=True)}"><link rel="canonical" href="{url}"><meta property="og:title" content="{esc(title, quote=True)}"><meta property="og:description" content="{esc(description, quote=True)}"><meta property="og:url" content="{url}"><meta property="og:type" content="website">'+ ('<meta name="robots" content="noindex,follow">' if noindex else '') + f'<link rel="stylesheet" href="/src/style.css"><link rel="stylesheet" href="/src/shell-refresh.css"><link rel="stylesheet" href="/src/design-system.css"><link rel="stylesheet" href="/src/resource-catalog.css"><script type="application/ld+json">{structured}</script></head><body id="top">{header}<main class="catalog-shell">{body}</main>{footer}<script type="module" src="/src/menu.js?v=20261005-2"></script></body></html>'
    def card(row):
        return '<article class="catalog-card"><p class="catalog-kicker">'+esc(row['type'])+' · '+esc(row['fileType'])+'</p><h2><a href="'+esc(row['pagePath'], quote=True)+'">'+esc(row['title'])+'</a></h2><p>'+esc(row['topic'])+' · '+esc(row['level'])+'</p><p>'+esc(row['source'])+'</p></article>'
    for row in resources:
        route = row['pagePath']; info = row.get('documentInfo', {}); title = row['title']; kind = row['type']; topic = row['topic']
        facts = [('Kaynak türü', kind), ('Konu', topic), ('Kademe', row['level']), ('Dosya biçimi', row['fileType']), ('Kaynak kurum', row['source'])]
        if info.get('page_count'): facts.append(('Belge uzunluğu', str(info['page_count']) + ' sayfa'))
        if info.get('slide_count'): facts.append(('Sunum uzunluğu', str(info['slide_count']) + ' slayt'))
        fact_list = '<dl>' + ''.join('<dt>'+esc(k)+'</dt><dd>'+esc(str(v))+'</dd>' for k,v in facts) + '</dl>'
        description = f'{title}: {topic.lower()} konulu {kind.lower()}. Resmî kaynak sayfası, {row["fileType"]} dosyası, kademe ve belge bilgileri.'
        related = [r for r in resources if r['id'] != row['id'] and (r['topic'] == topic or r['type'] == kind)][:4]
        body = '<p class="catalog-kicker"><a href="/kutuphane.html">Kütüphane</a> / <a href="'+HUB+'">Yeni kaynaklar</a></p><h1>'+esc(title)+'</h1><p class="catalog-lead">'+esc(description)+'</p><section class="catalog-card"><h2>Belge bilgileri ve resmî bağlantılar</h2>'+fact_list+'<p><a href="'+esc(row['file'], quote=True)+'" target="_blank" rel="noopener noreferrer">Resmî dosyayı aç / indir</a> · <a href="'+esc(row['sourcePage'], quote=True)+'" target="_blank" rel="noopener noreferrer">Kaynak kurumun yayın sayfası</a></p></section><section class="catalog-card"><h2>Kaynağı kullanmadan önce</h2><p>'+esc(title)+', '+esc(topic.lower())+' konusunda başvurulabilecek bir '+esc(kind.lower())+' olarak listelenir. Dosyayı kaynak kurumun bağlantısından açarak hedef kitleyi, uygulama yönergelerini ve varsa sınıf bilgilerini inceleyin. Buradaki konu ve dosya bilgileri, belgenin hangi çalışma için uygun olduğunu değerlendirmenize yardımcı olur.</p><p>Belgeyi okulun çalışma planı, öğrencilerin yaş ve gelişim özellikleri ile belirlenen rehberlik ihtiyacı çerçevesinde değerlendirin. Bir form veya envanter kullanacaksanız uygulama ve değerlendirme yönergelerine bağlı kalın; sonuçları tek başına tanı ya da öğrenci hakkında kesin hüküm olarak kullanmayın. Materyali uyarlarken kaynak kurumun kullanım koşullarını ve belge üzerindeki açıklamaları dikkate alın.</p><p>Bu sayfa belgenin bir kopyasını barındırmaz. Kaynak kurumun yayın sayfası güncel sürüm ve diğer ilgili belgeler için başvuru adresidir. Kütüphane aramasında konu, kademe ve kaynak türüyle benzer materyallere ulaşabilirsiniz.</p></section>'
        if related: body += '<h2>İlgili kaynaklar</h2><div class="catalog-grid">'+''.join(card(r) for r in related)+'</div>'
        body += '<p><a href="/kutuphane.html?q='+esc(topic, quote=True)+'">Bu konuda kütüphanede ara</a></p>'
        page(route, title+' · '+row['source']+' | PDR Kampüs', description, body, {'@context':'https://schema.org', '@type':'CreativeWork', 'name':title, 'url':BASE+route, 'learningResourceType':kind, 'inLanguage':'tr', 'isAccessibleForFree':True, 'citation':row['sourcePage']})
    chunks = [resources[i:i+40] for i in range(0, len(resources), 40)] or [[]]
    for n, rows in enumerate(chunks, 1):
        route = HUB if n == 1 else HUB+'sayfa/'+str(n)+'/'
        body = '<p class="catalog-kicker"><a href="/kutuphane.html">PDR Kampüs Kütüphanesi</a></p><h1>Yeni rehberlik kaynakları'+(' · Sayfa '+str(n) if n > 1 else '')+'</h1><p>Envanter, sunum, pano, form ve diğer rehberlik materyallerinin resmî dosya bağlantıları. Konu, kademe, kaynak kurumu ve dosya türünü karşılaştırarak ihtiyacınıza uygun belgeye ulaşın.</p><div class="catalog-grid">'+''.join(card(r) for r in rows)+'</div>'
        if not resources: body += '<p>Yeni kaynaklar bu bölümde listelenecek. <a href="/kutuphane.html">Mevcut kütüphaneyi inceleyin</a>.</p>'
        if len(chunks) > 1: body += '<nav class="catalog-pagination" aria-label="Yeni kaynak kataloğu">'+''.join('<a href="'+(HUB if i == 1 else HUB+'sayfa/'+str(i)+'/')+'">'+str(i)+'</a>' for i in range(1,len(chunks)+1))+'</nav>'
        page(route, 'Yeni Rehberlik Kaynakları'+(' · Sayfa '+str(n) if n > 1 else '')+' | PDR Kampüs', 'Yeni rehberlik materyalleri kataloğu'+(' · '+str(n)+'. sayfa' if n > 1 else '')+'. Resmî kaynaklardan envanter, form, sunum, pano ve etkinlikler.', body, noindex=not bool(resources))
    from resource_design import decorate
    for path in list(outputs):
        row = next((r for r in resources if r['pagePath'].lstrip('/')+'index.html'==path), None)
        outputs[path] = decorate(root, outputs[path], row)
    for path, content in outputs.items():
        dest = root / path; dest.parent.mkdir(parents=True, exist_ok=True); dest.write_text(content, encoding='utf-8')
    ns = 'http://www.sitemaps.org/schemas/sitemap/0.9'; ET.register_namespace('', ns)
    tree = ET.parse(root/'sitemap.xml'); sitemap = tree.getroot(); old = {node.text for node in sitemap.iter('{'+ns+'}loc')}
    if resources:
        for path in outputs:
            url = BASE+'/'+path[:-10]
            if url not in old: node = ET.SubElement(sitemap,'{'+ns+'}url'); ET.SubElement(node,'{'+ns+'}loc').text = url
        sitemap[:] = sorted(sitemap, key=lambda node: node.find('{'+ns+'}loc').text); ET.indent(tree, space='  ')
        (root/'sitemap.xml').write_text('<?xml version="1.0" encoding="UTF-8"?>\n'+ET.tostring(sitemap,encoding='unicode')+'\n')
        assert old <= {node.text for node in sitemap.iter('{'+ns+'}loc')}
        approval = root/'seo/approved-edits.json'; data = json.loads(approval.read_text()); data['edits']['sitemap.xml']['reviewed_sha256'] = hashlib.sha256((root/'sitemap.xml').read_bytes()).hexdigest(); approval.write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n')
