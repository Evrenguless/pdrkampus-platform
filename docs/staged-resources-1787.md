# 1.787 kaynaklık içe aktarımın yayın sonucu

Mevcut yayın ve gerçek belge önizleme kurallarıyla 1.787 kaynak değerlendirildi.
335 yeni kaynak `data/collected-resources.json` ek kataloğuna alındı; 1.452 kayıt
kontrolleri tamamlamadığı veya tekrar olduğu için yayına alınmadı. Ek katalog
368 kayıttan 703 kayda çıktı. Mevcut 1.284 kütüphane kaydı, 88 form, eski ek
katalog kayıtları ve eski önizleme metadata'sı aynen korunur.

| Yayına alınmama nedeni | Kayıt |
|---|---:|
| Mevcut MEB/HTTPS adres politikasının dışında | 260 |
| Mevcut dosya adresi veya dosya özetiyle tekrar | 64 |
| Tam belge içerik incelemesini geçemedi | 997 |
| İnceleme sonrasında aynı normalize belge metni | 35 |
| Boyut, biçim veya erişim kontrolü geçilemedi | 93 |
| Belge işleme süre sınırı | 2 |
| Kaynak bağlantı hatası | 1 |

Kaynak erişimi, resmi alan adı, dosya imzası, yüklenen dosyayla SHA-256 eşleşmesi,
başlık/konu/kademe tutarlılığı, olası kişisel bilgi işaretleri ve tekrar kontrolleri
uygulandı. Belirsiz, şifreli veya mevcut sınırları aşan belgeler yayımlanmadı.
Tam belge incelemesini geçen 370 kaydın 35'i aynı metin olduğu için ayrıldı.
335 kaydın her biri özgün belgeden üretilmiş ilk iki sayfa/slayt önizlemesine sahiptir
(tek sayfalı belgelerde bir önizleme). PDF, PowerPoint ve Word özgün dosya
bağlantıları korunur. Konu, materyal türü ve kademe mevcut içerik denetiminden alınır.

Kullanıcı sohbet içinde kullanım ve yayın izni verdi. Bu dayanak yeni canlı
kayıtların `approvalBasis` ve `approvedAt` alanlarında korunur. `licenseVerified`
yayın kapısı bu açık kullanıcı iznine dayanır; bağımsız kurum lisansı doğrulaması
yapıldığı iddia edilmez. Yeni kayıtlar iki onay `true` ve `reviewStatus=approved`
durumundadır. Diğer adayların özgün onay alanları staging dosyasında değişmeden kalır.

Özgün dosya `_staging/resources-1787.json` olarak korunur ve Pages yayınından
dışlanır. Satır bazında sonuç ve onay dayanağı `_staging/publication-review.json`
içindedir. Staging canlı yükleyiciye bağlanmaz; yalnız kontrolleri tamamlanan
ayrı canlı kayıtlar normal arama, tür/kademe/alan filtreleri ve kaynak sayfalarında
kullanılır. Bekleyen kimliklerin canlı ek kataloğa girmediği test edilir.

`prepare_staged_publication.py` yalnız proje dışına inceleme/önizleme çıktısı
üretir. 400 dosyalık gruplar, mevcut 15 MiB dosya, 80 sayfa PDF, alt süreç
zaman/bellek, resmi alan adı/robots ve kurum bekleme sınırları korunur. Yayın
300 kayıttan büyük ekleme yapmayan ardışık gruplarla hazırlanır. Önizleme üretimi
incelemede kullanılan aynı baytları kullanabilir; kaynak hash uyuşmazsa reddeder.
Eski önizleme komutunun varsayılan davranışı korunur.

Yeni yayın inceleme testleri ile bütün arayüz testleri GitHub Actions üzerinde
çalışır. Önceki genel içerik kalite testindeki mevcut sayfa benzerlikleri ayrı
bir editoryal bulgudur; bu içe aktarım mevcut kaynakları silmez veya birleştirmez.
