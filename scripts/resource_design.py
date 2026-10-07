"""Compact source-preserving public resource layouts and editorial usage suggestions."""
import html,json,re
from pathlib import Path
from functools import lru_cache
from urllib.parse import quote
E=html.escape

def load(root,name,default):
 p=root/name
 return json.loads(p.read_text()) if p.exists() else default

def guidance(row):
 topic=row.get('topic') or row.get('category') or row.get('group') or 'Rehberlik'
 kind=row.get('type') or 'Form'
 text=(topic+' '+row['title']).lower()
 intro=f'{topic} çalışmasını öğrencilerin yaşına, sınıfın ihtiyaçlarına ve okulun rehberlik planına göre düzenleyebilirsiniz.'
 suggestions=[]
 if 'selamlaş' in text:
  intro='Selamlaşma; bir sohbeti başlatmanın, karşıdaki kişiyi fark ettiğimizi göstermenin ve okulda günlük iletişime alan açmanın yollarından biridir. Öğrencilerle farklı selamlaşma ifadelerini konuşarak saygılı iletişim üzerine bir çalışma yapabilirsiniz.'
  suggestions=['Öğrencilerle okulda, evde ve arkadaş ortamında kullanılan selamlaşma ifadelerini listeleyin.','Farklı selamlaşma biçimlerini kısa rol canlandırmalarıyla deneyin; herkesin rahat ettiği iletişim biçimine yer verin.','Bir hafta boyunca sınıfın güne başlama rutinine gönüllü bir selamlaşma seçeneği ekleyin.','Çalışma sonunda “Birinin seni selamlaması sana nasıl hissettiriyor?” sorusuyla kısa geri bildirim alın.']
 elif any(x in text for x in ['kariyer','meslek','alan seç','tercih']):
  suggestions=['Öğrencinin ilgilerini ve öğrenmek istediği meslekleri kendi ifadeleriyle listelemesini isteyin.','Meslekleri günlük görevler, çalışma ortamı ve eğitim yolu açısından karşılaştırın.','Bir meslek araştırması için güncel kurum sayfalarından bilgi toplayıp soru listesi hazırlayın.']
 elif any(x in text for x in ['ders çalışma','zaman yönet','akademik','motivasyon','hedef']):
  suggestions=['Çalışmanın başında öğrencinin mevcut çalışma düzenini ve öncelikli hedefini belirleyin.','Hedefi haftalık küçük adımlara ayırın; çalışma ve dinlenme zamanlarını birlikte planlayın.','Hafta sonunda hangi adımın uygulanabildiğini ve planın nerede değişmesi gerektiğini konuşun.']
 elif any(x in text for x in ['sınır','mahremiyet','özdenetim','otokontrol','öz disiplin']):
  suggestions=['Günlük okul yaşamından bir örnek seçerek seçenekleri ve sonuçlarını konuşun.','Öğrencilerin kendi sınırlarını ifade edebileceği kısa cümleler üretmesini isteyin.','Çalışmayı bir sınıf anlaşması veya kişisel hatırlatma kartıyla somutlaştırın.']
 elif any(x in text for x in ['dijital','internet','siber','teknoloji']):
  suggestions=['Öğrencilerle kişisel bilgi paylaşımı ve çevrim içi iletişim hakkında örnek durumlar inceleyin.','Bir dijital alışkanlığı seçip ekran kullanımı, mola ve günlük sorumluluklar açısından değerlendirin.','Okul ve aileyle paylaşılabilecek kısa bir güvenli iletişim kontrol listesi oluşturun.']
 elif any(x in text for x in ['plan','program','rapor','izleme','çizelge']):
  suggestions=['Belgenin eğitim yılını, hedef grubunu ve çalışma takvimini inceleyin.','Okulun ihtiyaçlarıyla ilişkili hedef, faaliyet ve sorumlu kişi alanlarını eşleştirin.','Uygulama ve değerlendirme tarihlerini okul takvimine işleyin; gerçekleşen çalışmaları kaydedin.']
 elif any(x in text for x in ['iletişim','aile','sosyal','duygu','etik','uyum']):
  suggestions=['Konuyu öğrencilerin günlük yaşamından bir iletişim örneğiyle başlatın.','Öğrencilerin farklı görüşleri dinlemesine ve kendi önerilerini paylaşmasına alan açın.','Çalışma sonunda sınıfta uygulanabilecek bir ortak adım belirleyin.']
 else:
  suggestions=[f'{topic} konusunda çalışmanın amacını ve hedef grubunu belirleyin.','Materyaldeki yönergeleri inceleyip kullanılacak bölümleri çalışma planına yerleştirin.','Uygulama sonunda kısa bir geri bildirim alarak sonraki çalışma ihtiyacını değerlendirin.']
 if 'pano' in kind.lower() or 'pano' in row['title'].lower():
  usage=['Pano başlığını ve metinleri öğrencilerin okuyabileceği boyutta hazırlayın.','Materyali ortak kullanım alanında görünür bir noktaya yerleştirin; öğrenci katkıları için ayrı bir bölüm bırakın.','Panoyu kısa bir sınıf sohbeti veya etkinlikle birlikte kullanın; içerikleri çalışma dönemi boyunca güncelleyin.']
 elif 'sunum' in kind.lower():
  usage=['Sunumu önceden inceleyip hedef kitleye uygun bölümleri seçin.','Slaytlar arasında kısa sorular ve örnek durumlarla katılım sağlayın.','Kapanışta katılımcıların uygulayabileceği bir adımı belirleyin.']
 elif any(x in kind.lower() for x in ['form','envanter','anket','ölçek']):
  usage=['Uygulama amacını, hedef grubu ve özgün belgedeki yönergeleri inceleyin.','Formdaki alanları ve değerlendirme açıklamalarını değiştirmeden kullanın.','Kayıtları kurumun ilgili saklama ve paylaşım usullerine göre düzenleyin.']
 else:
  usage=['Özgün belgedeki hedef kitleyi ve uygulama açıklamalarını inceleyin.','Materyali çalışma amacına uygun bölümlerle kullanın.','Çalışma sonrasında katılımcıların görüşlerini alıp takip adımını belirleyin.']
 return topic,intro,suggestions,usage


