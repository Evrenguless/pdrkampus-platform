# -*- coding: utf-8 -*-
"""Source-preserving editorial/schema additions for existing public pages."""
import html,json,re
from pathlib import Path
from seo_engine import Page

def enrich_schema(source,url):
    page=Page(source)
    if page.noindex or not page.primary_h1:return source
    nodes=[]
    if not page.schemas:
        name=page.primary_h1[0];nodes=[{'@type':'WebPage','@id':url+'#page','url':url,'name':name,'description':page.description,'inLanguage':'tr','isPartOf':{'@type':'WebSite','@id':'https://pdrkampus.com/#website','name':'PDR Kampüs','url':'https://pdrkampus.com/'}},{'@type':'BreadcrumbList','itemListElement':[{'@type':'ListItem','position':1,'name':'PDR Kampüs','item':'https://pdrkampus.com/'},{'@type':'ListItem','position':2,'name':name,'item':url}]}]
    # FAQ uses only existing visible question headings and their existing first answer paragraph.
    questions=[]
    for heading,paragraph in re.findall(r'<h[23]\b[^>]*>([^<]*)</h[23]>\s*<p\b[^>]*>(.*?)</p>',source,re.S):
        q=html.unescape(re.sub('<[^>]+>','',heading)).strip();a=html.unescape(re.sub('<[^>]+>','',paragraph)).strip()
        if '?' in q and a and len(a.split())>=12 and len(a.split())<=160:questions.append({'@type':'Question','name':q,'acceptedAnswer':{'@type':'Answer','text':a}})
    if questions and '"FAQPage"' not in source:nodes.append({'@type':'FAQPage','mainEntity':questions})
    if nodes:
        schema=json.dumps({'@context':'https://schema.org','@graph':nodes},ensure_ascii=False).replace('<','\\u003c');source=source.replace('</head>','<script type="application/ld+json">'+schema+'</script></head>',1)
    return source

def resource_context(source,item,others):
    if 'data-resource-context' in source:return source
    e=html.escape;title=item['title'];audience='Öğretmen' if 'öğretmen' in title.lower() else 'Veli' if 'veli' in title.lower() else ''
    section='<section class="catalog-card" data-resource-context><h2>Kaynağın hedef kitlesi ve bağlantıları</h2>'
    section+='<p>'+e(title)+'; '+e(item.get('level',''))+' kademesi için katalogda '+e(item.get('type',''))+' olarak sınıflandırılmıştır. '+('Hedef kitle, kaynağın başlığında '+e(audience.lower())+' olarak belirtilir. ' if audience else '')+'Kurum ve dosya bilgileri bu kayda ait kaynak bağlantılarıyla birlikte gösterilir.</p>'
    if audience=='Öğretmen':section+='<p>Öğretmenlere yönelik bu materyali seçerken aynı kademedeki veli materyalinden ayrı değerlendirin. Öğretmen sunumu ve veli sunumu ayrı kaynaklardır; hedef kitleyi kaynağın başlığından ve özgün dosyadan kontrol edebilirsiniz.</p>'
    elif audience=='Veli':section+='<p>Velilere yönelik bu materyal, aynı kademedeki öğretmen materyaliyle birlikte incelenebilir. Veli sunumu ve öğretmen sunumu ayrı kaynaklardır; aile bilgilendirmesi için seçtiğiniz dosyanın hedef kitlesini özgün içerikten kontrol edebilirsiniz.</p>'
    section+='<ul>'
    peers=[r for r in others if r['id']!=item['id'] and r.get('topic')==item.get('topic') and r.get('level')==item.get('level') and (Path(__file__).resolve().parents[1]/'kaynak-detay'/r['id']/'index.html').exists()][:4]
    for r in peers:section+='<li><a href="/kaynak-detay/'+e(r['id'])+'/">'+e(r['title'])+'</a></li>'
    section+='</ul></section>'
    return source.replace('</main>',section+'</main>',1)
