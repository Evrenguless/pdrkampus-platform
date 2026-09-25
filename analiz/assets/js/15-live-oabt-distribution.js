
(function(){
  let rkOabtDistChart = null;

  function getLiveOabtValues(){
    const source = (typeof liveLeaderboardData !== 'undefined' && Array.isArray(liveLeaderboardData))
      ? liveLeaderboardData
      : (Array.isArray(window.liveLeaderboardData) ? window.liveLeaderboardData : []);
    return source.map(item => {
      const candidates = [
        item && item.oabt_net,
        item && item.raw_inputs && item.raw_inputs.oabt_net,
        item && item.raw_inputs && item.raw_inputs.oabt,
        item && item.oabt
      ];
      for(const value of candidates){
        const n = Number(value);
        if(Number.isFinite(n) && n >= 0 && n <= 50) return n;
      }
      return null;
    }).filter(v => v !== null);
  }

  function buildBuckets(values){
    // 5 netlik aralıkları: 0-4.99 ... 45-50
    const buckets = [];
    for(let start=0; start<50; start+=5){
      buckets.push({
        min:start,
        max:Math.min(50,start+5),
        label:`${start}–${Math.min(50,start+5)}`,
        count:0
      });
    }
    values.forEach(v=>{
      const idx = Math.min(9, Math.floor(v/5));
      buckets[idx].count++;
    });
    // 50.00 tam puanını son aralığa dahil et.
    values.forEach(v=>{
      if(v===50){
        buckets[9].count++;
      }
    });
    // Yukarıdaki loop 50'yi 10. kovaya zaten dahil ediyor; çift sayımı düzelt.
    if(values.some(v=>v===50)) buckets[9].count -= values.filter(v=>v===50).length;
    return buckets;
  }

  function buildAgsBuckets(values){
    const buckets=[];
    for(let start=0;start<80;start+=5) buckets.push({label:`${start}–${Math.min(80,start+5)}`,count:0});
    values.forEach(v=>{const idx=Math.min(buckets.length-1,Math.floor(v/5));buckets[idx].count++;});
    return buckets;
  }

  let rkDistributionMode='oabt';
  window.switchNetDistribution=function(mode){
    rkDistributionMode=(mode==='ags')?'ags':'oabt';
    document.querySelectorAll('[data-dist-mode]').forEach(btn=>btn.classList.toggle('active',btn.dataset.distMode===rkDistributionMode));
    const title=document.getElementById('rk-dist-title');
    const desc=document.getElementById('rk-dist-desc');
    const note=document.getElementById('rk-dist-note');
    if(rkDistributionMode==='ags'){
      if(title) title.textContent='Toplam AGS Net Dağılımı';
      if(desc) desc.textContent='Canlı lige kayıtlı adayların toplam AGS netlerinin hangi aralıklarda toplandığını gösterir.';
      if(note) note.textContent='Aralıklar 5 netlik dilimler halinde gruplanır. Grafik yalnızca canlı lige kaydedilmiş toplam AGS netlerini kullanır.';
    }else{
      if(title) title.textContent='ÖABT Net Dağılımı';
      if(desc) desc.textContent='Canlı lige kayıtlı adayların ÖABT netlerinin hangi aralıklarda toplandığını gösterir.';
      if(note) note.textContent='Aralıklar 5 netlik dilimler halinde gruplanır. Grafik yalnızca canlı lige kaydedilmiş ÖABT netlerini kullanır.';
    }
    window.renderOabtDistribution();
  };

  function getLiveAgsValues(){
    const source=(typeof liveLeaderboardData!=='undefined' && Array.isArray(liveLeaderboardData))?liveLeaderboardData:(Array.isArray(window.liveLeaderboardData)?window.liveLeaderboardData:[]);
    return source.map(item=>{
      const candidates=[item&&item.ags_net,item&&item.raw_inputs&&item.raw_inputs.ags_net,item&&item.raw_inputs&&item.raw_inputs.ags];
      for(const c of candidates){const n=Number(c);if(Number.isFinite(n))return Math.max(0,Math.min(80,n));}
      const parts=['sozel','sayisal','tarih','cografya','egitim','mevzuat'];
      let total=0,found=false;
      for(const k of parts){
        const c=item&&item.raw_inputs&&item.raw_inputs[k];
        const n=Number(c); if(Number.isFinite(n)){total+=n;found=true;}
      }
      return found?Math.max(0,Math.min(80,total)):null;
    }).filter(v=>v!==null);
  }

  window.renderOabtDistribution = function(){
    const canvas=document.getElementById('rkOabtDistributionChart');
    const totalEl=document.getElementById('rk-oabt-dist-total');
    const updatedEl=document.getElementById('rk-oabt-dist-updated');
    if(!canvas || typeof Chart==='undefined') return;

    const values=rkDistributionMode==='ags'?getLiveAgsValues():getLiveOabtValues();
    const buckets=rkDistributionMode==='ags'?buildAgsBuckets(values):buildBuckets(values);
    const total=values.length;

    if(totalEl) totalEl.textContent=`${total.toLocaleString('tr-TR')} aday`;
    if(updatedEl) updatedEl.textContent=total ? `Son güncelleme: ${new Date().toLocaleTimeString('tr-TR',{hour:'2-digit',minute:'2-digit'})}` : 'Veri bekleniyor';

    const labels=buckets.map(b=>b.label);
    const data=buckets.map(b=>b.count);

    if(rkOabtDistChart) rkOabtDistChart.destroy();

    rkOabtDistChart=new Chart(canvas.getContext('2d'),{
      type:'bar',
      data:{
        labels,
        datasets:[{
          label:'Aday sayısı',
          data,
          backgroundColor:'rgba(76,159,149,.78)',
          borderColor:'rgba(76,159,149,1)',
          borderWidth:1,
          borderRadius:7,
          maxBarThickness:44
        }]
      },
      options:{
        responsive:true,
        maintainAspectRatio:false,
        plugins:{
          legend:{display:false},
          tooltip:{
            callbacks:{
              title:(items)=>`${rkDistributionMode==='ags'?'AGS':'ÖABT'} ${items[0].label} net`,
              label:(item)=>` ${item.raw.toLocaleString('tr-TR')} aday`
            }
          }
        },
        scales:{
          x:{
            grid:{display:false},
            ticks:{font:{size:10},color:'#71808c'}
          },
          y:{
            beginAtZero:true,
            ticks:{precision:0,font:{size:10},color:'#71808c'},
            grid:{color:'rgba(24,44,64,.07)'},
            title:{display:true,text:'Aday sayısı',font:{size:10,weight:'700'},color:'#71808c'}
          }
        }
      }
    });
  };

  // Canlı lig renderer'ı veriyi güncellediğinde grafiği de güncelle.
  const originalRender = window.renderLiveLeaderboard;
  if(typeof originalRender==='function' && !originalRender.__rkWrapped){
    const wrapped=function(){
      const result=originalRender.apply(this,arguments);
      setTimeout(window.renderOabtDistribution,50);
      return result;
    };
    wrapped.__rkWrapped=true;
    window.renderLiveLeaderboard=wrapped;
  }

  document.addEventListener('DOMContentLoaded',()=>{
    setTimeout(window.renderOabtDistribution,500);
  });
})();