def specific_context(row):
 t=row['title'].lower();parts=[]
 if 'öğretmen' in t:
  parts.append('Öğretmenlere yönelik bu sürümü ders ve sınıf çalışmasına hazırlık amacıyla inceleyebilirsiniz. Meslektaşlarla paylaşılacak noktaları belirleyip okul içindeki gözlem ve takip düzeniyle ilişkilendirin; aile toplantısı için ayrıca veliye yönelik materyalleri seçin.')
 elif 'veli' in t or 'aile' in t:
  parts.append('Ailelere yönelik bu materyali veli bilgilendirmesinde tanıtırken evde konuşulabilecek örnekleri öne çıkarın. Velilerin sorularını dinleyip okul ile aile arasında ortak bir iletişim adımı belirleyin; öğretmen sürümü ayrı bir hedef kitleye yöneliktir.')
 elif 'öğrenci' in t:
  parts.append('Öğrenciye yönelik bu sürümde katılımcıların kendi ifadelerine ve sorularına zaman ayırabilirsiniz. Çalışmayı öğrencilerin anlayacağı örneklerle ele alın; yetişkinlere yönelik aile ve öğretmen belgelerini öğrenci uygulamasıyla karıştırmadan ayrı değerlendirin.')
 if 'okul sonuç' in t:
  parts.append('Okul sonuç çizelgesi başlığı, okul düzeyindeki sonuçların düzenlendiği sürümü belirtir. Sınıf çizelgelerini ayrı tutarak ilgili okul kaydının kapsamını belirleyin; okul planına aktarılacak öncelikleri özgün dosyanın değerlendirme yönergesine göre seçin.')
 elif 'sınıf sonuç' in t:
  parts.append('Sınıf sonuç çizelgesi, belirli bir sınıfın kayıtlarını izlemek için seçilecek sürümdür. Önce sınıf ve şube bilgilerini eşleştirin; öğrenci grubuyla ilgili çalışma ihtiyacını, okul düzeyindeki toplu sonuçlardan ayrı bir kayıt olarak ele alın.')
 if '1. dönem' in t:
  parts.append('Birinci dönem sonu sürümünü kullanırken dönem içinde yürütülen çalışmaları ve ara değerlendirme kayıtlarını birlikte inceleyin. İkinci dönem için takip gerektiren adımları belirleyip dönem geçişinde devam edecek çalışmaları ayrı not edin.')
 elif '2. dönem' in t:
  parts.append('İkinci dönem sonu başlıklı belgeyi yılın kapanış değerlendirmesinde inceleyebilirsiniz. Yıl boyunca gerçekleşen çalışmaların kaydını tamamlayıp sonraki eğitim yılına aktarılacak ihtiyaçları belirleyin; ilk dönem belgesiyle aynı dosya olarak değerlendirmeyin.')
 if 'broşür' in t and ('ön ' in t or '· ön' in t):
  parts.append('Broşürün ön yüzü olarak adlandırılan dosya, çift yüzlü baskı düzeninin bu bölümünü temsil eder. Başlık ve yönlendirme alanlarını kontrol ederek arka yüzün aynı koleksiyondaki dosyasını ayrıca eşleştirin; baskı öncesinde iki yüzün yönünü deneyin.')
 elif 'broşür' in t and ('arka' in t):
  parts.append('Bu kayıt broşürün arka yüzüne aittir. Ön kapak dosyasını ayrı seçerek katlama ve baskı düzenini birlikte kontrol edin; arka yüzdeki metin alanlarının kesilmeyeceği bir çıktı yerleşimi hazırlayın.')
 if 'erkek öğrenciler' in t:
  parts.append('Kaynak başlığı hedef grubu erkek öğrenciler olarak belirtir. Çalışmayı bu başlıktaki katılımcı grubuna göre planlayın; öğrencilere anonim soru iletme seçeneği sunup kişisel deneyim paylaşımını zorunlu tutmadan belgeyi tanıtın.')
 elif 'kız öğrenciler' in t:
  parts.append('Belge kız öğrencilere yönelik sürüm olarak listelenmiştir. Oturumun hedef grubunu bu kayıtla eşleştirin; katılımcıların sorularını rahatça iletebileceği bir düzen kurup paylaşım sınırlarını baştan birlikte belirleyin.')
 grade=re.search(r'\b(1[0-2]|[1-9])\.?\s*sınıf',t)
 grade_notes={1:'Birinci sınıf çalışmasında yönergeleri kısa adımlara bölüp görsellerle tanıtabilirsiniz. Okuma gerektiren bölümlerde metni birlikte incelemek ve öğrencinin sözel yanıtına yer vermek için zaman ayırın.',3:'Üçüncü sınıf planında öğrencilerin küçük gruplarla örnek durumlar üzerinde konuşmasına yer verebilirsiniz. Öğrencilerin oluşturduğu fikirleri kısa yazılı veya görsel ürünlerle toplamak için uygun bir çalışma bölümü seçin.',5:'Beşinci sınıf için okulun yeni çalışma düzenini ve farklı derslerle ilgili sorumlulukları konuşabilirsiniz. Haftalık hazırlık, sınıf arkadaşlarıyla tanışma ve günlük okul rutini üzerine bir takip adımı belirleyin.',8:'Sekizinci sınıf planını incelerken ortaöğretime geçişle ilgili bilgi ihtiyaçlarını listeleyebilirsiniz. Okul seçenekleri ve öğrencinin kendi çalışma düzeni için ayrı zaman ayırıp sorularını bir rehberlik görüşmesinde toparlayın.',10:'Onuncu sınıf için ders ve alan seçeneklerini öğrencinin ilgi duyduğu çalışmalarla birlikte ele alabilirsiniz. Bir alan araştırması hazırlayıp okulun rehberlik takvimi içinde görüşme ve bilgi toplama zamanı belirleyin.',12:'On ikinci sınıfta mezuniyet sonrasındaki eğitim ve meslek seçeneklerini karşılaştırmaya zaman ayırabilirsiniz. Öğrencinin hedefleri, başvuru takvimi ve bilgi ihtiyacını listeleyip takip görüşmesinde güncellenecek adımları belirleyin.'}
 if grade and int(grade.group(1)) in grade_notes:parts.append(grade_notes[int(grade.group(1))])
 manual=load(Path(__file__).resolve().parents[1],'seo/resource-design-context.json',{}).get(row['id'])
 if manual:parts.append(manual)
 return ' '.join(parts)

