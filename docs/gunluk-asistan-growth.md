# PDR Kampüs: kaynaktan günlük işe

## İnceleme sonucu

Ana depo `Evrenguless/pdrkampus-platform`, başlangıç commit'i `326062e`. Düz HTML/CSS, ES modülleri, GitHub Pages ve Supabase hesap/çalışma alanı kullanılıyor. Bu sürümde katalog toplam 1366 resmî kaynağı içeriyor. Mevcut çalışma alanında kişisel not, görev ve kaydedilen kaynaklar var. Yeni bir çatı veya ikinci veritabanı kurmak yerine mevcut görev altyapısı kullanıldı.

Canlı `pdrkampus.com` sayfası web aracında okunamadı; inceleme kaynak kod üzerindendir. Arama hacmi ve kullanıcı davranışı verisine erişilmedi. Aşağıdaki öncelikler ölçülmüş “en çok aranan” sıralaması değil, mevcut içerik açığı ve okul rehberliği iş akışlarına dayanan ürün hipotezidir.

## Bu sürümde

- `/asistan/`: haftalık iş planı, bugün/gecikmiş/açık iş sayıları; tarih değiştirme, ekleme, tamamlama, silme.
- Hesapla girişte mevcut `workspace_tasks` tablosu; `db/013_workspace.sql` kurulmuş olmalı. Yeni SQL veya veritabanı yazımı yapılmadı. Misafir ayrı tarayıcı planını kullanır; otomatik hesaba aktarım yoktur.
- Sekiz paket: haftalık plan, RİBA ihtiyaç analizi, zorbalığı önleme, devamsızlık izleme, veli semineri, zaman yönetimi, kariyer keşfi, aylık faaliyet özeti.
- Kademeye göre filtre, Türkçe paket araması, seçilen ilk adımı görev formuna taşıma.
- Süre ve kademeye göre özgün etkinlik taslağı. Bu, kurallı şablon oluşturucudur; yapay zekâ API'si kullanılmaz.
- Aylık faaliyet sayıları ve nitel değerlendirmeyle rapor taslağı. Metin indirme, kopyalama, yazdırma/PDF. Rapor girdileri sunucuya veya kalıcı depolamaya yazılmaz.
- Statik rehberler, canonical/Article verisi, sitemap ve ana sayfa/menü/konu bağlantıları. Rehber kaynağı `data/assistant-packs.json`, tekrar üretim `python scripts/build_assistant_guides.py`.

## Ürün döngüsü

Google veya kütüphane → konu rehberi → hazırlık paketi → ilk işini planla → taslak indir → uygulamadan sonra işi tamamla → aylık özet. Günlük geri dönüşün nedeni yeni yazı sayısı değil, öğretmenin yarım kalan işine devam edebilmesidir.

Öğretmen aynı plana dönmeli; öğrenci kayıt sistemi kurmak bu sürümün kapsamı değildir. Güvenlik süreçleri tanımlanmadan vaka takibi, hassas öğrenci dosyası veya otomatik klinik öneri eklenmemeli.

## İlk 30 gün

1. 8–12 rehber öğretmenle görev odaklı kullanım denemesi: ilk görevi ekleme ve ilk taslağı indirmede nerede zorlanıyorlar? Süreyi ölçün; görüşmeleri kendiniz organize edin.
2. Search Console sorgularında bu paketlerin gerçek talebini inceleyin. Birbirine benzer sayfalar üretmek yerine mevcut rehberi uygulama örnekleri ve açık kaynak ilişkileriyle geliştirin.
3. İzinli analitik altyapısı kurulduktan sonra `assistant_open`, `first_task_created`, `template_downloaded`, `task_completed` olaylarını ölçün. Görev başlığı, rapor içeriği, e-posta veya öğrenci verisini olaylara eklemeyin. Bu sürüm analitik servisi veya izleyici eklemez.
4. Aktivasyon: asistanı açanların ilk iş veya taslak tamamlayan oranı. Tutundurma: ilk aktif haftadan sonraki 7 ve 28 günde tekrar anlamlı işlem yapanların oranı. Hedefleri mevcut baz ölçüldükten sonra belirleyin; tahmini rakamları başarı gibi göstermeyin.

## 30–60 gün

- Okul kademesine göre başlangıç kurulumu ve kullanıcı seçimiyle önerilen haftalık akış.
- Kaydedilen kaynaklar ile plan arasındaki bağlantı; mevcut kaynak kimlikleri kullanılmalı.
- Uzman incelemesinden geçmiş, sınıf düzeyi ve kazanımı açık etkinlik paketleri; inceleyen kişi ve tarih görünür olmalı.
- Kaynak sürümü değiştiğinde ilgili çalışma paketini güncelleme süreci. Mevcut CI kaynak/link denetimleriyle birleştirin.
- Kullanıcının isteğiyle haftalık özet veya hatırlatma. Açık opt-in, zaman tercihi ve vazgeçme akışı olmadan bildirim göndermeyin.

## Ücretli değer hipotezi

Ücretsiz temel plan ve resmî kaynak erişimi korunabilir. Düzenlenebilir çıktı koleksiyonları, birden çok okul için çalışma alanı ve kurum düzeyinde anonim faaliyet raporları ücretli değer için test edilebilir. Ödeme, kota veya abonelik bu sürümde yoktur; ücretli paketi önce gerçek kullanım ve görüşmelerle doğrulayın.

## Kaynak sınırı

MEB ÖRGM program merkezi, sınıf rehberlik çalışmaları, akran zorbalığı ve rehberlik hizmetleri sayfaları 6 Ekim 2026 tarihinde web aracında incelendi. Özgün etkinlikler bu sayfalardaki resmî programların kopyası veya onaylı uyarlaması değildir; bağlantılar resmî materyali ayrıca incelemek içindir. Yerel hedefleri tüm ülkeye genelleyen takvim oluşturulmadı.
