# Personel ilanlarını otomatik takip

Kullanıcının 7 Ekim 2026 talebi yeni ve başvurusu devam eden kamu personel ilanlarının resmî sitelerden doğrulanarak ayrıca onay beklemeden yayımlanmasını yetkilendirir. Ana sayfa/genel menü kapsamı değişmez.

Bu sohbetin Codex heartbeat otomasyonu altı saatte bir kaynak kontrolü ve yayın yapar. Kaynak listesi `data/recruitment-sources.json`; bu dosya kendi başına zamanlayıcı değildir. Otomasyon bağlı yerel çalışma ortamının kullanılabilir olmasına bağlıdır; sürekli sunucuda çalışan bir RSS/webhook servisi değildir. Anlık yayın veya bütün Türkiye kapsamı garantisi verilmez.

## Her kontrolün işlemleri

1. Güncel `origin/main` ve yerel değişiklikleri kontrol et; kullanıcı çalışmalarını ezme. Kaynak listesindeki resmî portalları ve kurum duyurularını oku; başka resmî kurum kaynakları keşfedilirse listeyi genişlet.
2. Yeni ve başvurusu açık/ileride başlayacak alımları ayır. Sonuç, sözlü sınav takvimi, yedek çağrı, kurum içi görevlendirme ve eski ilan tekrarını yeni alım olarak yayımlama. Haber siteleri keşif içindir; veriyi kurum/Resmî Gazete/Kariyer Kapısı metniyle doğrula. Erişim engeli ve CAPTCHA aşılmaz; erişilebilir resmî alternatif aranır.
3. Başvuru tarihini, kontenjan toplamını, pozisyon dağılımını, öğrenim/KPSS şartlarını, başvuru yöntemini ve varsa ayrıca belge teslim tarihini doğrula. Bilinmeyen koşulu açıkça belirt; sayı, mezuniyet, puan veya saat uydurma. Pozisyon toplamı ve başvuru takvimi doğrulanamayan ilan yayımlanmaz.
4. Mevcut kayıtları kurum+ilan numarası+resmî URL ile eşleştir; URL varyantlarından mükerrer ilan üretme. Slug kalıcıdır. Kaynak kontrol tarihini kayıt bazında tut; içerik değişmeden veya yeniden doğrulanmadan günlük tarih değiştirme.
5. Açık kayıtlar için düzeltme/iptal/tarih değişikliği duyurularını da kontrol et. İptal doğrulanırsa `withdrawn: true`; kaynağın erişilememesi veya kaybolması tek başına iptal değildir. Süresi biten kayıtlar arşivde kalır; tarayıcı başvuru durumunu günceller.
6. Üreticiyi çalıştır ve `--check`, SEO, erişilebilirlik, frontend secret ve `node --test tests/career.mjs` kontrollerini tamamla. Değişiklik yoksa commit/PR açma.
7. İlan verisi, kaynak listesi, üretilen ilan sayfaları ve sitemap değişikliklerini yeni dal/PR üzerinden yayımla. PR'ı sohbetle ilişkilendir. İlgili kontroller geçince doğrulanmış head SHA ile main'e birleştir. Connector create_tree tabanı güncel main ağacıdır; başka çalışmaları silme. Yeni test hatasını araştır, mevcut ilgisiz katalog test kusuruyla karıştırma.
8. Pages dağıtımı ve değişen canlı URL içeriklerini doğrula. Sitemap güncellenir; Google indeksleme veya sıralama garantisi verilmez.

## Tarih hassasiyeti

Saat doğrulanan alanlar ISO 8601 `+03:00`; yalnızca gün doğrulanmışsa `YYYY-MM-DD` kullanılır. Ekran bilinmeyen saati göstermez. Saati bilinmeyen son başvuru gününde durum `unknown`, başvuru düğmesi gizlidir; ertesi gün kapanır. Bilinmeyen başlangıç tarihi uydurulmaz; ilan doğrulanana kadar yayımlanmaz.

Değişmeyen durumda sessiz kal. Yeni yayın, anlamlı iptal/değişiklik veya kullanıcı müdahalesi gerektiren bir sorun olduğunda bildir. Aynı erişim sorunu için tekrarlayan bildirim gönderme.
