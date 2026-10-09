# 1.787 kaynaklık editoryal inceleme kuyruğu

`resources-1787.json`, yüklenen dosyanın değiştirilmemiş kopyasıdır.
SHA-256: `12c107ce49abe8914d0cd4052b61d466d03d1e16a1e9f4cb7a8a4a05b0e699f2`.

Bütün kayıtlar `publicationApproved=false`, `licenseVerified=false`,
`reviewStatus=editorial_review_required` durumundadır. Bu dosya canlı yükleyiciye,
SEO sayfalarına, önizleme üretimine veya otomatik kaynak toplayıcısına bağlanmaz.
GitHub Pages/Jekyll `_config.yml` bu klasörü yayın paketinden dışlar.
Bu, GitHub deposunda erişim kontrolü sağlamaz; depo okuyucuları dosyayı görebilir.
Başka bir dağıtım sistemi kullanılırsa `_staging` yine yayın paketinden çıkarılmalıdır.

Yerel, salt okunur yönetici incelemesi:

```sh
python3 scripts/review_staged_resources.py --output /tmp/pdr-editorial-review
```

Üretilen JSON ve CSV, başlık/kategori şüphelerini ve kademe uyumsuzluklarını listeler.
İşaretlemeler içerik hatasını kesinleştirmez. Özellikle Özel Eğitim ve BEP
etiketi belgeyi okuyarak doğrulanmalıdır. Dosyalar otomatik düzeltilmez.

Her kayıt için belge başlığı, kategori, kademe, kişisel veri ve kullanım izni
insan tarafından incelenmelidir. `Belirtilmemiş` canlı katalogda kullanılan
`Belirtilmiyor` değerine dönüştürülmeli; çoklu kademeler `levels` dizisine alınmalıdır.
Kaynak/hash bilgisi ve kullanım izninin dayanağı inceleme notlarında korunmalıdır.
Onaylar birbirinden bağımsızdır; resmi alan adı veya doğrulanmış dosya hash'i
kullanım iznini kanıtlamaz. Bu içe aktarım hiçbir kaydı yayımlamaz.

Yayımlama ayrı bir PR ile yapılmalıdır. Mevcut `toplanan-` kimlikleri doğrudan
canlı ek katalog biçimine uymaz; kolektörün kimlik/adres/erişim/içerik kontrolleri
korunmalıdır. Onay alanları bulunan canlı ek kayıtlar ancak iki onay `true` ve
`reviewStatus=approved` olduğunda kabul edilir. Eski, onay alanları bulunmayan
1284 kütüphane, 88 form ve mevcut ek katalog kayıtları değiştirilmez.
