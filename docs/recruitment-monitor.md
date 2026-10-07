# Kamu alım ilanlarının otomatik yayını

Kullanıcının 7 Ekim 2026 talebi, tüm güncel kaynak kayıtlarını çekmeyi ve yeni veriyi ayrıca onay beklemeden canlıya eklemeyi yetkilendirir. Ana sayfa ve genel menü değişmez.

## Sunucuda saatlik takip

`.github/workflows/recruitment-collector.yml` GitHub Actions üzerinde her saat çalışır; yerel bilgisayar/Codex açık olma şartı yoktur. GitHub zamanlanmış işleri yoğunlukta gecikebilir. Akış aynı zamanda main'e kurulum yayını yapıldığında ve manuel başlatıldığında çalışır.

1. Kariyer Kapısı sitesinin kendi JavaScript'inde kullandığı giriş gerektirmeyen `GetIseAlimPage` API'sine tüm kurum/il/tür filtreleri boş olarak istek gönderilir. RSS adresi `/RSS`, resmî sitenin RSS Linkini Oluştur düğmesinden doğrulanmıştır.
2. Kamu İş İlanları'nın açık WordPress API'sinin bütün sayfaları taranır. Kaynak sitesinin haberleri keşif içindir; resmî doğrulama yapılmadan başvurusu açık ilan olarak yayımlanmaz. Yeni haber adayları `recruitment-scan` Actions paketinde saklanır; Codex takip görevi resmî doğrulama ve ayrıntı tamamlama için bu adayları izler.
3. Başvuru başlangıcı/bitişi, kurum, birim, başlık, tür ve resmî bağlantı `data/recruitment-feed.json` içinde saklanır. Resmî API'nin saatleri Türkiye saat diliminde kullanılır. API'nin paylaşmadığı kontenjan/KPSS/öğrenim koşulları tahmin edilmez; kullanıcı tam resmî ilana yönlendirilir.
4. Kurum içi yükselme, yeterlik sınavı, yurt dışı eğitim, belge ve tercih başvuruları personel alımı olarak gösterilmez. Henüz başlayacak alımlar ayrıca işaretlenir. Geçmiş kayıtlar tarihleriyle arşivde kalır; kaynağın geçici olarak kaybolması iptal sayılmaz.
5. Daha önce ayrıntılı yayımlanmış Niğde, Düzce ve ÇSGB kayıtları resmî ID ile eşleştirilir; mükerrer kart oluşturulmaz. Ayrıntı sayfasındaki takvim de resmî listeden güncellenir.
6. Üretici, SEO, erişilebilirlik, frontend secret, preservation ve tarih testleri geçmeden otomatik yayın yapılmaz. Yalnız feed, üretilen ilan sayfaları, sitemap ve onaylı hash kaydı yazılabilir. Başka veri dosyası veya uygulama kodu otomatik değiştirilmez.
7. Veri değiştiğinde bot main'e commit yapar ve Pages build API'sini açıkça çağırır; bot commit'lerinin yeni Actions işlerini kendiliğinden tetiklememesine bağlı kalınmaz. Değişiklik yoksa commit yapılmaz. Başka yayın main'i ilerletmişse non-fast-forward push reddedilir; veri sonraki çalışmada güncel main üstünden yeniden uygulanır.

## Kapsam ve ilk tarama

7 Ekim taraması: Kariyer Kapısı 27 kamuya açık kayıt, bunlardan 22 personel alımı (17 açık, 5 başlayacak), 5 kurum içi sınav/eğitim kaydı. Kamu İş İlanları 52 haber; en yeni yayın 6 Ocak 2026, son 90 günde yeni haber adayı yok. Bu sayılar canlı taramanın o anki sonucudur, sabit kontenjan değildir. Bu iki kaynağın dışında kalan İŞKUR, belediye veya diğer kurum ilanları için başka resmî kaynaklar da keşfedilmelidir; tüm Türkiye kapsamı gerçekleşmiş gibi sunulmaz.

## Koruma ve hata davranışı

Boş/bozuk resmî yanıt önceki geçerli feed'i silmez; iş hata verir. Haber kaynağındaki hata resmî akışın yayınını engellemez ve rapora yazılır. Erişim engeli/CAPTCHA aşılmaz. İptal ancak açık resmî düzeltme duyurusuyla doğrulanır. Üretilen ilan HTML'leri ve sitemap için yalnız ilgili dosyaların SHA-256 onay kaydı yenilenir; baseline koruması kapatılmaz.

Codex destek görevi kaynak raporlarını ve doğrulanmayı bekleyen haberleri altı saatte bir takip eder; normal saatlik feed yayınına ikinci kez müdahale etmez. Değişmeyen durumda sessiz kalır. Yeni doğrulanmış dış kaynak ilanı, anlamlı düzeltme/iptal veya kalıcı yayın hatası varsa bildirir.
