    // ==========================================
    // 🔮 DÜZELTİLMİŞ SİMÜLASYON & ORANSAL ÇAN EĞRİSİ
    // ==========================================
    function renderScenarioMatrix(userNets) {
      const scenarios = [
        { name: "🔵 2026 Tabanı (Aynı Zorluk)", agsShift: 0, oabtShift: 0, tag: "bg-indigo-900/40 text-indigo-300" },
        { name: "🟢 2027 AGS -2 Net (Zor AGS)", agsShift: -2, oabtShift: 0, tag: "bg-emerald-950 text-emerald-300 font-bold" },
        { name: "🟢 2027 AGS -5 Net (Çok Zor AGS)", agsShift: -5, oabtShift: 0, tag: "bg-emerald-900/50 text-emerald-200 font-bold" },
        { name: "🔴 2027 ÖABT +2 Net (Yığılma)", agsShift: 0, oabtShift: 2, tag: "bg-amber-950 text-amber-300" },
        { name: "🔴 2027 ÖABT +5 Net (Kolay ÖABT)", agsShift: 0, oabtShift: 5, tag: "bg-rose-950 text-rose-300 font-bold" },
        { name: "⚡ AGS Zor (-3) / ÖABT Kolay (+3)", agsShift: -3, oabtShift: 3, tag: "bg-purple-950 text-purple-300" },
        { name: "🏆 İki Oturum da Zorlaştı (-3 / -3)", agsShift: -3, oabtShift: -3, tag: "bg-emerald-900/80 text-emerald-200 font-bold" },
        { name: "⚠️ İki Oturum da Kolaylaştı (+3 / +3)", agsShift: 3, oabtShift: 3, tag: "bg-rose-900/80 text-rose-200 font-bold" }
      ];

      const tbody = document.getElementById('scenario-matrix-body');
      if (!tbody) return;
      tbody.innerHTML = '';

      const hasInput = userNets && Object.values(userNets).some(v => Number(v) > 0);
      if (!hasInput) {
        tbody.innerHTML = '<tr><td colspan="5" class="py-3 text-center text-slate-500">Netlerinizi giriniz.</td></tr>';
        return;
      }

      const currentRank = latestServerResult ? latestServerResult.rank : 1000;
      const currentScore = latestServerResult ? latestServerResult.score : 75.0;

      for (let sc of scenarios) {
        const agsLabel = sc.agsShift === 0 ? "Aynı" : (sc.agsShift < 0 ? `${Math.abs(sc.agsShift)} Net Zor` : `+${sc.agsShift} Net Kolay`);
        const oabtLabel = sc.oabtShift === 0 ? "Aynı" : (sc.oabtShift > 0 ? `+${sc.oabtShift} Net Kolay` : `${Math.abs(sc.oabtShift)} Net Zor`);

        // Oransal etki katsayısı: Sınav zorlaşınca (negatif), shiftFactor negatif olup sıra sayısını oransal düşürür (iyileştirir). Asla 1 yapmaz.
        const shiftFactor = (sc.agsShift * 0.035) + (sc.oabtShift * 0.055);
        const projectedRank = Math.max(1, Math.min(23236, Math.round(currentRank * (1 + shiftFactor))));
        const projectedScore = Math.min(100, Math.max(40, currentScore - (shiftFactor * 4.5)));

        const tr = document.createElement('tr');
        tr.className = "hover:bg-slate-800/40 transition-colors";
        tr.innerHTML = `
          <td class="py-2 px-2.5 font-medium"><span class="px-2 py-0.5 rounded-lg text-[10px] ${sc.tag}">${sc.name}</span></td>
          <td>${agsLabel}</td>
          <td>${oabtLabel}</td>
          <td>${projectedScore.toFixed(3)}</td>
          <td>${projectedRank.toLocaleString('tr-TR')}. Sıra</td>
        `;
        tbody.appendChild(tr);
      }
    }

    function runCustomSimulation() {
      const sliderAgs = document.getElementById('slider-ags');
      const sliderOabt = document.getElementById('slider-oabt');
      if (!sliderAgs || !sliderOabt) return;

      const agsShift = parseInt(sliderAgs.value) || 0;
      const oabtShift = parseInt(sliderOabt.value) || 0;

      document.getElementById('slider-ags-val').innerText = agsShift === 0 ? "0 Net (Aynı)" : (agsShift > 0 ? `+${agsShift} Net (Kolay / Ort. Yüksek)` : `${agsShift} Net (Zor / Ort. Düşük)`);
      document.getElementById('slider-oabt-val').innerText = oabtShift === 0 ? "0 Net (Aynı)" : (oabtShift > 0 ? `+${oabtShift} Net (Kolay / Ort. Yüksek)` : `${oabtShift} Net (Zor / Ort. Düşük)`);

      if (!latestServerResult) return;

      const currentRank = latestServerResult.rank;
      const currentScore = latestServerResult.score;

      const shiftFactor = (agsShift * 0.035) + (oabtShift * 0.055);
      const simRank = Math.max(1, Math.min(23236, Math.round(currentRank * (1 + shiftFactor))));
      const simScore = Math.min(100, Math.max(40, currentScore - (shiftFactor * 4.5)));

      document.getElementById('custom-sim-rank').innerText = `${simRank.toLocaleString('tr-TR')}. Sıra`;
      document.getElementById('custom-sim-score').innerText = `P2-10: ${simScore.toFixed(3)}`;

      let desc = "Standart 2026 sınav zorluğu baz alınıyor.";
      if (shiftFactor < -0.05) {
        desc = "🔥 Sınav genel olarak zorlaştığı için mevcut netlerinizin ayırt ediciliği arttı ve sıranız oransal olarak öne taşındı.";
      } else if (shiftFactor > 0.05) {
        desc = "⚠️ Sınav kolaylaştığı ve Türkiye ortalaması yükseldiği için aynı netlerle sıralamanız geriledi.";
      } else {
        desc = "AGS ve ÖABT oturumlarındaki zorluk değişimleri sıralamanızı dengede tuttu.";
      }
      document.getElementById('custom-sim-desc').innerText = desc;
    }

