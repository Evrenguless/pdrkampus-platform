# Kaynak envanteri v19 · ilk aktarım

26.09.2026 tarihli `PDR_Kampus_Kaynak_Envanteri_v19(1).xlsx` dosyasının **Kaynak Envanteri** sayfasında 1.165 satır var. Önceki v4 envanterindeki 255 başlığın tamamı burada da bulunuyor; 910 satır yeni başlık taşıyor. Başlıkların 16'sı envanterin kendi içinde tekrar ediyor. **Özet** sayfasındaki “Toplam materyal: 116” değeri güncel satır sayısı değil.

Envanterdeki `Kaynak URL` çoğu zaman bir içerik sayfasına, toplu dosya listesine veya birden fazla materyal içeren PDF'ye ait. Sadece `.pdf` ile biten 87 satırın da bir bölümü aynı dosyayı farklı bölüm başlığıyla yineliyor. Bu nedenle bağlantının yanıt vermesi, o başlıkta bağımsız bir indirilebilir dosya olduğu anlamına gelmiyor.

## Bu aktarım

Önceki 31 kütüphane kaydı korundu. Aşağıdaki 7 farklı PDF'nin doğrudan adresi HTTP 200 ve `application/pdf` olarak doğrulandı; kapak veya ilk sayfa başlığı denetlendi.

| Kaynak | Kurum | Konu |
|---|---|---|
| Okul Temelli Psikososyal Koruma, Önleme ve Krize Müdahalede Bir Yol Haritası | Çankaya RAM | Kriz ve psikososyal destek |
| Öfkemi Yönetiyorum | Dörtyol RAM | Öfke yönetimi |
| Akran Zorbalığı Psikoeğitim Programı | Isparta RAM | Akran zorbalığı |
| Okullarda Şiddeti Önleme Çalışmaları El Kitabı | Iğdır RAM | Şiddeti önleme |
| Verimli Ders Çalışma Rehberlik Bülteni | Hacı Lütfiye Şireci RAM | Verimli ders çalışma |
| Beden Algısı | Bolluca İMKB MTAL | Beden algısı |
| 12 Adımda Verimli Ders Çalışma Modüler Panosu | Iğdır Mehmet Murat İşler SBL | Verimli ders çalışma |

Modüler pano kaydının envanter başlığında “18 parçalı” yazıyor; PDF kapağında “12 Adımda Verimli Ders Çalışma Modüler Panosu” yazdığı için kartın başlığı dosyaya göre düzeltildi. “Öfke Kontrolü – Lise Çok Oturumlu Grup Programı” adresi HTTP 404 döndü; kütüphaneye alınmadı. Özel test/ölçek adlarını taşıyan ve başka bir brifing veya kitapçığa giden kayıtlar uygulanabilir test dosyası olarak yayımlanmadı.

## 2026 MEB esenlik paketi

[MEB ÖRGM Esenliği Güçlendirme](https://orgm.meb.gov.tr/www/esenligi-guclendirme/icerik/3661) sayfasındaki 25 envanter başlığı 20 farklı PDF'ye bağlanıyor. Bu 20 dosyanın tamamı HTTP 200 ve `application/pdf` olarak doğrulandı ve kademe/konu bilgileriyle kütüphaneye eklendi. Okul öncesi ve ilkokulun, ayrıca ortaokul ve lisenin ortak kullandığı aile/öğretmen PDF'leri tek kartta iki kademe ile gösterilir.

Sayfada lise **Dijital Esenlik Bireysel Psikoeğitim Programı** için verilen bağlantı, lise **Esenlik Bireysel Psikoeğitim Programı** ile aynı PDF'ye gidiyor. PDF'nin kapağında dijital esenlik değil genel esenlik yazıyor; ikinci başlık bağımsız dosya gibi yayımlanmadı. Böylece bu aktarımda **27 benzersiz PDF** eklendi ve kütüphane toplamı **58** oldu.

Kalan kaynaklar, başlık ve dosya eşleşmesi ile kademe doğrulandıktan sonra aynı yöntemle eklenebilir. Bağlantı ve dosya türü kontrolü materyalin pedagojik uygunluğunu tek başına doğrulamaz.

## Katalog denetimi

26.09.2026 tarihinde Araç Kutusu'ndaki **76 form** ve Kütüphane'deki **58 kaynak** olmak üzere **134 dosyanın tamamı** tekrar denetlendi. `python scripts/check_catalog_links.py` çıktısı: **134 / 134 HTTP 200, beklenen PDF/XLSX türü ve sıfırdan büyük dosya boyutu**. Bu kontrol ağa bağlıdır; ileride bağlantı değişirse tekrar çalıştırılmalıdır.

`npm test` içindeki 16 senaryo ayrıca 134 statik kaydın tamamında gerekli alan, benzersiz kimlik, benzersiz dosya, HTTPS adresi ve uzantı uyumunu; 20 esenlik kartında başlık ile dosya adı eşleşmesini; arama ve kademe filtrelerini denetler. **16 test sayısı 16 kaynak anlamına gelmez.**

## Psikolojik sağlamlık ve psikososyal destek

Envanterdeki 32 kayıt eski [MEB doküman sayfasına](https://orgm.meb.gov.tr/www/psikososyal-destek-dokumanlari-sayfa-1/icerik/1314/%40orgmnext) yönlendiriyordu. Bu sayfadaki iki başlangıç kılavuzu ve beş güçlendirici destek kitabı bağlantısı HTTP 404 döndü. Aynı içeriklerin [güncel MEB Psikososyal Destek-1 sayfasında](https://orgm.meb.gov.tr/www/psikososyal-destek-1/icerik/3070) yayımlanan **32 ayrı PDF bağlantısı** bulundu; her biri HTTP 200, `application/pdf` ve sıfırdan büyük boyutla doğrulandı.

Kayıtlar dört kademe için program, afiş, veli/öğretmen broşürü ve sunumu olarak ayrı kategorilendi. Doğal afet, ölüm-yas, göç, intihar ve terör konulu MEB kitapları da kaynak türüyle eklendi. Bu paketle kütüphane **90** kayda, Araç Kutusu ile toplam statik dosya sayısı **166**'ya ulaştı. Yukarıdaki 134 dosyalık toplu tarama, bu paketten önceki anlık kontroldür; yeni 32 dosya ayrıca kontrol edildi.