@lru_cache(maxsize=4)
def catalogue(root):
 rows=load(root,'data/library.json',[])+load(root,'data/forms.json',[])+load(root,'data/collected-resources.json',[])
 return {r['title']:r for r in rows},load(root,'data/resource-previews.json',{})

def enhance_cards(root,source):
 records,previews=catalogue(root)
 def decorate_card(match):
  card=match.group(0)
  card=re.sub(r'<div class="resource-card-cover">.*?</div>','',card,flags=re.S)
  heading=re.search(r'<h2[^>]*>(.*?)</h2>',card,re.S)
  if not heading:return card
  title=html.unescape(re.sub('<[^>]+>','',heading.group(1)))
  row=records.get(title)
  if not row:return card
  preview=previews.get(row['id'],{})
  cover=[preview['thumbnail']] if preview.get('thumbnail') else preview.get('previews',[])
  visual='<img src="'+E(cover[0],quote=True)+'" alt="'+E(title,quote=True)+' — gerçek ilk sayfa" loading="lazy">' if cover else '<span class="resource-format-tile">'+E(row['fileType'])+'<small>'+E(row.get('type') or 'Form')+'</small></span>'
  return card.replace('>','><div class="resource-card-cover">'+visual+'</div>',1)
 return re.sub(r'<article class="catalog-card"[^>]*>.*?</article>',decorate_card,source,flags=re.S)

