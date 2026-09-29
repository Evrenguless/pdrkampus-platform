# pdrkampus.com yayın geçişi

Bu dal hazırlık içindir. `main` dalına birleştirilmeden ve DNS değiştirilmeden önce aşağıdaki sırayı izleyin.

## Hazırlık

1. GitHub hesap ayarları → Pages → Verified domains bölümünde `pdrkampus.com` alan adını doğrulayın. GitHub'ın ürettiği TXT kaydını Squarespace DNS ekranına ekleyin; değeri tahmin etmeyin.
2. Supabase Authentication → URL Configuration bölümündeki Redirect URLs listesine `https://pdrkampus.com/hesap.html` ekleyin. Bu aşamada mevcut Site URL'yi değiştirmeyin; eski `hesap.html` adresini geçiş süresince listede tutun.
3. Gizlilik/aydınlatma, iletişim ve materyal paylaşım kurallarının gerçek işletici ve veri akışına göre hazır olduğundan emin olun. Bu metinler için kişi/kurum bilgisi uydurmayın.

## Alan adı geçişi

1. Bu dalı `main` ile birleştirin. Kök `CNAME` dosyası ve yeni SEO adresleri aynı sürümde yayımlanmalıdır.
2. GitHub deposunda Settings → Pages → Custom domain alanının `pdrkampus.com` olduğunu kontrol edin. GitHub'ın DNS kontrolünü bekleyin.
3. Squarespace Domains dashboard → `pdrkampus.com` → DNS → DNS Settings bölümünde mevcut kayıtları inceleyin. Alan adını yayına yönlendireceğiniz zaman Squarespace'in kök alan adına (`@`) ait web kayıtlarını GitHub Pages'in şu dört `A` kaydıyla değiştirin: `185.199.108.153`, `185.199.109.153`, `185.199.110.153`, `185.199.111.153`. `www` için `CNAME` hedefi `evrenguless.github.io` olmalıdır; depo adını hedefe eklemeyin. Squarespace Defaults veya çakışan `@`/`www` web kayıtlarının durumunu panelde gördükten sonra karar verin; e-posta için kullanılan MX/TXT, DKIM, SPF ve DMARC kayıtlarına dokunmayın.
4. Sertifika hazır olduğunda GitHub Pages'te Enforce HTTPS seçeneğini açın.
5. Yeni adres açıldığında Supabase Site URL'yi `https://pdrkampus.com` yapın; kayıt ve şifre sıfırlama e-postalarını yeni adresle sınayın.

## Canlı kontrol

- `https://pdrkampus.com/` ve üç ayrı konu sayfası `200` dönmeli; `www` tek seçilen ana adrese yönlenmeli.
- Eski GitHub Pages URL'sinden ana sayfa ve bir alt sayfa yeni karşılığına gitmeli; yalnız ana sayfaya toplu yönlendirme olmamalı.
- `https://pdrkampus.com/robots.txt` yeni sitemap'i göstermeli; sitemap'teki 131 URL yeni domain ve doğru canonical ile eşleşmeli.
- Kayıt, e-posta doğrulama, giriş, çıkış, şifre sıfırlama, kütüphane kaynağı açma, belge gönderme ve moderasyon akışları yeni domainde denenmeli.
- Google Search Console'da yeni domain doğrulanıp yeni sitemap gönderilmeli; eski ve yeni adreslerin dizin durumu izlenmeli.

Yerel kontrol: `python3 scripts/check_seo.py` ve `node --test tests/*.mjs`.

Başvuru: [GitHub Pages alan adı](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/managing-a-custom-domain-for-your-github-pages-site), [Squarespace DNS kayıtları](https://support.squarespace.com/hc/en-us/articles/360002101888-Edit-your-domain-s-DNS-records), [Supabase Auth yönlendirmeleri](https://supabase.com/docs/guides/auth/redirect-urls), [Google site taşıma](https://developers.google.com/search/docs/crawling-indexing/site-move-with-url-changes).
