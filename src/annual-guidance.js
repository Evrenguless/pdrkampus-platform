const STORAGE_KEY='pdrkampus-annual-guidance-prototype-v1';
const months=['Eylül','Ekim','Kasım','Aralık','Ocak','Şubat','Mart','Nisan','Mayıs','Haziran'];
const statuses=['Planlandı','Hazırlanıyor','Uygulandı','Ertelendi','İptal edildi'];
const baseGoals=[
 {id:'g-akran',type:'general',title:'Akran ilişkileri',description:'Akran etkileşimi, okul iklimi ve sağlıklı ilişki becerileriyle ilişkilendirilebilecek çalışma alanı.',keywords:['akran','zorbal','arkadaş','arkadas','sosyal']},
 {id:'g-uyum',type:'general',title:'Okula uyum ve aidiyet',description:'Okula uyum, aidiyet ve öğrenciyi tanıma çalışmaları için örnek hedef alanı.',keywords:['uyum','aidiyet','öğrenciyi tanıma','ogrenciyi tanima','riba']},
 {id:'g-akademik',type:'general',title:'Akademik gelişim',description:'Akademik motivasyon, çalışma becerileri ve sınav sürecine ilişkin çalışma alanı.',keywords:['akademik','motivasyon','ders çalışma','ders calisma','sınav','sinav']},
 {id:'l-dijital',type:'local',title:'Dijital yaşam ve güvenli teknoloji kullanımı',description:'Yerel ihtiyaçlara göre seçilebilecek örnek çalışma alanı; resmî yerel hedef değildir.',keywords:['dijital','siber','internet','teknoloji','ekran']},
 {id:'l-esenlik',type:'local',title:'Öğrenci esenliği ve psikolojik sağlamlık',description:'Yerel ihtiyaçlara göre seçilebilecek örnek çalışma alanı; resmî yerel hedef değildir.',keywords:['esenlik','psikolojik sağlamlık','psikolojik saglamlik','duygu','stres']}
];
const blankYear=()=>({school:{level:'',schoolType:'',grades:'',studentCount:''},selectedGoals:[],customGoals:[],items:[],notes:''});
let app=loadApp();
let catalogs={resources:[],types:[]};
let activeMonth='Eylül',selectedItemId=null;

function loadApp(){
 try{const parsed=JSON.parse(localStorage.getItem(STORAGE_KEY)||'null');if(parsed?.years)return parsed}catch{}
 return {activeYear:'2026–2027',years:{'2026–2027':blankYear()}};
}
function save(){localStorage.setItem(STORAGE_KEY,JSON.stringify(app))}
function yearState(){app.years[app.activeYear]??=blankYear();return app.years[app.activeYear]}
function allGoals(){return [...baseGoals,...yearState().customGoals]}
function selectedGoals(){const ids=new Set(yearState().selectedGoals);return allGoals().filter(g=>ids.has(g.id))}
function escapeHtml(value=''){return String(value).replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]))}
function norm(v=''){return String(v).toLocaleLowerCase('tr-TR').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/ı/g,'i')}
function uid(){return crypto?.randomUUID?.()||Date.now().toString(36)+Math.random().toString(36).slice(2)}

const yearSelect=document.querySelector('#academicYear');
const yearOptions=['2025–2026','2026–2027','2027–2028','2028–2029'];
yearSelect.innerHTML=yearOptions.map(y=>`<option ${y===app.activeYear?'selected':''}>${y}</option>`).join('');
yearSelect.addEventListener('change',()=>{app.activeYear=yearSelect.value;yearState();save();selectedItemId=null;renderAll()});
document.querySelector('#resetYear').addEventListener('click',()=>{if(confirm(app.activeYear+' yılına ait bu önizleme verileri sıfırlansın mı?')){app.years[app.activeYear]=blankYear();selectedItemId=null;save();renderAll()}});

async function loadCatalogs(){
 try{
  const [formsRes,libRes]=await Promise.all([fetch('data/forms.json'),fetch('data/library.json')]);
  const forms=await formsRes.json(),lib=await libRes.json();
  const formItems=forms.map(item=>({...item,_kind:'Form',_id:'form:'+item.id,_type:item.type||'Form',_file:item.file||item.url||item.fileUrl||'',_source:item.source||'MEB'}));
  const libItems=lib.map(item=>({...item,_kind:'Kütüphane',_id:'lib:'+item.id,_type:item.type||'Kaynak',_file:item.file||'',_source:item.source||''}));
  catalogs.resources=[...formItems,...libItems];
  catalogs.types=[...new Set(catalogs.resources.map(r=>r._type).filter(Boolean))].sort((a,b)=>a.localeCompare(b,'tr'));
  document.querySelector('#resourceTypeFilter').innerHTML='<option value="">Tüm kaynak türleri</option>'+catalogs.types.map(t=>`<option>${escapeHtml(t)}</option>`).join('');
  renderResources();
 }catch(err){
  document.querySelector('#resourceResults').innerHTML='<p class="annual-empty">Kaynak kataloğu şu anda yüklenemedi.</p>';
 }
}

