
(function(){
  const oldRender=window.renderOabtDistribution;
  window.renderOabtDistribution=function(){
    try{
      if((typeof liveLeaderboardData !== 'undefined' && Array.isArray(liveLeaderboardData))
         || Array.isArray(window.liveLeaderboardData)){
        return oldRender();
      }
      const rows=[...document.querySelectorAll('#live-leaderboard-body tr')];
      const vals=rows.map(r=>{
        const text=r.innerText||'';
        const m=text.match(/(?:ÖABT|Oabt)[^\d]*(\d+(?:[.,]\d+)?)/i);
        return m ? Number(m[1].replace(',','.')) : null;
      }).filter(v=>Number.isFinite(v)&&v>=0&&v<=50);
      const totalEl=document.getElementById('rk-oabt-dist-total');
      const updatedEl=document.getElementById('rk-oabt-dist-updated');
      if(totalEl) totalEl.textContent=`${vals.length.toLocaleString('tr-TR')} aday`;
      if(updatedEl) updatedEl.textContent=vals.length?'Canlı lig verisi':'Veri bekleniyor';
    }catch(e){}
  };
})();
