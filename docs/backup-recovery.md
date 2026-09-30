# PDR Kampüs · Yedekleme ve Kurtarma Prosedürü

Bu belge üretim ortamı için asgari yedekleme, geri yükleme ve felaket kurtarma adımlarını tanımlar.

## Kapsam

- GitHub Pages kaynak kodu ve statik içerik
- Supabase PostgreSQL veritabanı
- Supabase Storage içindeki `community-documents` bucket'ı
- Auth yapılandırması ve kritik proje ayarları

## Mevcut koruma katmanları

### 1. Kaynak kodu

Ana kaynak GitHub'daki `Evrenguless/pdrkampus-platform` deposudur. Tüm üretim değişiklikleri commit geçmişinde tutulur. Bir sürüm hatasında güvenli son commit'e dönülebilir.

### 2. Veritabanı

Supabase planına bağlı otomatik yedekleme özellikleri kullanılmalıdır. Pro ve üstü planlarda günlük yedekler Supabase tarafından sağlanır. Free plan kullanılıyorsa düzenli mantıksal dışa aktarma ayrıca yapılmalıdır.

Önerilen minimum:
- Haftalık logical DB dump
- Büyük şema değişikliklerinden önce ek dump
- Aylık geri yükleme doğrulaması

Yedekler yalnızca Supabase projesinin içinde tutulmamalı; ayrı ve erişimi kısıtlı bir yerde saklanmalıdır.

### 3. Storage

Supabase veritabanı yedeği Storage nesnelerinin kendisini geri getirmez. Bu nedenle `community-documents` bucket'ı ayrıca yedeklenmelidir.

Önerilen minimum:
- Haftalık bucket kopyası
- Dosya anahtarı, boyut, MIME türü ve ilgili `community_documents` kaydıyla eşleşme kontrolü
- Silme/temizlik işlemlerinden önce ek yedek

## Kurtarma sırası

1. Olay sırasında yeni yazmaları mümkünse durdur.
2. Etkilenen bileşeni belirle: statik site, DB, Storage veya Auth.
3. GitHub Pages sorunuysa bilinen sağlıklı commit'e dön.
4. DB sorunuysa en son sağlam database backup/dump'ını geri yükle.
5. Storage kaybı varsa bucket yedeğini geri yükle.
6. `community_documents.file_storage_key` kayıtları ile Storage nesnelerini karşılaştır.
7. Auth, RLS ve Storage policy kontrollerini yeniden çalıştır.
8. SEO Audit, Link Audit ve Accessibility Audit workflow'larını doğrula.
9. Canlıda kayıt/giriş, belge yükleme, moderasyon ve dosya açma smoke testlerini yap.
10. Olayın nedenini ve yapılan işlemleri kayıt altına al.

## Geri yükleme doğrulama kontrolü

- Ana sayfa açılıyor.
- Kütüphane ve Topluluk açılıyor.
- Sitemap ve robots erişilebilir.
- Test kullanıcısı oturum açabiliyor.
- Kullanıcı sadece kendi özel kayıtlarını görebiliyor.
- Onaylı belgeler görüntülenebiliyor.
- Pending/rejected belgeler anonim kullanıcıya görünmüyor.
- Moderatör inceleme kuyruğunu görebiliyor.
- Storage signed URL ile dosya açılıyor.
- Supabase Security Advisor kritik hata göstermiyor.
- Link Audit ve Accessibility Audit başarılı.

## RPO / RTO hedefi

İlk üretim aşaması için hedef:
- RPO: en fazla 7 gün veri kaybı (haftalık dış yedek kullanılıyorsa)
- RTO: aynı gün içinde temel hizmetin geri getirilmesi

Kullanıcı hacmi arttığında hedef haftalık yerine günlük harici yedek ve daha kısa RPO olacak şekilde güncellenmelidir.

## Sorumluluk

Yedeklerin gerçekten alınması, farklı bir konumda saklanması ve periyodik geri yükleme testi yapılması operasyon sahibinin sorumluluğundadır. Sadece bir yedek dosyasının bulunması yeterli kabul edilmez; geri yükleme test edilmelidir.

## Önemli not

Database backup ile Storage backup ayrı düşünülmelidir. PostgreSQL yedeği Storage dosyalarının kendisini içermez.
