    // ==========================================
    // 🔐 GOOGLE AUTH & KULLANICI YÖNETİMİ
    // ==========================================
    function goToPlatformLogin() {
      const returnUrl = new URL('../?login=1&return=analiz/', window.location.href);
      window.location.href = returnUrl.href;
    }

    async function logoutUser() {
      if (supabaseClient) {
        await supabaseClient.auth.signOut();
      }
      currentUser = null;
      updateAuthUI();
      fetchLiveLeaderboard();
      updateChatUI();
    }

    async function checkAuthSession() {
      if (!supabaseClient) {
        restoreLocalInputs();
        return;
      }

      try {
        const { data: { session } } = await supabaseClient.auth.getSession();
        currentUser = session?.user || null;
        updateAuthUI();
        updateChatUI();

        if (currentUser) {
          await loadUserCloudData();
        } else {
          restoreLocalInputs();
        }

        fetchLiveLeaderboard();
        fetchChatMessages();
        initChatRealtime();
        renderCommunityQuestions();

        supabaseClient.auth.onAuthStateChange(async (_event, session) => {
          currentUser = session?.user || null;
          updateAuthUI();
          updateChatUI();
          if (currentUser) {
            await loadUserCloudData();
          }
          fetchLiveLeaderboard();
        });
      } catch (err) {
        console.warn("Auth kontrolü yerel modda:", err);
        restoreLocalInputs();
      }
    }

    function updateAuthUI() {
      const btnLogin = document.getElementById('btn-login');
      const badge = document.getElementById('user-profile-badge');
      const avatar = document.getElementById('user-avatar');
      const name = document.getElementById('user-name');

      if (currentUser) {
        btnLogin.classList.add('hidden');
        badge.classList.remove('hidden');
        avatar.src = currentUser.user_metadata?.avatar_url || 'https://via.placeholder.com/40';
        name.innerText = currentUser.user_metadata?.full_name || currentUser.email?.split('@')[0] || 'Kullanıcı';
      } else {
        btnLogin.classList.remove('hidden');
        badge.classList.add('hidden');
        document.getElementById('live-platform-rank').innerText = "Giriş Yapılmadı";
        document.getElementById('sticky-live-rank').innerText = "Giriş Yok";
      }
    }

    function updateChatUI() {
      const prompt = document.getElementById('chat-auth-prompt');
      const form = document.getElementById('chat-form');
      if (currentUser) {
        prompt.classList.add('hidden');
        form.classList.remove('hidden');
      } else {
        prompt.classList.remove('hidden');
        form.classList.add('hidden');
      }
    }
