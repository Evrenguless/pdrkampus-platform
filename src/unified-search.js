import {SUPABASE_URL,SUPABASE_PUBLISHABLE_KEY,authConfigured} from './auth-config.js?v=20260925-2';
import {parseQuery,normalize} from './search.js?v=20260926-14';
const form=document.querySelector('#searchForm');
if(form&&authConfigured&&window.supabase){
 const client=window.supabase.createClient(SUPABASE_URL,SUPABASE_PUBLISHABLE_KEY);
 const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const groups=[
  {type:'document',name:'Meslektaş belgeleri',source:'Üye paylaşımı · incelemeden geçti',url:id=>`belgeler.html${id?'#belge-'+encodeURIComponent(id):'#meslektas'}`},
  {type:'question',name:'Meslektaşıma Sor',source:'Meslektaş deneyimi',url:id=>`meslektasima-sor.html${id?'#soru-'+encodeURIComponent(id):''}`},
  {type:'post',name:'Topluluk gönderileri',source:'Meslektaş paylaşımı',url:id=>`topluluk.html${id?'#gonderi-'+encodeURIComponent(id):''}`}
 ];
 const host=document.querySelector('#memberSearchResults');
 let request=0;
 form.addEventListener('submit',async event=>{
  event.preventDefault();
  const current=++request,query=document.querySelector('#searchInput').value.trim();
  if(!query||!host)return;
  const parsed=parseQuery(query),words=parsed.words.slice(0,12);
  document.querySelector('#results').hidden=false;
  host.innerHTML='<section class="search-result-section"><div class="result-head"><h3>Meslektaş içerikleri</h3></div><p class="small-note">Yayımlanmış içerikler aranıyor…</p></section>';
  if(!words.length){host.innerHTML='<p class="small-note">Meslektaş içeriklerinde arama yapmak için sınıf düzeyinin yanında bir konu yaz.</p>';return}
  const {data,error}=await client.rpc('search_campus',{p_query:words.join(' '),p_level:parsed.level||null,p_topic:parsed.topic?.name||null,p_per_kind_limit:12});
  if(current!==request)return;
  if(error){host.innerHTML='<section class="search-result-section"><h3>Meslektaş içerikleri</h3><p class="small-note">Bu sonuçlar yüklenemedi. Arama veritabanı kurulumunu kontrol et.</p></section>';return}
  // The database preselects up to 12 per kind. Require every meaningful term in the visible item.
  // This keeps an OR-matched word such as “veli” from flooding a two-word query.
  const rows=(data||[]).filter(x=>{const searchable=normalize([x.title,x.category,x.topic,x.excerpt].filter(Boolean).join(' '));return words.every(word=>searchable.includes(word))});
  host.innerHTML=`<section class="search-result-section"><div class="result-head"><h3>Meslektaş içerikleri <span>${rows.length}</span></h3><span class="search-origin">Üye deneyimi · resmî kaynak değil</span></div><p class="small-note">Yayımlanmış belge, soru ve gönderiler; içerikleri inceleyerek değerlendir.</p>${rows.length?groups.map(g=>{const found=rows.filter(x=>x.resource_type===g.type);if(!found.length)return '';return `<div class="search-source"><div class="result-head"><h4>${g.name} <span>${found.length}</span></h4><a href="${g.url('')}">Bölüme git ↗</a></div><div class="search-mini-list">${found.map(x=>`<a href="${g.url(x.resource_id)}" class="search-hit"><span class="search-hit-copy"><strong>${esc(x.title)}</strong><small>${esc(g.source)}${x.school_level?' · '+esc(x.school_level):''}${x.topic?' · '+esc(x.topic):''}</small><span class="search-snippet">${esc(x.excerpt)}</span></span><span aria-hidden="true">↗</span></a>`).join('')}</div></div>`}).join(''):'<p class="empty">Meslektaş içeriklerinde bu terimlerle eşleşen kayıt bulunamadı.</p>'}</section>`;
 });
 document.querySelector('#clearSearch')?.addEventListener('click',()=>{request++;host.replaceChildren()});
}
