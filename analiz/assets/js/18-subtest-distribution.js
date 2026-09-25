
(function(){
  const TESTS=[
    {key:'sozel',name:'Sözel Yetenek',short:'Sözel'},
    {key:'sayisal',name:'Sayısal Yetenek',short:'Sayısal'},
    {key:'tarih',name:'Tarih',short:'Tarih'},
    {key:'cografya',name:'Coğrafya',short:'Coğrafya'},
    {key:'egitim',name:'Eğitim Bilimleri',short:'Eğitim'},
    {key:'mevzuat',name:'Mevzuat',short:'Mevzuat'}
  ];
  const charts={};
  function data(){return (typeof P2_RANKING_DATA!=='undefined'&&Array.isArray(P2_RANKING_DATA))?P2_RANKING_DATA:[];}
  function values(key){return data().map(x=>Number(x&&x[key])).filter(Number.isFinite);}
  function buckets(vals,max){
    const step=2.5;
    const count=Math.ceil(max/step);
    const out=Array.from({length:count},(_,i)=>{
      const start=i*step;
      const end=Math.min(max,(i+1)*step);
      return {label:`${start.toLocaleString('tr-TR')}-${end.toLocaleString('tr-TR')}`,count:0};
    });
    vals.forEach(v=>{
      if(!Number.isFinite(v) || v<0 || v>max) return;
      const i=Math.min(count-1,Math.floor(v/step));
      out[i].count++;
    });
    return out;
  }
  function renderChart(key,canvas){
    if(typeof Chart==='undefined'||!canvas)return;
    const vals=values(key), bs=buckets(vals, key==='egitim'?30:key==='sozel'?15:key==='sayisal'?15:key==='tarih'?6:key==='cografya'?6:8);
    if(charts[key])charts[key].destroy();
    charts[key]=new Chart(canvas.getContext('2d'),{type:'bar',data:{labels:bs.map(b=>b.label),datasets:[{label:'Aday sayısı',data:bs.map(b=>b.count),backgroundColor:'rgba(76,159,149,.78)',borderColor:'rgba(76,159,149,1)',borderWidth:1,borderRadius:6,maxBarThickness:30}]},options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false},tooltip:{callbacks:{title:i=>`${TESTS.find(t=>t.key===key).name}: ${i[0].label} net`,label:i=>` ${i.raw.toLocaleString('tr-TR')} aday`}}},scales:{x:{grid:{display:false},ticks:{font:{size:9},color:'#71808c',maxRotation:45,minRotation:0}},y:{beginAtZero:true,ticks:{precision:0,font:{size:10},color:'#71808c'},grid:{color:'rgba(24,44,64,.07)'},title:{display:true,text:'Aday sayısı',font:{size:10,weight:'700'},color:'#71808c'}}}}});
  }
  function openTest(key){
    const item=document.querySelector(`[data-rk-subtest="${key}"]`); if(!item)return;
    const was=item.classList.contains('open');
    document.querySelectorAll('.rk-subtest-item').forEach(x=>x.classList.remove('open'));
    if(!was){item.classList.add('open'); const canvas=item.querySelector('canvas'); requestAnimationFrame(()=>renderChart(key,canvas));}
  }
  window.renderP2SubtestDistributions=function(){
    const host=document.getElementById('rk-real-dist-subtests'); if(!host)return;
    const ds=data();
    if(!ds.length){host.innerHTML='<div class="rk-subtest-empty">Gerçek sonuç verileri yüklenemedi.</div>';return;}
    host.innerHTML=`<div class="rk-subtest-dist-head"><div><div class="rk-subtest-dist-kicker">DERS DERS ANALİZ</div><div class="rk-subtest-dist-title">AGS Test Dağılımları</div></div><div class="rk-subtest-summary">${ds.length} gerçek sonuç</div></div>`+TESTS.map((t,i)=>{const v=values(t.key),avg=v.reduce((a,b)=>a+b,0)/v.length;return `<div class="rk-subtest-item" data-rk-subtest="${t.key}"><button class="rk-subtest-toggle" type="button" onclick="openP2Subtest('${t.key}')"><span class="rk-subtest-left"><span class="rk-subtest-icon">${i+1}</span><span><span class="rk-subtest-name">${t.name}</span><span class="rk-subtest-summary">Ortalama ${avg.toFixed(2)} net · ${v.length} aday</span></span></span><span class="rk-subtest-chevron">⌄</span></button><div class="rk-subtest-body"><div class="rk-subtest-stats"><span class="rk-subtest-stat">Ortalama <strong>${avg.toFixed(2)}</strong></span><span class="rk-subtest-stat">En düşük <strong>${Math.min(...v).toFixed(2)}</strong></span><span class="rk-subtest-stat">En yüksek <strong>${Math.max(...v).toFixed(2)}</strong></span></div><div class="rk-subtest-chart"><canvas data-rk-subtest-canvas="${t.key}"></canvas></div><div class="rk-subtest-note">${ds.length} gerçek sonuçtaki ${t.name} netleri, sınavın maksimum neti aşılmadan 2,5 netlik aralıklarda gruplanmıştır.</div></div></div>`;}).join('');
  };
  window.openP2Subtest=function(key){openTest(key);};
  function inject(){
    const card=document.querySelector('.rk-real-distribution-card'); if(!card||document.getElementById('rk-real-dist-subtests'))return;
    const host=document.createElement('div');host.id='rk-real-dist-subtests';host.className='rk-subtest-dist';
    const note=card.querySelector('.rk-real-dist-note'); if(note)note.insertAdjacentElement('beforebegin',host); else card.appendChild(host);
    window.renderP2SubtestDistributions();
  }
  document.addEventListener('DOMContentLoaded',()=>setTimeout(inject,350));
})();
