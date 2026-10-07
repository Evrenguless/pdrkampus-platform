# Personel ilanları ve bölüm rehberi

Bu iki alan ana sayfa, genel arama, Konular kataloğu ve masaüstü/mobil/alt menüye eklenmez. Doğrudan URL, arama motorları ve kendi aralarındaki içerik bağlantılarıyla erişilir:

- `/personel-alim-ilanlari/`: tarih sıralı ilan haberleri; metin, şehir, öğrenim ve durum filtresi.
- `/personel-alim-ilanlari/<slug>/`: kalıcı ve statik haber detayı.
- `/bolumler/`: bölüm seçkisi; metin, puan türü ve program düzeyi filtresi.
- `/bolumler/<slug>/`: puan türü, süre, yıl belirtilen başarı sırası koşulu, tercih kontrolü ve resmî kaynaklar.

Liste ve içeriklerin tamamı HTML'de bulunur; JavaScript sadece filtreleme ve güncel başvuru durumunu sağlar. JS kapalıysa içerik ve kaynaklar erişilebilirdir; durum rozeti kaynak kontrolü tarihine göre etiketlenir. JavaScript açıkken durumlar 30 saniyede bir ve sekmeye dönüldüğünde güncellenir. Kapanan, geri çekilen ve henüz başlamayan ilanlarda başvuru düğmesi gizlenir. İptal/değişiklik duyuruları resmî kaynaklardan takip edilir. Altı saatlik Codex otomasyonunun iş akışı ve erişim sınırları `docs/recruitment-monitor.md` içindedir.

## İlan ekleme / güncelleme

1. Kurumun resmî duyurusunu ve tam ilan metnini kontrol edin. Başka haber siteleri keşif/referans içindir; kaynak metni kopyalamayın. İlk ilan Düzce Üniversitesi 2026/2 duyurusu ve kurum PDF'sinden doğrulanmıştır.
2. `data/recruitment.json` içindeki `announcements` listesine aynı yapıda bir kayıt ekleyin. `slug` kalıcıdır. Tarih/saatler ISO 8601 ve `+03:00` saat dilimiyle girilir. Son başvuru saatini tahmin etmeyin. Kontenjan toplamı pozisyonların toplamıyla eşleşmelidir. KPSS asgari puanı belirtilmemişse sayısal eşik uydurmayın.
3. `sourceUrl`, `documentUrl` ve `applyUrl` resmî HTTPS kurum adresleridir. İlan iptal edildiyse `withdrawn: true` yapın; arşiv URL'sini koruyun. Yeni ilan metnini eski slug üzerine yazmayın.
4. `updatedAt` gerçek içerik kontrol/değişiklik tarihidir. Üstteki `reviewedAt` son editör kontrolüdür; otomatik günlük tarih değiştirmeyin.
5. `python3 scripts/build_career_pages.py` çalıştırıp üretilen HTML ve sitemap değişikliklerini veriyle birlikte commit edin.

İçerik Git üzerinden yönetilir. Kaynak kontrolü ve yayın Codex otomasyonuna bağlıdır; tarayıcı yönetici paneli veya Supabase değişikliği yoktur.

## Bölüm koşulları

`data/programs.json` her bölümün puan türü, süresi, `ruleYear`, `reviewedAt`, `rank` ve kaynak bağlantısını tutar. `rank: null` kılavuzun Tablo 1B bölümünde genel baraj tanımlanmamasıdır; özel koşulların olmadığı anlamına gelmez. Genel başarı sırası barajını geçmiş taban sıralamasıyla karıştırmayın. Üniversite bazında doğrulanmış taban verileri bu sürümde kopyalanmaz; ziyaretçi ilgili YÖK Atlas ekranına yönlendirilir.

2026 koşulları ÖSYM'nin 2026 Programlar ve Kontenjanlar Kılavuzu, sayfa 16 (PDF sayfa 18), Tablo 1B ile doğrulanmıştır. Hukuk için bu kılavuzda 100.000 bulunur; 2025'teki 125.000 koşulu 2026 diye taşınmaz. Kaynak PDF: https://dokuman.osym.gov.tr/web/2026/8/2026-yuksekogretim-programlari-ve-kontenjanlari-kilavuzu-90wzzd-04155310.pdf . Gelecek dönem için yeni kılavuz ve değişiklik duyuruları yeniden kontrol edilmelidir. Puan türleri ve süreler kılavuzun Tablo 3/4 program kayıtlarıyla eşleştirilir. Vakıf üniversitelerinin daha yüksek sıralama koşulları ve program özel koşulları ayrıca kontrol edilir.

## Kontroller

- `python3 scripts/build_career_pages.py --check`
- `python3 scripts/check_seo.py`
- `python3 scripts/check_accessibility.py`
- `npm test`

HTML sayfaları elle düzenlenmez; JSON/generator değiştirilip tekrar üretilir. Veri listesinden çıkarılan eski detay sayfaları için üretici durur; arşiv veya yönlendirme kararı bilinçli verilmelidir. Sitemap yalnızca temel ve kalıcı sayfa URL'lerini içerir; filtre parametreleri eklenmez. Canonical, Open Graph ve Article/NewsArticle metaverileri üretilir. Birden fazla pozisyonu haber olarak anlatan sayfaya `JobPosting` eklenmez; liste sayfasına da eklenmez.

## Yayına alma

GitHub Pages'in mevcut dağıtımını kullanın. Canlı güncelleme için değişiklikleri main'e birleştirip mevcut Pages dağıtımının bitmesini bekleyin. Search Console'da sitemap gönderimi ve URL denetimi ayrıca site sahibi tarafından yapılır; kod değişikliği indekslenme veya Google sıralaması garantisi vermez.
