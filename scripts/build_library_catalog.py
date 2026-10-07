# -*- coding: utf-8 -*-
"""Build crawlable official resource catalog; member documents are never exported."""
import html, json, re, unicodedata, sys
from pathlib import Path
from urllib.parse import quote, unquote
from xml.etree import ElementTree as ET

ROOT = Path(__file__).resolve().parents[1]
BASE = 'https://pdrkampus.com'
overrides = json.loads((ROOT/'seo/link-overrides.json').read_text())['entries']
def esc(value): return html.escape(str(value or ''), quote=True)
def slug(value):
    return re.sub(r'[^a-z0-9]+', '-', unicodedata.normalize('NFKD', value.replace('ı','i')).encode('ascii','ignore').decode().lower()).strip('-')
forms = json.loads((ROOT/'data/forms.json').read_text())
resources = json.loads((ROOT/'data/library.json').read_text())
# One visible card per official file, with all original catalogue identifiers retained.
aliases = json.loads((ROOT/'seo/catalogue-aliases.json').read_text())
groups = {}
for original in forms + resources:
    item = dict(original)
    if item['file'] in groups:
        groups[item['file']]['aliases'].append(item)
    else:
        item['aliases'] = []
        groups[item['file']] = item
for file, item in groups.items():
    if item['aliases']:
        ids = sorted([item['id']] + [a['id'] for a in item['aliases']])
        assert ids == sorted(aliases.get(file, [])), 'Unreviewed repeated file: ' + file
items = list(groups.values())
reviewed = resources[:20]
selected = items
links = {x['id']: '/kaynak-detay/'+slug(x['id'])+'/' for x in selected}
assert len(set(links.values())) == len(selected)
for item in selected:
    for alias in item.get('aliases', []): links[alias['id']] = links[item['id']]
reviewed_links = {x['id']: '/kaynak-detay/'+slug(x['id'])+'/' for x in reviewed}
# Reuse a published page only when it links to this exact source file.
published_by_file = {unquote(x['file']): reviewed_links[x['id']] for x in reviewed}
for existing in sorted((ROOT/'kaynak').glob('*/index.html')):
    source = existing.read_text()
    route = '/' + str(existing.parent.relative_to(ROOT)) + '/'
    for href in re.findall(r'href=["\']([^"\']+)', source):
        published_by_file.setdefault(unquote(html.unescape(href)), route)
for item in selected:
    key = unquote(item['file'])
    route = published_by_file.setdefault(key, links[item['id']])
    links[item['id']] = route
    for alias in item.get('aliases', []): links[alias['id']] = route
template = (ROOT/'konu/akran-zorbaligi/index.html').read_text()
header = re.search(r'<header.*?</header>.*?</nav>', template, re.S).group().replace(' data-section-current="true"','')
footer = re.search(r'<footer.*?</footer>', template, re.S).group()
outputs = {}
def page(path, title, desc, body, schema=None):
    url = BASE + path
    structured = '<script type="application/ld+json">'+json.dumps(schema,ensure_ascii=False).replace('<','\\u003c')+'</script>' if schema else ''
    outputs[path.lstrip('/')+'index.html'] = f'''<!doctype html><html lang="tr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>{esc(title)}</title><meta name="description" content="{esc(desc)}"><link rel="canonical" href="{url}"><meta property="og:title" content="{esc(title)}"><meta property="og:description" content="{esc(desc)}"><meta property="og:url" content="{url}"><meta property="og:type" content="website"><link rel="stylesheet" href="/src/style.css"><link rel="stylesheet" href="/src/shell-refresh.css"><link rel="stylesheet" href="/src/design-system.css"><link rel="stylesheet" href="/src/resource-catalog.css">{structured}</head><body id="top">{header}<main class="catalog-shell">{body}</main>{footer}<script type="module" src="/src/menu.js?v=20261005-2"></script></body></html>'''
def file_url(item):
    value = overrides.get(item.get('file',''),{}).get('replacement_url') or item.get('file','')
    assert value.startswith(('https://','http://')), item['id']
    return quote(value, safe="/:?=&%#@+;,-._~")
