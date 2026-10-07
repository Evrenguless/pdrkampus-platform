# -*- coding: utf-8 -*-
"""Build source-grounded grade hubs; only public catalogue metadata is used."""
import sys,json,re,html
from pathlib import Path
from enrich_seo_content import enrich_schema
root=Path(__file__).resolve().parents[1]
outputs={}
rows=json.loads((root/'data/library.json').read_text());template=(root/'materyaller/etkinlikler/index.html').read_text()
for slug,label in [('ilkokul','İlkokul'),('ortaokul','Ortaokul'),('lise','Lise')]:
 selected=[r for r in rows if r.get('level')==label and any(x in r.get('type','').lower() for x in ['etkinlik','farkındalık','psikoeğitim'])]
 assert len(selected)>=3
 title=label+' Rehberlik Etkinlikleri ve Programları';desc=label+' için resmî rehberlik etkinlikleri, farkındalık ve psikoeğitim programları. Kademe, konu ve materyal türüne göre kaynak seçin.';route='/materyaller/etkinlikler/'+slug+'/'
 body='<h1>'+title+'</h1><p class="catalog-lead">'+desc+'</p><section class="catalog-card"><h2>'+label+' için hangi materyaller var?</h2><p>Bu seçkide '+str(len(selected))+' kayıt bulunur. Her kaydın konu ve türü mevcut katalog sınıflandırmasıyla gösterilir. Etkinlik dosyası, farkındalık programı ve psikoeğitim programı farklı materyal türleridir; çalışmanın kapsamını özgün belgeden inceleyebilirsiniz.</p><h2>Kaynağı nasıl seçebilirsiniz?</h2><p>Önce çalışmanın hedefini ve sınıf düzeyini belirleyin. Aşağıdaki başlıklardan ilgili konuyu seçip resmî materyaldeki uygulama yönergelerini inceleyin. Programın süresi ve oturum yapısı için özgün dosyayı kullanın.</p></section><div class="catalog-grid">'
 for r in selected:
  detail=root/'kaynak-detay'/r['id']/'index.html';link='/kaynak-detay/'+r['id']+'/' if detail.exists() else '/kutuphane.html#'+r['id']
  body+='<article class="catalog-card"><h2>'+html.escape(r['title'])+'</h2><p>'+html.escape(r['type']+' · '+r.get('topic','')+' · '+r['level'])+'</p><p>'+html.escape(r['source'])+'</p><a href="'+html.escape(link,quote=True)+'">Kaynağı incele</a></article>'
 body+='<p>İçerik güncellemesi: <time datetime="2026-10-07">7 Ekim 2026</time>. Bu tarih kaynak belgelerin yayın tarihinden ayrıdır.</p></div><section class="catalog-card"><h2>Diğer kademeler</h2>'+''.join('<p><a href="/materyaller/etkinlikler/'+s+'/">'+l+' rehberlik etkinlikleri</a></p>' for s,l in [('ilkokul','İlkokul'),('ortaokul','Ortaokul'),('lise','Lise')] if s!=slug)+'<p><a href="/materyaller/etkinlikler/">Tüm rehberlik etkinlikleri</a></p><p><a href="/kutuphane.html">PDR Kampüs Kütüphanesi</a></p></section>'
 src=re.sub(r'<main\b[^>]*>.*?</main>','<main class="catalog-shell">'+body+'</main>',template,flags=re.S)
 src=re.sub(r'<script type="application/ld\+json">.*?</script>','',src,flags=re.S)
 src=re.sub(r'<title>.*?</title>','<title>'+title+' | PDR Kampüs</title>',src)
 src=re.sub(r'(<meta (?:name="description"|property="og:description") content=")[^"]*',lambda m:m[1]+desc,src)
 src=src.replace('https://pdrkampus.com/materyaller/etkinlikler/','https://pdrkampus.com'+route)
 src=re.sub(r'(<meta property="og:title" content=")[^"]*',lambda m:m[1]+title+' | PDR Kampüs',src)
 target=root/route.strip('/')/'index.html';outputs[target]=enrich_schema(src,'https://pdrkampus.com'+route)

for target,content in outputs.items():
 if '--check' in sys.argv:assert target.read_text()==content,str(target)
 else:target.parent.mkdir(parents=True,exist_ok=True);target.write_text(content)
print('Grade hubs verified:',len(outputs))