def decorate(root,source,row=None):
 source=re.sub(r'(resource-design\.css|resource-preview\.js|library\.js)\?v=[^"\s>]+',r'\1?v=20261008-2',source)
 source=enhance_cards(root,source)
 source=re.sub(r'(/assets/resource-previews/[^"<>]+)\.png',lambda m:m.group(1)+'.jpg' if (root/(m.group(1).lstrip('/')+'.jpg')).exists() else m.group(0),source)
 if 'data-resource-design="1"' in source:
  if row:
   context=specific_context(row)
   topic=row.get('topic') or row.get('category') or row.get('group') or 'Rehberlik'
   lead=f"{row['title']}. {row.get('level') or 'Belirtilmiyor'} kademesi için {(row.get('type') or 'Form').lower()}; dosya önizlemesi, konu bilgileri ve kullanım önerileri."
   source=re.sub(r'<p class="resource-lead">.*?</p>','<p class="resource-lead">'+E(lead)+'</p>',source,count=1,flags=re.S)
   source=re.sub(r'<section class="resource-editorial" data-resource-use-context>.*?</section>','',source,flags=re.S)
   if context:source=source.replace('<details class="resource-original">','<section class="resource-editorial" data-resource-use-context><h2>Bu sürümle çalışırken</h2><p>'+E(context)+'</p></section><details class="resource-original">',1)
  return source
 source=source.replace('<body','<body data-resource-design="1"',1)
 source=source.replace('</head>','<link rel="stylesheet" href="/src/resource-design.css?v=20261008-2"></head>',1)
 if not row:return source
 match=re.search(r'<main\b[^>]*>(.*?)</main>',source,re.S)
 if not match:return source
 old=match.group(1); old=re.sub(r'<(/?)h1\b',r'<\1h2',old)
 # Existing published descriptions, audience distinctions, source links and FAQ remain visible in an expandable section.
 title=row['title'];topic,intro,suggestions,usage=guidance(row)
 kind=row.get('type') or 'Form';level=row.get('level') or 'Belirtilmiyor'
 overrides=load(root,'seo/link-overrides.json',{}).get('entries',{}).get(row['file'],{})
 file=overrides.get('replacement_url') or row['file'];source_url=overrides.get('source_url') or row.get('sourcePage') or row.get('sourceUrl') or file
 config={'id':row['id'],'title':title,'file':file,'fileType':row['fileType'],'unavailable':overrides.get('status')=='unavailable'}
 count=load(root,'data/resource-previews.json',{}).get(row['id'],{})
 facts=[('Materyal türü',kind),('Kademe',level),('Konu',topic),('Dosya biçimi',row['fileType']),('Kaynak kurum',row.get('source') or 'Millî Eğitim Bakanlığı')]
 if count.get('pageCount'):facts.append(('Belge uzunluğu',str(count['pageCount'])+' sayfa'))
 if count.get('sheetCount'):facts.append(('Çalışma sayfası',str(count['sheetCount'])))
 audience='Veliler' if 'veli' in title.lower() else 'Öğretmenler' if 'öğretmen' in title.lower() else ''
 if audience:facts.insert(0,('Hedef kitle',audience))
 ul=lambda arr:'<ul>'+''.join('<li>'+E(x)+'</li>' for x in arr)+'</ul>'
 lead=f'{title}. {level} kademesi için {kind.lower()}; dosya önizlemesi, konu bilgileri ve kullanım önerileri.'
 body=f'''<main class="catalog-shell resource-detail"><nav class="resource-crumbs" aria-label="İçerik yolu"><a href="/">Ana sayfa</a> › <a href="/kutuphane.html">Kaynaklar</a> › {E(topic)}</nav><h1>{E(title)}</h1><div class="resource-badges"><span>{E(kind)}</span><span>{E(level)}</span><span>{E(topic)}</span></div><p class="resource-lead">{E(lead)}</p><div class="resource-detail-grid"><div class="resource-main"><section class="resource-viewer" aria-label="Belge önizlemesi"><div class="resource-viewer-head"><strong>Belge önizlemesi</strong><span>{E(row['fileType'])}</span></div><div id="resourcePreview" class="resource-preview" aria-live="polite"><p>Belge önizlemesi yükleniyor…</p></div><div id="resourcePreviewControls" class="resource-preview-controls"></div></section><section class="resource-editorial"><h2>{E(topic)} hakkında</h2><p>{E(intro)}</p><details><summary>Çalışma önerileri</summary>{ul(suggestions)}</details></section><section class="resource-editorial"><h2>Bu {E(kind.lower())} nasıl kullanılır?</h2>{ul(usage)}<p class="resource-note">Bu bölümdeki öneriler materyalin kullanımını desteklemek için hazırlanmıştır. Belgenin içeriği ve uygulama yönergeleri özgün dosyada yer alır.</p></section><details class="resource-original"><summary>Kaynağın kapsamı ve ayrıntılı bilgileri</summary>{old}</details></div><aside class="resource-sidebar"><section class="resource-infobox"><h2>ⓘ Materyal bilgileri</h2><dl>{''.join('<dt>'+E(k)+'</dt><dd>'+E(str(v))+'</dd>' for k,v in facts)}</dl>{'<p>Güncel dosya için kaynak kurumun sayfasını inceleyin.</p>' if config['unavailable'] else '<a class="resource-download" href="'+E(file,quote=True)+'" target="_blank" rel="noopener noreferrer">↓ '+E(row['fileType'])+' dosyasını aç / indir</a>'}<a class="resource-source-link" href="{E(source_url,quote=True)}" target="_blank" rel="noopener noreferrer">Resmî yayın sayfası ↗</a></section><section class="resource-tip"><h2>Konuya uygun kaynakları keşfedin</h2><p>Sunum, pano, broşür ve etkinlikleri birlikte inceleyebilirsiniz.</p><a href="/kutuphane.html?q={quote(topic)}">{E(topic)} kaynakları →</a></section></aside></div></main>'''
 context=specific_context(row)
 if context:body=body.replace('<details class="resource-original">','<section class="resource-editorial" data-resource-use-context><h2>Bu sürümle çalışırken</h2><p>'+E(context)+'</p></section><details class="resource-original">',1)
 source=source[:match.start()]+body+source[match.end():]
 source=source.replace('</body>','<script type="application/json" id="resourcePreviewData">'+json.dumps(config,ensure_ascii=False).replace('<','\\u003c')+'</script><script type="module" src="/src/resource-preview.js?v=20261008-2"></script></body>',1)
 return source