function renderGoals(){
 for(const type of ['general','local','special']){
  const root=document.querySelector('#'+type+'Goals');
  const list=allGoals().filter(g=>g.type===type);
  root.className='annual-goal-list';
  root.innerHTML=list.length?list.map(g=>{
   const on=yearState().selectedGoals.includes(g.id);
   return `<div class="annual-goal-card"><strong>${escapeHtml(g.title)}</strong><p>${escapeHtml(g.description||'Okulunuzun ihtiyacına göre tanımlanan özel hedef.')}</p><button type="button" data-goal="${g.id}" data-selected="${on}">${on?'✓ Planımda':'＋ Bu hedefi planıma ekle'}</button></div>`;
  }).join(''):'<p class="annual-empty">Henüz hedef eklenmedi.</p>';
 }
 document.querySelectorAll('[data-goal]').forEach(btn=>btn.addEventListener('click',()=>{
  const s=yearState(),id=btn.dataset.goal;
  s.selectedGoals=s.selectedGoals.includes(id)?s.selectedGoals.filter(x=>x!==id):[...s.selectedGoals,id];
  save();renderAll();
 }));
}

document.querySelector('#specialGoalForm').addEventListener('submit',e=>{
 e.preventDefault();const title=e.currentTarget.title.value.trim();if(!title)return;
 const goal={id:'custom-'+uid(),type:'special',title,description:'Okulun kendi ihtiyaçları doğrultusunda eklenen özel hedef.',keywords:title.split(/\s+/).filter(x=>x.length>3)};
 yearState().customGoals.push(goal);yearState().selectedGoals.push(goal.id);save();e.currentTarget.reset();renderAll();
});

function renderSchool(){
 const s=yearState().school,form=document.querySelector('#schoolForm');
 form.level.value=s.level||'';form.schoolType.value=s.schoolType||'';form.grades.value=s.grades||'';form.studentCount.value=s.studentCount||'';
}
document.querySelector('#schoolForm').addEventListener('submit',e=>{
 e.preventDefault();const fd=new FormData(e.currentTarget);
 yearState().school=Object.fromEntries(fd.entries());save();
 document.querySelector('#schoolStatus').textContent='Okul bilgileri bu eğitim yılı için kaydedildi.';renderAll();
});

function openPlanForm(){
 const form=document.querySelector('#planForm');form.hidden=false;
 const goalSelect=form.goalId;const goals=selectedGoals();
 goalSelect.innerHTML='<option value="">Hedef seçin</option>'+goals.map(g=>`<option value="${g.id}">${escapeHtml(g.title)}</option>`).join('');
 form.month.innerHTML=months.map(m=>`<option ${m===activeMonth?'selected':''}>${m}</option>`).join('');
 form.scrollIntoView({behavior:'smooth',block:'center'});
}
document.querySelector('#openPlanForm').addEventListener('click',openPlanForm);
document.querySelector('#quickAdd').addEventListener('click',()=>{location.hash='plan';setTimeout(openPlanForm,100)});
document.querySelector('#cancelPlanForm').addEventListener('click',()=>document.querySelector('#planForm').hidden=true);
document.querySelector('#planForm').addEventListener('submit',e=>{
 e.preventDefault();const fd=Object.fromEntries(new FormData(e.currentTarget).entries());if(!fd.goalId)return;
 const item={id:uid(),month:fd.month,goalId:fd.goalId,grade:fd.grade.trim(),activityType:fd.activityType,title:fd.title.trim(),status:'Planlandı',resourceIds:[],createdAt:new Date().toISOString()};
 yearState().items.push(item);activeMonth=item.month;selectedItemId=item.id;save();e.currentTarget.reset();e.currentTarget.hidden=true;renderAll();location.hash='plan';
});

