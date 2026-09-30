# PDR Kampüs · Auth Production Checklist

Bu liste Supabase Auth üretim ayarlarının düzenli olarak doğrulanması için kullanılır.

## Sunucu tarafı ayarları

- Authentication > Rate Limits: varsayılan Supabase rate limitlerinin etkin olduğunu doğrula.
- Authentication > CAPTCHA: Cloudflare Turnstile veya hCaptcha etkinleştir ve signup/signin/password reset akışlarını test et.
- Authentication > Providers > Email: e-posta doğrulamasını açık tut.
- Authentication > Providers > Email OTP Expiry: 3600 saniye veya daha kısa kullan.
- Authentication > URL Configuration: Site URL `https://pdrkampus.com/`; gerekli redirect URL'leri yalnızca üretim alan adında tut.
- Authentication > Emails > SMTP: mümkünse pdrkampus.com alan adından özel SMTP kullan.
- Authentication > Emails > Templates: doğrulama ve şifre sıfırlama metinlerini PDR Kampüs markasıyla kontrol et.
- Session/JWT ayarlarını gereksiz uzun tutma; değişiklikten sonra kayıt, giriş, çıkış ve şifre sıfırlama testlerini tekrar yap.

## İstemci kabul kriterleri

- Frontend yalnızca publishable key içerir.
- `service_role`, `sb_secret_` veya özel anahtar frontend/repo içinde bulunmaz.
- Şifre sıfırlama yanıtı hesap varlığını ifşa etmez.
- Hassas işlemlerden önce sunucudan `getUser()` ile oturum doğrulanır.
- Çıkış sonrası özel sayfalardaki kullanıcı verisi erişilemez.
- Auth redirectleri yalnız HTTPS production origin'e döner.

## Periyodik kontrol

Her auth yapılandırma değişikliğinden sonra:
1. Yeni hesap oluştur.
2. E-posta doğrulamasını tamamla.
3. Giriş/çıkış yap.
4. Şifre sıfırlamayı test et.
5. Yanlış giriş ve art arda isteklerde rate limit/CAPTCHA davranışını kontrol et.
6. Supabase Security Advisor'ı tekrar çalıştır.
