const scopeLibrary=document.querySelector('#scopeLibrary');
const scopeForms=document.querySelector('#scopeForms');
const scopeTopics=document.querySelector('#scopeTopics');
if(scopeLibrary||scopeForms||scopeTopics){
 const readJson=path=>fetch(path).then(r=>r.ok?r.json():Promise.reject()).catch(()=>null);
 const [libraryData,formsData,topicsData]=await Promise.all([
  readJson('data/library.json?v=20260928-1'),
  readJson('data/forms.json?v=20260928-1'),
  readJson('data/topics.json?v=20260928-1')
 ]);
 if(scopeLibrary)scopeLibrary.textContent=Array.isArray(libraryData)?libraryData.length:'—';
 if(scopeForms)scopeForms.textContent=Array.isArray(formsData)?formsData.length:'—';
 if(scopeTopics)scopeTopics.textContent=Array.isArray(topicsData?.topics)?topicsData.topics.filter(x=>x.indexable&&x.contentStatus==='published').length:'—';
}

import {SUPABASE_URL,SUPABASE_PUBLISHABLE_KEY,authConfigured} from './auth-config.js?v=20260925-2';
const host=document.querySelector('#homeQuestions');
if(host){
 const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 if(!authConfigured||!window.supabase){host.innerHTML='<p class="small-note">Sorular şu anda görüntülenemiyor.</p>'}
 else{
  const client=window.supabase.createClient(SUPABASE_URL,SUPABASE_PUBLISHABLE_KEY);
  const {data,error}=await client.from('colleague_questions').select('id,title,category,school_level,created_at').eq('moderation_status','published').order('created_at',{ascending:false}).limit(3);
  if(error){host.innerHTML='<p class="small-note">Sorular şu anda yüklenemedi. Meslektaşıma Sor bölümünü açabilirsin.</p>'}
  else if(!data?.length){host.innerHTML='<p class="small-note">Henüz yayımlanmış soru yok. İlk sorunu Meslektaşıma Sor bölümünde paylaşabilirsin.</p>'}
  else host.innerHTML=data.map(x=>`<a class="campus-entry" href="meslektasima-sor.html#soru-${encodeURIComponent(x.id)}"><span class="campus-entry-meta">${esc(x.category)}${x.school_level?' · '+esc(x.school_level):''}</span><strong>${esc(x.title)}</strong></a>`).join('');
 }
}
