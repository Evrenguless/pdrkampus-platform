"""Generate authored document guides with curated official files and original worksheets."""
import json,re,sys
from html import escape as e
from pathlib import Path
from urllib.parse import quote
from xml.etree import ElementTree as ET
ROOT=Path(__file__).resolve().parents[1]
pages=json.loads((ROOT/'data/document-directory.json').read_text())
resources={x['id']:x for name in ('forms','library') for x in json.loads((ROOT/f'data/{name}.json').read_text())}
assert len(pages)==48 and len({p['slug'] for p in pages})==48
template=(ROOT/'konu/akran-zorbaligi/index.html').read_text()
header=re.search(r'<header.*?</header>.*?</nav>',template,re.S).group()
footer=re.search(r'<footer.*?</footer>',template,re.S).group()
outputs={}
worksheets={
 'aylik-calisma-programi':"""Dönem / ay:
Okul programındaki çalışma hedefi:
İhtiyaç analiziyle ilişki:
Çalışma 1 — tarih / hedef grup / sorumlu / hazırlık / izleme:
Çalışma 2 — tarih / hedef grup / sorumlu / hazırlık / izleme:
Çalışma 3 — tarih / hedef grup / sorumlu / hazırlık / izleme:
Ayrılacak zaman ve gereken materyal:
Gerçekleşmeyen çalışma / gerekçe / yeni tarih:
Ay sonu değerlendirmesi ve sonraki adım:""",
 'etkinlik-degerlendirme-formu':"""Etkinliğin adı / sınıf düzeyi / tarih:
Hedeflenen kazanım:
Uygulanan süre ve katılım toplamı:
Anonim geri bildirim: Bugün öğrendiğim bir şey...
Anonim geri bildirim: Hâlâ merak ettiğim bir soru...
Anonim geri bildirim: Günlük yaşamda deneyebileceğim bir adım...
Uygulayıcı gözlemi — somut gözlem:
Geri bildirimin gösterdiği ve göstermediği sonuçlar:
Bir sonraki uygulama için düzenleme:""",
 'rehberlik-servisi-tanitim-panosu':"""REHBERLİK SERVİSİ

Rehberlik servisine hangi konularda başvurabilirsin?
Okula uyum, arkadaşlık ilişkileri, çalışma alışkanlıkları ve kariyer seçenekleri hakkında konuşabilir; ihtiyacına uygun destek için rehberlik isteyebilirsin.

Bize nasıl ulaşabilirsin?
Yer:
Görüşme / randevu talep yolu:
Uygun başvuru saatleri:
Ailelerin ve öğretmenlerin iletişim yolu:

Görüşme için ne hazırlamalısın?
Konuşmak istediğin konuyu düşünmen yeterli. Ayrıntılı kişisel bilgi ve görüşme içeriğini ortak panoya ya da herkese açık forma yazma.

Okula özgü başvuru düzeni:
Hazırlayan / güncelleme tarihi:""",
 'okula-uyum-panosu':"""OKULDA İLK HAFTA

Okulumu tanıyorum
Rehberlik servisi:
Sınıf öğretmeni / danışabileceğim yetişkin:
Okulun ortak alanları:
Günün başlangıç ve bitiş düzeni:

Bir sorum olduğunda
Güvenli yardım isteme yolu:
Randevu / iletişim yolu:

Birlikte yaşayacağımız sınıf
Sınıfın birlikte belirlediği iletişim kuralları:
Yeni arkadaşımı tanımak için bir soru:
Bu hafta keşfetmek istediğim bir yer:

Ailelerle paylaşılacak iletişim yolu:
Güncelleme tarihi:""",
 'akran-zorbaligi-afisi':"""OKULDA GÜVENLİ İLETİŞİM

Rahatsız eden bir davranış yaşadığında veya gördüğünde yardım isteyebilirsin.
Güvendiğin bir yetişkinle konuş: sınıf öğretmenin, rehberlik servisi veya okul yönetimi.

Okulumuzdaki başvuru yolları:
Rehberlik servisi / yer:
Öğretmenle iletişim yolu:
Okul yönetimine başvuru yolu:

Bir arkadaşın yardım istediğinde onu dinle; yaşadığını sınıf içinde yayma.
Somut olayları afişe yazma; öğrenci isimleri, fotoğrafları ve kişisel görüşme bilgilerini paylaşma.

Okula özgü destek adımı:
Hazırlayan / güncelleme tarihi:""",
 'uyarlanmis-etkinlikler':"""ETKİNLİK UYARLAMA HAZIRLIĞI

Seçilen kaynak ve etkinliğin sayfası:
Hedef kazanım:
Sınıf düzeyi ve süre:
Erişim ihtiyacı — kişisel bilgi içermeyen grup düzeyinde açıklama:
Kısa ve anlaşılır yönerge:
Görsel / somut materyal desteği:
Yanıt biçimi seçenekleri — konuşma / çizim / işaretleme / yazma:
Katılıma alternatif:
Süre ve ortam düzenlemesi:
Kazanımı gözlemek için kullanılacak somut ölçüt:
Uygulama sonrası yapılacak düzenleme:""",
 'rehberlik-servisi-dosya-duzeni':"""SERVİS DOSYASI HAZIRLIK LİSTESİ

[ ] Plan ve programlar — çalışma dönemi ve sürüm belirtilmiş.
[ ] İhtiyaç analizi — anonim toplu sonuçlar uygun dosyada.
[ ] Sınıf / grup çalışmaları — kazanım, tarih ve materyal kaynağı kayıtlı.
[ ] Veli ve öğretmen çalışmaları — hazırlık ve değerlendirme ayrı.
[ ] Faaliyet özeti — toplamlar ve sınırlılıklar açıklanmış.
[ ] Kamuya açık materyaller — kaynak ve bağlantılar kontrol edilmiş.
[ ] Kişisel görüşme kayıtları — genel materyal arşivinden ayrılmış.
[ ] Dosya erişim düzeni — yetki ve saklama kurumu içinde belirlenmiş.
[ ] Eski sürümler — güncel belgelerle karışmayacak biçimde ayrılmış.

Eksik belge / sorumlu / tamamlanacak tarih:
Düzenleme tarihi:""",
 'komisyon-toplanti-tutanagi':"""TOPLANTI GÜNDEMİ VE KARAR HAZIRLIK TASLAĞI
Bu sayfa resmî toplantı tutanağı veya imza formu değildir.

Toplantı konusu ve tarihi:
Gündem maddeleri:
Önceden incelenecek kaynaklar:
Değerlendirilecek anonim çalışma verileri:
Madde 1 — görüşülen konu / karar önerisi / sorumlu / tarih:
Madde 2 — görüşülen konu / karar önerisi / sorumlu / tarih:
Sonraki toplantıda izlenecek işler:
Kurumun resmî tutanağına aktarılacak kararlar:
Kurum içi kayıt ve onay adımı:""",
 'dokuman-kontrol-listesi':"""DOKÜMAN YAYIMLAMA VE KULLANIM KONTROLÜ

Belge adı / kullanım amacı:
Hedef kademe ve kitle:
Kaynak kurum / kaynak sayfa:
Dosya bağlantısı:
Belgedeki yıl ve sürüm:
Bağlantı kontrol tarihi:
[ ] Dosya açılıyor ve başlıkla eşleşiyor.
[ ] Dosya türü doğru belirtilmiş.
[ ] Örnek / taslak / resmî belge ayrımı açık.
[ ] Gerekli yönergeler incelenmiş.
[ ] Öğrenciye ait kişisel bilgi bulunmuyor.
[ ] Paylaşılacak sürüm erişim amacına uygun.
[ ] Güncelleme gerektiğinde izlenecek kaynak belirtilmiş.

Düzeltilecek madde / sorumlu / tarih:"""
}
def page(path,title,intro,body):
 url='https://pdrkampus.com'+path
 schema={'@context':'https://schema.org','@type':'CollectionPage','name':title,'url':url,'inLanguage':'tr','isAccessibleForFree':True}
 outputs[path.lstrip('/')+'index.html']=f'''<!doctype html><html lang="tr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>{e(title)} | PDR Kampüs</title><meta name="description" content="{e(intro,quote=True)}"><link rel="canonical" href="{url}"><meta property="og:title" content="{e(title,quote=True)} | PDR Kampüs"><meta property="og:description" content="{e(intro,quote=True)}"><meta property="og:url" content="{url}"><meta property="og:type" content="website"><link rel="stylesheet" href="/src/style.css"><link rel="stylesheet" href="/src/shell-refresh.css"><link rel="stylesheet" href="/src/design-system.css"><link rel="stylesheet" href="/src/document-directory.css"><script type="application/ld+json">{json.dumps(schema,ensure_ascii=False).replace('<',chr(92)+'u003c')}</script></head><body id="top">{header}<main class="document-directory">{body}</main>{footer}<script type="module" src="/src/menu.js"></script><script type="module" src="/src/document-directory.js"></script></body></html>'''
