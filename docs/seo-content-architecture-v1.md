# PDR Kampüs SEO + İçerik Mimarisi v1

## Amaç
PDR Kampüs'ün arama motorları için ayrı bir içerik çöplüğü üretmeden; mevcut kütüphane, araçlar ve topluluk deneyimini besleyen kalıcı bir bilgi katmanı kurmak.

## Temel URL modeli
- /kutuphane/ -> arama ve filtreleme ürünü
- /konu/{slug}/ -> canonical konu sayfası
- /kaynak/{slug}/ -> tek kaynağın açıklayıcı detay sayfası
- /ihtiyac/{slug}/ -> gerçek problem/iş akışı sayfası
- /rehber/{slug}/ -> daha kapsamlı yönlendirici yazılar

Not: Mevcut GitHub Pages yapısında temiz URL yönlendirmeleri ayrıca çözülene kadar fiziksel dosya üretimi veya uygun fallback/routing yaklaşımı kullanılmalıdır.

## Index politikası
Bir konu sayfası indexable=true olmadan önce:
1. Özgün ve kullanıcıya yararlı açıklama bulunmalı.
2. En az 2 anlamlı kaynak veya ilgili içerik bağlantısı bulunmalı.
3. Sayfa yalnızca anahtar kelime varyasyonu için üretilmiş olmamalı.
4. Başlık, meta description ve canonical URL tanımlı olmalı.
5. İlgili konu/kaynaklara gerçek <a href> iç bağlantıları bulunmalı.

Filtre, sıralama ve site içi arama URL'leri SEO landing page olarak kullanılmaz.

## Topic Dictionary
data/topics.json tek canonical konu sözlüğüdür.
- slug: kalıcı URL anahtarı
- aliases: eş anlamlılar ve gerçek kullanıcı sorgu varyasyonları
- useCases: kullanıcının kaynağı neden aradığını temsil eder
- categoryId: üst bilgi mimarisi
- indexable: SEO sayfasının yayına uygun olup olmadığı
- contentStatus: seed/draft/review/published

## Resource v2 hedef alanları
Mevcut data/library.json ve data/forms.json geriye dönük uyumluluk korunarak genişletilecek:
- slug
- description
- topicIds[]
- useCaseIds[] veya useCases[]
- keywords[]
- sourceName
- sourceUrl/sourcePage
- fileUrl/file
- resourceType/type
- schoolLevels[] veya level
- publisherType/sourceType
- publicationYear
- verifiedAt
- status
- license
- language
- seoTitle
- seoDescription
- canonicalPath
- dateAdded
- dateModified

Geçiş kademeli yapılacak; mevcut alanlar topluca silinmeyecek.

## Konu sayfası şablonu
1. Breadcrumb
2. H1: canonical konu adı
3. 2-4 cümlelik kısa açıklama
4. "Ne zaman işine yarar?" kullanım bağlamları
5. Kısa yönlendirici içerik
6. İlgili resmî/güvenilir kaynaklar
7. İlgili formlar ve araçlar
8. İlgili konular
9. Gerekiyorsa güvenlik/yönlendirme notu

## İçerik yazım ilkesi
"Kısa SEO yazısı" = anahtar kelime doldurma değildir.
Her yazı şu sorulardan en az birini gerçek şekilde yanıtlamalı:
- Bu kavram nedir?
- Okul psikolojik danışmanı bunu hangi durumda arar?
- İlk olarak hangi kaynağa bakmalı?
- Hangi öğrenci/veli/öğretmen bağlamında kullanılır?
- Hangi yakın kavramlarla karıştırılmamalıdır?

Tanı veya tedavi iddiası yapılmaz. Riskli durumlarda içerik, okul prosedürleri ve uygun profesyonel/kurumsal yönlendirmeye bağlanır.

## Structured data
Uygun kaynak detaylarında Schema.org LearningResource temel alınabilir:
- name
- description
- learningResourceType
- educationalLevel
- educationalUse
- about
- keywords
- inLanguage
- license (varsa)

Konu sayfalarında BreadcrumbList kullanılabilir. Structured data yalnızca sayfada gerçekten görünen içeriği temsil etmelidir.

## Yayın öncesi teknik SEO
- Benzersiz title ve meta description
- self canonical
- robots.txt
- sitemap.xml
- gerçek href iç bağlantılar
- 404 davranışı
- Open Graph metadata
- mobil ve performans kontrolü
- Search Console kurulumu alan adı yayına alındıktan sonra
- sitemap gönderimi
- filtre/search parametrelerinin index kontrolü

## İçerik yayın sırası
İlk dalga:
1. Sosyometri
2. Akran zorbalığı
3. Devamsızlık
4. Sınav kaygısı
5. Okul reddi
6. Veli görüşmesi
7. Öğrenciyi tanıma
8. Çalışma alışkanlıkları
9. Kariyer gelişimi
10. Üniversite tercihi

Bu 10 konu, şablonun kalitesini test etmek için pilot kümedir. Başarılı olduktan sonra sözlükteki diğer konulara genişletilir.

## Menü yaklaşımı
İleride ana menüye ağır bir "Blog" eklemek yerine "Konular" veya "Rehber" girişi önerilir.
Bu sayfa:
- popüler konuları,
- okul kademelerini,
- dönemsel ihtiyaçları,
- ilgili kaynak sayılarını
gösterebilir ve PDR Kampüs'ün mevcut tasarım diliyle aynı kart sistemini kullanmalıdır.
