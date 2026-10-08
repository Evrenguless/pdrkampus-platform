# Belge önizlemeleri

Toplu komut:

```sh
python scripts/build_resource_previews.py --limit 5000
```

Komutu depo kökünde çalıştırın. Python bağımlılıkları: openpyxl, Pillow, pypdf. PDF için Poppler; DOC/DOCX/PPT/PPTX/XLS için LibreOffice gerekir. GitHub Actions içindeki **Real Resource Previews** işi bağımlılıkları kurar, önizlemeleri üretir, katalog sayfalarını günceller ve canlı yayını başlatır. Elle çalıştırırken `limit` alanı 5000 olarak kullanılabilir. Canlı sistem 100 dosyalık grupları kontrol edip yayımlar, ardından sonraki gruba geçer. Zaman sınırı nedeniyle bir tur tamamlanamazsa sonraki zamanlanmış çalıştırma hazır önizlemeleri atlayarak devam eder.

PDF ve sunumların ilk iki sayfası/slaytı gerçek dosyadan görüntüye çevrilir. Excel dosyalarının görünür çalışma sayfaları özgün değerleriyle gösterilir. Formüller yeniden hesaplanmaz; özgün dosyalar ve katalog kayıtları değiştirilmez. Office belgeleri, makrolar kapalı olan geçici bir LibreOffice profiliyle PDF’ye dönüştürülür.

Önceden hazır kapaklar tekrar işlenmez. Aynı dosyayı paylaşan katalog kimlikleri aynı önizlemeyi kullanır. Erişim sorunu olan dosyalar daha sonra yeniden denenir. ZIP arşivleri ve yalnız web sayfasına yönlendiren kayıtlar belge önizlemesi kapsamına girmez. İşlem bulunmayan bir belge sayfası veya temsilî kapak oluşturmaz.
