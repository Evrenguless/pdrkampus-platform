    async function loadSiteDatasets() {
      if (!supabaseClient) {
        console.warn('Veri hizmetine ulaşılamadığı için anasayfa verileri yüklenemedi.');
        return false;
      }
      try {
        const requiredKeys = ['p2_ranking_data', 'calculation_config', 'historical_appointments', 'research_data'];
        const { data, error } = await supabaseClient
          .from('pdrkampus_site_datasets')
          .select('key,payload')
          .in('key', requiredKeys);
        if (error) throw error;
        const datasets = Object.fromEntries((data || []).map(row => [row.key, row.payload]));
        const config = datasets.calculation_config || {};
        P2_RANKING_DATA = Array.isArray(datasets.p2_ranking_data) ? datasets.p2_ranking_data : [];
        P2_VALID_RESULT_COUNT = P2_RANKING_DATA.length;
        P2_MODEL = config.p2_model || null;
        OFFICIAL_TEST_STATS = config.official_test_stats || {};
        MARGINAL_TESTS = config.marginal_tests || {};
        window.PDR_SITE_DATA = datasets;
        renderHistoricalDataset(datasets.historical_appointments);
        renderResearchDataset(datasets.research_data);
        document.dispatchEvent(new CustomEvent('pdr:site-data-ready', { detail: datasets }));
        if (typeof handleInputChange === 'function') handleInputChange(false);
        if (typeof window.renderRealResultDistribution === 'function') window.renderRealResultDistribution();
        if (typeof window.renderP2SubtestDistributions === 'function') window.renderP2SubtestDistributions();
        return true;
      } catch (error) {
        console.error('Anasayfa verileri yüklenemedi:', error);
        const table = document.getElementById('rk-historical-table-body');
        if (table) table.innerHTML = '<tr><td colspan="5">Veriler şu anda yüklenemiyor. Lütfen daha sonra tekrar deneyin.</td></tr>';
        const topicHost = document.getElementById('rk-topic-bars');
        if (topicHost) topicHost.textContent = 'Araştırma verileri yüklenemedi.';
        return false;
      }
    }

    function renderHistoricalDataset(dataset) {
      const rows = Array.isArray(dataset?.rows) ? dataset.rows : [];
      if (!rows.length) return;
      const number = value => Number(value).toLocaleString('tr-TR');
      const percent = value => `%${Number(value).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
      const maxApplicants = rows.reduce((best, row) => Number(row.applicants) > Number(best.applicants) ? row : best, rows[0]);
      const maxQuota = rows.reduce((best, row) => Number(row.quota) > Number(best.quota) ? row : best, rows[0]);
      const maxShare = rows.reduce((best, row) => Number(row.share) > Number(best.share) ? row : best, rows[0]);
      const kpis = document.getElementById('rk-historical-kpis');
      if (kpis) kpis.innerHTML = `
        <div><span>En yüksek PDR aday sayısı</span><strong>${number(maxApplicants.applicants)}</strong><small>${maxApplicants.year}</small></div>
        <div><span>En yüksek PDR kontenjanı</span><strong>${number(maxQuota.quota)}</strong><small>${maxQuota.year}</small></div>
        <div><span>En yüksek PDR payı</span><strong>${percent(maxShare.share)}</strong><small>${maxShare.year}</small></div>`;
      const latest = rows.slice().sort((a, b) => Number(b.year) - Number(a.year))[0];
      const featured = rows.find(row => Number(row.year) === Number(dataset.featured_year)) || maxShare;
      const shareKpis = document.getElementById('rk-historical-share-kpis');
      if (shareKpis) shareKpis.innerHTML = `
        <div><span>En yüksek PDR payı</span><strong>${percent(maxShare.share)}</strong><small>${maxShare.year}</small></div>
        <div><span>${featured.year} PDR payı</span><strong>${percent(featured.share)}</strong><small>${number(featured.total_appointments)} toplam atama içinde ${number(featured.quota)} PDR</small></div>
        <div><span>${latest.year} PDR payı</span><strong>${percent(latest.share)}</strong><small>${number(latest.total_appointments)} toplam atama içinde ${number(latest.quota)} PDR</small></div>`;
      const body = document.getElementById('rk-historical-table-body');
      if (body) body.innerHTML = rows.slice().sort((a, b) => Number(b.year) - Number(a.year)).map(row => `
        <tr><td>${row.year}</td><td>${number(row.applicants)}</td><td>${number(row.quota)}</td><td>${number(row.total_appointments)}</td><td>${percent(row.share)}</td></tr>`).join('');
    }

    function renderResearchDataset(dataset) {
      const topics = Array.isArray(dataset?.topics) ? dataset.topics : [];
      const asdep = Array.isArray(dataset?.asdep) ? dataset.asdep : [];
      if (!topics.length) return;
      const total = topics.reduce((sum, item) => sum + Number(item.count || 0), 0);
      const top = topics.reduce((best, item) => Number(item.count) > Number(best.count) ? item : best, topics[0]);
      const currentAsdep = asdep.slice().sort((a, b) => Number(b.year) - Number(a.year))[0] || {};
      const kpis = document.getElementById('rk-research-kpis');
      if (kpis) kpis.innerHTML = `
        <article><span>${dataset.exam_year} ÖABT</span><strong>${total}</strong><small>toplam soru</small></article>
        <article><span>Kesin dağılım</span><strong>${total}</strong><small>soru sayısı toplamı</small></article>
        <article><span>En yoğun alan</span><strong>${top.count}</strong><small>${top.short_name || top.name}</small></article>
        <article class="is-alert"><span>${currentAsdep.year} ASDEP</span><strong>${currentAsdep.count}</strong><small>özel PDR kontenjanı</small></article>`;
      const maxTopic = Math.max(...topics.map(item => Number(item.count)));
      const topicBars = document.getElementById('rk-topic-bars');
      if (topicBars) topicBars.innerHTML = topics.map(item => `<div class="rk-topic-row"><span>${item.name}</span><i><em style="width:${(Number(item.count) / maxTopic) * 100}%"></em></i><b>${item.count}</b></div>`).join('');
      const table = document.getElementById('rk-topic-table-body');
      if (table) table.innerHTML = topics.map(item => `<tr><td>${item.name}</td><td><b>${item.count}</b></td><td>${item.scope}</td></tr>`).join('');
      const maxAsdep = Math.max(1, ...asdep.map(item => Number(item.count)));
      const bars = document.getElementById('rk-asdep-bars');
      if (bars) bars.innerHTML = asdep.map(item => `<div class="${Number(item.count) === 0 ? 'is-zero' : ''}"><span>${item.year}</span><i><em style="height:${Number(item.count) === 0 ? 3 : (Number(item.count) / maxAsdep) * 100}%"></em></i><strong>${item.approximate ? '≈' : ''}${item.count}</strong><small>${item.threshold == null ? 'özel kontenjan' : Number(item.threshold).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</small></div>`).join('');
      const timeline = document.getElementById('rk-asdep-timeline');
      if (timeline) timeline.innerHTML = asdep.map((item, index) => `<div class="${index === asdep.length - 1 ? 'is-current' : ''}"><b>${item.year}</b><p>${item.note}</p></div>`).join('');
    }
