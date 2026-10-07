# PDR Kampüs sürekli kaynak toplama ve yayın

İlk hedef **5.000 benzersiz kaynak**. Mevcut `data/library.json` ve `data/forms.json` kayıtları aynen korunur. Yeni kayıtlar ayrı `data/collected-resources.json` ek kataloğuna yazılır; mevcut kütüphane araması, konu/tür/kademe filtreleri ve dosya görüntüleyicisi üzerinden bulunabilir.

## Çalışma düzeni

`Official Resource Collector` her saat **23. dakikada** çalışır. Program ana dala alınınca ilk tarama da başlar. GitHub Actions → Run workflow ile elle çalıştırılabilir. Başlangıç GitHub yoğunluğunda gecikebilir.

Başlangıç havuzu yapılandırılmış MEB sayfaları, mevcut katalog kaynak sayfaları, kurum ana sayfaları ve mevcut envanterin kaynak sayfalarından oluşur. Her çalışmada havuzun sıradaki 160 adresine ilerlenir, en fazla 400 sayfa taranır. Yeni ilgili sayfalar sonraki çalışmalara aktarılır. Farklı kurumların sayfaları en fazla 8 paralel işçiyle, belgeler en fazla 4 paralel işçiyle işlenir. Kurum başına bekleme ve robots kuralları korunur. Tüm kurumlar her çalışmada tekrar taranmaz. Yeni adres ve dosya bulunması garanti değildir; tekrar bulunan dosyalar sayıya eklenmez.

PDF, PPT/PPTX, DOC/DOCX, XLS/XLSX ve PNG/JPG/WebP pano görselleri desteklenir. MEB/RAM ve MEB okul siteleri izin listesindedir. Başka kaynak alanları ancak yapılandırmaya eklenerek taranır.

## Otomatik yayın kapısı

Dosya imzası ve erişimi, kaynak adresi, belgenin okunabilir içeriği, başlık/konu/kademe tutarlılığı, olası kişisel bilgi işaretleri ve tekrar durumu kontrol edilir. Boş form alanları ile doldurulmuş ad-soyad, T.C. kimlik numarası, cep telefonu ve kişisel e-posta işaretleri ayrılır. Bu desenler otomatik ön kontroldür; bütün kişisel verileri kesin saptama garantisi vermez.

PDF ve yeni Office dosyaları metin olarak incelenir. Eski Office dosyaları geçici, makro güvenliği yüksek bir LibreOffice profiliyle inceleme için dönüştürülür; yayımlanan bağlantı özgün dosyaya gider. Taranmış PDF/görseller Türkçe OCR ile incelenir. Okunamayan, şifreli, sınırları aşan veya belirsiz kalan belgeler otomatik yayımlanmaz. Belgenin metni ve kopyası kalıcı tutulmaz; içerik özetleri ve sınıflandırma sonuçları tutulur.

Bir çalışmada en fazla 400 aday dosya ve 50 eski katalog dosyası incelenir. Toplam süre sınırı 20 dakika, dosya sınırı 15 MiB, PDF sınırı 80 sayfa, OCR PDF sınırı 10 sayfadır. Her belgeyi işleyen alt süreçte zaman/bellek sınırı vardır. Robots kuralları, kurum başına bekleme ve resmî alan adı sınırı uygulanır. Haber küçük görselleri, okul sınav takvimleri ve öğrenci listeleri filtrelenir.

Aynı adres, aynı dosya bayt özeti ve aynı normalize edilmiş belge metni tekrar sayılmaz. Eski kataloğun içerik özeti indeksi aşamalı kurulur. Henüz indekslenememiş eski dosyaların farklı adreslerdeki kopyaları yalnız URL kontrolüyle kesin tanınamaz; indeks kapsamı raporda yer alır.

