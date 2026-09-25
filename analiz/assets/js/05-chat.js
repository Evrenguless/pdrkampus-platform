    // ==========================================
    // 💬 CANLI SOHBET MOTORU (ANONİM DESTEKLİ)
    // ==========================================
    async function fetchChatMessages() {
      if (!supabaseClient) return;
      try {
        const { data, error } = await supabaseClient
          .from('messages')
          .select('*')
          .order('created_at', { ascending: true })
          .limit(60);

        if (error) throw error;
        chatMessagesList = data || [];
        renderChatMessages();
      } catch (err) {
        console.warn("Mesajlar çekilemedi:", err);
      }
    }

    function initChatRealtime() {
      if (!supabaseClient || isChatRealtimeSubscribed) return;

      supabaseClient
        .channel('public:messages')
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, payload => {
          chatMessagesList.push(payload.new);
          renderChatMessages();
        })
        .subscribe();

      isChatRealtimeSubscribed = true;
    }

    async function handleSendChatMessage(e) {
      e.preventDefault();
      if (!supabaseClient || !currentUser) {
        loginWithGoogle();
        return;
      }

      const input = document.getElementById('chat-input');
      const content = input.value.trim();
      if (!content) return;

      const isChatAnon = document.getElementById('chat-anon-toggle')?.checked || false;
      const rawName = currentUser.user_metadata?.full_name || currentUser.email?.split('@')[0] || 'Aday';

      const userName = isChatAnon ? `🎭 ${anonymizeName(rawName)}` : rawName;
      const userAvatar = isChatAnon ? `https://api.dicebear.com/7.x/bottts/svg?seed=${currentUser.id}` : (currentUser.user_metadata?.avatar_url || '');

      let rankBadge = '';
      if (latestServerResult) {
        rankBadge = `${latestServerResult.rank}. Sıra`;
      }

      input.value = '';
      input.focus();

      try {
        const { error } = await supabaseClient.from('messages').insert([{
          user_id: currentUser.id,
          user_name: userName,
          user_avatar: userAvatar,
          user_rank_badge: rankBadge,
          content: content
        }]);

        if (error) throw error;
      } catch (err) {
        alert("Mesaj gönderilemedi: " + err.message);
      }
    }

    function renderChatMessages() {
      const box = document.getElementById('chat-messages-box');
      if (!box) return;
      if (chatMessagesList.length === 0) {
        box.innerHTML = `
          <div class="text-center py-10 text-slate-500">
            💬 Henüz sohbet odasında mesaj yok. İlk mesajı siz yazarak PDR adaylarıyla tanışın!
          </div>
        `;
        return;
      }

      box.innerHTML = chatMessagesList.map(msg => {
        const isMe = currentUser && msg.user_id === currentUser.id;
        const time = new Date(msg.created_at).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
        const avatarSrc = msg.user_avatar || 'https://api.dicebear.com/7.x/bottts/svg?seed=' + msg.user_id;

        return `
          <div class="flex items-start gap-2.5 ${isMe ? 'flex-row-reverse' : ''}">
            <img src="${avatarSrc}" alt="Avatar" class="w-7 h-7 rounded-full border border-slate-700 object-cover flex-shrink-0 mt-0.5">
            <div class="max-w-[80%] sm:max-w-[70%]">
              <div class="flex items-center gap-1.5 mb-0.5 ${isMe ? 'justify-end' : ''}">
                <span class="font-bold text-[11px] text-slate-300">${msg.user_name}</span>
                ${msg.user_rank_badge ? `<span class="px-1.5 py-0.2 rounded bg-indigo-950 border border-indigo-700 text-indigo-300 text-[9px] font-mono">${msg.user_rank_badge}</span>` : ''}
                <span class="text-[9px] text-slate-500 font-mono">${time}</span>
              </div>
              <div class="p-2.5 rounded-2xl text-xs leading-relaxed break-words ${isMe ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-tr-none shadow-md' : 'bg-slate-950/80 border border-slate-800 text-slate-200 rounded-tl-none'}">
                ${escapeHtml(msg.content)}
              </div>
            </div>
          </div>
        `;
      }).join('');

      box.scrollTop = box.scrollHeight;
    }

    function escapeHtml(text) {
      const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' };
      return text.replace(/[&<>"']/g, m => map[m]);
    }

