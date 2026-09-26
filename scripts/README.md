# Form Haritası veri kaynağı

`data/forms.json`, MEB'in 16.05.2025 Form Haritası PDF'indeki tıklanabilir bağlantılar okunarak oluşturuldu. 80 tıklanabilir alanın 76'sı benzersiz PDF/XLSX dosyasıdır; yinelenen bağlantı, modül ve iki sonuç sayfası dosya kaydı sayılmadı. Kod ve adlar harita yerleşimiyle eşleştirilerek gözden geçirildi. `db/001_form_catalog.sql` ve `db/002_seed_form_catalog.sql` aynı katalog için PostgreSQL/Supabase şeması ve verisidir; henüz canlı veritabanına uygulanmadı.

`source_file_url` özgün MEB dosyasıdır. `storage_key` boş bırakılmıştır; formun kopyası projede barındırılmıyor. Kaynak izinleri ve sürüm yönetimi netleştikten sonra aynı kayıt kimliği korunarak depolama anahtarı doldurulabilir.

## Kaynak envanteri toplu hazırlama

`python scripts/prepare_inventory.py envanter.xlsx --out-dir inventory-review` komutu, Excel'deki kaynakları `review-queue.csv`, `source-pages.csv` ve `summary.json` dosyalarına ayırır. Ayrıntılar için `docs/envanter-toplu-aktarim.md` dosyasına bakın. Çıktı onaysız dosyaları canlı kataloğa eklemez.
