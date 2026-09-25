    // SAYFA AÇILDIĞINDA OTURUM VE BİLEŞENLERİ BAŞLAT
    function startPdrApp() {
      checkAuthSession();
      loadSiteDatasets();
    }
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', startPdrApp, { once: true });
    } else {
      startPdrApp();
    }
  