
(function(){
  let realResultDistributionMode='ags';
  let realResultDistributionChart=null;

  function getRealResultValues(mode){
    const data=(typeof P2_RANKING_DATA!=='undefined' && Array.isArray(P2_RANKING_DATA))?P2_RANKING_DATA:[];
    return data.map(item=>{
      if(mode==='oabt') return Number(item&&item.oabt);
      const parts=['sozel','sayisal','tarih','cografya','egitim','mevzuat'];
      return parts.reduce((sum,key)=>sum+(Number(item&&item[key])||0),0);
    }).filter(Number.isFinite);
  }

  function buildRealBuckets(values, max, step){
    const count=Math.ceil(max/step);
    const buckets=Array.from({length:count},(_,i)=>{
      const start=i*step;
      const end=Math.min(max,(i+1)*step);
      return {label:`${start}-${end}`,count:0};
    });
    values.forEach(v=>{
      if(!Number.isFinite(v) || v<0 || v>max) return;
      const idx=Math.min(count-1,Math.floor(v/step));
      buckets[idx].count++;
    });
    return buckets;
  }

  window.switchRealResultDistribution=function(mode){
    realResultDistributionMode=mode==='oabt'?'oabt':'ags';
    document.querySelectorAll('[data-real-dist-mode]').forEach(btn=>btn.classList.toggle('active',btn.dataset.realDistMode===realResultDistributionMode));
    const title=document.getElementById('rk-real-dist-title');
    const desc=document.getElementById('rk-real-dist-desc');
    const note=document.getElementById('rk-real-dist-note');
    if(realResultDistributionMode==='oabt'){
      if(title) title.textContent='ÖABT Net Dağılımı';
      if(desc) desc.textContent='Doğrulanmış gerçek sonuç belgelerinde ÖABT netlerinin hangi aralıklarda toplandığını gösterir.';
      if(note) note.textContent='Grafik, kayıtlı geçerli gerçek sonuç belgelerindeki ÖABT netlerini kullanır.';
    }else{
      if(title) title.textContent='Toplam AGS Net Dağılımı';
      if(desc) desc.textContent='Doğrulanmış gerçek sonuç belgelerinde toplam AGS netlerinin hangi aralıklarda toplandığını gösterir.';
      if(note) note.textContent='Grafik, kayıtlı geçerli gerçek sonuç belgelerindeki altı AGS testinin toplam netini kullanır.';
    }
    renderRealResultDistribution();
  };

  window.renderRealResultDistribution=function(){
    const canvas=document.getElementById('rkRealResultDistributionChart');
    if(!canvas || typeof Chart==='undefined') return;
    const values=getRealResultValues(realResultDistributionMode);
    const countEl=document.getElementById('rk-real-dist-total'); if(countEl) countEl.textContent=P2_VALID_RESULT_COUNT.toLocaleString('tr-TR');
    const desc=document.getElementById('rk-real-dist-desc');
    if(desc) desc.textContent=realResultDistributionMode==='oabt' ? `Doğrulanmış ${P2_VALID_RESULT_COUNT} gerçek sonuç belgesinde ÖABT netlerinin hangi aralıklarda toplandığını gösterir.` : `Doğrulanmış ${P2_VALID_RESULT_COUNT} gerçek sonuç belgesinde toplam AGS netlerinin hangi aralıklarda toplandığını gösterir.`;
    const note=document.getElementById('rk-real-dist-note');
    if(note) note.textContent=realResultDistributionMode==='oabt' ? `Grafik, kayıtlı ${P2_VALID_RESULT_COUNT} geçerli gerçek sonuç belgesindeki ÖABT netlerini kullanır.` : `Grafik, kayıtlı ${P2_VALID_RESULT_COUNT} geçerli gerçek sonuç belgesindeki altı AGS testinin toplam netini kullanır.`;
    const max=realResultDistributionMode==='oabt'?50:80;
    const buckets=buildRealBuckets(values,max,5);
    const totalEl=document.getElementById('rk-real-dist-total');
    const avgEl=document.getElementById('rk-real-dist-average');
    const rangeEl=document.getElementById('rk-real-dist-range');
    if(totalEl) totalEl.textContent=values.length.toLocaleString('tr-TR');
    const avg=values.length?values.reduce((a,b)=>a+b,0)/values.length:0;
    const min=values.length?Math.min(...values):0;
    const maxValue=values.length?Math.max(...values):0;
    if(avgEl) avgEl.textContent=`Ortalama: ${avg.toFixed(2)} net`;
    if(rangeEl) rangeEl.textContent=`Aralık: ${min.toFixed(2)} – ${maxValue.toFixed(2)}`;
    if(realResultDistributionChart) realResultDistributionChart.destroy();
    realResultDistributionChart=new Chart(canvas.getContext('2d'),{
      type:'bar',
      data:{labels:buckets.map(b=>b.label),datasets:[{label:'Gerçek aday sayısı',data:buckets.map(b=>b.count),backgroundColor:'rgba(209,123,91,.78)',borderColor:'rgba(209,123,91,1)',borderWidth:1,borderRadius:7,maxBarThickness:44}]},
      options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false},tooltip:{callbacks:{title:(items)=>`${realResultDistributionMode==='ags'?'AGS':'ÖABT'} ${items[0].label} net`,label:(item)=>` ${item.raw.toLocaleString('tr-TR')} gerçek sonuç`}}},scales:{x:{grid:{display:false},ticks:{font:{size:10},color:'#71808c'}},y:{beginAtZero:true,ticks:{precision:0,font:{size:10},color:'#71808c'},grid:{color:'rgba(24,44,64,.07)'},title:{display:true,text:'Gerçek aday sayısı',font:{size:10,weight:'700'},color:'#71808c'}}}}
    });
  };

  document.addEventListener('DOMContentLoaded',()=>setTimeout(window.renderRealResultDistribution,300));
})();
