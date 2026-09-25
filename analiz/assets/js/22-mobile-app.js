/* PDRkampüs Capacitor köprüsü. Hesaplama akışından bağımsız tutulur. */
(function initializePdrkampusMobileShell() {
  const capacitor = window.Capacitor;
  const isNative = Boolean(capacitor && typeof capacitor.isNativePlatform === 'function' && capacitor.isNativePlatform());

  window.PDRKAMPUS_APP = Object.freeze({
    isNative,
    platform: isNative && typeof capacitor.getPlatform === 'function' ? capacitor.getPlatform() : 'web'
  });

  if (!isNative) return;

  document.documentElement.classList.add('rk-native-app');

  document.addEventListener('DOMContentLoaded', async () => {
    const plugins = capacitor.Plugins || {};

    try {
      await plugins.StatusBar?.setBackgroundColor?.({ color: '#F7F3E9' });
      await plugins.StatusBar?.setStyle?.({ style: 'LIGHT' });
    } catch (error) {
      console.warn('Durum çubuğu ayarlanamadı:', error);
    }

    try {
      await plugins.SplashScreen?.hide?.();
    } catch (error) {
      console.warn('Açılış ekranı kapatılamadı:', error);
    }

    plugins.App?.addListener?.('backButton', ({ canGoBack }) => {
      const sidebar = document.getElementById('rk-sidebar');
      if (sidebar?.classList.contains('rk-open')) {
        document.getElementById('rk-mobile-menu')?.click();
        return;
      }

      const legalModal = document.getElementById('rk-legal-modal');
      if (legalModal?.getAttribute('aria-hidden') === 'false') {
        legalModal.querySelector('[data-legal-close]')?.click();
        return;
      }

      if (canGoBack) {
        window.history.back();
      } else {
        plugins.App?.minimizeApp?.();
      }
    });
  });
})();
