
(function(){
  let appointmentsChart=null,shareChart=null;
  function initHistoricalCharts(){
    const dataset=window.PDR_SITE_DATA?.historical_appointments;
    const rows=Array.isArray(dataset?.rows)?dataset.rows.slice().sort((a,b)=>Number(a.year)-Number(b.year)):[];
    if(!rows.length||typeof Chart==='undefined')return;
    const appointmentCanvas=document.getElementById('rkHistoricalAppointmentsChart');
    const shareCanvas=document.getElementById('rkHistoricalShareChart');
    if(appointmentCanvas){
      appointmentsChart?.destroy();
      appointmentsChart=new Chart(appointmentCanvas,{type:'bar',data:{labels:rows.map(row=>String(row.year)),datasets:[
        {label:'Sınava Giren PDR Adayı',data:rows.map(row=>row.applicants),backgroundColor:'#2f897b',borderRadius:6,borderSkipped:false,barPercentage:.72,categoryPercentage:.78},
        {label:'PDR Kontenjanı',data:rows.map(row=>row.quota),backgroundColor:'#e77865',borderRadius:6,borderSkipped:false,barPercentage:.72,categoryPercentage:.78}
      ]},options:{responsive:true,maintainAspectRatio:false,interaction:{mode:'index',intersect:false},plugins:{legend:{position:'bottom',labels:{usePointStyle:true,boxWidth:9,font:{family:'DM Sans',size:11,weight:'700'}}},tooltip:{callbacks:{label:ctx=>ctx.dataset.label+': '+ctx.parsed.y.toLocaleString('tr-TR')}}},scales:{y:{beginAtZero:true,ticks:{callback:v=>Number(v).toLocaleString('tr-TR')},grid:{color:'rgba(39,48,71,.08)'},title:{display:true,text:'Kişi sayısı',font:{family:'DM Sans',size:10,weight:'700'}}},x:{grid:{display:false},ticks:{font:{family:'DM Sans',size:10,weight:'700'}}}}}});
    }
    if(shareCanvas){
      shareChart?.destroy();
      shareChart=new Chart(shareCanvas,{type:'bar',data:{labels:rows.map(row=>String(row.year)),datasets:[{label:'PDR kontenjanının toplam öğretmen atamasındaki payı',data:rows.map(row=>row.share),backgroundColor:'#2f897b',borderRadius:7,borderSkipped:false,barPercentage:.64,categoryPercentage:.74}]},options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false},tooltip:{callbacks:{label:ctx=>'PDR payı: %'+Number(ctx.parsed.y).toLocaleString('tr-TR',{minimumFractionDigits:2,maximumFractionDigits:2})}}},scales:{y:{beginAtZero:true,max:10,ticks:{callback:v=>'%'+v},grid:{color:'rgba(39,48,71,.08)'},title:{display:true,text:'Toplam atamalardaki PDR payı',font:{family:'DM Sans',size:10,weight:'700'}}},x:{grid:{display:false},ticks:{font:{family:'DM Sans',size:10,weight:'700'}}}}}});
    }
  }
  document.addEventListener('pdr:site-data-ready',initHistoricalCharts);
  document.addEventListener('click',event=>{if(event.target.closest('[onclick*="rk-historical-appointments"]'))setTimeout(initHistoricalCharts,250);});
})();
