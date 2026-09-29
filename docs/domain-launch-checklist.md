# pdrkampus.com yayın geçişi

Bu dal hazırlık içindir. `main` dalına birleştirilmeden ve DNS değiştirilmeden önce aşağıdaki sırayı izleyin.

## Hazırlık

1. Tamamlandı (29 Eylül 2026): GitHub hesap ayarları → Pages → Verified domains bölümünde `pdrkampus.com` doğrulandı. Squarespace DNS ekranındaki `_github-pages-challenge-Evrenguless` TXT kaydı yayındaki doğrulamayı sağlıyor; kaydı koruyun.
2. Tamamlandı (29 Eylül 2026): Supabase Authentication → URL Configuration bölümündeki Redirect URLs listesinde `https://pdrkampus.com/hesap.html` ile eski `hesap.html` adresi birlikte doğrulandı. Site URL hâlâ eski GitHub Pages adresi; yeni domain açılana kadar değiştirmeyin.
3. İletişim, veri işleme bilgileri ve materyal paylaşım kuralları sayfaları taslak PR'da hazırlandı. İşletenin ticaret sicili kaydı yoktur ve sitede kişisel ad kullanmak istememektedir; kamuya açık sayfalarda yalnızca PDRKampüs adını ve `evrengules@pdrkampus.com` iletişim adresini kullanın. PDRKampüs'ü tescilli şirket veya tüzel kişi unvanı olarak göstermeyin. Bu tercih veri sorumlusunun kimliğini açıklama yükümlülüğünü kendiliğinden karşılamaz: üyelik, topluluk ve dosya yükleme gibi kişisel veri işleyen özellikleri yayımlamadan önce kimlik bildiriminin nasıl yerine getirileceğini, uygulanacak KVKK işleme şartlarını, Avustralya (Sydney) Supabase bölgesine aktarımın hukuki mekanizmasını, saklama/silme sürelerini ve başvuru usulünü hukuk danışmanıyla çözün. Kişisel adı siteye otomatik eklemeyin; bu hususlar çözülmeden mevcut gizlilik sayfasını tamamlanmış aydınlatma metni olarak sunmayın.
4. Yeni hedef: üyelik ve topluluk verileri Türkiye'de saklanacak. Mevcut yönetilen Supabase projesi Sydney'dedir ve Supabase'in Türkiye bölgesi yoktur; bu projeyi Türkiye'deymiş gibi tanıtmayın. Türkiye'deki altyapıya taşıma, hizmetler ve hukuki metin güncellemesi için [veri yerleşimi planını](turkiye-veri-yerlesimi.md) tamamlayın. Bu gerçekleşmeden `src/auth-config.js` içindeki Sydney API bağlantısını değiştirmeyin ve bu dalı yayına almayın.

## Alan adı geçişi

Yukarıdaki hukuki, altyapı ve içerik kontrolü tamamlandıktan sonra merge ile DNS düzenlemesini aynı yayın penceresinde gerçekleştirin. `CNAME` etkinleşince eski GitHub Pages adresi yeni domaine yönlenebilir; DNS yayılması sırasında bazı ziyaretçiler bir süre Squarespace park sayfasına gidebilir.

1. Bu dalı `main` ile birleştirin ve Pages dağıtımının başarıyla tamamlandığını doğrulayın. Kök `CNAME` dosyası ve yeni SEO adresleri aynı sürümde yayımlanmalıdır.
2. GitHub deposunda Settings → Pages → Custom domain alanının `pdrkampus.com` olduğunu kontrol edin. DNS yönlendirmesine geçmeden önce bu alanın GitHub Pages tarafında kayıtlı olması gerekir; DNS kontrolü henüz başarısız görünebilir.
3. Squarespace Domains dashboard → `pdrkampus.com` → DNS → DNS Settings bölümünde yayın geçişinde **Squarespace Varsayılan Ayarları** ön ayarını kaldırın. Bu ön ayar şu anda dört Squarespace `@` A kaydını, `www → ext-sq.squarespace.com` CNAME kaydını ve Squarespace IP ipuçları içeren `@` HTTPS kaydını birlikte tutuyor. Ardından `@` için GitHub Pages'in şu dört `A` kaydını ekleyin: `185.199.108.153`, `185.199.109.153`, `185.199.110.153`, `185.199.111.153`. `www` için `CNAME` hedefi `evrenguless.github.io` olmalıdır; depo adını hedefe eklemeyin. Google Workspace MX/SPF/DKIM ve GitHub doğrulama TXT kayıtlarını, ayrıca `_domainconnect` ön ayarını koruyun.
4. DNS kontrolü ve sertifika hazır olduğunda GitHub Pages'te Enforce HTTPS seçeneğini açın.
5. Türkiye'de kurulan ve doğrulanan kimlik hizmetinin Site URL'sini `https://pdrkampus.com` yapın; kayıt ve şifre sıfırlama e-postalarını yeni adresle sınayın. Sydney projesini canlı hedef olarak kullanmayın.

## Canlı kontrol

- `https://pdrkampus.com/` ve üç ayrı konu sayfası `200` dönmeli; `www` tek seçilen ana adrese yönlenmeli.
- Bilinmeyen bir yol GitHub Pages özel `404.html` sayfasını `404` durumuyla döndürmeli; sayfa `noindex` olmalı ve bağlantıları yeni domain altında çalışmalı.
- Eski GitHub Pages URL'sinden ana sayfa ve bir alt sayfa yeni karşılığına gitmeli; yalnız ana sayfaya toplu yönlendirme olmamalı.
- `https://pdrkampus.com/robots.txt` yeni sitemap'i göstermeli; sitemap'teki 134 URL yeni domain ve doğru canonical ile eşleşmeli.
- Kayıt, e-posta doğrulama, giriş, çıkış, şifre sıfırlama, kütüphane kaynağı açma, belge gönderme ve moderasyon akışları yeni domainde denenmeli.
- Google Search Console'da yeni domain doğrulanıp yeni sitemap gönderilmeli; eski ve yeni adreslerin dizin durumu izlenmeli.

Yerel kontrol: `python3 scripts/check_seo.py` ve `node --test tests/*.mjs`.

Başvuru: [GitHub Pages alan adı](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/managing-a-custom-domain-for-your-github-pages-site), [Squarespace DNS kayıtları](https://support.squarespace.com/hc/en-us/articles/360002101888-Edit-your-domain-s-DNS-records), [Supabase Auth yönlendirmeleri](https://supabase.com/docs/guides/auth/redirect-urls), [Google site taşıma](https://developers.google.com/search/docs/crawling-indexing/site-move-with-url-changes).
