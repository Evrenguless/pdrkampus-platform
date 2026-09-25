
(function(){
  window.rkNavigateToSection=function(tabId,sectionId,label){
    const tab=document.getElementById(tabId), target=document.getElementById(sectionId);
    if(!tab||!target)return;
    if(typeof switchTab==='function') switchTab(tabId);
    document.querySelectorAll('.rk-nav-button').forEach(b=>b.classList.remove('active'));
    const current=document.getElementById('rk-current-section'); if(current) current.textContent=label||'Analizler';
    const go=()=>{
      const h=document.querySelector('.rk-topbar');
      const headerHeight=h ? h.getBoundingClientRect().height : (window.innerWidth<=680?64:82);
      const y=target.getBoundingClientRect().top+window.pageYOffset-headerHeight-14;
      window.scrollTo({top:Math.max(0,y),behavior:'smooth'});
    };
    requestAnimationFrame(go);
    if(window.innerWidth<=680 && typeof rkCloseMobileMenu==='function') rkCloseMobileMenu();
  };
})();
