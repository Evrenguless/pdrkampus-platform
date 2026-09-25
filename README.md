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

Hesap bölümü **yeni ve bağımsız** bir Supabase projesinin Project URL ve publishable key bilgileriyle bağlanmıştır; eski PDR analiz projesine bağlanmaz. Giriş/kayıt, şifre sıfırlama ve kişisel profil kodu hazırdır. Profil tablosu SQL dosyası yeni projede çalıştırılmadan profil kaydı oluşmaz.

1. [Supabase Dashboard](https://supabase.com/dashboard) üzerinde PDR Kampüs Platform için yeni proje oluşturun. Projenin veritabanı parolasını GitHub'a veya site koduna koymayın.
2. Authentication → Providers → Email bölümünde e-posta kaydını etkinleştirin; e-posta doğrulamasını açık tutun. Authentication → URL Configuration bölümünde Site URL olarak `https://evrenguless.github.io/pdrkampus-platform/` ve Redirect URLs içine `https://evrenguless.github.io/pdrkampus-platform/hesap.html` adresini ekleyin. Yerel deneme için ayrıca `http://localhost:8000/hesap.html` eklenebilir.
3. Yeni projenin SQL Editor bölümünde `db/006_accounts.sql` içeriğini çalıştırın. Bu işlem `auth.users` ile bağlı `public.profiles` tablosu ve yalnızca kendi profilini okumaya izin veren RLS politikası oluşturur. Daha önceki taslak katalog SQL'leri ve `005_community_documents_draft.sql` hesap açmak için gerekli değildir; topluluk taslağını çalıştırmayın.
4. Project URL ve **publishable key** `src/auth-config.js` içinde ayarlanmıştır. **Secret/service_role key asla tarayıcı koduna veya GitHub'a konmaz.** Publishable key herkese açık istemci anahtarıdır; gerçek veri koruması RLS ile sağlanır.
5. GitHub Pages dağıtımından sonra kendi e-postanızla kayıt, doğrulama bağlantısı, giriş, profil ve şifre sıfırlama akışını deneyin. E-posta gönderimi için Supabase'in varsayılan sınırları ve üretim SMTP ayarları ayrıca değerlendirilmelidir.

Kayıt formu yalnızca görünen ad, e-posta ve şifre ister; şifreyi veritabanı tablomuzda tutmaz. E-posta kayıt ayarı ve yönlendirme adresi Supabase panelinde kontrol edilmelidir.

## Meslektaş belge paylaşımı · kurulum

`db/007_community_documents.sql` yalnızca **yeni** Supabase projesinde, `006_accounts.sql` sonrasında çalıştırılır. Önceki `005_community_documents_draft.sql` çalıştırılmaz. Yeni SQL, **özel** `community-documents` bucket'ını, belge kayıtlarını, RLS politikalarını ve moderatör tablosunu oluşturur. Bekleyen dosyalar halka açık URL ile sunulmaz; onaylı belgeler kısa süreli imzalı bağlantıyla açılır. Depolama politikası kullanıcının yalnızca kendi kimlik klasörüne yükleme yapmasına izin verir. Belgelerde öğrenci kişisel verisi ve paylaşım hakkı olmayan materyal bulunmamalıdır.

`db/008_moderator_file_access.sql` dosyasını 007 sonrasında çalıştırın. Ardından Authentication → Users bölümünden kendi hesabınızın UUID değerini alıp SQL Editor'da bir kez şu komutu çalıştırın:

```sql
insert into public.community_moderators(user_id) values ('KENDI_HESAP_UUID') on conflict do nothing;
```

Bu atama yalnızca yetkili yönetici tarafından yapılır. `009` kurulumu sonrasında giriş yaptığınız profilinizde **Belge yönetimi** alanı görünür. Bekleyen dosyayı açıp onaylayabilir veya gerekçe yazarak reddedebilirsiniz. Otomatik dosya taraması ve kişisel veri tespiti henüz yoktur; her dosya insan tarafından incelenmelidir.


## Üye profili ve belge yönetimi

`db/009_profiles_and_document_management.sql` dosyasını 006–008 sonrasında yeni Supabase projesinde çalıştırın. `profil.html` her üyeye kendi belgelerini (incelemede/yayında/reddedildi/kaldırıldı) ve görünen adını gösterir. Yayımlanmış belge kartındaki üye bağlantısı yalnızca görünen ad ve yayımlanmış belgeleri açar; e-posta görünmez. Moderatörün profilinde belge bilgilerini düzeltme, yayımlama, reddetme ve **geri alınabilir silme/yayından kaldırma** bulunur. Düzenleme ve durum değişiklikleri özel audit tablosuna kaydedilir. Fiziksel dosya silme ve dosya değiştirme henüz yoktur.

## Meslektaşıma Sor

`db/010_colleague_questions.sql` dosyasını 009'dan sonra yeni Supabase projesinde çalıştırın. `meslektasima-sor.html` sayfasında sorular ve cevaplar herkese açık okunur; giriş yapan üyeler paylaşım yapar, kendi cevabına oy veremez, her cevaba bir oy verebilir ve oyunu geri alabilir. Üye kimlikleri profil bağlantısı için kullanılır; oy verenlerin kimlikleri genel erişime açık değildir. Paylaşımlarda öğrenciye ait tanınabilir bilgi bulunmamalıdır. Yanıtlar meslektaş deneyimidir, uzman veya resmî kaynak onayı değildir.

## Topluluk yönetimi

`db/011_question_moderation.sql` dosyasını 010'dan sonra Supabase SQL Editor'da çalıştırın. Yönetici kendi profilinden `topluluk-yonetimi.html` bağlantısına gider. Yalnızca mevcut `community_moderators` tablosundaki yönetici soru/cevap metinlerini düzeltebilir ve içeriği geri alınabilir biçimde yayından kaldırabilir. Yayından kaldırılan soru, cevaplarıyla beraber normal akıştan gizlenir. Yönetici değişiklikleri özel denetim tablosuna yazılır.

## PDR Topluluğu

`db/012_community_feed.sql` dosyasını 011 sonrasında yeni Supabase projesinde çalıştırın. `topluluk.html` herkese açık gönderi/yorum akışıdır; giriş yapan üyeler gönderi, yorum, beğeni ve kaydetme işlemlerini yapabilir. Kaydedilen gönderiler profildeki bağlantıdan filtrelenir. Yönetici `topluluk-yonetimi.html` ekranında gönderi ve yorumları düzenleyebilir, geri alınabilir biçimde kaldırabilir. Değişiklikler özel denetim tablosunda saklanır. Öğrenci bilgileri bu alanda paylaşılmamalıdır.
