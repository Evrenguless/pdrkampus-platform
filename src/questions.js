import {SUPABASE_URL,SUPABASE_PUBLISHABLE_KEY,authConfigured} from './auth-config.js?v=20260925-2';
const $=s=>document.querySelector(s),esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const client=authConfigured&&window.supabase?.createClient(SUPABASE_URL,SUPABASE_PUBLISHABLE_KEY);
let user=null,questions=[],answers=[],votes=[],counts=new Map(),names=new Map();
const date=s=>new Date(s).toLocaleDateString('tr-TR',{day:'numeric',month:'short',year:'numeric'});
const author=id=>`<a href="profil.html?id=${encodeURIComponent(id)}">${esc(names.get(id)||'PDR Kampüs üyesi')}</a>`;
const notice=(s)=>{$('#questionStatus').textContent=s};
async function load(){
  const [q,a,v]=await Promise.all([
    client.from('colleague_questions').select('id,author_id,title,body,category,created_at').eq('moderation_status','published').order('created_at',{ascending:false}).limit(100),
    client.from('colleague_answers').select('id,question_id,author_id,body,created_at').eq('moderation_status','published').order('created_at',{ascending:true}).limit(1000),
    user?client.from('colleague_helpful_votes').select('answer_id,voter_id').eq('voter_id',user.id).limit(5000):Promise.resolve({data:[],error:null})
  ]);
  if(q.error||a.error||v.error)throw q.error||a.error||v.error;
  questions=q.data;answers=a.data;votes=v.data;
  const {data:countData,error:countError}=await client.rpc('get_helpful_counts',{answer_ids:answers.map(x=>x.id)});if(countError)throw countError;counts=new Map(countData.map(x=>[x.answer_id,Number(x.vote_count)]));
  const ids=[...new Set([...questions,...answers].map(x=>x.author_id))];
  names=new Map();if(ids.length){const {data,error}=await client.rpc('get_member_profiles',{member_ids:ids});if(error)throw error;names=new Map(data.map(x=>[x.id,x.display_name]))}
  render();
}
function render(){
  const search=$('#questionSearch').value.trim().toLocaleLowerCase('tr-TR'),category=$('#questionCategory').value;
  const filtered=questions.filter(q=>(!category||q.category===category)&&(!search||`${q.title} ${q.body} ${q.category}`.toLocaleLowerCase('tr-TR').includes(search)));
  $('#questionCount').textContent=`${filtered.length} soru`;
  $('#questions').innerHTML=filtered.length?filtered.map(q=>{
    const list=answers.filter(a=>a.question_id===q.id);
    return `<article class="question-card" id="soru-${esc(q.id)}"><div class="document-card-meta"><span>${esc(q.category)}</span><span>${date(q.created_at)}</span></div><h2>${esc(q.title)}</h2><p class="question-copy">${esc(q.body)}</p><p class="question-author">Soran: ${author(q.author_id)} · ${list.length} cevap</p><div class="question-answers">${list.map(a=>{const count=counts.get(a.id)||0,selected=votes.some(v=>v.answer_id===a.id&&v.voter_id===user?.id);return `<div class="answer-card"><p>${esc(a.body)}</p><div class="answer-footer"><span>${author(a.author_id)} · ${date(a.created_at)}</span><button type="button" data-vote="${esc(a.id)}" aria-pressed="${selected}" ${!user||a.author_id===user.id?'disabled':''}>${selected?'✓ ':''}Faydalı buldum · ${count}</button></div></div>`}).join('')}</div>${user?`<form class="answer-form" data-answer="${esc(q.id)}"><label>Cevap yaz<textarea name="body" minlength="10" maxlength="4000" required placeholder="Deneyimini ve gerekçeni paylaş. Öğrenci adı veya tanınabilir bilgi yazma."></textarea></label><button type="submit">Cevapla ↗</button></form>`:'<a href="hesap.html">Cevaplamak için giriş yap ↗</a>'}</article>`
  }).join(''):'<p>Bu aramaya uygun soru bulunamadı.</p>';
}
async function init(){if(!client){notice('Topluluk bağlantısı kurulmadı.');return}const {data:{session}}=await client.auth.getSession();user=session?.user||null;$('#questionFormArea').hidden=!user;$('#loginPrompt').hidden=!!user;try{await load()}catch(e){notice('Sorular yüklenemedi. Veritabanında 010 SQL dosyasının çalıştırıldığını kontrol et: '+e.message)}}
$('#questionSearch').addEventListener('input',render);$('#questionCategory').addEventListener('change',render);
$('#questionForm').addEventListener('submit',async e=>{e.preventDefault();if(!user)return;const form=e.currentTarget,button=form.querySelector('button[type="submit"]'),title=form.elements.title.value.trim(),body=form.elements.body.value.trim(),category=form.elements.category.value;if(title.length<10||body.length<20)return;button.disabled=true;try{const {data:{user:verified}}=await client.auth.getUser();if(verified?.id!==user.id)throw Error('Yeniden giriş yap.');const {error}=await client.from('colleague_questions').insert({author_id:user.id,title,body,category});if(error)throw error;form.reset();notice('Sorun yayımlandı.');await load()}catch(e){notice(e.message)}finally{button.disabled=false}});
$('#questions').addEventListener('submit',async e=>{const form=e.target.closest('[data-answer]');if(!form)return;e.preventDefault();if(!user)return;const button=form.querySelector('button'),body=form.elements.body.value.trim();if(body.length<10)return;button.disabled=true;try{const {data:{user:verified}}=await client.auth.getUser();if(verified?.id!==user.id)throw Error('Yeniden giriş yap.');const {error}=await client.from('colleague_answers').insert({question_id:form.dataset.answer,author_id:user.id,body});if(error)throw error;notice('Cevabın yayımlandı.');await load()}catch(e){notice(e.message);button.disabled=false}});
$('#questions').addEventListener('click',async e=>{const button=e.target.closest('[data-vote]');if(!button||!user)return;button.disabled=true;try{const answer_id=button.dataset.vote,selected=votes.some(v=>v.answer_id===answer_id&&v.voter_id===user.id);const {error}=selected?await client.from('colleague_helpful_votes').delete().eq('answer_id',answer_id).eq('voter_id',user.id):await client.from('colleague_helpful_votes').insert({answer_id,voter_id:user.id});if(error)throw error;await load()}catch(e){notice(e.message);button.disabled=false}});
await init();
