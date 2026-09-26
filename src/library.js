import {SUPABASE_URL,SUPABASE_PUBLISHABLE_KEY,authConfigured} from './auth-config.js?v=20260925-2';
import {getCuratedResources} from './curated.js?v=20260926-1';
import {parseQuery,normalize} from './search.js?v=20260926-14';

const $=selector=>document.querySelector(selector);
const esc=value=>String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const client=authConfigured&&window.supabase?.createClient(SUPABASE_URL,SUPABASE_PUBLISHABLE_KEY);
const bucket='community-documents';
const topicButtons=['Akran zorbalığı','Sınav kaygısı','LGS','Kariyer','Devamsızlık','Özel eğitim'];
const state={query:'',type:'',level:'',area:'',source:'',limit:24};
let documents=[];

async function loadJson(path){
 const response=await fetch(new URL(path,import.meta.url));
 if(!response.ok)throw Error('Katalog yüklenemedi');
 return response.json();
}
function officialDocuments(forms,resources){
 return [
  ...forms.map(item=>({id:item.id,kind:'tool',title:item.title,type:'Form',level:item.level,levels:item.levels,topic:item.category,area:item.group,source:'MEB Form Haritası',origin:'official',file:item.file,fileType:item.fileType,code:item.code,location:item.location,grades:item.grades})),
  ...resources.map(item=>({id:item.id,kind:'library',title:item.title,type:item.type,level:item.level,levels:item.levels,topic:item.topic,area:item.area,source:item.source||'MEB yayını',origin:'official',file:item.file,fileType:item.fileType,grades:item.grades}))
 ];
}
function memberDocuments(rows){
 return rows.map(item=>({id:item.id,kind:'member',title:item.title,type:item.document_type,level:item.level,topic:item.topic,area:'Meslektaş paylaşımı',source:'Üye paylaşımı · incelendi',origin:'member',file:item.file_storage_key,fileType:item.file_storage_key?.toLowerCase().endsWith('.pdf')?'PDF':'DOSYA'}));
}
function matchGrade(item,parsed){
 if(parsed.level&&item.level&&!['Belirtilmiyor','Tüm kademeler'].includes(item.level)&&item.level!==parsed.level&&!item.levels?.includes(parsed.level))return false;
 if(parsed.grade&&item.grades?.length&&!item.grades.includes(parsed.grade))return false;
 const range=normalize(item.title).match(/\b([1-9]|1[0-2])\s*[-–]\s*([1-9]|1[0-2])\.?\s*sinif\b/);
 return !range||!parsed.grade||(parsed.grade>=Number(range[1])&&parsed.grade<=Number(range[2]));
}
function score(item,query,parsed){
 if(!query)return 1;
 if(!matchGrade(item,parsed))return 0;
 const title=normalize(item.title);
 const hay=normalize([item.title,item.type,item.topic,item.area,item.source,item.level,item.code,item.location].join(' '));
 const words=parsed.words.filter(word=>!['meb','resmi','kaynak','belge'].includes(word));
 if(!words.length)return hay.includes(normalize(query))||parsed.level?1:0;
 const hits=words.filter(word=>hay.includes(word));
 if(hits.length===words.length)return 20+words.filter(word=>title.includes(word)).length*5+(item.origin==='official'?1:0);
 if(parsed.topic&&item.kind==='tool'&&parsed.topic.related?.some(term=>title.includes(term))&&hits.length>=words.length-2)return 8;
 return 0;
}
function card(item){
 const origin=item.origin==='member'?'Meslektaş paylaşımı':'Resmî kaynak';
 const subtitle=[item.area,item.topic,item.level==='Belirtilmiyor'?'Kademe belirtilmiyor':item.level].filter(Boolean).join(' · ');
 const fileButton=item.kind==='member'
  ?`<button type="button" data-community-file="${esc(item.file)}" data-library-open="${esc(item.id)}">Görüntüle ↗</button>`
  :`<button type="button" data-kind="${item.kind}" data-id="${esc(item.id)}" data-library-open="${esc(item.id)}">Görüntüle ↗</button>`;
 return `<article class="document-card library-document" id="${item.kind==='member'?'belge-':''}${esc(item.id)}"><div class="document-card-meta"><span>${origin}</span><span>${esc(item.type)}</span></div><h3>${esc(item.title)}</h3><p class="library-source">${esc(item.source)}</p><p>${esc(subtitle)}</p><div><small>${esc(item.fileType||'Dosya')}</small>${fileButton}</div></article>`;
}
function setTypeOptions(){
 const current=state.type;
 const values=[...new Set(documents.map(item=>item.type).filter(Boolean))].sort((a,b)=>a.localeCompare(b,'tr'));
 $('#libraryType').innerHTML='<option value="">Tüm türler</option>'+values.map(value=>`<option value="${esc(value)}">${esc(value)}</option>`).join('');
 $('#libraryType').value=current;
}
function setAreaOptions(){
 const values=[...new Set(documents.map(item=>item.area).filter(Boolean))].sort((a,b)=>a.localeCompare(b,'tr'));
 $('#libraryArea').innerHTML='<option value="">Tüm alanlar</option>'+values.map(value=>`<option value="${esc(value)}">${esc(value)}</option>`).join('');
 $('#libraryArea').value=state.area;
}
function render(){
 const parsed=parseQuery(state.query);
 const rows=documents.filter(item=>(!state.type||item.type===state.type)&&(!state.area||item.area===state.area)&&(!state.source||item.origin===state.source)&&(!state.level||item.level===state.level||item.level==='Tüm kademeler'||item.levels?.includes(state.level)))
  .map(item=>({item,score:score(item,state.query,parsed)})).filter(row=>row.score>0)
  .sort((a,b)=>b.score-a.score||a.item.title.localeCompare(b.item.title,'tr')).map(row=>row.item);
 const target=decodeURIComponent(location.hash.slice(1));
 if(target){const position=rows.findIndex(item=>(item.kind==='member'?'belge-'+item.id:item.id)===target);if(position>=state.limit)state.limit=position+1}
 $('#libraryCount').textContent=`${rows.length} kaynak${state.query?' bulundu':' gösteriliyor'}`;
 $('#libraryGrid').innerHTML=rows.length?rows.slice(0,state.limit).map(card).join(''):'<p class="empty">Bu ölçütlerde kaynak bulunamadı. Aramayı veya filtreleri değiştir.</p>';
 $('#libraryMore').hidden=rows.length<=state.limit;
 $('#libraryMore').textContent=`Daha fazla göster · ${rows.length-state.limit} kayıt`;
 document.querySelectorAll('[data-library-source]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.librarySource===state.source)));
 if(target)requestAnimationFrame(()=>document.getElementById(target)?.scrollIntoView({block:'center'}));
}
function openViewer(item,url){
 $('#viewerCode').textContent=[item.type,item.source].filter(Boolean).join(' · ');
 $('#viewerTitle').textContent=item.title;
 $('#viewerOpen').href=url;
 $('#viewerBody').innerHTML=item.fileType==='PDF'?`<iframe title="${esc(item.title)}" src="${esc(url)}#toolbar=1" loading="lazy"></iframe>`:'<div class="file-message"><strong>Önizleme yok</strong><p>Dosyayı alt bağlantıdan aç veya indir.</p></div>';
 $('#viewerDialog').showModal();
}
function closeViewer(){$('#viewerDialog').close();$('#viewerBody').replaceChildren()}

$('#libraryQuery').addEventListener('input',event=>{state.query=event.target.value.trim();state.limit=24;render()});
for(const [id,key] of [['libraryType','type'],['libraryLevel','level'],['libraryArea','area']]){
 $('#'+id).addEventListener('change',event=>{state[key]=event.target.value;state.limit=24;render()});
}
document.querySelector('[data-library-sources]').addEventListener('click',event=>{
 const button=event.target.closest('[data-library-source]');if(!button)return;
 state.source=button.dataset.librarySource;state.limit=24;render();
});
$('#libraryTopics').innerHTML=topicButtons.map(topic=>`<button type="button" data-library-topic="${esc(topic)}">${esc(topic)}</button>`).join('');
$('#libraryTopics').addEventListener('click',event=>{
 const button=event.target.closest('[data-library-topic]');if(!button)return;
 state.query=button.dataset.libraryTopic;$('#libraryQuery').value=state.query;state.limit=24;render();
});
$('#libraryMore').addEventListener('click',()=>{state.limit+=24;render()});
$('#libraryGrid').addEventListener('click',async event=>{
 const button=event.target.closest('[data-library-open]');if(!button)return;
 const item=documents.find(row=>row.id===button.dataset.libraryOpen);if(!item)return;
 if(item.origin==='official'){openViewer(item,item.file);return}
 button.disabled=true;
 try{
  if(!client)throw Error('Dosya bağlantısı kurulamadı.');
  const {data,error}=await client.storage.from(bucket).createSignedUrl(item.file,300);
  if(error)throw error;
  openViewer(item,data.signedUrl);
 }catch(error){$('#libraryStatus').textContent='Dosya açılamadı: '+error.message}
 finally{button.disabled=false}
});
$('#closeViewer').addEventListener('click',closeViewer);
$('#viewerDialog').addEventListener('click',event=>{if(event.target===$('#viewerDialog'))closeViewer()});

try{
 const [forms,resources,curated]=await Promise.all([loadJson('../data/forms.json?v=20260926-5'),loadJson('../data/library.json?v=20260926-39'),getCuratedResources()]);
 documents=officialDocuments([...forms,...curated.tools],[...resources,...curated.library]);
 setTypeOptions();setAreaOptions();
 const url=new URL(location.href);
 if(url.searchParams.get('tur')){state.type=url.searchParams.get('tur');$('#libraryType').value=state.type}
 if(url.searchParams.get('kaynak'))state.source=url.searchParams.get('kaynak');
 if(url.searchParams.get('q')){state.query=url.searchParams.get('q');$('#libraryQuery').value=state.query}
 render();
 if(client){
  const {data,error}=await client.from('community_documents').select('id,title,document_type,level,topic,file_storage_key').eq('review_status','approved').order('created_at',{ascending:false}).limit(1000);
  if(error)throw error;
  documents.push(...memberDocuments(data||[]));setTypeOptions();setAreaOptions();render();
 }
}catch(error){$('#libraryStatus').textContent='Kaynakların bir bölümü yüklenemedi: '+error.message}
