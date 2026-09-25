
function rkNavigate(tabId){
  const target=document.getElementById(tabId);
  if(!target){ console.warn('PDRkampus: sekme bulunamadı',tabId); return; }
  if(typeof switchTab === 'function') switchTab(tabId);
  document.querySelectorAll('.rk-nav-button').forEach(b=>b.classList.toggle('active',b.dataset.tab===tabId));
  const labels={'tab-overview':'Kişisel Performans Analizi','tab-simulator':'2027 Senaryo Analizi','tab-matches':'Eşleşen Aday ve Dağılımlar','tab-leaderboard':'Canlı Sıralama ve Net Dağılımları','tab-historical':'PDR Adayı vs Kontenjan','tab-research':'PDR ÖABT & ASDEP Analizi','tab-ags':'2026 AGS Konu Dağılımı'};
  const el=document.getElementById('rk-current-section'); if(el) el.textContent=labels[tabId]||'Genel Bakış';
  target.classList.remove('hidden');
  requestAnimationFrame(()=>target.scrollIntoView({behavior:'smooth',block:'start'}));
  const side=document.getElementById('rk-sidebar');
  if(side && window.innerWidth<=680){
    side.classList.remove('rk-open');
    document.getElementById('rk-sidebar-overlay')?.classList.remove('rk-visible');
    document.body.classList.remove('rk-menu-open');
    const mb=document.getElementById('rk-mobile-menu');
    if(mb){mb.setAttribute('aria-expanded','false');mb.setAttribute('aria-label','Menüyü aç');const ic=mb.querySelector('span');if(ic)ic.textContent='☰';}
  }
}

function rkNavigateToSection(tabId, sectionId, label){
  const tab=document.getElementById(tabId);
  const section=document.getElementById(sectionId);
  if(!tab){ console.warn('PDRkampus: sekme bulunamadı',tabId); return; }
  if(typeof switchTab === 'function') switchTab(tabId);
  document.querySelectorAll('.rk-nav-button').forEach(b=>b.classList.toggle('active',false));
  const el=document.getElementById('rk-current-section'); if(el) el.textContent=label||'Analizler';
  tab.classList.remove('hidden');
  const destination = section || tab;
  // Hedefi sabit header'ın hemen altına kilitle. Grafikler canlı veriyle
  // yeniden boyanabildiği için konumu birkaç kez yeniden doğruluyoruz.
  const scrollToDestination = (behavior='smooth') => {
    if(!destination || !document.body.contains(destination)) return;
    const header = document.querySelector('.rk-topbar');
    const headerHeight = header ? header.getBoundingClientRect().height : (window.innerWidth <= 680 ? 64 : 82);
    const gap = 18;
    const absoluteTop = destination.getBoundingClientRect().top + window.scrollY;
    const targetTop = Math.max(0, absoluteTop - headerHeight - gap);
    window.scrollTo({top: targetTop, behavior});
  };
  requestAnimationFrame(()=>scrollToDestination('smooth'));
  setTimeout(()=>scrollToDestination('auto'), 220);
  setTimeout(()=>scrollToDestination('auto'), 600);
  setTimeout(()=>scrollToDestination('auto'), 1000);
  const side=document.getElementById('rk-sidebar');
  if(side && window.innerWidth<=680){
    side.classList.remove('rk-open');
    document.getElementById('rk-sidebar-overlay')?.classList.remove('rk-visible');
    document.body.classList.remove('rk-menu-open');
    const mb=document.getElementById('rk-mobile-menu');
    if(mb){mb.setAttribute('aria-expanded','false');mb.setAttribute('aria-label','Menüyü aç');const ic=mb.querySelector('span');if(ic)ic.textContent='☰';}
  }
}

function rkToast(msg){
  const old=document.querySelector('.rk-toast'); if(old) old.remove();
  const el=document.createElement('div'); el.className='rk-toast'; el.textContent=msg; document.body.appendChild(el);
  setTimeout(()=>el.remove(),2600);
}
document.addEventListener('DOMContentLoaded',()=>{
  const btn=document.getElementById('rk-mobile-menu');
  const closeBtn=document.getElementById('rk-sidebar-close');
  const overlay=document.getElementById('rk-sidebar-overlay');
  const side=document.getElementById('rk-sidebar');
  const setMenu=(open)=>{
    if(!side)return;
    side.classList.toggle('rk-open',open);
    if(overlay) overlay.classList.toggle('rk-visible',open);
    document.body.classList.toggle('rk-menu-open',open && window.innerWidth<=680);
    if(btn){
      btn.setAttribute('aria-expanded',String(open));
      btn.setAttribute('aria-label',open?'Menüyü kapat':'Menüyü aç');
      const icon=btn.querySelector('span'); if(icon) icon.textContent=open?'×':'☰';
    }
  };
  if(btn) btn.addEventListener('click',()=>setMenu(!side?.classList.contains('rk-open')));
  if(closeBtn) closeBtn.addEventListener('click',()=>setMenu(false));
  if(overlay) overlay.addEventListener('click',()=>setMenu(false));
  document.addEventListener('keydown',(e)=>{if(e.key==='Escape') setMenu(false);});
  // Canlı ligi arka planda önceden yükle; menüye tıklanınca bekleme olmasın.
  setTimeout(() => { if (typeof fetchLiveLeaderboard === 'function') fetchLiveLeaderboard(); }, 250);
});
