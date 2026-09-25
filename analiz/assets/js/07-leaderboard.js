    // ==========================================
    // 🏆 CANLI LİDERLİK TABLOSU
    // ==========================================
    async function publishToLiveLeaderboard() {
      if (!supabaseClient) {
        alert("Canlı sıralama hizmetine şu anda ulaşılamıyor. Lütfen daha sonra tekrar deneyin.");
        return;
      }

      if (!currentUser) {
        if (confirm("Canlı sıralamaya katılmak ve netlerinizi hesabınıza kaydetmek için lütfen Google ile giriş yapın.\n\nGiriş sayfasına yönlendirilsin mi?")) {
          loginWithGoogle();
        }
        return;
      }

      if (!latestServerResult) {
        alert("Lütfen önce netlerinizi giriniz.");
        return;
      }

      const userNets = getUserNets();
      const isAnonymous = document.getElementById('anon-toggle')?.checked || false;
      const rawName = currentUser.user_metadata?.full_name || currentUser.email?.split('@')[0] || 'Aday';
      const displayName = isAnonymous ? anonymizeName(rawName) : rawName;
      const avatarUrl = isAnonymous ? '' : (currentUser.user_metadata?.avatar_url || '');
      const totalAgs = userNets.sozel + userNets.sayisal + userNets.tarih + userNets.cografya + userNets.egitim + userNets.mevzuat;
      const rawInputs = collectCurrentDOMInputs();

      const btn = document.getElementById('btn-publish-live');
      const originalText = btn.innerHTML;
      btn.innerHTML = `<span>⏳ Kaydediliyor...</span>`;
      btn.disabled = true;

      try {
        const { error } = await supabaseClient.from('leaderboard').upsert({
          user_id: currentUser.id,
          full_name: displayName,
          avatar_url: avatarUrl,
          ags_net: totalAgs,
          oabt_net: userNets.oabt,
          score: latestServerResult.score,
          raw_inputs: rawInputs,
          is_anonymous: isAnonymous,
          updated_at: new Date().toISOString()
        }, { onConflict: 'user_id' });

        if (error) throw error;

        await fetchLiveLeaderboard();

        btn.innerHTML = `<span>✅ Canlı Sıralamanız Güncellendi!</span>`;
        btn.className = "w-full py-3.5 px-4 rounded-2xl font-black text-white bg-emerald-600 shadow-xl transition-all text-xs sm:text-sm tracking-wide flex items-center justify-center gap-2";

        setTimeout(() => {
          btn.innerHTML = originalText;
          btn.className = "w-full py-3.5 px-4 rounded-2xl font-black text-white bg-gradient-to-r from-emerald-600 via-teal-600 to-indigo-600 hover:from-emerald-500 hover:to-indigo-500 shadow-xl shadow-emerald-950/40 transition-all duration-200 active:scale-[0.99] text-xs sm:text-sm tracking-wide flex items-center justify-center gap-2";
          btn.disabled = false;
        }, 2500);

      } catch (err) {
        alert("Canlı sıralama güncellenemedi: " + err.message);
        btn.innerHTML = originalText;
        btn.disabled = false;
      }
    }

    function anonymizeName(name) {
      const parts = name.trim().split(' ');
      return parts.map(p => p.charAt(0) + '***').join(' ');
    }

    function toggleAnonymousMode() {
      if (currentUser && supabaseClient) {
        publishToLiveLeaderboard();
      }
    }

    async function fetchLiveLeaderboard() {
      const container = document.getElementById('leaderboard-list-container');
      if (!supabaseClient || !container) return;

      try {
        const { data, error } = await supabaseClient
          .from('leaderboard')
          .select('user_id,full_name,avatar_url,ags_net,oabt_net,score,raw_inputs,is_anonymous,updated_at')
          .order('score', { ascending: false })
          .limit(150);

        if (error) throw error;

        liveLeaderboardData = data || [];
        renderLeaderboardUI();
        if (typeof window.renderOabtDistribution === 'function') {
          setTimeout(window.renderOabtDistribution, 0);
        }
      } catch (err) {
        container.innerHTML = `
          <div class="text-center py-6 text-slate-500 text-xs">
            Canlı sıralama yüklenemedi: ${err.message}
          </div>
        `;
      }
    }

    function toFiniteNumber(value, fallback = 0) {
      const n = Number(value);
      return Number.isFinite(n) ? n : fallback;
    }

    function getLiveNetValue(item, field) {
      const rawDirect = item?.[field];
      const direct = Number(rawDirect);
      if (rawDirect !== null && rawDirect !== undefined && rawDirect !== '' && Number.isFinite(direct)) return direct;

      // Eski leaderboard kayıtlarında ags_net/oabt_net NULL olabilir.
      // raw_inputs içindeki D/Y değerlerinden gerçek neti yeniden üret.
      const raw = item?.raw_inputs || {};
      if (field === 'oabt_net') {
        const d = toFiniteNumber(raw['oabt-d'], 0);
        const y = toFiniteNumber(raw['oabt-y'], 0);
        return Math.max(0, d - (y / 4));
      }

      const pairs = [
        ['sozel-d','sozel-y',15], ['sayisal-d','sayisal-y',15],
        ['tarih-d','tarih-y',6], ['cografya-d','cografya-y',6],
        ['egitim-d','egitim-y',30], ['mevzuat-d','mevzuat-y',8]
      ];
      let total = 0;
      for (const [dId, yId, maxQ] of pairs) {
        const d = Math.min(maxQ, Math.max(0, toFiniteNumber(raw[dId], 0)));
        const y = Math.min(maxQ - d, Math.max(0, toFiniteNumber(raw[yId], 0)));
        total += Math.max(0, d - y / 4);
      }
      return total;
    }

    function formatLiveNumber(value, decimals = 2) {
      const n = Number(value);
      return Number.isFinite(n) ? n.toFixed(decimals) : '--';
    }

    function renderLeaderboardUI() {
      const container = document.getElementById('leaderboard-list-container');
      if (!container) return;
      if (liveLeaderboardData.length === 0) {
        container.innerHTML = `
          <div class="text-center py-6 text-slate-500 text-xs">
            Henüz canlı sıralamaya katılan aday bulunmuyor. İlk adımı siz atın!
          </div>
        `;
        return;
      }

      let myRank = null;
      if (currentUser) {
        const index = liveLeaderboardData.findIndex(item => item.user_id === currentUser.id);
        if (index !== -1) {
          myRank = index + 1;
          document.getElementById('live-platform-rank').innerText = `#${myRank} / ${liveLeaderboardData.length} Aday`;
          const stickyLive = document.getElementById('sticky-live-rank'); if (stickyLive) stickyLive.innerText = `#${myRank} / ${liveLeaderboardData.length}`;
        }
      }

      container.innerHTML = liveLeaderboardData.map((item, index) => {
        const rank = index + 1;
        const isMe = currentUser && item.user_id === currentUser.id;

        let medal = `#${rank}`;
        if (rank === 1) medal = "🥇";
        else if (rank === 2) medal = "🥈";
        else if (rank === 3) medal = "🥉";

        const rowBg = isMe
          ? "bg-indigo-950/80 border-indigo-500/80 ring-1 ring-indigo-500 shadow-md"
          : "bg-slate-950/70 border-slate-800";

        const avatarSrc = item.avatar_url || 'https://api.dicebear.com/7.x/bottts/svg?seed=' + item.user_id;

        return `
          <div class="p-2.5 sm:p-3 ${rowBg} border rounded-2xl flex items-center justify-between gap-2.5 transition-all">
            <div class="flex items-center gap-2.5 min-w-0">
              <span class="w-6 text-center font-black text-xs sm:text-sm font-mono ${rank <= 3 ? 'text-amber-300 text-base' : 'text-slate-400'}">${medal}</span>
              <img src="${avatarSrc}" alt="Avatar" class="w-7 h-7 rounded-full border border-slate-700 object-cover flex-shrink-0">
              <div class="min-w-0">
                <div class="flex items-center gap-1.5">
                  <span class="font-bold text-white text-xs truncate">${item.full_name}</span>
                  ${isMe ? '<span class="px-1.5 py-0.2 rounded bg-indigo-600 text-white text-[9px] font-extrabold">SİZ</span>' : ''}
                </div>
                <span class="text-[10px] text-slate-400 font-mono block">AGS: ${formatLiveNumber(getLiveNetValue(item, 'ags_net'), 2)} | ÖABT: ${formatLiveNumber(getLiveNetValue(item, 'oabt_net'), 2)}</span>
              </div>
            </div>
            <div class="text-right flex-shrink-0">
              <span class="font-black text-emerald-400 text-xs sm:text-sm font-mono block">${formatLiveNumber(item.score, 3)} P</span>
              <span class="text-[9px] text-slate-500 font-mono">P2-10</span>
            </div>
          </div>
        `;
      }).join('');
    }
