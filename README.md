# PDR Kampüs Platform · Aşama 1

Bu proje, mevcut `Evrenguless/pdrkampus` deposundan bağımsızdır. `analiz/`, mevcut uygulamanın kopyasını içerir. Hesaplama formülleri, sayısal veriler ve simülatör korunur. Kopyadaki Google giriş düğmesi yeni platformun e-posta/şifre giriş sayfasına yönlendirir; özgün depoya dokunulmadı.

## Kullanım

Kök dizinde `python3 -m http.server 8000` çalıştırıp `http://localhost:8000` adresini açın. Ana sayfada arama, Araç Kutusu, MEB kaynaklı Kütüphane ve mevcut PDR Analiz bağlantısı bulunur. GitHub Pages için `main` dalı ve `/(root)` kullanılabilir. Analiz bölümü kendi CDN/Supabase bağlantılarına bağımlıdır.

## Araç Kutusu

`data/forms.json`, MEB Özel Eğitim ve Rehberlik Hizmetleri Genel Müdürlüğünün [16.05.2025 Form Haritası](https://orgm.meb.gov.tr/meb_iys_dosyalar/2025_05/16122806_formharitasi-16.05.2025-saat_09.45.pdf) içindeki **76 benzersiz ve doğrudan tıklanabilir dosyayı** kaydeder: 64 PDF ve 12 XLSX. Bağlantıların tamamı 25.09.2026 tarihinde HTTP 200 yanıtıyla kontrol edildi. Haritadaki bağlantısız, devam eden kalemler ve iki sonuç sayfası bu indirilebilir dosya listesine dahil edilmedi.

Her kayıt şu sırada görünür: **Bireyi Tanıma / Sistem Formları → alt başlık → form**. Kademe yalnızca form adında açıkça geçiyorsa atanır. Kod sonundaki `a`, `b`, `c` haritanın açıklamasına göre sırasıyla okul, RAM, okul ve RAM kullanımını gösterir. Haritada kod bulunmayan iki program kaydı “Kod belirtilmiyor” olarak gösterilir.

PDF kayıtları sitedeki görüntüleyicide özgün MEB URL'si üzerinden açılır. MEB veya tarayıcı gömmeyi engellerse “Dosyayı aç / indir” bağlantısı doğrudan özgün dosyayı açar. XLSX için tarayıcı içi önizleme yoktur; özgün dosya bağlantısı gösterilir. **Dosyalar henüz bu deponun sunucusunda saklanmaz.** Bir tarayıcı PDF'yi önce açarsa kullanıcı PDF görüntüleyicisinin indirme düğmesini kullanır.

## Veri tabanı hazırlığı

`db/001_form_catalog.sql` PostgreSQL/Supabase tablosu, `db/002_seed_form_catalog.sql` 76 kayıtlık başlangıç verisidir. Bu dosyalar **canlı bir veritabanına uygulanmadı**. Kaynak URL ve olası gelecek depolama anahtarı ayrı tutulur; `storage_key` şimdilik boştur. Öğrenciye ait kişisel veri bu katalogda yer almaz.

## Sınırlar ve sonraki aşama

Kütüphane kaynakları özgün MEB PDF bağlantılarını içerir. Arama istemci tarafındaki katalog terimlerini eşleştirir; tanı veya uygulama önerisi üretmez. Belge Merkezi, Topluluk, Meslektaşıma Sor ve kişisel çalışma alanı henüz yoktur. Sonraki adım katalog içerik denetimi, gerçek materyal/kaynak izinleri, ardından birleşik arama ve rol tabanlı içerik iş akışıdır. Öğrenci kayıtları için ayrı güvenlik, yetki ve saklama modeli gereklidir.

### Görünürlük

Araç Kutusu artık varsayılan olarak 76 dosyanın tamamını alt başlıklarına ayrılmış kartlarla listeler. Üstteki başlık düğmeleri ilgili bölüme kaydırır; filtreler listeyi daraltır. Arama sonuçları ilk 12 eşleşmeyi gösterir, tam katalog Araç Kutusu'ndadır.

## Kütüphane · MEB kaynakları

Örnek kartlar yerine `data/library.json` içinde 23 resmî MEB PDF kaydı bulunur: kademelere göre sınıf rehberlik etkinlikleri, akran zorbalığı farkındalık programları, veli/öğretmen broşür ve sunumları, psikolojik danışman kitapçığı ve özelleştirilmiş özel eğitim programları. Kaynak sayfaları ve dosya URL'leri ayrı tutulur; tamamı 25.09.2026 tarihinde erişim kontrolünden geçti. PDF görüntüleyici Araç Kutusu ile ortaktır. `db/003_library_resources.sql` ve `db/004_seed_library_resources.sql` henüz uygulanmamış PostgreSQL/Supabase hazırlığıdır.

## Birleşik arama

`src/search.js` form ve kaynak kataloglarını birlikte tarar. Sınıf düzeyini (1–4 ilkokul, 5–8 ortaokul, 9–12 lise) sorgudan ayırır; farklı kademe için açıkça hazırlanmış materyalleri dışlar. Konuyla doğrudan eşleşme, ilgili terim ve kademeye uygun genel kaynak ayrı gerekçelerle gösterilir. Arama yalnızca kayıt metaverisine ve açıkça tanımlı terim ilişkilerine dayanır; belge içeriğini tam metin taramaz, uygulama kararı veya psikolojik tanı üretmez. `npm test` örnek sorguları doğrular.

## Hesap ve kaydedilenler

Ana sayfada e-posta/şifre ile kayıt, giriş ve çıkış bulunur. Kayıt, mevcut Supabase Auth projesinin e-posta doğrulamasına bağlıdır. Analiz modülü aynı oturumu kullanır. Form ve kütüphane kartlarındaki **Kaydet** düğmesi oturum açmadan da çalışır; kayıtlar bu tarayıcıda saklanır. Giriş sırasında konuk kayıtları hesaba aktarılır.

`db/005_user_bookmarks.sql` kullanıcının kaydettiklerini hesaplar arasında eşitlemek için RLS korumalı tabloyu kurar. Bu SQL **canlı veritabanına uygulanmadı**; uygulanıncaya kadar arayüz kaydetme durumunun yalnızca bu cihazda tutulduğunu açıkça belirtir. Supabase Auth ayarlarında e-posta kaydı ve yeni GitHub Pages adresinin yönlendirme izinleri ayrıca doğrulanmalıdır. Hizmet anahtarlarından yalnızca istemcide kullanılabilen public/anon anahtar vardır; şifreler uygulama kodunda veya yerel kayıtlarda tutulmaz.
