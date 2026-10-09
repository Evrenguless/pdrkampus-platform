# Makaleler

`/makaleler.html`, `data/academic-articles-tr.json` dosyasındaki taramayı Kütüphane'nin mevcut kaynak kartları, kapak alanı, liste ızgarası ve temasıyla sunar. Sayfada yalnızca toplam makale sayısı gösterilir; arama, kategori, erişim veya yıl filtresi ve ayrı PDF göstergeleri yoktur. Her kart özgün `sourcePage` sayfasını, bu yoksa DOI adresini açar. PDF adayları veya doğrudan dosya adresleri kullanıcı arayüzünde sunulmaz.

Yeni taramayı aynı JSON dosyasına kopyalayın, `python3 scripts/build_academic_fallback.py` çalıştırın ve güncel veriyi ve statik sayfayı yayınlayın.

İsteğe bağlı DergiPark doğrulaması: `python3 scripts/dergipark_pdf_tara.py --limit 10` (Python `requests` gerekir). Veri dosyasını günceller; günlükler ve yedekler yayınlanmayan `.academic-scans/` klasöründe kalır. 15 saniye aralık, PDF imza kontrolü, yönlendirme izlememe ve 403/429 durumunda durma davranışı korunmuştur. Tarayıcı Python betiğini çalıştırmaz.