def access_markup(item,detail=False):
    entry=overrides.get(item.get('file',''),{})
    if entry.get('status')=='unavailable':
        return '<p>Dosya bağlantısına erişilemiyor. Belgenin güncel adresini kaynak kurumdan kontrol edin.</p><a href="'+esc(entry['source_url'])+'" target="_blank" rel="noopener">'+esc(entry['source_label'])+' ↗</a>'
    return '<a'+(' class="catalog-primary"' if detail else '')+' href="'+esc(file_url(item))+'" target="_blank" rel="noopener">'+('Resmî dosyayı aç / indir' if detail else 'Resmî dosyayı aç')+' ↗</a>'
def card(item):
    entry=overrides.get(item.get('file',''),{})
    url = links.get(item['id']) or (None if entry.get('status')=='unavailable' else file_url(item))
    heading='<a href="'+esc(url)+'">'+esc(item['title'])+'</a>' if url else esc(item['title'])
    alias_markup = ''.join(f'<li id="{esc(a["id"])}">{esc(a["title"])}</li>' for a in item.get('aliases',[]))
    alias_markup = '<ul>'+alias_markup+'</ul>' if alias_markup else ''
    meta = ' · '.join(str(item.get(k,'')) for k in ('type','level','fileType') if item.get(k))
    return f'<article class="catalog-card"><p class="catalog-kicker">{esc(meta)}</p><h2>{heading}</h2>{alias_markup}<p>{esc(item.get("source") or "Millî Eğitim Bakanlığı")}</p>{access_markup(item)}</article>'
count = (len(items)+39)//40
def catalog_path(n): return '/kutuphane/katalog/' if n==1 else f'/kutuphane/katalog/sayfa/{n}/'
for n in range(1,count+1):
    pagination = ''.join(f'<a href="{catalog_path(i)}"'+(' aria-current="page"' if i==n else '')+f'>{i}</a>' for i in range(1,count+1))
    body = f'<p class="catalog-kicker"><a href="/kutuphane.html">PDR Kampüs Kütüphanesi</a></p><h1>Resmî kaynak kataloğu · Sayfa {n}</h1><p>Formlar, rehberlik etkinlikleri, sunumlar ve mesleki kaynaklar. {len(items):,} kaynak, {count} sayfa. Arama ve filtreler için <a href="/kutuphane.html">kütüphaneye geçin</a>.</p><div class="catalog-grid">'+''.join(card(x) for x in items[(n-1)*40:n*40])+f'</div><nav class="catalog-pagination" aria-label="Katalog sayfaları">{pagination}</nav>'
    page(catalog_path(n),f'Resmî Rehberlik Kaynakları · Sayfa {n} | PDR Kampüs',f'Rehberlik ve psikolojik danışmanlık kaynak kataloğunun {n}. sayfası. Resmî formlar, etkinlikler, programlar ve sunumlara erişin.',body)
for item in selected:
    if item['id'] in reviewed_links:
        existing = ROOT / (reviewed_links[item['id']].lstrip('/') + 'index.html')
        outputs[str(existing.relative_to(ROOT))] = existing.read_text()
        continue
    if links[item['id']] != '/kaynak-detay/'+slug(item['id'])+'/':
        continue
    title = item['title']; source = item.get('source') or 'Millî Eğitim Bakanlığı'; level = item.get('level',''); topic = item.get('topic') or item.get('group') or 'Rehberlik'
    desc = f'{title}: {level} kademesi için {item.get("type","rehberlik kaynağı").lower()}. Kaynak bilgileri ve resmî dosya bağlantısı PDR Kampüs’te.'
    source_page = quote(overrides.get(item.get('file',''),{}).get('source_url') or item.get('sourcePage') or item.get('sourceUrl') or file_url(item), safe="/:?=&%#@+;,-._~")
    related = [x for x in selected if x['id']!=item['id'] and (x.get('level')==level or x.get('type')==item.get('type'))][:4]
    body = f'<p class="catalog-kicker"><a href="/kutuphane.html">Kütüphane</a> / <a href="/kutuphane/katalog/">Resmî kaynaklar</a></p><h1>{esc(title)}</h1><p class="catalog-lead">{esc(desc)}</p><section class="catalog-card"><h2>Kaynak bilgileri</h2><dl><dt>Hazırlayan kurum</dt><dd>{esc(source)}</dd><dt>Kademe</dt><dd>{esc(level)}</dd><dt>Kaynak türü</dt><dd>{esc(item.get("type"))}</dd><dt>Konu</dt><dd>{esc(topic)}</dd><dt>Dosya biçimi</dt><dd>{esc(item.get("fileType"))}</dd></dl>{access_markup(item,detail=True)}<p><a href="{esc(source_page)}" target="_blank" rel="noopener">Kaynak kurumun sayfası ↗</a></p></section><section class="catalog-card"><h2>Hangi çalışma için kullanılabilir?</h2><p>Bu kaynak, {esc(level.lower())} kademesinde {esc(topic.lower())} konusunda yürütülen çalışmalarda başvurulabilecek bir {esc(item.get("type","kaynak").lower())} olarak listelenmiştir. Uygulama öncesinde resmî dosyadaki hedef kitleyi ve yönergeleri inceleyin; materyali öğrencilerinizin ihtiyaçlarına ve kurumunuzun çalışma planına göre değerlendirin.</p><p>Bu sayfa dosyayı yeniden yayımlamaz; güncel belgeye hazırlayan kurumun bağlantısından ulaşabilirsiniz.</p></section><h2>İlgili kaynaklar</h2><div class="catalog-grid">'+''.join(card(x) for x in related)+'</div>'
    page(links[item['id']], title+' · '+source+' · '+level+' | PDR Kampüs', desc, body, {'@context':'https://schema.org','@type':'CreativeWork','name':title,'url':BASE+links[item['id']],'isAccessibleForFree':True,'inLanguage':'tr','learningResourceType':item.get('type'),'publisher':{'@type':'Organization','name':source}})
