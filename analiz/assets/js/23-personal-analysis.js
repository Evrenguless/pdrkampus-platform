(function(){
  'use strict';
  let profileChart=null;
  let distributionChart=null;
  const tests=[
    {key:'sozel',label:'Sözel',max:15},
    {key:'sayisal',label:'Sayısal',max:15},
    {key:'tarih',label:'Tarih',max:6},
    {key:'cografya',label:'Coğrafya',max:6},
    {key:'egitim',label:'Eğitim',max:30},
    {key:'mevzuat',label:'Mevzuat',max:8},
    {key:'oabt',label:'ÖABT',max:50}
  ];
  const text=(id,fallback='--')=>{
    const value=document.getElementById(id)?.textContent?.trim();
    return value||fallback;
  };
  const numberFrom=(value)=>{
    let cleaned=String(value||'').replace(/[^0-9,.-]/g,'');
    if(cleaned.includes(',')) cleaned=cleaned.replace(/\./g,'').replace(',','.');
    else if((cleaned.match(/\./g)||[]).length>1) cleaned=cleaned.replace(/\./g,'');
    const match=cleaned.match(/-?\d+(?:\.\d+)?/);
    return match?Number(match[0]):0;
  };
  const currentNets=()=>{
    if(typeof getUserNets==='function'){
      try{return getUserNets()}catch(e){}
    }
    return Object.fromEntries(tests.map(t=>[t.key,numberFrom(text('net-'+t.key,'0'))]));
  };
  const setText=(id,value)=>{const el=document.getElementById(id);if(el)el.textContent=value};
  function userFirstName(){
    const raw=text('user-name','Aday');
    if(!raw||raw==='Kullanıcı')return 'Aday';
    return raw.split(/\s+/)[0];
  }
  function rankingText(){
    const direct=text('result-2026-rank','--');
    return direct==='--'?text('result-rank-range','--'):direct;
  }
  function drawProfileChart(nets){
    const canvas=document.getElementById('rkPersonalProfileChart');
    if(!canvas||typeof Chart==='undefined')return;
    const values=tests.map(t=>Math.max(0,Math.min(100,(Number(nets[t.key]||0)/t.max)*100)));
    if(profileChart)profileChart.destroy();
    profileChart=new Chart(canvas,{
      type:'line',
      data:{labels:tests.map(t=>t.label),datasets:[{
        label:'Başarı yüzdesi',data:values,borderColor:'#2f9184',backgroundColor:'rgba(47,145,132,.12)',
        fill:true,tension:.38,borderWidth:2.5,pointRadius:3.5,pointHoverRadius:5,
        pointBackgroundColor:'#fffdf8',pointBorderColor:'#2f9184',pointBorderWidth:2
      }]},
      options:{responsive:true,maintainAspectRatio:false,animation:{duration:350},
        plugins:{legend:{display:false},tooltip:{callbacks:{label:(ctx)=>'%'+ctx.parsed.y.toFixed(1)}}},
        scales:{y:{beginAtZero:true,max:100,ticks:{stepSize:25,callback:v=>'%'+v,color:'#7c898f',font:{size:9}},grid:{color:'rgba(24,44,64,.07)'},border:{display:false}},
          x:{ticks:{color:'#64747c',font:{size:9,weight:'600'}},grid:{display:false},border:{display:false}}}
      }
    });
  }
  function drawDistributionChart(nets){
    const canvas=document.getElementById('rkPersonalDistributionChart');
    if(!canvas||typeof Chart==='undefined')return;
    const values=tests.map(t=>Math.max(0,Number(nets[t.key]||0)));
    const total=values.reduce((sum,value)=>sum+value,0);
    const hasData=total>0;
    if(distributionChart)distributionChart.destroy();
    distributionChart=new Chart(canvas,{
      type:'doughnut',
      data:{
        labels:hasData?tests.map(t=>t.label):['Netlerini gir'],
        datasets:[{
          data:hasData?values:[1],
          backgroundColor:hasData?['#2f9184','#63aaa0','#d4a23d','#5b759e','#86b7a9','#e17c68','#17364a']:['#e6ebe7'],
          borderColor:'#fffdf8',borderWidth:3,hoverOffset:5
        }]
      },
      plugins:[{
        id:'rkPersonalDistributionCenter',
        afterDraw(chart){
          const meta=chart.getDatasetMeta(0);
          if(!meta?.data?.[0])return;
          const {x,y}=meta.data[0];
          const ctx=chart.ctx;
          ctx.save();
          ctx.textAlign='center';ctx.textBaseline='middle';
          ctx.fillStyle='#17364a';ctx.font='800 18px "Space Mono", monospace';
          ctx.fillText(total.toFixed(2).replace('.',','),x,y-5);
          ctx.fillStyle='#7d898f';ctx.font='700 9px "Plus Jakarta Sans", sans-serif';
          ctx.fillText('toplam net',x,y+15);
          ctx.restore();
        }
      }],
      options:{
        responsive:true,maintainAspectRatio:false,cutout:'66%',animation:{duration:350},
        plugins:{
          legend:{position:'bottom',labels:{boxWidth:8,boxHeight:8,usePointStyle:true,pointStyle:'circle',padding:11,color:'#53666f',font:{size:9,weight:'600'}}},
          tooltip:{callbacks:{label:(ctx)=>{const value=Number(ctx.raw||0);const share=total?value/total*100:0;return ctx.label+': '+value.toFixed(2).replace('.',',')+' net (%'+share.toFixed(1).replace('.',',')+')';}}}
        }
      }
    });
  }
  function updatePersonalDashboard(){
    const root=document.getElementById('rk-personal-dashboard');
    if(!root)return;
    const nets=currentNets();
    const totalAgs=['sozel','sayisal','tarih','cografya','egitim','mevzuat'].reduce((s,k)=>s+Number(nets[k]||0),0);
    const p2=text('result-p2-score','--');
    const rank=rankingText();
    setText('rk-pa-name',userFirstName());
    setText('rk-pa-ags',totalAgs.toFixed(2).replace('.',','));
    setText('rk-pa-oabt',Number(nets.oabt||0).toFixed(2).replace('.',','));
    setText('rk-pa-p2',p2);
    setText('rk-pa-rank',rank);
    const p2Number=Math.max(0,Math.min(100,numberFrom(p2)));
    const ring=document.getElementById('rk-pa-ring');
    if(ring)ring.style.setProperty('--rk-pa-progress',String(p2Number));
    setText('rk-pa-ring-value',p2==='--'?'--':p2);
    setText('rk-pa-ring-rank',rank);
    const normalized=tests.map(t=>({label:t.label,key:t.key,value:Number(nets[t.key]||0),ratio:Math.max(0,Math.min(1,Number(nets[t.key]||0)/t.max))}));
    normalized.forEach(item=>{
      const fill=document.querySelector('.rk-pa-bar-fill[data-key="'+item.key+'"]');
      if(fill)fill.style.width=(item.ratio*100).toFixed(1)+'%';
      setText('rk-pa-bar-'+item.key,item.value.toFixed(2).replace('.',','));
    });
    const entered=normalized.some(x=>x.value>0);
    const sorted=[...normalized].sort((a,b)=>b.ratio-a.ratio);
    setText('rk-pa-strongest',entered?sorted[0].label:'Netlerini girdikten sonra belirlenecek');
    setText('rk-pa-priority',entered?sorted[sorted.length-1].label:'Netlerini girdikten sonra belirlenecek');
    const avg=entered?normalized.reduce((s,x)=>s+x.ratio,0)/normalized.length:0;
    setText('rk-pa-level',entered?(avg>=.7?'Hedefe çok yakın':avg>=.45?'Dengeli ilerliyor':'Gelişime açık'):'Analiz için veri bekleniyor');
    drawProfileChart(nets);
    drawDistributionChart(nets);
  }
  function scheduleUpdate(){clearTimeout(scheduleUpdate.t);scheduleUpdate.t=setTimeout(updatePersonalDashboard,220)}
  document.addEventListener('DOMContentLoaded',()=>{
    document.querySelectorAll('#sozel-d,#sozel-y,#sayisal-d,#sayisal-y,#tarih-d,#tarih-y,#cografya-d,#cografya-y,#egitim-d,#egitim-y,#mevzuat-d,#mevzuat-y,#oabt-d,#oabt-y').forEach(el=>el.addEventListener('input',scheduleUpdate));
    ['result-p2-score','result-2026-rank','result-rank-range','user-name'].forEach(id=>{
      const el=document.getElementById(id);if(el)new MutationObserver(scheduleUpdate).observe(el,{childList:true,subtree:true,characterData:true});
    });
    setTimeout(updatePersonalDashboard,450);
  });
  window.updatePersonalDashboard=updatePersonalDashboard;
})();