function renderMonths(){
 const s=yearState();
 document.querySelector('#monthStrip').innerHTML=months.map(m=>{
  const count=s.items.filter(i=>i.month===m).length;
  return `<button type="button" class="annual-month-button" data-month="${m}" data-active="${m===activeMonth}">${m}<strong>${count}</strong></button>`;
 }).join('');
 document.querySelectorAll('[data-month]').forEach(btn=>btn.addEventListener('click',()=>{activeMonth=btn.dataset.month;renderMonths();renderBoard()}));
}
function renderBoard(){
 const items=yearState().items.filter(i=>i.month===activeMonth);
 const root=document.querySelector('#monthBoard');
 if(!items.length){root.innerHTML='<div class="annual-empty">'+activeMonth+' için henüz çalışma eklenmedi. Bu ayı doldurmak zorunda değilsin; yalnızca ihtiyaç duyduğun çalışmaları ekle.</div>';return}
 root.innerHTML=items.map(i=>{
  const goal=allGoals().find(g=>g.id===i.goalId);const resources=i.resourceIds?.length||0;
  return `<article class="annual-item-card"><div><div class="annual-item-meta"><span>${escapeHtml(activeMonth)}</span><span>${escapeHtml(i.grade||'Sınıf belirtilmedi')}</span><span>${escapeHtml(i.activityType)}</span><span>${resources} kaynak</span></div><h3>${escapeHtml(i.title)}</h3><p>${escapeHtml(goal?.title||'Hedef bulunamadı')}</p></div><div class="annual-item-actions"><select data-status="${i.id}">${statuses.map(s=>`<option ${s===i.status?'selected':''}>${s}</option>`).join('')}</select><button type="button" data-resources="${i.id}">Kaynakları bul →</button></div></article>`;
 }).join('');
 document.querySelectorAll('[data-status]').forEach(sel=>sel.addEventListener('change',()=>{const item=yearState().items.find(i=>i.id===sel.dataset.status);if(item){item.status=sel.value;save();renderOverview();renderYearEnd()}}));
 document.querySelectorAll('[data-resources]').forEach(btn=>btn.addEventListener('click',()=>{selectedItemId=btn.dataset.resources;renderResources();location.hash='resources'}));
}

function scoreResource(r,item){
 const goal=allGoals().find(g=>g.id===item.goalId);if(!goal)return -1;
 const hay=norm([r.title,r.topic,r.area,r.category,r.group,r._type,r.level,r.source].filter(Boolean).join(' '));
 let score=0;
 const level=yearState().school.level;
 if(level){
   if(r.level&&r.level!==level&&r.level!=='Tüm kademeler'&&r.level!=='Belirtilmiyor')return -1;
   if(r.level===level)score+=6;
 }
 const words=[...(goal.keywords||[]),...norm(goal.title).split(/\s+/).filter(w=>w.length>3)];
 for(const w0 of words){const w=norm(w0);if(w&&hay.includes(w))score+=8}
 if(item.grade){
   const num=Number(item.grade.match(/\d+/)?.[0]||0);
   if(num&&Array.isArray(r.grades)&&r.grades.includes(num))score+=7;
 }
 if(norm(r._type).includes('etkinlik')&&norm(item.activityType).includes('sinif'))score+=3;
 if(norm(r.title).includes(norm(goal.title)))score+=8;
 return score;
}
function candidateResources(){
 const item=yearState().items.find(i=>i.id===selectedItemId);if(!item)return [];
 const type=document.querySelector('#resourceTypeFilter').value;
 const q=norm(document.querySelector('#resourceSearch').value);
 return catalogs.resources.map(r=>({r,score:scoreResource(r,item)})).filter(x=>x.score>0).filter(x=>!type||x.r._type===type).filter(x=>!q||norm([x.r.title,x.r.topic,x.r.area,x.r._type].join(' ')).includes(q)).sort((a,b)=>b.score-a.score).slice(0,30);
}
function renderResources(){
 const root=document.querySelector('#resourceResults');const item=yearState().items.find(i=>i.id===selectedItemId);
 if(!item){document.querySelector('#resourceHeading').textContent='Bir çalışma seç; uygun kaynakları bulalım.';document.querySelector('#resourceContext').textContent='Yıllık plandaki “Kaynakları bul” düğmesini kullan.';root.innerHTML='<div class="annual-empty">Henüz bir plan maddesi seçilmedi.</div>';return}
 const goal=allGoals().find(g=>g.id===item.goalId);
 document.querySelector('#resourceHeading').textContent=item.title;
 document.querySelector('#resourceContext').textContent=[app.activeYear,item.month,yearState().school.level,item.grade,goal?.title].filter(Boolean).join(' · ');
 const results=candidateResources();
 root.innerHTML=results.length?results.map(({r,score})=>{
  const added=item.resourceIds?.includes(r._id);
  const href=r._file||r.sourcePage||r.sourcePageUrl||'#';
  return `<article class="annual-resource-card"><div class="meta"><span>${escapeHtml(r._type)}</span><span>${escapeHtml(r.level||'Kademe belirtilmiyor')}</span><span>Eşleşme ${score}</span></div><h3>${escapeHtml(r.title)}</h3><p>${escapeHtml([r.topic,r.area,r.source].filter(Boolean).join(' · '))}</p><div class="annual-resource-actions"><a href="${escapeHtml(href)}" target="_blank" rel="noopener noreferrer">Kaynağı aç ↗</a><button type="button" data-add-resource="${escapeHtml(r._id)}">${added?'✓ Planda':'＋ Planıma ekle'}</button></div></article>`;
 }).join(''):'<div class="annual-empty">Bu plan maddesi için mevcut metadata ile güçlü bir eşleşme bulunamadı. Bu sonuç da kütüphanedeki içerik boşluklarını görmemize yardımcı olacak.</div>';
 document.querySelectorAll('[data-add-resource]').forEach(btn=>btn.addEventListener('click',()=>{
   item.resourceIds??=[];const id=btn.dataset.addResource;item.resourceIds=item.resourceIds.includes(id)?item.resourceIds.filter(x=>x!==id):[...item.resourceIds,id];save();renderResources();renderBoard();
 }));
}
document.querySelector('#resourceTypeFilter').addEventListener('change',renderResources);
document.querySelector('#resourceSearch').addEventListener('input',renderResources);

