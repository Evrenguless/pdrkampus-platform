
(function(){
  function ensureRadar(){
    const canvas=document.getElementById('radarChart');
    if(!canvas || typeof Chart==='undefined') return;
    try{
      if(typeof getCurrentNets==='function'){
        updateRadarChart(getCurrentNets());
      } else if(typeof radarChartInstance==='undefined' || !radarChartInstance){
        updateRadarChart({
          sozel:0, sayisal:0, tarih:0, cografya:0, egitim:0, mevzuat:0, oabt:0
        });
      }
      if(typeof radarChartInstance!=='undefined' && radarChartInstance) radarChartInstance.resize();
    }catch(e){}
  }
  window.addEventListener('load', ()=>setTimeout(ensureRadar, 250));
  window.addEventListener('resize', ()=>{
    if(typeof radarChartInstance!=='undefined' && radarChartInstance) radarChartInstance.resize();
  });
})();