def filecard(sid):
 r=resources[sid]
 assert r['file'].startswith('https://'),sid
 u=quote(r['file'],safe="/:?=&%#@+;,-._~")
 source=r.get('source') or 'MEB Özel Eğitim ve Rehberlik Hizmetleri'
 sourcepage=r.get('sourcePage') or r.get('sourceUrl') or u
 return f'''<article class="document-file"><span>{e(r.get('fileType','Dosya'))} · {e(r.get('level','Kademe belirtilmiyor'))}</span><h3>{e(r['title'])}</h3><p>{e(source)}</p><div><a href="{e(u,quote=True)}" target="_blank" rel="noopener noreferrer">Dosyayı aç / indir ↗</a><a href="{e(sourcepage,quote=True)}" target="_blank" rel="noopener noreferrer">Kaynak sayfası ↗</a></div></article>'''
groups={}
for p in pages:groups.setdefault(p['group'],[]).append(p)
hub='''<p class="document-kicker">DOKÜMAN KÜTÜPHANESİ</p><h1>Rehberlik servisi için dokümanlar</h1><p>Plan, form, etkinlik, sunum ve raporları kullanım amacına göre bulun. Her başlıkta gerçek kaynak dosyaları ve hazırlık bilgileri var.</p><label class="document-search">Doküman başlığı ara<input type="search" id="documentSearch" placeholder="BEP, görüşme, yıllık plan…" autocomplete="off"></label><p id="documentResults" role="status" aria-live="polite">8 kategori · 48 kaynak sayfası</p><div class="document-groups">'''
for name,entries in groups.items():
 hub+=f'<section class="document-group" data-document-group><h2>{e(name)}</h2>'
 for p in entries:hub+=f'<a data-document-link href="/dokumanlar/{p["slug"]}/">{e(p["title"])}</a>'
 hub+='</section>'
