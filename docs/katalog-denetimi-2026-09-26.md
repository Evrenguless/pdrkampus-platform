# Katalog denetimi · 26.09.2026

## Kapsam ve sonuç

| Kontrol | Sonuç |
|---|---:|
| Araç Kutusu form dosyası | 76 |
| Kütüphane PDF kaydı | 23 |
| Benzersiz kimlik, başlık ve dosya adresi | 99 / 99 |
| Canlı MEB dosya adresi HTTP HEAD 200 | 99 / 99 |
| Dosya türü ve uzantı uyumu | 99 / 99 |
| PDF yanıtı | 87 / 87 |
| XLSX yanıtı | 12 / 12 |
| Kod son eki ile kullanım yeri uyumu | Uygulanabilir kayıtların tamamı |

Kaynak: [MEB ÖRGM Form Haritası](https://orgm.meb.gov.tr/meb_iys_dosyalar/2025_05/16122806_formharitasi-16.05.2025-saat_09.45.pdf). PDF bağlantı açıklamalarında 80 tıklanabilir bağlantı, 78 benzersiz adres vardı. Bunların **76'sı doğrudan dosya** ve 76'sı da `data/forms.json` içinde yer alıyor. Diğer iki benzersiz adres dosya yerine MEB sayfasına yönlendiriyor; form dosyası kataloğuna katılmadı. Aynı dosya bağlantısının PDF içinde tekrar kullanılması fazladan kart üretilmesine yol açmıyor.

Form kategorileri MEB haritasındaki üst/alt grupları izliyor. Haritada kodu aynı olan iki **Eğitsel Değerlendirme İsteği Formu** farklı dosyalardır; katalog kimlikleri ve dosya adresleri ayrıdır. Kodu olmayan iki program kaydı bilinçli olarak “Kod belirtilmiyor” gösterilir. `4–6. sınıf` ve `7–12. sınıf` anketleri tek bir kademeye sıkıştırılmadı; sınıf aralığı başlıklarında korunur.

## Arama düzeltmesi

“7. sınıf akran zorbalığı” araması genel **DEHB** ve **Özel Öğrenme Güçlüğü** gözlem formlarını ilişkili sonuç diye gösterebiliyordu. İlgili form eşleştirmesi Sosyometri, Öğrenci Gözlem Kaydı ve şiddet anketleriyle daraltıldı. Ayrıca sınıf aralığı başlıkta yazılıysa 7. sınıf araması 4–6. sınıf formunu dışlar. “8. sınıf sınav kaygısı” için mevcut katalogda doğrudan kaynak yok; sistem ilgisiz belgeyi varmış gibi göstermiyor.

## Kontrolün sınırı

HTTP HEAD doğrulaması bağlantının **o anda erişilebilir** olduğunu ve sunulan dosya türünü gösterir; dosyanın pedagojik uygunluğunu veya gelecekteki erişimini garanti etmez. Bu denetim 99 PDF/XLSX dosyasının içeriklerini tek tek incelemez. Yeni yönetici kayıtları ayrı olarak MEB bağlantısı doğrulanıp yayımlanmalıdır.
