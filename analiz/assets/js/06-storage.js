    // ==========================================
    // 💾 FORM GİRDİLERİNİ SAKLAMA & GERİ YÜKLEME
    // ==========================================
    function saveInputsLocally() {
      const inputs = collectCurrentDOMInputs();
      localStorage.setItem('pdrkampus_saved_inputs', JSON.stringify(inputs));
    }

    function restoreLocalInputs() {
      const saved = localStorage.getItem('pdrkampus_saved_inputs');
      if (saved) {
        try {
          applyInputsToDOM(JSON.parse(saved));
        } catch (e) {
          console.warn("Yerel girdiler okunamadı:", e);
        }
      }
      handleInputChange(false);
    }

    async function loadUserCloudData() {
      if (!supabaseClient || !currentUser) return;
      try {
        const { data, error } = await supabaseClient
          .from('leaderboard')
          .select('*')
          .eq('user_id', currentUser.id)
          .single();

        if (!error && data && data.raw_inputs) {
          applyInputsToDOM(data.raw_inputs);
          if (data.is_anonymous) {
            const anonCheckbox = document.getElementById('anon-toggle');
            if (anonCheckbox) anonCheckbox.checked = true;
          }
          handleInputChange(false);
          return;
        }
      } catch (err) {
        console.warn("Bulut girdileri çekilemedi:", err);
      }
      restoreLocalInputs();
    }

    function collectCurrentDOMInputs() {
      return {
        mode: currentInputMode,
        'sozel-d': document.getElementById('sozel-d').value,
        'sozel-y': document.getElementById('sozel-y').value,
        'sozel-net': document.getElementById('sozel-net').value,
        'sayisal-d': document.getElementById('sayisal-d').value,
        'sayisal-y': document.getElementById('sayisal-y').value,
        'sayisal-net': document.getElementById('sayisal-net').value,
        'tarih-d': document.getElementById('tarih-d').value,
        'tarih-y': document.getElementById('tarih-y').value,
        'tarih-net': document.getElementById('tarih-net').value,
        'cografya-d': document.getElementById('cografya-d').value,
        'cografya-y': document.getElementById('cografya-y').value,
        'cografya-net': document.getElementById('cografya-net').value,
        'egitim-d': document.getElementById('egitim-d').value,
        'egitim-y': document.getElementById('egitim-y').value,
        'egitim-net': document.getElementById('egitim-net').value,
        'mevzuat-d': document.getElementById('mevzuat-d').value,
        'mevzuat-y': document.getElementById('mevzuat-y').value,
        'mevzuat-net': document.getElementById('mevzuat-net').value,
        'oabt-d': document.getElementById('oabt-d').value,
        'oabt-y': document.getElementById('oabt-y').value,
        'oabt-net': document.getElementById('oabt-net').value
      };
    }

    function applyInputsToDOM(inputs) {
      if (!inputs) return;
      for (let id in inputs) {
        if (id === 'mode') continue;
        const el = document.getElementById(id);
        if (el && inputs[id] !== undefined) {
          el.value = inputs[id];
        }
      }
    }

