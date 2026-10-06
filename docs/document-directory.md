# Doküman kütüphanesi

Ana sayfa ve /dokumanlar/ üzerinde 8 kategori ve 48 doğrudan kaynak sayfası bulunur. Sayfalarda kullanım amacı, hazırlık notu, dosyanın gerçek adı, biçimi, kademe ve kaynak bağlantısı yer alır.

- Veri: data/document-directory.json
- Üretim: python3 scripts/build_document_directory.py
- Tutarlılık kontrolü: python3 scripts/build_document_directory.py --check
- Test: node --test tests/document-directory.mjs
- 95 farklı MEB/RAM dosyası: 6 Ekim 2026 tarihinde dosya uç noktaları açılarak PDF/Office imzaları kontrol edildi.
- Kontrolde 404 dönen of-disleksi-veli-brosuru-2024 ve sidikaavar-aylik-rehberlik-calisma-raporu-2025, yeni sayfaların kaynak seçiminden çıkarıldı. Eski katalog bu değişiklikte yeniden yazılmadı.
- 9 özgün hazırlık taslağı: .txt indirme, sayfa içi düzenleme ve yazdırma/PDF kaydetme. Bunlar resmî MEB formu olarak sunulmaz.
- Taslak metinleri sunucuya gönderilmez ve kalıcı tarayıcı depolamasına yazılmaz.
- Dış kaynak dosyaları kopyalanmaz; hazırlayan kurumun sunucusundan açılır. İç sayfalar dosyanın içeriğini yeniden yayımlamaz.
- Dosya erişim testi kalıcı erişim garantisi değildir. Üçüncü taraf kaynak bağlantıları zamanla değişebilir.

Mevcut catalog.mjs testi aynı dosyaya ait bağımsız kartları yakalar. Bu çalışmadan önce de bulunan dört yinelenen dosya grubu nedeniyle test başarısızdır; yeni doküman testlerinin üçü de geçer.
