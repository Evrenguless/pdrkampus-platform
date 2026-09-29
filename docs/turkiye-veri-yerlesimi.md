# Türkiye veri yerleşimi: yayın öncesi teknik plan

## Mevcut durum ve hedef

- Site şu anda `src/auth-config.js` üzerinden yönetilen Supabase projesine (`ptdotvzkizlwkjgcazox`) bağlanır. Bu proje Sydney bölgesindedir. Üyelik, veritabanı ve belge depolaması için Türkiye'de saklama koşulunu **sağlamaz**.
- Supabase'in yönetilen bölgelerinde Türkiye bulunmuyor; mevcut projenin bölgesi yerinde değiştirilemiyor. Önce yeni bir altyapı kurulmalı, sonra veriler ve istemci bağlantısı taşınmalıdır.
- Olası mimari: Türkiye'deki bir sunucuda üretime uygun, kendi yönetilen Supabase kurulumu; `api.pdrkampus.com` üzerinden HTTPS; Türkiye'de PostgreSQL, Auth, Storage ve yedekler. Bu mimari seçilmeden ve işletim sorumlusu belirlenmeden kurulumu başlatmayın.
- “Bütün veriler Türkiye'de” hedefi, yalnız veritabanını kapsıyorsa bunu açıkça tanımlayın. Tam trafik/veri yerleşimi isteniyorsa GitHub Pages barındırması, `cdn.jsdelivr.net` üzerinden yüklenen JS, e-posta sağlayıcısı, log, yedek ve üçüncü taraf bağlantılar da ayrıca değerlendirilmelidir. Alan adı DNS'i veya API alan adının Türkiye'de olması tek başına veri yerleşimi kanıtı değildir.

## Taşıma envanteri

1. Veritabanı şeması, RLS politikaları, fonksiyonlar ve seed kayıtları: `db/001`–`db/018` sırası; `db/005_community_documents_draft.sql` uygulanmaz. Canlı projedeki gerçek şema ve veriler ayrıca karşılaştırılmalı.
2. `auth.users`, profil kayıtları, kimlik doğrulama ayarları, e-posta şablonları, yönlendirme adresleri ve yönetici üyelikleri. Kullanıcıların şifre yenileme ve mevcut oturumlarının taşımadan nasıl etkileneceği test edilmeli.
3. Özel `community-documents` bucket'ı: nesne meta verisi **ve gerçek dosyalar** ayrı taşınmalı. Kaynakların sayısı, toplam boyutu ve SHA-256 özeti karşılaştırılmalı; bekleyen belgeler erişime açılmamalı.
4. Notlar, görevler, kaydedilenler, soru/yanıt, gönderi/yorum, moderasyon, bildirim ve denetim kayıtları yeni ortamda sahip UUID'leri ve RLS ile doğrulanmalı.
5. Üretim SMTP, TLS, güncellemeler, erişim kontrolü, geri yükleme denemesi ve Türkiye'de tutulan yedekler kurulmalı; gizli anahtarlar git deposuna eklenmemeli.
6. Yeni HTTPS API origin'i ve yalnız tarayıcıda kullanımı güvenli publishable key, doğrulamalardan sonra `src/auth-config.js` içinde birlikte değiştirilir. Kesinlikle service role/secret key eklenmez.

## Yayın kapısı

- Türkiye sunucusu ve yedek/nesne depolama konumları sağlayıcı bilgileriyle doğrulandı.
- Yeni ortamdaki kayıt, doğrulama, giriş, şifre sıfırlama, belge yükleme/indirme, moderasyon ve silme akışları gerçek hesaplarla denendi.
- Eski Sydney projesinde kişisel veri varsa taşıma ve silme takvimi belirlendi; bu proje geçiş tamamlanmadan kapatılmadı.
- Aydınlatmada veri sorumlusu kimliği, amaç, hukuki sebep, alıcılar, saklama/silme ve başvuru usulü doğrulandı. Kişisel adın sitede kullanılmaması tercihine uyulacak; bunun hukuki karşılığı çözülmeden bildirim tamamlandı sayılmayacak. Yurt dışındaki diğer sağlayıcı ve erişim yolları ayrıca değerlendirilecek.
- Mevcut `gizlilik.html` Sydney'i doğru anlatıyor; taşımadan sonra ancak doğrulanmış yeni mimariye göre güncellenecek.

Kaynaklar: [Supabase bölgeleri](https://supabase.com/docs/guides/platform/regions), [bölge değişikliği](https://supabase.com/docs/guides/troubleshooting/change-project-region-eWJo5Z), [kendi sunucunda kurulum](https://supabase.com/docs/guides/self-hosting), [yönetilen projeden geri yükleme](https://supabase.com/docs/guides/self-hosting/restore-from-platform), [KVKK aydınlatma](https://www.kvkk.gov.tr/Icerik/2033/Aydinlatma-Yukumlulugu-).
