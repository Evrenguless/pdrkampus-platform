
(function(){
  const legalTexts = {
    privacy: {
      title: "Gizlilik İlkeleri",
      body: `
        <div class="rk-legal-text">
          <p>PDR Kampüs, kullanıcıların siteyi güvenli ve işlevsel biçimde kullanabilmesini amaçlar. Bu metin, platform üzerinden girilen bilgilerin nasıl ele alındığına ilişkin genel bilgilendirmedir.</p>
          <h3>Toplanan bilgiler</h3>
          <p>Hesaplama için kullanıcı tarafından girilen sınav netleri ve senaryo tercihleri kullanılabilir. Üyelik veya canlı sıralama özellikleri kullanıldığında hesapla ilişkili teknik bilgiler de işlenebilir.</p>
          <h3>Bilgilerin kullanım amacı</h3>
          <p>Veriler; puan ve sıralama tahmini üretmek, canlı sıralama özelliklerini çalıştırmak, site güvenliğini sağlamak ve hizmeti geliştirmek amacıyla kullanılabilir.</p>
          <h3>Veri güvenliği</h3>
          <p>Kullanıcı bilgilerinin yetkisiz erişime karşı korunması için makul teknik ve idari önlemler uygulanır. Ancak internet üzerindeki hiçbir aktarımın mutlak biçimde risksiz olduğu garanti edilemez.</p>
          <h3>Üçüncü taraf hizmetler</h3>
          <p>Platformun çalışması için kullanılan barındırma, veri tabanı, analiz veya benzeri üçüncü taraf hizmetleri kendi gizlilik koşullarına tabi olabilir.</p>
          <h3>Haklar ve talepler</h3>
          <p>Verilerinizle ilgili bir talebiniz veya gizlilik sorunuz varsa iletişim bölümündeki kanallardan PDR Kampüs ile iletişime geçebilirsiniz.</p>
        </div>`
    },
    terms: {
      title: "Kullanıcı Sözleşmesi",
      body: `
        <div class="rk-legal-text">
          <p>PDR Kampüs'ü kullanarak aşağıdaki kullanım esaslarını kabul etmiş olursunuz.</p>
          <h3>Hizmetin amacı</h3>
          <p>Platform, sınav sonuçları ve kullanıcı tarafından girilen veriler üzerinden bilgilendirme amaçlı puan ve sıralama tahminleri sunar.</p>
          <h3>Tahminlerin niteliği</h3>
          <p>2027 puan ve sıralama sonuçları tahminidir; resmî sınav sonucu, ÖSYM sonucu veya herhangi bir kurum tarafından verilmiş kesin başarı sırası olarak değerlendirilmemelidir.</p>
          <h3>Kullanıcı sorumluluğu</h3>
          <p>Kullanıcı, girdiği bilgilerin doğruluğundan ve hesabının güvenliğinden sorumludur. Platformun kötüye kullanılması, otomatik saldırılar veya hizmetin çalışmasını engelleyici faaliyetler yasaktır.</p>
          <h3>Değişiklikler</h3>
          <p>Platform özellikleri, hesaplama yöntemleri ve bu sözleşme hizmetin geliştirilmesi kapsamında güncellenebilir.</p>
        </div>`
    },
    cookies: {
      title: "Çerez Politikası",
      body: `
        <div class="rk-legal-text">
          <p>PDR Kampüs, sitenin temel işlevlerini sağlamak ve kullanıcı deneyimini sürdürebilmek için çerezler veya benzer teknolojiler kullanabilir.</p>
          <h3>Zorunlu teknolojiler</h3>
          <p>Oturum, güvenlik, tercihlerin korunması ve temel site işlevleri için gerekli teknik veriler kullanılabilir.</p>
          <h3>Tercihler</h3>
          <p>Kullanılan üçüncü taraf hizmetlerin kendi çerez politikaları bulunabilir. Tarayıcınızın ayarlarından çerezleri yönetebilirsiniz; ancak bazı özellikler bu durumda düzgün çalışmayabilir.</p>
        </div>`
    },
    legal: {
      title: "Yasal Uyarı",
      body: `
        <div class="rk-legal-text">
          <p>PDR Kampüs üzerindeki puan, sıralama, yüzdelik dilim ve senaryo sonuçları bilgilendirme ve tahmin amacı taşır.</p>
          <h3>Resmî sonuç yerine geçmez</h3>
          <p>Platformdaki tahminler resmî sınav sonucu, yerleştirme sonucu veya kurum tarafından açıklanan kesin sıralama değildir. Nihai değerlendirmede ilgili resmî kurumların açıkladığı sonuçlar esas alınmalıdır.</p>
          <h3>Hesaplama modelleri</h3>
          <p>Tahminler mevcut veri setleri ve istatistiksel modeller kullanılarak oluşturulur. Gelecekteki sınavın gerçek dağılımı değişebileceğinden tahminlerde sapma oluşabilir.</p>
        </div>`
    },
    contact: {
      title: "İletişim",
      body: `
        <div class="rk-legal-text">
          <p>Görüş, hata bildirimi veya yasal talepleriniz için PDR Kampüs iletişim kanalını kullanabilirsiniz.</p>
          <p><strong>Web:</strong> pdrkampus.com.tr</p>
        </div>`
    }
  };

  const modal = document.getElementById('rk-legal-modal');
  const title = document.getElementById('rk-legal-title');
  const content = document.getElementById('rk-legal-content');
  if(!modal || !title || !content) return;

  function openLegal(key){
    const item = legalTexts[key] || legalTexts.privacy;
    title.textContent = item.title;
    content.innerHTML = item.body;
    modal.classList.add('is-open');
    modal.setAttribute('aria-hidden','false');
    document.body.style.overflow='hidden';
  }
  function closeLegal(){
    modal.classList.remove('is-open');
    modal.setAttribute('aria-hidden','true');
    document.body.style.overflow='';
  }

  document.querySelectorAll('[data-legal]').forEach(a=>{
    a.addEventListener('click', e=>{
      e.preventDefault();
      openLegal(a.getAttribute('data-legal'));
    });
  });
  document.querySelectorAll('[data-legal-close]').forEach(el=>el.addEventListener('click', closeLegal));
  document.addEventListener('keydown', e=>{ if(e.key==='Escape') closeLegal(); });
})();
