
(function(){
  function enforceContentFlow(){
    const stage=document.querySelector('.rk-content-stage');
    if(!stage)return;
    ['tab-overview','tab-simulator','tab-matches','tab-leaderboard','tab-historical','tab-research','tab-ags'].forEach(function(id){
      const section=document.getElementById(id);
      if(section)stage.appendChild(section);
    });
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',enforceContentFlow);
  else enforceContentFlow();
})();
