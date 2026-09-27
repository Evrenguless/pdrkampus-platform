# PDR Kampüs Indexleme ve Kaynak Politikası v1

## Ana kural
Keyword sayısı sayfa sayısı değildir. Arama sorguları canonical konu, rehber, kaynak veya veri sayfalarında kümelenir.

## Bir sayfa ne zaman indexlenir?
Aşağıdaki koşullar birlikte sağlanmadan yeni URL sitemap'e eklenmez ve indexable yapılmaz:
1. Tek ve açık bir kullanıcı niyetine cevap verir.
2. Kopya/çok benzer başka bir canonical sayfa yoktur.
3. Özgün, görünür ve faydalı açıklayıcı içerik vardır.
4. İlgili gerçek kaynak/form/belge veya güvenilir birincil referans vardır.
5. Title, description, canonical ve breadcrumb tamamdır.
6. En az bir anlamlı iç bağlantı girişi ve çıkışı vardır.
7. Güncellik gerektiren sayfalarda doğrulama tarihi bulunur.

## Indexlenmeyecekler
- Site içi arama sonuçları ve filtre kombinasyonları
- Sırf keyword varyasyonu için oluşturulan ince sayfalar
- Yalnız dış link veren sayfalar
- Kaynağı doğrulanmamış belge/form sayfaları
- Henüz içerik taslağı olan topic kayıtları

## Kaynak ekleme sırası
1. Mevcut library.json ve forms.json taranır.
2. Mevcut kaynak yeterliyse yeni belge eklenmez.
3. Boşluk varsa önce MEB/ÖRGM/RAM/ÖSYM/YÖK ve ilgili birincil resmî kurum aranır.
4. Aynı belgenin gereksiz kopyaları eklenmez.
5. Kaynak URL, kaynak sayfası, kurum, dosya türü ve doğrulama bilgisi kaydedilir.
6. Hassas/yüksek-risk içeriklerde resmî ve güncel kaynak zorunludur.

## Yayın akışı
keyword -> canonical küme -> inventory eşleşmesi -> içerik üretimi -> kalite kontrol -> indexable -> sitemap

Bu akış sayesinde envanter binlerce kaynağa büyüyebilir; Google'a açılan URL sayısı ise yalnız gerçekten değerli içeriklerle kontrollü biçimde artar.
