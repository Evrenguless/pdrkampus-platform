# Form Haritası veri kaynağı

`data/forms.json`, MEB'in 16.05.2025 Form Haritası PDF'indeki tıklanabilir bağlantılar okunarak oluşturuldu. 80 tıklanabilir alanın 76'sı benzersiz PDF/XLSX dosyasıdır; yinelenen bağlantı, modül ve iki sonuç sayfası dosya kaydı sayılmadı. Kod ve adlar harita yerleşimiyle eşleştirilerek gözden geçirildi. `db/001_form_catalog.sql` ve `db/002_seed_form_catalog.sql` aynı katalog için PostgreSQL/Supabase şeması ve verisidir; henüz canlı veritabanına uygulanmadı.

`source_file_url` özgün MEB dosyasıdır. `storage_key` boş bırakılmıştır; formun kopyası projede barındırılmıyor. Kaynak izinleri ve sürüm yönetimi netleştikten sonra aynı kayıt kimliği korunarak depolama anahtarı doldurulabilir.

## Kaynak envanteri toplu hazırlama

`python scripts/prepare_inventory.py envanter.xlsx --out-dir inventory-review` komutu, Excel'deki kaynakları `review-queue.csv`, `source-pages.csv` ve `summary.json` dosyalarına ayırır. Ayrıntılar için `docs/envanter-toplu-aktarim.md` dosyasına bakın. Çıktı onaysız dosyaları canlı kataloğa eklemez.

## Doğrudan MEB dosyası aktarımı

`python scripts/import_official_batches.py` komutu, sürüm kontrolündeki `inventory-review/review-queue.csv.gz` satırlarını MEB ÖRGM'nin sosyal-duygusal beceriler, akran zorbalığı, siber zorbalık, mesleki rehberlik, sosyal uyum ve özel eğitim sayfalarındaki ayrı PDF bağlantılarıyla eşleştirir. Çalıştırmak için Python `lxml` paketi gerekir. Kaynak sayfasındaki dosya sayısı veya beklenen dosya adı değişmişse işlem durur; her yeni dosyada HTTP 200, PDF türü ve sıfırdan büyük boyut aranır. Aynı dosya ikinci kez eklenmez. Dosya kopyası depolanmaz; kütüphane kartı özgün PDF'yi sitenin görüntüleyicisinde açar.

`docs/verified-batch-2026-09-26.json` son aktarımın kayıt sayısını ve çalışmayan bağlantılarını listeler. Eski sınıf rehberliği seti bağlantıları 404 verdiği için sınıf başına sahte dosya kartı oluşturulmadı. Yeni kaynak sayfaları önce başlık/dosya eşleşmesi doğrulanıp aynı akışa eklenmelidir.

`python scripts/import_riba_sheets.py` komutu, Gölcük RAM'ın RİBA listesindeki sekiz ayrı okul/sınıf sonuç çizelgesini özgün XLSX bağlantılarıyla ekler. Form Haritası'ndaki mevcut RİBA anket formlarını ikinci kez kaydetmez. Excel dosyaları tarayıcıda önizlenemediğinde görüntüleyicide özgün dosyayı açma/indirme bağlantısı sunulur.
