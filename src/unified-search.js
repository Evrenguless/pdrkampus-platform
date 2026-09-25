import {SUPABASE_URL,SUPABASE_PUBLISHABLE_KEY,authConfigured} from './auth-config.js?v=20260925-2';
import {normalize} from './search.js';
const form=document.querySelector('#searchForm');
if(form&&authConfigured&&window.supabase){
 const client=window.supabase.createClient(SUPABASE_URL,SUPABASE_PUBLISHABLE_KEY);
 const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 let request=0;
 form.addEventListener('submit',async()=>{
  const current=++request,query=document.querySelector('#searchInput').value.trim();if(!query)return;
  const host=document.querySelector('#resultGrid');
  const section=document.createElement('section');section.id='communitySearchResults';
  section.innerHTML='<div class="result-head"><h3>Meslektaşlardan ve belgelerden</h3></div><p class="small-note">Son paylaşımlar aranıyor…</p>';
  host.querySelector('#communitySearchResults')?.remove();host.append(section);
  const sources=[
   {table:'community_documents',fields:'title,topic,document_type,level',kind:'belge',label:'Belgeler',url:'belgeler.html#meslektas',status:'review_status',active:'approved'},
   {table:'community_posts',fields:'id,title,body,category',kind:'gonderi',label:'Topluluk',url:'topluluk.html',status:'status',active:'published'},
   {table:'colleague_questions',fields:'id,title,body,category',kind:'soru',label:'Meslektaşıma Sor',url:'meslektasima-sor.html',status:'moderation_status',active:'published'}
  ];
  const found=await Promise.all(sources.map(async s=>{const {data,error}=await client.from(s.table).select(s.fields).eq(s.status,s.active).order('created_at',{ascending:false}).limit(200);return {source:s,items:error?[]:data,error}}));
  if(current!==request||!section.isConnected)return;
  const words=normalize(query).split(/[^a-z0-9]+/).filter(x=>x.length>2&&!['sinif','sinifta','icin','ile','suphesi','ogrenci'].includes(x));
  const groups=found.map(({source,items,error})=>({source,error,items:items.filter(x=>{const value=normalize([x.title,x.topic,x.document_type,x.level,x.body,x.category].filter(Boolean).join(' '));return words.length?words.some(w=>value.includes(w)):value.includes(normalize(query))}).slice(0,6)}));
  section.innerHTML=`<div class="result-head"><h3>Belgeler ve meslektaş paylaşımları</h3><span>Son eklenen kayıtlar</span></div>${groups.map(({source,items,error})=>`<div class="search-source"><div class="result-head"><h4>${source.label} <span>${items.length}</span></h4><a href="${source.url}">Bölüme git ↗</a></div>${error?'<p class="small-note">Bu bölümün sonuçları şu anda yüklenemedi.</p>':items.length?`<div class="search-mini-list">${items.map(x=>`<a href="${source.url}${x.id&&source.kind!=='belge'?'#'+(source.kind==='soru'?'soru-':'gonderi-')+encodeURIComponent(x.id):''}"><strong>${esc(x.title)}</strong><small>${esc(x.topic||x.category||x.document_type||'')}</small><span>↗</span></a>`).join('')}</div>`:'<p class="small-note">Son kayıtlarda eşleşme yok.</p>'}</div>`).join('')}`;
 });
 document.querySelector('#clearSearch')?.addEventListener('click',()=>{request++});
}
