# PDR Kampüs Platform · Aşama 1 prototipi

Bu, mevcut `Evrenguless/pdrkampus` deposundan **ayrı** bir projedir. `analiz/` klasörü, 25 Eylül 2026 tarihinde okunan mevcut deponun `index.html` ve `assets` dosyalarının değiştirilmemiş kopyasını taşır. Formüller, sayısal veriler, kimlik doğrulama ve simülatör kodu düzenlenmemiştir. Depoya hiçbir yazma yapılmamıştır.

## Çalıştırma

Proje kökünde `python3 -m http.server 8000` çalıştırın ve `http://localhost:8000` adresine gidin. `analiz/` mevcut CDN ve Supabase bağlantılarına bağlıdır. Yeni ana sayfa ve katalog statiktir; hesap gerekmez.

## Bugünkü kapsam

- Mobil uyumlu kampüs ana sayfası ve mevcut analize geçiş
- Araç Kutusu ve Kütüphane için örnek, filtrelenebilir kayıtlar ve ayrıntı kartları
- Konu/kademe terimleriyle iki koleksiyonda arama; basit eş anlamlı eşleştirme
- Gelecek aşamaların açık yol haritası

Katalog girdileri **örnek içerik taslaklarıdır**. Resmî MEB formu, indirilebilir belge veya doğrulanmış klinik araç olarak sunulmaz. Arama şu an katalog üzerindeki istemci tarafı eşleştirmedir; topluluk gönderilerini veya harici kaynakları taramaz. İçerik indirme, kaydetme, giriş, belge yükleme, yorum ve kişisel öğrenci verisi bu prototipte yoktur.

## Modül sınırları ve sonraki geliştirme

- `analiz/`: Eski çalışan uygulamanın bağımsız ve değişmemiş kopyası. Mevcut Supabase projesine bağlanır; yeni platform kimliğiyle birleştirilmeden önce oturum, yönlendirme, veri sahipliği ve dağıtım ayrıntıları incelenmelidir.
- `src/catalog.js`: Araç ve kaynak metaverisinin tek noktası. Gelecekte kayıtlar API üzerinden alınabilir. Her kayıt kaynak türü (`official`, `verified`, `community`, `draft`), kaynak URL'si, sürüm, moderasyon ve erişim alanlarıyla genişletilmeli.
- `src/app.js`: Görünüm, filtre ve örnek arama. İkinci aşamada birleşik arama API'si araç, kütüphane, belge ve topluluk için tür ve yetki filtresiyle sonuç dönmeli.
- Belge Merkezi / Topluluk / Meslektaşıma Sor: Kullanıcı, rol, içerik, revizyon, rapor ve moderasyon tabloları ile ayrı modüller. Topluluk deneyimi resmî kaynaklarla aynı rozet altında gösterilmemeli.
- Çalışma alanı / erken uyarı: Öğrenci kayıtları için ayrı güvenli veri alanı, yetkilendirme, erişim kaydı, saklama politikası ve kurum onayı tasarlanmadan öğrenci verisi toplanmamalı. Değişim sinyali karar desteğidir; tanı veya otomatik risk etiketi değildir.

## Önerilen aşamalar

1. Katalog içeriğini doğrulama, gerçek kaynak izinleri ve veri modelini kesinleştirme; mevcut analizi yeni uygulama kabuğuna taşırken regresyon karşılaştırması.
2. Kimlik/rol sistemi, belge iş akışı, moderasyonlu topluluk ve soru cevap; birleşik arama dizini.
3. Kurumsal çalışma alanı, öğrenci/sınıf ölçümleri ve açıklanabilir zaman serisi; gizlilik ve yetki tasarımı tamamlandıktan sonra pilot.

## Kontrol

`node --check src/app.js` ve `node --check src/catalog.js`; ayrıca yerel sunucuda ana sayfa, kart filtresi, arama, ayrıntı iletişim kutusu ve `/analiz/` bağlantısını kontrol edin.
