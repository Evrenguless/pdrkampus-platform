(function(){
  const tests={
    verbal:{label:'Sözel Yetenek',total:15,color:'#2f897b',topics:[
      ['Sözcük, söz grubu ve deyimde anlam',2],
      ['Cümlede anlam ve yorum',1],
      ['Paragrafın yapısı ve düşünce akışı',3],
      ['Paragrafta anlam, çıkarım ve yorum',5],
      ['Sözel mantık',4]
    ]},
    quantitative:{label:'Sayısal Yetenek',total:15,color:'#56618f',topics:[
      ['Temel matematik ve sayı kavramları',4],
      ['Fonksiyonlar ve bileşke',1],
      ['Denklem kurma ve problemler',2],
      ['Sıralama ve algoritmik akıl yürütme',1],
      ['Basamak ve sayı özellikleri',2],
      ['Mantıksal işlem ve durum analizi',2],
      ['Grafik ve veri yorumlama',3]
    ]},
    history:{label:'Tarih',total:6,color:'#a56b42',topics:[
      ['İlk Türk devletlerinde kültür ve töre',1],
      ['Türk-İslam tarihi ve destanlar',1],
      ['Osmanlı yenileşmesi ve meşrutiyet',1],
      ['Millî Mücadele hazırlık dönemi',1],
      ['Atatürk ilke ve inkılapları',1],
      ['Çağdaş Türk ve dünya tarihi',1]
    ]},
    geography:{label:'Türkiye Coğrafyası',total:6,color:'#4f8069',topics:[
      ['Jeolojik yapı ve masif araziler',1],
      ['Kıyılar, boğazlar ve körfezler',1],
      ['Bitki örtüsü ve alpin çayırlar',1],
      ['Nüfus politikaları',1],
      ['Madenler ve ekonomik coğrafya',1],
      ['Çevre, sulak alanlar ve Ramsar alanları',1]
    ]},
    education:{label:'Eğitim Bilimleri ve TMES',shortLabel:'Eğitim Bilimleri',total:30,color:'#9b6b2d',topics:[
      ['Türk eğitim tarihi',2],
      ['Eğitimin toplumsal işlevleri',1],
      ['Öğretim yöntem ve teknikleri',3],
      ['Sınıf yönetimi',2],
      ['Program geliştirme ve farklılaştırma',3],
      ['Ölçme ve değerlendirme',3],
      ['Öğrenme psikolojisi',3],
      ['Gelişim psikolojisi',3],
      ['Rehberlik',3],
      ['Öğretim teknolojileri',3],
      ['Türk Millî Eğitim Sistemi',2],
      ['Türkiye Yüzyılı Maarif Modeli',2]
    ]},
    legislation:{label:'Mevzuat',total:8,color:'#8b5e78',topics:[
      ['1982 Anayasası',2],
      ['7528 sayılı Öğretmenlik Mesleği Kanunu',2],
      ['1739 sayılı Millî Eğitim Temel Kanunu',2],
      ['222 sayılı İlköğretim ve Eğitim Kanunu',2]
    ]}
  };
  const totalQuestions=Object.values(tests).reduce((sum,test)=>sum+test.total,0);
  let activeKey='all';
  let chart=null;

  function rowsFor(key){
    if(key==='all') return Object.entries(tests).map(([id,test])=>({id,label:test.label,count:test.total,color:test.color}));
    const test=tests[key];
    return test.topics.map(([label,count])=>({label,count,color:test.color}));
  }

  function renderButtons(){
    const host=document.getElementById('rk-ags-test-switch');
    if(!host) return;
    const items=[['all','Genel Dağılım'],...Object.entries(tests).map(([id,test])=>[id,test.shortLabel||test.label])];
    host.innerHTML=items.map(([id,label])=>`<button type="button" class="rk-ags-test-btn ${id===activeKey?'active':''}" data-ags-test="${id}">${label}</button>`).join('');
    host.querySelectorAll('[data-ags-test]').forEach(button=>button.addEventListener('click',()=>window.switchAgsTopicView(button.dataset.agsTest)));
  }

  function renderSummary(){
    const selected=activeKey==='all'?null:tests[activeKey];
    const rows=rowsFor(activeKey);
    const leading=rows.reduce((best,row)=>row.count>best.count?row:best,rows[0]);
    const title=document.getElementById('rk-ags-view-title');
    const subtitle=document.getElementById('rk-ags-view-subtitle');
    const total=document.getElementById('rk-ags-selected-total');
    const totalLabel=document.getElementById('rk-ags-selected-label');
    const top=document.getElementById('rk-ags-leading-topic');
    const topLabel=document.getElementById('rk-ags-leading-label');
    if(title) title.textContent=selected?`${selected.label} konu dağılımı`:'Testlere göre soru dağılımı';
    if(subtitle) subtitle.textContent=selected?'Konuların test içindeki soru ağırlıklarını karşılaştır.':'2026 AGS’deki 80 sorunun altı teste göre dağılımını karşılaştır.';
    if(total) total.textContent=selected?selected.total:totalQuestions;
    if(totalLabel) totalLabel.textContent=selected?'seçili testteki soru':'toplam soru';
    if(top) top.textContent=leading.label;
    if(topLabel) topLabel.textContent=`${leading.count} soru ile en yoğun ${selected?'konu':'test'}`;
  }

  function renderTable(){
    const body=document.getElementById('rk-ags-topic-table-body');
    const firstHead=document.getElementById('rk-ags-table-first-head');
    if(!body) return;
    const selected=activeKey==='all'?null:tests[activeKey];
    const denominator=selected?selected.total:totalQuestions;
    if(firstHead) firstHead.textContent=selected?'Konu':'Test';
    body.innerHTML=rowsFor(activeKey).map(row=>{
      const percent=(row.count/denominator)*100;
      return `<tr><td><span class="rk-ags-table-dot" style="background:${row.color}"></span>${row.label}</td><td><strong>${row.count}</strong></td><td><span class="rk-ags-share"><i style="width:${percent.toFixed(2)}%;background:${row.color}"></i></span><b>%${percent.toLocaleString('tr-TR',{maximumFractionDigits:1})}</b></td></tr>`;
    }).join('');
  }

  function renderChart(){
    const canvas=document.getElementById('rkAgsTopicChart');
    if(!canvas || typeof Chart==='undefined') return;
    const rows=rowsFor(activeKey);
    if(chart) chart.destroy();
    chart=new Chart(canvas.getContext('2d'),{
      type:'bar',
      data:{
        labels:rows.map(row=>row.label),
        datasets:[{
          data:rows.map(row=>row.count),
          backgroundColor:rows.map(row=>row.color+'d9'),
          borderColor:rows.map(row=>row.color),
          borderWidth:1,
          borderRadius:7,
          maxBarThickness:28
        }]
      },
      options:{
        indexAxis:'y',
        responsive:true,
        maintainAspectRatio:false,
        animation:{duration:350},
        plugins:{
          legend:{display:false},
          tooltip:{callbacks:{label:item=>` ${item.raw} soru`}}
        },
        scales:{
          x:{beginAtZero:true,ticks:{precision:0,stepSize:1,color:'#71808c',font:{size:10}},grid:{color:'rgba(24,44,64,.07)'},title:{display:true,text:'Soru sayısı',color:'#71808c',font:{size:10,weight:'700'}}},
          y:{grid:{display:false},ticks:{color:'#314252',font:{size:10,weight:'600'},autoSkip:false}}
        }
      }
    });
  }

  window.switchAgsTopicView=function(key){
    if(key!=='all'&&!tests[key]) return;
    activeKey=key;
    renderButtons();
    renderSummary();
    renderTable();
    renderChart();
  };

  function init(){
    renderButtons();
    renderSummary();
    renderTable();
    renderChart();
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',init,{once:true});
  else init();
})();