function renderOverview(){
 const s=yearState(),done=s.items.filter(i=>i.status==='Uygulandı').length,total=s.items.length;
 document.querySelector('#statGoals').textContent=s.selectedGoals.length;
 document.querySelector('#statItems').textContent=total;
 document.querySelector('#statDone').textContent=done;
 document.querySelector('#statProgress').textContent='%'+(total?Math.round(done/total*100):0);
 const thisItems=s.items.filter(i=>i.month===activeMonth);
 document.querySelector('#currentMonthTitle').textContent=activeMonth;
 document.querySelector('#currentMonthCount').textContent=thisItems.length+' çalışma';
 document.querySelector('#currentMonthList').innerHTML=thisItems.length?thisItems.slice(0,5).map(i=>`<div class="annual-mini-item"><div><strong>${escapeHtml(i.title)}</strong><span>${escapeHtml(i.grade||i.activityType)}</span></div><span>${escapeHtml(i.status)}</span></div>`).join(''):'<div class="annual-empty">Bu ay için çalışma yok.</div>';
 const used=new Set(s.items.map(i=>i.goalId)),gaps=selectedGoals().filter(g=>!used.has(g.id));
 document.querySelector('#gapList').innerHTML=gaps.length?gaps.map(g=>`<div class="annual-mini-item"><div><strong>${escapeHtml(g.title)}</strong><span>Henüz yıllık plana çalışma eklenmedi.</span></div></div>`).join(''):'<div class="annual-empty">Seçilen bütün hedeflerde en az bir çalışma var.</div>';
}
function renderYearEnd(){
 const s=yearState();const done=s.items.filter(i=>i.status==='Uygulandı').length,cancel=s.items.filter(i=>i.status==='İptal edildi').length,resources=new Set(s.items.flatMap(i=>i.resourceIds||[])).size;
 document.querySelector('#yearEndSummary').innerHTML=[
  [s.selectedGoals.length,'Seçilen hedef'],[s.items.length,'Planlanan çalışma'],[done,'Uygulanan çalışma'],[resources,'Kullanılan kaynak'],[s.items.filter(i=>i.status==='Ertelendi').length,'Ertelenen'],[cancel,'İptal edilen']
 ].map(([n,l])=>`<article><strong>${n}</strong><span>${l}</span></article>`).join('');
 document.querySelector('#yearEndNotes').value=s.notes||'';
}
document.querySelector('#yearEndNotes').addEventListener('input',e=>{yearState().notes=e.target.value;save()});

function renderAll(){
 renderSchool();renderGoals();renderMonths();renderBoard();renderOverview();renderYearEnd();renderResources();
 document.querySelector('.annual-section-head span').textContent=app.activeYear+' / GENEL BAKIŞ';
}
renderAll();loadCatalogs();
