# PDR Kampüs Platform · Aşama 1

Bu proje, mevcut `Evrenguless/pdrkampus` deposundan bağımsızdır. Puan hesaplama ve simülatör mevcut `Evrenguless/pdrkampus` deposunda kalır; bu platformun kapsamından ve yol haritasından çıkarılmıştır. Özgün depoya dokunulmadı.

## Kullanım

Kök dizinde `python3 -m http.server 8000` çalıştırıp `http://localhost:8000` adresini açın. Ana sayfada arama; ayrı `araclar.html`, `kutuphane.html`, `belgeler.html` ve `platform.html` sayfalarında katalog ve yol haritası bulunur. GitHub Pages için `main` dalı ve `/(root)` kullanılabilir.

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

## Belge Merkezi

`src/documents.js`, 76 MEB formunu ve 23 MEB yayınını tek listede birleştirir; kaynak türü, belge türü, kademe ve başlığa göre filtreler. Belgeler mevcut görüntüleyicide resmî MEB bağlantısından açılır. Meslektaş belgeleri ayrı ve kapalıdır; kullanıcı yüklemesi varmış gibi gösterilmez.

`db/005_community_documents_draft.sql` gelecekteki paylaşım için **uygulanmamış** bir taslaktır. Kaynak türü bu tabloda yalnızca meslektaş paylaşımıdır; `pending/approved/rejected/withdrawn` durumları ve dosya metaverisi ayrıdır. RLS açık ve hiçbir erişim politikası tanımlı değildir. Yayına almadan önce hesaplar, özel dosya depolama, hak/onay kontrolü, moderatör yetkileri ve onay geçmişi kurulmalıdır.

## Sayfa yapısı

Ana sayfa yalnızca arama ve bölüm geçişlerini sunar. Araç Kutusu, Kütüphane, Belge Merkezi ve Platform ayrı HTML sayfalarıdır. Aynı menü ve görüntüleyici her sayfada bulunur; tek sayfada uzun kaydırma gerekmez.

## Yeni kullanıcı hesabı kurulumu

Hesap bölümü **yeni ve bağımsız** bir Supabase projesini bekler; eski PDR analiz projesine bağlanmaz. `hesap.html` şimdilik kurulum uyarısı gösterir. Giriş/kayıt, şifre sıfırlama ve kişisel profil kodu hazırdır; gerçek hesap oluşturma ancak aşağıdaki adımlardan sonra açılır.

1. [Supabase Dashboard](https://supabase.com/dashboard) üzerinde PDR Kampüs Platform için yeni proje oluşturun. Projenin veritabanı parolasını GitHub'a veya site koduna koymayın.
2. Authentication → Providers → Email bölümünde e-posta kaydını etkinleştirin; e-posta doğrulamasını açık tutun. Authentication → URL Configuration bölümünde Site URL olarak `https://evrenguless.github.io/pdrkampus-platform/` ve Redirect URLs içine `https://evrenguless.github.io/pdrkampus-platform/hesap.html` adresini ekleyin. Yerel deneme için ayrıca `http://localhost:8000/hesap.html` eklenebilir.
3. Yeni projenin SQL Editor bölümünde `db/006_accounts.sql` içeriğini çalıştırın. Bu işlem `auth.users` ile bağlı `public.profiles` tablosu ve yalnızca kendi profilini okumaya izin veren RLS politikası oluşturur. Daha önceki taslak katalog SQL'leri ve `005_community_documents_draft.sql` hesap açmak için gerekli değildir; topluluk taslağını çalıştırmayın.
4. Project Settings → API bölümündeki **Project URL** ve **publishable key** değerlerini `src/auth-config.js` içindeki iki boş sabite girin. **Secret/service_role key asla tarayıcı koduna veya GitHub'a konmaz.** Publishable key herkese açık istemci anahtarıdır; gerçek veri koruması RLS ile sağlanır.
5. GitHub Pages dağıtımından sonra kendi e-postanızla kayıt, doğrulama bağlantısı, giriş, profil ve şifre sıfırlama akışını deneyin. E-posta gönderimi için Supabase'in varsayılan sınırları ve üretim SMTP ayarları ayrıca değerlendirilmelidir.

Kayıt formu yalnızca görünen ad, e-posta ve şifre ister; şifreyi veritabanı tablomuzda tutmaz. SQL kurulumu ve URL/anahtar ayarı tamamlanmadan form çalışmaz. Belge yükleme ve Topluluk için yetki/depoma politikaları henüz yoktur.
