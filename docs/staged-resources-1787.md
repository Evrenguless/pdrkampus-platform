# 1.787 yeni kaynağın staging entegrasyonu

Canlı kütüphaneye yeni kayıt eklenmedi. `data/library.json` içindeki 1.284 kayıt,
88 form ve mevcut 368 ek katalog kaydı korunur. Yüklenen dosya değiştirilmeden
`_staging/resources-1787.json` olarak saklanır ve Pages yayınından dışlanır.

`src/library.js` formları, kütüphaneyi, mevcut yönetici kaynaklarını ve ek kataloğu
birleştirir; arama ve tür/kademe/alan/kaynak filtreleri bu görünür listeyi kullanır.
Staging dosyası bu listeye dahil edilmez. `src/collected-resources.js` artık açık
onay metadata'sı bulunan kayıtları iki onay ve `reviewStatus=approved` olmadıkça
reddeder. Eski metadata'sız yayımlanmış kayıtların davranışı korunur.
Otomatik yayınlayıcı da açık bekleyen onayları geçersiz kılamaz.

## İnceleme bulguları

| Kontrol | Kayıt |
|---|---:|
| Başlıkta dosya adı, sayı, indirme metni veya Unicode biçim şüphesi | 166 |
| Özel Eğitim ve BEP başlığında kategori desteği zayıf | 298 |
| Kademe değeri normalleştirme gerektiriyor | 1.440 |
| Mevcut kataloglarla aynı dosya URL'si | 8 |
| Tanınmayan kategori | 0 |
| En az bir otomatik inceleme işareti | 1.500 |

İşaret sayıları örtüşür. Kategori işaretleri belge içeriği okunmadan kesin hata
olarak değerlendirilemez. İşaretsiz kayıtlar da yayın/izin onayı almış değildir.
1.787 kimlik ve 1.787 SHA-256 değeri staging içinde benzersizdir.

İnceleme akışı ve komut: `_staging/README.md`. Salt okunur yerel rapor,
yöneticiye satır bazında JSON/CSV sunar; onay verme veya yayınlama işlemi yapmaz.
Mevcut web yönetimine bu kuyruğu eklemek için veri tabanı yetkilendirmesi ve
sunucu tarafı onay kontrolü ayrıca tasarlanmalıdır. Bu entegrasyon veri tabanına
ve mevcut yönetici ekranına müdahale gerektirmez.
