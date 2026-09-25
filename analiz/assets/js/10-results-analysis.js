    function calculateRankingViaServer(userNets) {
      if (!P2_MODEL || !P2_RANKING_DATA.length || !Object.keys(OFFICIAL_TEST_STATS).length) return;
      const keys = ['sozel','sayisal','tarih','cografya','egitim','mevzuat','oabt'];
      let score = P2_MODEL.intercept;
      keys.forEach(k => score += P2_MODEL.coef[k] * Number(userNets[k] || 0));
      score = Math.max(0, score);

      // P2 puanını 2026 dosyasındaki gerçek P2 başarı sıraları arasında enterpole et.
      const data = P2_RANKING_DATA;

      // Önce net kombinasyonunu 119 geçerli gerçek adayın netleriyle birebir karşılaştır.
      // Böylece veri setinde gerçekten bulunan bir adayın sonucu regresyon tahminiyle
      // 1042 -> 1050 gibi kaymaz; doğrudan gerçek P2 puanı ve gerçek sırası kullanılır.
      const exactCandidate = data.find(c =>
        ['sozel','sayisal','tarih','cografya','egitim','mevzuat','oabt']
          .every(k => Math.abs(Number(c[k]) - Number(userNets[k] || 0)) < 0.001)
      );

      if (exactCandidate) {
        score = exactCandidate.score;
      }

      // Veri setindeki küçük sıra tutarsızlıklarını düzeltmek için monotonik zarf kullan.
      // Puan yükseldikçe sıra asla kötüleşmez.
      const monotonicData = data.map((c, i) => ({ ...c, monotonicRank: i === 0 ? c.rank : 0 }));
      for (let i = 1; i < monotonicData.length; i++) {
        monotonicData[i].monotonicRank = Math.max(monotonicData[i - 1].monotonicRank, monotonicData[i].rank);
      }

      let rank;
      if (exactCandidate) {
        rank = exactCandidate.rank;
      } else if (score >= monotonicData[0].score) {
        rank = monotonicData[0].monotonicRank;
      } else if (score <= monotonicData[monotonicData.length - 1].score) {
        rank = monotonicData[monotonicData.length - 1].monotonicRank;
      } else {
        let lo = 0, hi = monotonicData.length - 1;
        while (lo <= hi) {
          const mid = (lo + hi) >> 1;
          if (monotonicData[mid].score >= score) lo = mid + 1;
          else hi = mid - 1;
        }
        const upper = monotonicData[hi], lower = monotonicData[lo];
        const t = (upper.score - score) / (upper.score - lower.score);
        rank = upper.monotonicRank + t * (lower.monotonicRank - upper.monotonicRank);
      }
      rank = Math.max(1, Math.min(P2_MODEL.candidateCount, Math.round(rank)));

      // 2026 MEB-AGS resmi Türkiye istatistikleri: Z-Skor katmanında kullanılır.
      // 119 geçerli gerçek sonuçtan üretilen puan/sıra tahmin modeli aynen korunur.
      const z_scores = {};
      keys.forEach(k => {
        const stats = OFFICIAL_TEST_STATS[k];
        z_scores[k] = (Number(userNets[k] || 0) - stats.mean) / stats.std;
      });

      const keysForMatch = ['sozel','sayisal','tarih','cografya','egitim','mevzuat','oabt'];
      const nearest_5 = data.slice()
        .map(c => ({ ...c, _distance: Math.sqrt(keysForMatch.reduce((sum,k) => {
          const sd = P2_MODEL.std[k] || 1;
          return sum + Math.pow((Number(c[k]) - Number(userNets[k] || 0)) / sd, 2);
        }, 0)) }))
        .sort((a,b) => a._distance - b._distance)
        .slice(0,5)
        .map(c => ({rank:c.rank, score:c.score, soz:c.sozel, mat:c.sayisal, tar:c.tarih, cog:c.cografya, egt:c.egitim, mev:c.mevzuat, oabt:c.oabt}));

      const percentile = ((rank / P2_MODEL.candidateCount) * 100).toFixed(2);
      const result = {rank, score, percentile, z_scores, nearest_5};
      latestServerResult = result;
      renderServerResults(result, userNets);
      // Senaryo tablosunu sonuç kartından bağımsız olarak da güncelle.
      renderScenarioMatrix(userNets);
    }

    // V53 — Kullanıcının mevcut netlerine göre 1 netin marjinal P2 etkisi.
    let marginalSelectedTest = 'oabt';
    let marginalBaseNets = null;
    let marginalBaseScore = null;
    let marginalBaseRank = null;
    function estimateRankFromScoreForMarginal(score){
      const data=P2_RANKING_DATA;
      if(!Array.isArray(data)||!data.length) return null;
      if(score>=data[0].score) return data[0].rank;
      if(score<=data[data.length-1].score) return data[data.length-1].rank;
      let lo=0,hi=data.length-1;
      while(lo<=hi){const mid=(lo+hi)>>1;if(data[mid].score>=score)lo=mid+1;else hi=mid-1;}
      const upper=data[hi],lower=data[lo];
      const t=(upper.score-score)/(upper.score-lower.score);
      return Math.max(1,Math.round(upper.rank+t*(lower.rank-upper.rank)));
    }
    function selectMarginalTest(key){
      if(!MARGINAL_TESTS[key])return;
      marginalSelectedTest=key;
      document.querySelectorAll('.rk-marginal-test').forEach(btn=>btn.classList.toggle('active',btn.dataset.marginalTest===key));
      updateMarginalP2Panel();
    }
    function updateMarginalP2Panel(){
      if(!marginalBaseNets||marginalBaseScore===null)return;
      const test=MARGINAL_TESTS[marginalSelectedTest];
      const stepEl=document.getElementById('marginal-step');
      const steps=stepEl?Number(stepEl.value)||1:1;
      const current=Number(marginalBaseNets[marginalSelectedTest]||0);
      const maxAdd=Math.max(0,test.max-current);
      const actualAdd=Math.min(steps,maxAdd);
      const coef=P2_MODEL.coef[marginalSelectedTest]||0;
      const gain=coef*actualAdd;
      const newScore=marginalBaseScore+gain;
      const newRank=estimateRankFromScoreForMarginal(newScore);
      const fmt=n=>Number(n).toLocaleString('tr-TR',{minimumFractionDigits:2,maximumFractionDigits:2});
      const effectEl=document.getElementById('marginal-effect-'+marginalSelectedTest); if(effectEl)effectEl.textContent='+'+fmt(coef);
      const label=document.getElementById('marginal-selected-label');if(label)label.textContent=test.label;
      const net=document.getElementById('marginal-current-net');if(net)net.textContent=fmt(current)+' net';
      const stepLabel=document.getElementById('marginal-step-label');if(stepLabel)stepLabel.textContent='+'+fmt(actualAdd)+' net';
      const gainEl=document.getElementById('marginal-score-gain');if(gainEl)gainEl.textContent='+'+fmt(gain);
      const base=document.getElementById('marginal-base-score');if(base)base.textContent=fmt(marginalBaseScore);
      const ns=document.getElementById('marginal-new-score');if(ns)ns.textContent=fmt(newScore);
      const rc=document.getElementById('marginal-rank-change');if(rc)rc.textContent=(marginalBaseRank?marginalBaseRank.toLocaleString('tr-TR'):'--')+' → '+(newRank?newRank.toLocaleString('tr-TR'):'--');
    }
    function renderMarginalP2Panel(userNets,baseScore,baseRank){
      marginalBaseNets={...userNets}; marginalBaseScore=Number(baseScore)||0; marginalBaseRank=Number(baseRank)||null;
      const slider=document.getElementById('marginal-step');
      if(slider){slider.value='1';}
      document.querySelectorAll('.rk-marginal-test').forEach(btn=>{
        const key=btn.dataset.marginalTest; const effect=document.getElementById('marginal-effect-'+key);
        if(effect)effect.textContent='+'+(Number(P2_MODEL.coef[key]||0)).toLocaleString('tr-TR',{minimumFractionDigits:2,maximumFractionDigits:2});
      });
      updateMarginalP2Panel();
    }

    function renderServerResults(data, userNets) {
      const exact2026Rank = data.rank;
      const baseScore = data.score;
      renderMarginalP2Panel(userNets, baseScore, exact2026Rank);

      if (data.z_scores) {
        for (let key in data.z_scores) {
          updateSubtestCard(key, data.z_scores[key]);
        }
      }

      if (data.nearest_5) {
        renderSimilarCandidates(data.nearest_5);
      }

      const min2027Rank = Math.max(1, Math.round(exact2026Rank * 0.95));
      const max2027Rank = Math.round(exact2026Rank * 1.05);
      const rankText = (exact2026Rank === 1) ? "1 - 1" : `${min2027Rank.toLocaleString('tr-TR')} - ${max2027Rank.toLocaleString('tr-TR')}`;

      const resultRankRange = document.getElementById('result-rank-range'); if (resultRankRange) resultRankRange.innerText = rankText;
      const resultP2 = document.getElementById('result-p2-score'); if (resultP2) resultP2.innerText = toFiniteNumber(baseScore, 0).toFixed(5);
      const resultRank = document.getElementById('result-2026-rank'); if (resultRank) resultRank.innerText = `${exact2026Rank.toLocaleString('tr-TR')}. Sıra`;

      // Üstteki 2027 özet kartları her net değişiminde mutlaka yenilenir.
      const p2Summary = document.getElementById('rk-p2');
      const rankSummary = document.getElementById('rk-rank');
      const oabtSummary = document.getElementById('rk-oabt');
      if (p2Summary) p2Summary.innerText = toFiniteNumber(baseScore, 0).toFixed(5);
      if (rankSummary) rankSummary.innerText = rankText;
      if (oabtSummary) oabtSummary.innerText = Object.values(userNets).reduce((sum, v) => sum + (Number(v) || 0), 0).toFixed(2);
      const stickyRank = document.getElementById('sticky-rank-range'); if (stickyRank) stickyRank.innerText = rankText;
      const percentileLabel = document.getElementById('percentile-label'); if (percentileLabel) percentileLabel.innerText = `İlk %${data.percentile}`;

      const statusBadge = document.getElementById('status-badge');
      if (exact2026Rank <= 450) {
        statusBadge.innerText = "🏆 Derece / Asil";
        statusBadge.className = "text-xs font-bold px-3 py-0.5 rounded-full border bg-emerald-500/20 border-emerald-500/50 text-emerald-300 shadow-sm";
      } else if (exact2026Rank <= 1100) {
        statusBadge.innerText = "🎯 Güvenli Atama";
        statusBadge.className = "text-xs font-bold px-3 py-0.5 rounded-full border bg-blue-500/20 border-blue-500/50 text-blue-300 shadow-sm";
      } else if (exact2026Rank <= 2000) {
        statusBadge.innerText = "⚠️ Kontenjan Sınırı";
        statusBadge.className = "text-xs font-bold px-3 py-0.5 rounded-full border bg-amber-500/20 border-amber-500/50 text-amber-300 shadow-sm";
      } else {
        statusBadge.innerText = "🚨 Riskli Bölge";
        statusBadge.className = "text-xs font-bold px-3 py-0.5 rounded-full border bg-rose-500/20 border-rose-500/50 text-rose-300 shadow-sm";
      }

      updateRadarChart(userNets);
      renderScenarioMatrix(userNets);
      runCustomSimulation();
    }

    function switchTab(tabId) {
      // V6: sekmeler ana sayfada aynı anda görünür; menü yalnızca ilgili bölüme kaydırır.
      document.querySelectorAll('.rk-content-stage > .tab-content').forEach(el => el.classList.remove('hidden'));

      document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.className = "tab-btn p-2 rounded-2xl border transition-all text-left flex flex-col justify-between gap-1 shadow-md bg-slate-900/90 text-slate-300 border-slate-800 hover:border-slate-700";
      });

      const activeContent = document.getElementById(tabId);
      if (activeContent) {
        activeContent.classList.remove('hidden');
      }

      const activeBtn = document.getElementById(`btn-${tabId}`);
      if (activeBtn) {
        activeBtn.className = "tab-btn p-2 rounded-2xl border transition-all text-left flex flex-col justify-between gap-1 shadow-lg bg-gradient-to-br from-indigo-600 to-purple-600 text-white border-indigo-400 ring-2 ring-indigo-500/50";
      }

      if (tabId === 'tab-overview') {
        requestAnimationFrame(() => {
          if (typeof updateRadarChart === 'function' && typeof getCurrentNets === 'function') {
            try { updateRadarChart(getCurrentNets()); } catch(e) {}
          }
          if (radarChartInstance) radarChartInstance.resize();
        });
      }
      if (tabId === 'tab-leaderboard') fetchLiveLeaderboard();
      if (tabId === 'tab-simulator') {
        runCustomSimulation();
      }
    }

    function updateRadarChart(userNets) {
      const canvas = document.getElementById('radarChart');
      const ctx = canvas?.getContext('2d');
      if (!ctx) return;

      const tests = [
        { key:'sozel', label:'Sözel', max:15, avg:8.3 },
        { key:'sayisal', label:'Sayısal', max:15, avg:3.4 },
        { key:'tarih', label:'Tarih', max:6, avg:2.7 },
        { key:'cografya', label:'Coğrafya', max:6, avg:2.2 },
        { key:'egitim', label:'Eğitim', max:30, avg:11.2 },
        { key:'mevzuat', label:'Mevzuat', max:8, avg:2.5 },
        { key:'oabt', label:'ÖABT', max:50, avg:33.5 }
      ];

      const labels = tests.map(t => [t.label, `${Number(userNets[t.key] || 0).toFixed(2)} / ${t.max}`]);
      const userPercents = tests.map(t => Math.min(100, Math.max(0, (Number(userNets[t.key] || 0) / t.max) * 100)));
      const trPercents = tests.map(t => (t.avg / t.max) * 100);

      if (radarChartInstance) radarChartInstance.destroy();

      radarChartInstance = new Chart(ctx, {
        type: 'radar',
        data: {
          labels,
          datasets: [
            {
              label: 'Sizin performansınız',
              data: userPercents,
              borderColor: '#2f897b',
              backgroundColor: 'rgba(47, 137, 123, 0.16)',
              pointBackgroundColor: '#fffdf8',
              pointBorderColor: '#2f897b',
              pointHoverBackgroundColor: '#2f897b',
              pointHoverBorderColor: '#fffdf8',
              pointRadius: 4,
              pointHoverRadius: 6,
              borderWidth: 2.5,
              tension: 0.15
            },
            {
              label: 'Türkiye ortalaması',
              data: trPercents,
              borderColor: '#e77865',
              backgroundColor: 'rgba(231, 120, 101, 0.045)',
              pointBackgroundColor: '#e77865',
              pointBorderColor: '#fffdf8',
              pointRadius: 2.5,
              borderWidth: 1.5,
              borderDash: [5, 5]
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          animation: { duration: 650, easing: 'easeOutQuart' },
          interaction: { intersect: false, mode: 'nearest' },
          plugins: {
            legend: {
              position: 'bottom',
              labels: {
                color: '#536071',
                font: { family: 'DM Sans', size: 10, weight: '700' },
                boxWidth: 12,
                boxHeight: 8,
                padding: 14,
                usePointStyle: true
              }
            },
            tooltip: {
              backgroundColor: '#273047',
              titleColor: '#fffdf8',
              bodyColor: '#f6f1e7',
              borderColor: '#e4ddd0',
              borderWidth: 1,
              padding: 10,
              displayColors: true,
              callbacks: {
                label: (context) => {
                  const t = tests[context.dataIndex];
                  const net = context.datasetIndex === 0 ? Number(userNets[t.key] || 0) : t.avg;
                  return ` ${context.dataset.label}: ${net.toFixed(2)} / ${t.max} (%${context.parsed.r.toFixed(1)})`;
                }
              }
            }
          },
          scales: {
            r: {
              min: 0,
              max: 100,
              beginAtZero: true,
              angleLines: { color: 'rgba(39,48,71,.10)', lineWidth: 1 },
              grid: { color: 'rgba(39,48,71,.10)', circular: true, lineWidth: 1 },
              ticks: {
                display: true,
                stepSize: 25,
                color: '#8a919d',
                backdropColor: 'transparent',
                font: { family: 'Space Mono', size: 8 },
                callback: value => `${value}%`
              },
              pointLabels: {
                color: '#273047',
                padding: 7,
                font: { family: 'DM Sans', size: 10, weight: '800' }
              }
            }
          }
        }
      });
    }

    function updateSubtestCard(testKey, z) {
      const zElem = document.getElementById(`z-${testKey}`);
      const statElem = document.getElementById(`stat-${testKey}`);
      if (!zElem || !statElem) return;

      const safeZ = Number(z);
      if (!Number.isFinite(safeZ)) {
        zElem.innerText = '0.00 σ';
        statElem.innerText = 'Veri bekleniyor';
        statElem.className = 'text-[9px] text-slate-500';
        return;
      }

      const sign = safeZ >= 0 ? '+' : '';
      zElem.innerText = `${sign}${safeZ.toFixed(2)} σ`;

      if (safeZ >= 1.0) {
        zElem.className = "font-black text-emerald-400 block text-xs";
        statElem.innerText = "🔥 Çok Güçlü Getiri";
        statElem.className = "text-[9px] text-emerald-400 font-semibold";
      } else if (safeZ >= 0.2) {
        zElem.className = "font-bold text-indigo-300 block text-xs";
        statElem.innerText = "👍 Ortalamanın Üstü";
        statElem.className = "text-[9px] text-indigo-300";
      } else if (safeZ >= -0.3) {
        zElem.className = "font-semibold text-slate-300 block text-xs";
        statElem.innerText = "⚖️ Ortalama Civarı";
        statElem.className = "text-[9px] text-slate-400";
      } else {
        zElem.className = "font-bold text-rose-400 block text-xs";
        statElem.innerText = "🔻 Geriye Çekiyor";
        statElem.className = "text-[9px] text-rose-400 font-medium";
      }
    }

    function renderSimilarCandidates(similarList) {
      const container = document.getElementById('similar-candidates-list');
      if (!container) return;
      container.innerHTML = '';

      similarList.forEach((cand, idx) => {
        const item = document.createElement('div');
        item.className = "bg-slate-950/70 border border-slate-800/80 p-3 rounded-2xl flex flex-wrap items-center justify-between gap-2 text-xs";
        item.innerHTML = `
          <div>
            <div class="flex items-center gap-2">
              <span class="font-bold text-indigo-300">#${idx+1} Belge:</span>
              <span class="bg-indigo-950 border border-indigo-700/50 text-indigo-200 px-2 py-0.5 rounded-lg font-black text-xs font-mono">${cand.rank}. Sıra</span>
              <span class="text-emerald-400 font-semibold font-mono">${parseFloat(cand.score).toFixed(5)} Puan</span>
            </div>
            <div class="text-[10px] text-slate-400 mt-1">
              Sözel: <b class="text-slate-200">${cand.soz}</b> | Sayısal: <b class="text-slate-200">${cand.mat}</b> | Tarih: <b class="text-slate-200">${cand.tar}</b> | Coğ: <b class="text-slate-200">${cand.cog}</b> | Eğt: <b class="text-slate-200">${cand.egt}</b> | Mev: <b class="text-slate-200">${cand.mev}</b> | ÖABT: <b class="text-purple-300">${cand.oabt} Net</b>
            </div>
          </div>
          <span class="text-[9px] text-emerald-400 font-bold bg-emerald-950/80 px-2.5 py-1 rounded-lg border border-emerald-800/60">Doğrulanmış</span>
        `;
        container.appendChild(item);
      });
    }