# Preserve reviewed source-specific content when rebuilding existing detail URLs.
pilot_path = ROOT/'seo/pilot.json'
if pilot_path.exists():
    from seo_engine import render
    config = json.loads((ROOT/'seo/config.json').read_text())
    for proposal in json.loads(pilot_path.read_text()).get('proposals', []):
        key = proposal['route'].strip('/') + '/index.html'
        if key not in outputs:
            raise ValueError('Reviewed pilot route absent from catalog: ' + key)
        outputs[key] = render(ROOT, config, proposal, source=outputs[key])
from enrich_seo_content import enrich_schema,resource_context
resource_lookup={item['id']:item for item in resources}
for key in list(outputs):
    if not key.endswith('/index.html'):continue
    resource_id=key.split('/')[1] if key.startswith('kaynak-detay/') else None
    if resource_id in reviewed_links:
        outputs[key]=resource_context(outputs[key],resource_lookup[resource_id],resources)
    outputs[key]=enrich_schema(outputs[key],BASE+'/'+key[:-10])
outputs['src/resource-access-data.js'] = 'export const resourceAccessEntries = '+json.dumps(overrides,ensure_ascii=False,indent=2)+';\n'
outputs['src/library-detail-links.js'] = 'export const libraryDetailLinks = '+json.dumps(reviewed_links,ensure_ascii=False,indent=2)+';\n'
outputs['src/resource-page-links.js'] = 'export const resourcePageLinks = '+json.dumps(links,ensure_ascii=False,indent=2)+';\n'
ns = 'http://www.sitemaps.org/schemas/sitemap/0.9'
ET.register_namespace('',ns)
tree = ET.parse(ROOT/'sitemap.xml'); root=tree.getroot()
for entry in list(root):
    loc=entry.find('{'+ns+'}loc')
    if loc is not None and ('/kutuphane/katalog/' in loc.text or '/kaynak-detay/' in loc.text): root.remove(entry)
for path in outputs:
    if path.endswith('/index.html'):
        entry=ET.SubElement(root,'{'+ns+'}url'); ET.SubElement(entry,'{'+ns+'}loc').text=BASE+'/'+path[:-10]
root[:] = sorted(root, key=lambda entry: entry.find('{'+ns+'}loc').text)
ET.indent(tree,space='  ')
outputs['sitemap.xml'] = '<?xml version="1.0" encoding="UTF-8"?>\n'+ET.tostring(root,encoding='unicode')+'\n'
check = '--check' in sys.argv
for path,content in outputs.items():
    dest=ROOT/path
    if check:
        assert dest.exists() and dest.read_text()==content, 'Regenerate catalog: '+path
    else:
        dest.parent.mkdir(parents=True,exist_ok=True); dest.write_text(content)
print(f'Catalog verified: {len(items)} resources, {count} catalog pages, {len(selected)} detail pages.')