def apply(root):
 rows=load(root,'data/forms.json',[])+load(root,'data/library.json',[])+load(root,'data/collected-resources.json',[])
 links=json.loads(re.search(r'=\s*(\{.*\})\s*;', (root/'src/resource-page-links.js').read_text(),re.S).group(1))
 seen=set()
 for row in rows:
  route=row.get('pagePath') or links.get(row['id'])
  if not route or route in seen:continue
  seen.add(route)
  p=root/route.lstrip('/')/'index.html'
  if p.exists():p.write_text(decorate(root,p.read_text(),row))
 for folder in ['kutuphane/katalog','kaynak/yeni']:
  for p in (root/folder).rglob('index.html'):
   if re.search(r'id="resourcePreviewData"',p.read_text()):continue
   p.write_text(decorate(root,p.read_text()))
 p=root/'kutuphane.html';p.write_text(decorate(root,p.read_text()))
def refresh_reviews(root):
 import hashlib
 from seo_engine import runtime_digest
 baseline=load(root,'seo/protected-files.json',{})['files'];approval=root/'seo/approved-edits.json';data=load(root,'seo/approved-edits.json',{})
 changed=set(__import__('subprocess').check_output(['git','diff','--name-only'],cwd=root,text=True).splitlines())
 for name in changed:
  if name not in baseline:continue
  eligible=name=='kutuphane.html' or name.startswith(('kaynak/','kaynak-detay/','kutuphane/katalog/')) or name in ['scripts/build_library_catalog.py','src/library.js']
  if not eligible:continue
  path=root/name
  entry=data['edits'].setdefault(name,{'baseline_sha256':baseline[name]})
  entry['reviewed_sha256']=hashlib.sha256(path.read_bytes()).hexdigest()
  entry['reason']='User-approved resource design and editorial usage suggestions; original source records and calculations preserved'
  if name.endswith('.html'):entry['runtime_sha256']=runtime_digest(path.read_text())
 approval.write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n')
if __name__=='__main__':
 root=Path(__file__).resolve().parents[1]
 apply(root)
 refresh_reviews(root)
