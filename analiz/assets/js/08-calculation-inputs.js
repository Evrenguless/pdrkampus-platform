    // ==========================================
    // 🎛️ FORM & HESAPLAMA MOTORU
    // ==========================================
    // Tek giriş yöntemi: Doğru/Yanlış girilir, net otomatik hesaplanır.
    // Eski mod değiştirme fonksiyonu kayıtlı eski verilerle uyumluluk için pasif tutulur.
    function setInputMode(mode) {
      // Artık kullanıcıya mod seçtirmiyoruz; hesaplama daima D/Y üzerinden yapılır.
      document.querySelectorAll('.dy-group').forEach(el => el.classList.remove('hidden'));
      document.querySelectorAll('.net-group').forEach(el => el.classList.add('hidden'));
      handleInputChange();
    }

    function getUserNets() {
      return {
        sozel: getNetFromDY('sozel-d', 'sozel-y', 15),
        sayisal: getNetFromDY('sayisal-d', 'sayisal-y', 15),
        tarih: getNetFromDY('tarih-d', 'tarih-y', 6),
        cografya: getNetFromDY('cografya-d', 'cografya-y', 6),
        egitim: getNetFromDY('egitim-d', 'egitim-y', 30),
        mevzuat: getNetFromDY('mevzuat-d', 'mevzuat-y', 8),
        oabt: getNetFromDY('oabt-d', 'oabt-y', 50)
      };
    }

    function getNetFromDY(dId, yId, maxQ) {
      let d = parseFloat(document.getElementById(dId).value) || 0;
      let y = parseFloat(document.getElementById(yId).value) || 0;
      d = Math.min(maxQ, Math.max(0, d));
      y = Math.min(maxQ - d, Math.max(0, y));
      return Math.max(0, d - (y / 4));
    }

    function handleInputChange(autoSave = true) {
      const userNets = getUserNets();

      document.getElementById('net-sozel').innerText = userNets.sozel.toFixed(2);
      document.getElementById('net-sayisal').innerText = userNets.sayisal.toFixed(2);
      document.getElementById('net-tarih').innerText = userNets.tarih.toFixed(2);
      document.getElementById('net-cografya').innerText = userNets.cografya.toFixed(2);
      document.getElementById('net-egitim').innerText = userNets.egitim.toFixed(2);
      document.getElementById('net-mevzuat').innerText = userNets.mevzuat.toFixed(2);
      document.getElementById('net-oabt').innerText = userNets.oabt.toFixed(2) + ' Net';

      const totalAgs = userNets.sozel + userNets.sayisal + userNets.tarih + userNets.cografya + userNets.egitim + userNets.mevzuat;
      document.getElementById('total-ags-net-badge').innerText = totalAgs.toFixed(2) + ' Net';

      if (autoSave) {
        saveInputsLocally();
      }

      clearTimeout(calcDebounceTimer);
      calcDebounceTimer = setTimeout(() => {
        calculateRankingViaServer(userNets);
      }, 150);
    }

    // 2026 P2 VERİ SETİ: yüklenen sonuç belgelerinden, soru sayıları doğrulanmış 119 geçerli adaydan kalibre edilmiştir.
    let P2_RANKING_DATA = [];
    let P2_VALID_RESULT_COUNT = 0;
    let P2_MODEL = null;
    let OFFICIAL_TEST_STATS = {};
    let MARGINAL_TESTS = {};

