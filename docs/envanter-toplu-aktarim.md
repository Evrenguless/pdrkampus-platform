# Envanteri toplu hazırlama

Kaynak envanterini tek tek elle girmek yerine aşağıdaki komutla yeniden işlenebilir bir inceleme kuyruğuna dönüştürün:

```bash
python -m pip install openpyxl
python scripts/prepare_inventory.py PDR_Kampus_Kaynak_Envanteri_v19.xlsx --out-dir inventory-review
```

CSV girdi de desteklenir. `review-queue.csv` satırları önceliğe göre sıralar. `source-pages.csv` aynı kaynak sayfasına giden başlıkları bir araya toplar; tek sayfa taranarak birden çok kayıt incelenebilir. `summary.json` sayıların kısa dökümüdür. Üretilen v19 kuyruğu depoda `review-queue.csv.gz` olarak sıkıştırılmış saklanır; `gzip -dc inventory-review/review-queue.csv.gz > review-queue.csv` komutuyla açılır. Böylece yeniden çalıştırmak için Excel dosyasına bağımlı değildir.

- `published`: Envanterdeki doğrudan dosya URL'si mevcut form veya kütüphane dosyasıyla aynı.
- `file_candidate`: URL dosyaya benziyor; bağlantı, başlık, kapsam ve dosya içeriği ayrıca denetlenmeli.
- `review`: Kaynak sayfasından dosya eşleşmesi gerekli, başlık mevcut kayıtla aynı ama dosya eşleşmesi belirsiz, URL yok veya tekrar var.

Bu işlem **hiçbir envanter satırını canlı kataloğa otomatik yayımlamaz**. Kaynak sayfasına giden URL bağımsız indirilebilir dosya sayılmaz. `duplicate_rows` olası envanter tekrarlarını işaretler; aynı sayfaya giden farklı başlıkları kendi başına tekrar kabul etmez. Dosya adaylarının bazısı yanlış belgeye veya artık olmayan adrese çıkabilir. Onaylanan dosyalar mevcut katalog şemasına, benzersiz dosya URL'si ve doğrulanmış metaveriyle eklenir. `npm test` ve `python scripts/check_catalog_links.py` ardından çalıştırılır.

26.09.2026 v19 sonucu: 1.165 satır; mevcut dosyayla URL eşleşen 7, kontrol edilecek doğrudan dosya adayı 11, kaynak/dosya eşleştirmesi gerektiren 1.147. 159 farklı dosya dışı kaynak sayfası ve 93 olası tekrar ilişkili satır var. Bu sayılar *yeni yayımlanmış kaynak sayısı* değildir. Önceden farklı bir kaynak sayfasından eklenen yayınlar, yalnızca URL eşleştirmesiyle otomatik saptanamaz.