hub+='</div><noscript><p>Arama için JavaScript gerekir; bütün bağlantılar yukarıda doğrudan erişilebilir.</p></noscript>'
page('/dokumanlar/','Rehberlik Dokümanları', 'Rehber öğretmenler için planlar, formlar, RİBA kaynakları, etkinlikler, veli sunumları, BEP, pano materyalleri ve raporlar.',hub)
for p in pages:
 siblings=[x for x in groups[p['group']] if x['slug']!=p['slug']]
 body=f'''<p class="document-kicker"><a href="/dokumanlar/">Doküman kütüphanesi</a> / {e(p['group'])}</p><h1>{e(p['title'])}</h1><p class="document-intro">{e(p['intro'])}</p><section class="document-use"><h2>Bu kaynakları nasıl kullanabilirsiniz?</h2><p>{e(p['note'])}</p><ol><li>Dosyanın başlığını, hedef kademesini ve içindeki yönergeleri inceleyin.</li><li>Belgenin kendi yayın dönemini ve sürümünü kontrol ederek okulunuzdaki çalışma için uygun olanı seçin.</li><li>Hazırlığı okulun çalışma takvimi ve ilgili kurumun kullandığı kayıt düzeniyle eşleştirin.</li></ol></section><h2>Kaynak dosyaları</h2><div class="document-files">{''.join(filecard(x) for x in p['sources'])}</div><p class="document-caption">Dosyalar hazırlayan kurumun sunucusundan açılır. Katalog başlığı bir kaynak grubudur; her dosyanın gerçek adı ve biçimi yukarıda ayrı gösterilir.</p>'''
 if p['slug'] in worksheets:
  text=p['title'].upper()+'\nPDR Kampüs özgün hazırlık taslağı — 6 Ekim 2026\nResmî belge veya onaylı program değildir.\n\n'+worksheets[p['slug']]+'\n'
  path='dokumanlar/taslaklar/'+p['slug']+'.txt'
  outputs[path]=text
  body+=f'''<section class="document-use"><p class="document-kicker">PDR KAMPÜS ÖZGÜN TASLAĞI</p><h2>Düzenlenebilir hazırlık taslağı</h2><p>Bu metin PDR Kampüs tarafından hazırlanmıştır; resmî MEB formu yerine geçmez. Aşağıdaki alan yalnız bu sayfada düzenlenir; sunucuya gönderilmez ve tarayıcıda saklanmaz. Kişisel öğrenci bilgisi eklemeyin.</p><label>Taslak metni<textarea id="documentDraft" rows="18">{e(text)}</textarea></label><div class="document-actions"><button type="button" id="downloadDraft">Düzenlediğim metni indir</button><button type="button" id="printDraft">Yazdır / PDF kaydet</button><a href="/{path}" download>Boş taslağı indir (.txt)</a></div><p id="draftStatus" role="status" aria-live="polite"></p><noscript><p>Boş taslağı indir bağlantısı JavaScript olmadan da çalışır.</p></noscript></section>'''
 body+='<section class="document-use"><h2>Aynı kategorideki kaynaklar</h2><div class="document-related">'+''.join(f'<a href="/dokumanlar/{x["slug"]}/">{e(x["title"])}</a>' for x in siblings)+'</div></section><p><a href="/asistan/">Haftalık plan ve faaliyet özeti araçları →</a></p>'
 page('/dokumanlar/'+p['slug']+'/',p['title'],p['intro'],body)
