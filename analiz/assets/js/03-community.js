    // ==========================================
    // 💡 5. ÖZELLİK: TOPLULUK SORU HAVUZU MOTORU
    // ==========================================
    let communityQuestionsList = [
      {
        id: 1,
        author: "PDR Rehberlik Danışmanı",
        author_avatar: "https://api.dicebear.com/7.x/bottts/svg?seed=user1",
        category: "ÖABT Danışma Kuramları",
        title: "Adler'de 'Üstünlük Çabası' vs 'Gelişme İhtiyacı'",
        content: "TG-2 denemesinde çıkan soruda danışanın aşağılık duygusunu telafi etmeye çalışması 'üstünlük çabası' olarak alındı. Ancak Rogers'ın 'kendini gerçekleştirme' kavramıyla aralarındaki en net ayrım nedir? Şıklar çok yakındı.",
        created_at: new Date(Date.now() - 3600000 * 4).toISOString(),
        likes: 6,
        replies: [
          {
            author: "Rehber Öğrt. Merve",
            author_avatar: "https://api.dicebear.com/7.x/bottts/svg?seed=merve",
            content: "Adler'de temel itici güç doğuştan gelen ve yetersizlikten doğan 'aşağılık hissinin telafisi'dir. Rogers'ta ise eksiklikten değil, organizmanın potansiyelini büyütme eğiliminden kaynaklanır.",
            time: "2 saat önce"
          }
        ]
      },
      {
        id: 2,
        author: "Aday #842",
        author_avatar: "https://api.dicebear.com/7.x/bottts/svg?seed=user2",
        category: "Mevzuat (ÖMK 7528)",
        title: "7528 ÖMK Hazırlık Eğitimi Süresi ve Taban Puanlar",
        content: "Akademiye çağrılmada MEB-AGS ve ÖABT puanlarının ağırlığı %50-%50 mi hesaplanıyor, yoksa hazırlık eğitimi sonundaki başarı puanı sıralamayı ne kadar değiştiriyor?",
        created_at: new Date(Date.now() - 3600000 * 12).toISOString(),
        likes: 9,
        replies: [
          {
            author: "PDR Uzmanı Ahmet",
            author_avatar: "https://api.dicebear.com/7.x/bottts/svg?seed=ahmet",
            content: "Kanuna göre Akademi Giriş Sınavı ile hazırlık eğitimine kabul edilirsiniz. Hazırlık eğitimi sonundaki sınav notu ise doğrudan öğretmenliğe atanma sıralamasını belirler.",
            time: "5 saat önce"
          }
        ]
      }
    ];

    function renderCommunityQuestions() {
      const container = document.getElementById('community-questions-feed');
      if (!container) return;

      container.innerHTML = communityQuestionsList.map(q => {
        const timeAgo = new Date(q.created_at).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });

        const repliesHtml = q.replies.map(rep => `
          <div class="bg-slate-900/90 border border-slate-800 p-2.5 rounded-xl text-xs space-y-1">
            <div class="flex items-center justify-between">
              <span class="font-bold text-teal-300 text-[11px] flex items-center gap-1.5">
                <img src="${rep.author_avatar}" class="w-4 h-4 rounded-full">
                ${escapeHtml(rep.author)}
              </span>
              <span class="text-[9px] text-slate-500">${rep.time}</span>
            </div>
            <p class="text-slate-300 text-[11px] leading-relaxed">${escapeHtml(rep.content)}</p>
          </div>
        `).join('');

        return `
          <div class="bg-slate-900/80 border border-slate-800 rounded-3xl p-4 shadow-xl space-y-3">
            <div class="flex items-start justify-between gap-2 border-b border-slate-800/80 pb-2.5">
              <div class="flex items-center gap-2.5">
                <img src="${q.author_avatar}" class="w-7 h-7 rounded-full border border-slate-700">
                <div>
                  <span class="font-bold text-white text-xs block">${escapeHtml(q.author)}</span>
                  <span class="text-[10px] text-teal-400 bg-teal-950/80 border border-teal-800/60 px-2 py-0.2 rounded">${escapeHtml(q.category)}</span>
                </div>
              </div>
              <span class="text-[10px] text-slate-500 font-mono">${timeAgo}</span>
            </div>

            <div>
              <h4 class="font-extrabold text-sm text-slate-100 mb-1">${escapeHtml(q.title)}</h4>
              <p class="text-xs text-slate-300 leading-relaxed whitespace-pre-line bg-slate-950/60 p-3 rounded-2xl border border-slate-800/80">${escapeHtml(q.content)}</p>
            </div>

            <!-- Cevaplar & Yanıt Girişi -->
            <div class="space-y-2 pt-1">
              <div class="flex items-center justify-between text-[11px] text-slate-400">
                <span class="font-semibold flex items-center gap-1">💬 Çözüm & Görüşler (${q.replies.length})</span>
                <button onclick="likeQuestion(${q.id})" class="text-slate-400 hover:text-teal-300 flex items-center gap-1 bg-slate-950 border border-slate-800 px-2 py-0.5 rounded-lg text-xs">
                  <span>👍 Faydalı</span> <b class="text-teal-400">${q.likes}</b>
                </button>
              </div>

              <div class="space-y-1.5">
                ${repliesHtml}
              </div>

              <!-- Yanıt Yazma Kutusu -->
              <form onsubmit="handlePostReply(event, ${q.id})" class="flex gap-2 pt-1.5">
                <input type="text" id="reply-input-${q.id}" required placeholder="Çözümünüzü veya fikrinizi yazın..." class="flex-grow bg-slate-950 border border-slate-700/80 rounded-xl px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:border-teal-500 outline-none">
                <button type="submit" class="bg-teal-600 hover:bg-teal-500 text-white px-3 py-1.5 rounded-xl text-xs font-bold transition-all shadow active:scale-95">
                  Cevapla
                </button>
              </form>
            </div>
          </div>
        `;
      }).join('');
    }

    function handlePostNewQuestion(e) {
      e.preventDefault();
      const title = document.getElementById('post-q-title').value.trim();
      const category = document.getElementById('post-q-category').value;
      const content = document.getElementById('post-q-content').value.trim();
      const isAnon = document.getElementById('post-q-anon')?.checked || false;

      if (!title || !content) return;

      const rawName = currentUser?.user_metadata?.full_name || currentUser?.email?.split('@')[0] || 'PDR Adayı';
      const author = isAnon ? `🎭 ${anonymizeName(rawName)}` : rawName;
      const avatar = isAnon ? `https://api.dicebear.com/7.x/bottts/svg?seed=${Date.now()}` : (currentUser?.user_metadata?.avatar_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${Date.now()}`);

      const newQ = {
        id: Date.now(),
        author: author,
        author_avatar: avatar,
        category: category,
        title: title,
        content: content,
        created_at: new Date().toISOString(),
        likes: 1,
        replies: []
      };

      communityQuestionsList.unshift(newQ);
      document.getElementById('post-q-title').value = '';
      document.getElementById('post-q-content').value = '';

      renderCommunityQuestions();
      alert("✅ Sorunuz PDR soru panosuna başarıyla eklendi!");
    }

    function handlePostReply(e, qId) {
      e.preventDefault();
      const input = document.getElementById(`reply-input-${qId}`);
      if (!input) return;
      const text = input.value.trim();
      if (!text) return;

      const q = communityQuestionsList.find(item => item.id === qId);
      if (q) {
        const rawName = currentUser?.user_metadata?.full_name || currentUser?.email?.split('@')[0] || 'PDR Meslektaşı';
        q.replies.push({
          author: rawName,
          author_avatar: currentUser?.user_metadata?.avatar_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${Date.now()}`,
          content: text,
          time: "Az önce"
        });
        input.value = '';
        renderCommunityQuestions();
      }
    }

    function likeQuestion(qId) {
      const q = communityQuestionsList.find(item => item.id === qId);
      if (q) {
        q.likes++;
        renderCommunityQuestions();
      }
    }

