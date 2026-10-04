"""Build curated entry pages from public official library data."""
from pathlib import Path
from html import escape as e
from urllib.parse import quote
from xml.etree import ElementTree as ET
import json,re,sys
root=Path(__file__).resolve().parents[1]
data=json.loads((root/'data/library.json').read_text())
template=(root/'konu/akran-zorbaligi/index.html').read_text()
header=re.search(r'<header.*?</header>.*?</nav>',template,re.S).group().replace(' data-section-current="true"','')
footer=re.search(r'<footer.*?</footer>',template,re.S).group()
hubs={
'sunumlar':('Rehberlik Sunumları','Sunum','sunum','Öğrenci, veli ve öğretmen çalışmaları için rehberlik sunumları. Konu, kademe ve dosya biçimine göre resmî materyalleri seçin.','Sunumu seçmeden önce hedef kitlenizi belirleyin. Öğrenci, veli ve öğretmen sunumları farklı amaçlarla hazırlanabilir; dosyanın içindeki açıklamaları ve kademeyi inceleyin. Sunumu kullanacağınız ortamda açarak okunabilirliğini kontrol edin.','Bilgilendirme sonrasında katılımcıların sorularına zaman ayırın. Kısa geri bildirimle hangi konunun takip gerektirdiğini belirleyin. Bir sunum, yapılandırılmış bir programın uygulama yönergelerinin yerine geçmez.'),
'etkinlikler':('Rehberlik Etkinlikleri','Etkinlik','etkinlik','Sınıf rehberliği çalışmaları için etkinlikler ve etkinlik kitapları. Kademe, konu ve uygulama ihtiyacına göre kaynak seçme rehberi.','Önce çalışma kazanımını ve yaş grubunu belirleyin. Materyalin süresini, grup büyüklüğünü ve gerekli araçları dosya üzerinden kontrol edin. Bir etkinlik kitabının tamamını tek oturumluk çalışma gibi değerlendirmeyin.','Uygulamada öğrencilerin özel yaşantılarını grup önünde anlatmasını gerektirmeyen örnekler seçin. Kapanışta ne öğrendiklerini ve bunu nerede kullanabileceklerini sorun; takip ihtiyacını sınıf düzeyinde değerlendirin.'),
'pano-materyalleri':('Rehberlik Pano Materyalleri','Pano materyali','pano','Okul rehberlik panosu için resmî materyaller ve pano uygulama örnekleri. Hedef kitle, okunabilirlik ve güncellik açısından kaynak seçin.','Panonun hedef kitlesini ve vermek istediğiniz mesajı belirleyin. Sınıf düzeyine uygun dil, uzaktan okunabilen yazılar ve anlaşılır görseller seçin. Dosyanın baskı biçimini kontrol ederek önce küçük bir deneme çıktısı alın.','Tarih ve başvuru bilgilerini güncel tutun. Öğrencilerin kişisel bilgilerini veya görüşme kayıtlarını panoya taşımayın. Pano mesajını sınıf çalışması veya kısa bir bilgilendirmeyle destekleyebilirsiniz.')}
outputs={}
for slug,(title,filter_type,needle,desc,intro,followup) in hubs.items():
 rows=[x for x in data if needle in x.get('type','').lower()]
 path='/materyaller/'+slug+'/';url='https://pdrkampus.com'+path
 cards=''
 for x in rows[:16]:
  file=quote(x['file'],safe='/:?=&%#@+;,-._~');assert file.startswith(('https://','http://'))
  cards+='<article class="catalog-card"><p class="catalog-kicker">'+e(x.get('type',''))+' · '+e(x.get('level',''))+' · '+e(x.get('fileType',''))+'</p><h2>'+e(x['title'])+'</h2><p>'+e(x.get('source','MEB'))+'</p><a href="'+e(file,quote=True)+'" target="_blank" rel="noopener">Resmî dosyayı aç / indir ↗</a></article>'
 others=''.join('<a href="/materyaller/'+n+'/">'+e(v[0])+'</a> · ' for n,v in hubs.items() if n!=slug)
 body='<p class="catalog-kicker"><a href="/kutuphane.html">PDR Kampüs Kütüphanesi</a></p><h1>'+title+'</h1><p class="catalog-lead">'+desc+'</p><section class="catalog-card"><h2>Materyal seçerken</h2><p>'+intro+'</p><h2>Çalışmayı tamamladıktan sonra</h2><p>'+followup+'</p></section><h2>Başlangıç için resmî kaynaklar</h2><p>Kütüphanede bu materyal grubunda '+str(len(rows))+' kayıt bulunuyor. Aşağıdaki seçki ilk 16 kaydı gösterir; farklı türdeki dosyalar aynı çalışma amacı için birlikte kullanılabilir.</p><div class="catalog-grid">'+cards+'</div><p><a class="catalog-primary" href="/kutuphane.html?q='+quote(needle)+'">Kütüphanede ilgili materyalleri ara →</a></p><p>'+others+'</p><p>Kaynak dosyalar hazırlayan kuruma aittir. Bu sayfadaki seçim ve uygulama önerileri PDR Kampüs tarafından hazırlanmıştır.</p>'
 outputs['materyaller/'+slug+'/index.html']='<!doctype html><html lang="tr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>'+title+' | PDR Kampüs</title><meta name="description" content="'+e(desc,quote=True)+'"><link rel="canonical" href="'+url+'"><meta property="og:url" content="'+url+'"><meta property="og:title" content="'+title+' | PDR Kampüs"><meta property="og:description" content="'+e(desc,quote=True)+'"><link rel="stylesheet" href="/src/style.css"><link rel="stylesheet" href="/src/shell-refresh.css"><link rel="stylesheet" href="/src/design-system.css"><link rel="stylesheet" href="/src/resource-catalog.css"></head><body id="top">'+header+'<main class="catalog-shell">'+body+'</main>'+footer+'<script type="module" src="/src/menu.js?v=20261005-2"></script></body></html>'
ns='http://www.sitemaps.org/schemas/sitemap/0.9';ET.register_namespace('',ns);tree=ET.parse(root/'sitemap.xml')
for entry in list(tree.getroot()):
 if '/materyaller/' in entry.find('{'+ns+'}loc').text:tree.getroot().remove(entry)
for slug in hubs:
 entry=ET.SubElement(tree.getroot(),'{'+ns+'}url');ET.SubElement(entry,'{'+ns+'}loc').text='https://pdrkampus.com/materyaller/'+slug+'/';ET.SubElement(entry,'{'+ns+'}lastmod').text='2026-10-05'
tree.getroot()[:] = sorted(tree.getroot(),key=lambda entry:entry.find('{'+ns+'}loc').text)
ET.indent(tree,space='  ');outputs['sitemap.xml']='<?xml version="1.0" encoding="UTF-8"?>\n'+ET.tostring(tree.getroot(),encoding='unicode')+'\n'
for path,content in outputs.items():
 dest=root/path
 if '--check' in sys.argv:assert dest.exists() and dest.read_text()==content,path
 else:dest.parent.mkdir(parents=True,exist_ok=True);dest.write_text(content)
print('Three material hubs verified.')
