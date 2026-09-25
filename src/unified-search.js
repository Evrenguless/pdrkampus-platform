import {SUPABASE_URL,SUPABASE_PUBLISHABLE_KEY,authConfigured} from './auth-config.js?v=20260925-2';
import {parseQuery} from './search.js';
const form=document.querySelector('#searchForm');
if(form&&authConfigured&&window.supabase){
 const client=window.supabase.createClient(SUPABASE_URL,SUPABASE_PUBLISHABLE_KEY);
 const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&quot;',"'":'&#39;'}[c]));
 const groups=[
  {type:'document',name:'Meslektaş belgeleri',source:'Üye paylaşımı · incelemeden geçti',url:id=>`belgeler.html${id?'#belge-'+encodeURIComponent(id):'#meslektas'}`},
  {type:'question',name:'Meslektaşıma Sor',source:'Meslektaş deneyimi',url:id=>`meslektasima-sor.html${id?'#soru-'+encodeURIComponent(id):''}`},
  {type:'post',name:'Topluluk gönderileri',source:'Meslektaş paylaşımı',url:id=>`topluluk.html${id?'#gonderi-'+encodeURIComponent(id):''}`}
 ];
 let request=0;
 form.addEventListener('submit',async()=>{
  const current=++request,query=document.querySelector('#searchInput').value.trim();if(!query)return;
  const parsed=parseQuery(query),terms=parsed.words.slice(0,12).join(' '),host=document.querySelector('#resultGrid');
  const section=document.createElement('section');section.id='communitySearchResults';
  section.innerHTML='<div class="result-head"><h3>Belgeler ve meslektaş paylaşımları</h3></div><p class="small-note">Yayımlanmış kayıtlar aranıyor…</p>';
  host.querySelector('#communitySearchResults')?.remove();host.append(section);
  if(!terms){section.innerHTML='<p class="small-note">Meslektaş içeriklerinde arama yapmak için konu da yaz.</p>';return}
  const {data,error}=await client.rpc('search_campus',{p_query:terms,p_level:parsed.level||null,p_topic:parsed.topic?.name||null,p_per_kind_limit:8});
  if(current!==request||!section.isConnected)return;
  if(error){section.innerHTML='<div class="result-head"><h3>Belgeler ve meslektaş paylaşımları</h3></div><p class="small-note">Bu sonuçlar yüklenemedi. Veritabanında 014 arama SQL dosyasının çalıştırıldığını kontrol et.</p>';return}
  section.innerHTML=`<div class="result-head"><h3>Belgeler ve meslektaş paylaşımları</h3><span>Yayımlanmış içerikler</span></div><p class="small-note">Resmî MEB araçları ve kaynakları yukarıda; aşağıdakiler üyelerin içerikleridir.</p>${groups.map(g=>{const rows=data.filter(x=>x.resource_type===g.type),total=rows[0]?.match_count||0;return `<div class="search-source"><div class="result-head"><h4>${g.name} <span>${total}</span></h4><a href="${g.url('')}">Bölüme git ↗</a></div>${rows.length?`<div class="search-mini-list">${rows.map(x=>`<a href="${g.url(x.resource_id)}" class="search-hit"><span class="search-hit-copy"><strong>${esc(x.title)}</strong><small>${esc(g.source)}${x.school_level?' · '+esc(x.school_level):''}${x.topic?' · '+esc(x.topic):''}</small><span class="search-snippet">${esc(x.excerpt)}</span></span><span aria-hidden="true">↗</span></a>`).join('')}</div>`:'<p class="small-note">Bu bölümde eşleşme yok.</p>'}${Number(total)>rows.length?`<p class="small-note">İlk ${rows.length} sonuç gösteriliyor; ${Number(total)-rows.length} kayıt daha var.</p>`:''}</div>`}).join('')}`;
 });
 document.querySelector('#clearSearch')?.addEventListener('click',()=>{request++});
}