# Maintain the homepage directory from the same data; no empty preview routes.
homepage=(ROOT/'index.html').read_text()
start='<!-- DOCUMENT DIRECTORY START -->'
end='<!-- DOCUMENT DIRECTORY END -->'
block=start+'<section class="document-directory" aria-label="Doküman kütüphanesi">'+hub.replace('<h1>','<h2>').replace('</h1>','</h2>')+'</section>'+end
if start in homepage: homepage=re.sub(re.escape(start)+'.*?'+re.escape(end),lambda _:block,homepage,flags=re.S)
else: homepage=homepage.replace('<main class="portal-main">','<main class="portal-main">'+block,1)
if '/src/document-directory.css' not in homepage: homepage=homepage.replace('</head>','<link rel="stylesheet" href="/src/document-directory.css"></head>')
if '/src/document-directory.js' not in homepage: homepage=homepage.replace('</body>','<script type="module" src="/src/document-directory.js"></script></body>')
outputs['index.html']=homepage
ns='http://www.sitemaps.org/schemas/sitemap/0.9';ET.register_namespace('',ns);tree=ET.parse(ROOT/'sitemap.xml')
for n in list(tree.getroot()):
 if n.find('{'+ns+'}loc').text.startswith('https://pdrkampus.com/dokumanlar/'):tree.getroot().remove(n)
for path in outputs:
 if path.endswith('/index.html'):
  n=ET.SubElement(tree.getroot(),'{'+ns+'}url');ET.SubElement(n,'{'+ns+'}loc').text='https://pdrkampus.com/'+path[:-10]
tree.getroot()[:]=sorted(tree.getroot(),key=lambda x:x.find('{'+ns+'}loc').text);ET.indent(tree,space='  ')
outputs['sitemap.xml']='<?xml version="1.0" encoding="UTF-8"?>\n'+ET.tostring(tree.getroot(),encoding='unicode')+'\n'
for path,content in outputs.items():
 dest=ROOT/path
 if '--check' in sys.argv:assert dest.exists() and dest.read_text()==content,path
 else:dest.parent.mkdir(parents=True,exist_ok=True);dest.write_text(content)
print(f'{len(pages)} document pages; {len(set(x for p in pages for x in p["sources"]))} source files; {len(worksheets)} authored text worksheets.')
