# Sürekli kaynak toplama

`Official Resource Collector`, her gün Türkiye saatiyle 06.23'te ve GitHub Actions içinden **Run workflow** ile çalışır. GitHub yoğunluğunda başlangıç gecikebilir. Zamanlı çalışma, iş akışı ana dala alındıktan sonra etkinleşir.

Başlangıç havuzu `collector/config.json` ve mevcut `data/library.json` / `data/forms.json` kayıtlarının resmî kaynak sayfalarından oluşur. Kaynak kurumların ana sayfaları da izlenir. Her gün havuzun sıradaki 40 adresi seçilir, ilgili bağlantılardan en fazla 80 sayfa taranır. Yeni keşfedilen sayfalar sonraki çalışmalara devredilir; tüm kurumlar her gün taranmaz. Kaynak havuzu genişledikçe tam tur süresi artar.

MEB, RAM ve MEB'e bağlı okul sitelerinde envanter, form, sunum, pano/afiş, broşür ve etkinlikler aranır. PDF, PPT/PPTX, DOC/DOCX, XLS/XLSX ve PNG/JPG/WebP dosyaları desteklenir. Konular ve kaynak alan adları yapılandırmadan genişletilebilir. Dosyanın adı ve kaynak bağlantı metni konu/kademe önerisi üretir; bunlar belge içeriğinin insan tarafından doğrulanmasının yerine geçmez. Belirtilmeyen kademe tahmin edilmez.

## Sonuçlara erişim

GitHub → Actions → **Official Resource Collector** → son çalışma → **official-resource-review** paketini indirin. `index.html` inceleme ekranını, `review.csv` tablo çıktısını, `state.json` kalıcı kuyruğu, `report.json` tarama sonucunu içerir. İnceleme ekranından resmî kaynak sayfasına, dosyaya ve mevcut PDR Kampüs kaynak yönetimine geçilebilir.

- `pending_check`: dosya henüz kontrol edilmedi.
- `review_ready`: erişim ve gerçek dosya imzası doğrulandı, editoryal inceleme bekliyor.
- `retry`: geçici erişim sorunu, robots kısıtı, boyut sınırı veya geçersiz dosya; sonraki çalışmada yeniden ele alınır.
- `duplicate`: başka adayla SHA-256 içerik özeti aynı.
- `already_catalogued`: mevcut katalogda zaten bulunuyor.

Her çalışmada en fazla 24 yeni/bekleyen dosya kontrol edilir; dosya sınırı 15 MiB, süre sınırı 10 dakikadır. Büyük dosyalar kuyruğa alınır ancak kontrol sınırını aşınca elle inceleme gerekir. HTTP yanıtı kadar dosya imzası da kontrol edilir; Word/Excel/PowerPoint OOXML paket yapısı doğrulanır. Orijinal dosyaların kopyaları tutulmaz. SHA-256, bağlantı ve kaynak bağlamı saklanır. Dosya içeriğinin aynı URL'de sonradan değiştirilmesi bu ilk sürümde yeniden taranmaz.

Mevcut katalog kayıtları URL ile ayıklanır; adaylar arasında içerik özetiyle tekrar kontrol edilir. Mevcut katalogdaki bütün dosyalar yeniden indirilmediği için farklı URL'deki eski bir dosyayla içerik eşleşmesi kesin olarak belirlenemez. Editoryal incelemede başlık/içerik tekrarı da kontrol edilmelidir.

Önceki ana dal çalışmasının kuyruğu geri yüklenir ve sonraki pakete devredilir; paketler 90 gün tutulur. 90 gün boyunca başarılı paket üretilemezse veya bütün paketler silinirse kuyruk yedeği elle geri verilmelidir. Uzun süre kullanılmayan herkese açık depolarda GitHub zamanlı işleri devre dışı bırakabilir; Actions ekranından yeniden etkinleştirilir.

## Yerel kullanım

Python 3.9+ ve standart kütüphane yeterlidir; API anahtarı veya yeni veritabanı gerekmez.

```sh
python scripts/collect_resources.py --output /tmp/pdr-resources-first
python scripts/collect_resources.py --previous /tmp/pdr-resources-first/state.json --output /tmp/pdr-resources-next
python -m unittest discover -s scripts -p test_collect_resources.py
```

Program `robots.txt` kurallarına, kurum başına bekleme süresine, alan adı izin listesine ve dosya/süre sınırlarına uyar. Alan adı dışına yönlendirmeler reddedilir. Kaynak metni HTML içinde kaçışlanır, CSV formül girişleri metne dönüştürülür. Gerçek kişi bilgileri içerebilecek dosyaların yayımlanması inceleme gerektirir.

**Toplama işlemi mevcut kataloğa, hesaplama veri kümelerine, Supabase'e veya canlı sayfalara yazmaz.** İncelenen ve uygun bulunan kaynaklar mevcut kaynak yönetimi üzerinden yayımlanır. Otomatik yayın bu sürümün parçası değildir.

GitHub belgeleri: [zamanlı işler](https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows#schedule), [çıktı paketleri](https://docs.github.com/en/actions/tutorials/store-and-share-data).
