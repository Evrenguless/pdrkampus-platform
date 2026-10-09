# Makaleler

`/makaleler.html`, `data/academic-articles-tr.json` dosyasındaki taramayı sunar. Arama başlık, yazar, dergi, konu ve DOI metaverisini kullanır. PDF yalnızca `directDownload: true`, `downloadStatus: verified` ve geçerli HTTP(S) dosya bağlantısı birlikte varsa gösterilir. Doğrulanmamış `candidatePdf` bağlantıları ziyaretçiye sunulmaz. Dil etiketi tam metin incelemesi anlamına gelmez.

Yeni taramayı aynı JSON dosyasına kopyalayıp yayınlayın. Statik ilk sonuçları güncellemek için `python3 scripts/build_academic_fallback.py` çalıştırın.

İsteğe bağlı DergiPark doğrulaması: `python3 scripts/dergipark_pdf_tara.py --limit 10` (Python `requests` gerekir). İşlem veri dosyasını günceller; günlükler ve yedekler yayınlanmayan `.academic-scans/` klasöründe kalır. 15 saniye aralık, PDF imza kontrolü, yönlendirme izlememe ve 403/429 durumunda durma davranışı korunmuştur. Güncelleme sonrası statik sonuçları yenileyip değişiklikleri yayınlayın. Tarayıcı bu Python betiğini çalıştırmaz.