Kontrollerden geçen en fazla 300 yeni kayıt bir çalışmada ek kataloğa **eklenir**. Eski kayıtlar yeniden yazılmaz. Yeni kaynaklar kendi canonical adresi, başlık/açıklama, resmî kaynak bağlantıları, belge/kademe/konu bilgisi ve yapılandırılmış verisi bulunan sayfalara sahip olur. Yeni kaynak kataloğu sayfalarıyla iç bağlantı kurulur. Sitemap'e yeni adresler eklenir; eski adresler kaldırılmaz. Yayın öncesi özgün dosya koruması ve içerik kalite kontrolü tekrar çalışır. GitHub Pages yayını otomatik istenir; GitHub iş akışı token'ıyla yapılan commitlerin Pages'i kendiliğinden tetiklememesi bu adımla ele alınır.

Konu ve kademe yalnız belgeyle desteklendiğinde kullanılır. Bilinmeyen kademe “Belirtilmiyor” olarak kalır. Bir belgeyi farklı konu veya sınıf başlıklarına bölerek kaynak sayısı artırılmaz. 5.000'e ulaşma tarihi bulunacak uygun benzersiz belgelerin sayısına bağlıdır.

## İzleme ve inceleme

GitHub → Actions → Official Resource Collector → son çalışma → **official-resource-review** paketini indirin. `index.html` inceleme ekranı, `review.csv` tablo, `state.json` kalıcı kuyruk/indeks, `report.json` sayım ve tarama sonuçlarıdır. Raporda yeni aday, uygun aday, kaynak toplamı, hedefe kalan sayı ve eski dosya indeksi kapsamı bulunur. Aday sayısı yayımlanan kaynak sayısı değildir.

Kuyruk önceki ana dal çalışmasından geri yüklenir; paketler 90 gün tutulur. 90 gün boyunca paket üretilemezse veya bütün paketler silinirse yedek elle geri verilir. GitHub uzun süre etkinlik olmayan herkese açık depolarda zamanlı işleri devre dışı bırakabilir; Actions ekranından tekrar etkinleştirilir. Aynı URL'deki sonraki içerik değişiklikleri bu sürümde yeni kaynak olarak sayılmaz.

## Yerel kullanım

Python 3.9+, `pypdf==6.10.0`; OCR/eski Office için `pdftoppm`, `tesseract` (tur+eng) ve LibreOffice gerekir. CI gerekli araçları kurar. Araç bulunmazsa ilgili formatlar incelemede kalır.

```sh
python scripts/collect_resources.py --output /tmp/pdr-first
python scripts/collect_resources.py --previous /tmp/pdr-first/state.json --output /tmp/pdr-next
python scripts/publish_collected_resources.py --state /tmp/pdr-next/state.json
# --apply yeni ek katalog ve sayfaları yerel checkout'ta oluşturur:
python scripts/publish_collected_resources.py --state /tmp/pdr-next/state.json --apply
python -m unittest discover -s scripts -p 'test_*resource*.py'
```

Toplama komutu yalnız proje dışına çıktı yazar. Yayın komutu yalnız ek katalog, kendine ait yeni kaynak sayfaları, sitemap'in eklenen adresleri ve bunun koruma özetini yazar. Hesaplamalar, özgün veri kümeleri, auth, RLS ve Supabase kayıtlarına yazım yoktur. Kaynak metni HTML içinde kaçışlanır; CSV formül metni güvenli metne dönüştürülür.

GitHub belgeleri: [zamanlı işler](https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows#schedule), [Pages yayın isteği](https://docs.github.com/en/rest/pages/pages#request-a-github-pages-build).

Tarama süresinin en fazla %25’i kaynak sayfalarının keşfine, ilk %35’ine kadar olan bölüm mevcut dosyaların ek hash indeksine ayrılır. Kalan süre kontrol kuyruğundaki belgeler içindir; mevcut katalog her turda en fazla 10 ek dosyayla indekslenir. Böylece büyüyen kuyruk yayın kontrollerinden önce tüm süreyi tüketmez.
