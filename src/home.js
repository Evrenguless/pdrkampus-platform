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


const featuredStandTrack=document.querySelector('#featuredStandTrack');
const featuredStandViewport=document.querySelector('#featuredStandViewport');
const featuredStandPrev=document.querySelector('.featured-stand-prev');
const featuredStandNext=document.querySelector('.featured-stand-next');

if(featuredStandTrack&&featuredStandViewport){
 const cards=[...featuredStandTrack.querySelectorAll('.featured-stand-card')];
 const originals=cards.map(card=>({
   id:card.dataset.id,
   file:card.dataset.file,
   title:card.dataset.title,
   type:card.dataset.type,
   source:card.dataset.source
 }));

 const openFeatured=(item)=>{
   if(!item?.file)return;
   const dialog=document.querySelector('#viewerDialog');
   if(!dialog)return window.open(item.file,'_blank','noopener');
   const code=document.querySelector('#viewerCode');
   const title=document.querySelector('#viewerTitle');
   const open=document.querySelector('#viewerOpen');
   const body=document.querySelector('#viewerBody');
   if(code)code.textContent=[item.type,item.source].filter(Boolean).join(' · ');
   if(title)title.textContent=item.title||'Kaynak';
   if(open)open.href=item.file;
   if(body)body.innerHTML='<iframe title="'+String(item.title||'Kaynak').replace(/"/g,'&quot;')+'" src="'+item.file+'#toolbar=1" loading="lazy"></iframe>';
   dialog.showModal();
 };

 featuredStandTrack.addEventListener('click',event=>{
   const button=event.target.closest('.featured-stand-open');
   if(!button)return;
   event.preventDefault();
   event.stopPropagation();
   const card=button.closest('.featured-stand-card');
   if(!card)return;
   openFeatured({
     id:card.dataset.id,
     file:card.dataset.file,
     title:card.dataset.title,
     type:card.dataset.type,
     source:card.dataset.source
   });
 });

 const originalMarkup=featuredStandTrack.innerHTML;
 featuredStandTrack.insertAdjacentHTML('beforeend',originalMarkup);
 featuredStandTrack.querySelectorAll('.featured-stand-card').forEach((card,index)=>{
   if(index>=originals.length)card.setAttribute('aria-hidden','true');
 });

 let paused=false;
 let dragging=false;
 let dragStartX=0;
 let dragStartScroll=0;
 let raf=0;
 let last=performance.now();
 const speed=.042;
 let carry=0;

 const loop=(now)=>{
   const dt=Math.min(40,now-last);
   last=now;
   if(!paused&&!dragging&&!document.hidden&&!matchMedia('(prefers-reduced-motion: reduce)').matches){
     carry+=speed*dt;
     const whole=Math.floor(carry);
     if(whole>0){
       featuredStandViewport.scrollLeft+=whole;
       carry-=whole;
     }
     const half=featuredStandTrack.scrollWidth/2;
     if(featuredStandViewport.scrollLeft>=half)featuredStandViewport.scrollLeft-=half;
   }
   raf=requestAnimationFrame(loop);
 };
 raf=requestAnimationFrame(loop);

 const pause=()=>{paused=true};
 const resume=()=>{paused=false;last=performance.now()};
 featuredStandViewport.addEventListener('mouseenter',pause);
 featuredStandViewport.addEventListener('mouseleave',resume);
 featuredStandViewport.addEventListener('focusin',pause);
 featuredStandViewport.addEventListener('focusout',resume);

 featuredStandViewport.addEventListener('pointerdown',event=>{
   if(event.pointerType==='touch'||event.target.closest('button,a'))return;
   dragging=true;paused=true;dragStartX=event.clientX;dragStartScroll=featuredStandViewport.scrollLeft;
   featuredStandViewport.classList.add('is-dragging');
   featuredStandViewport.setPointerCapture?.(event.pointerId);
 });
 featuredStandViewport.addEventListener('pointermove',event=>{
   if(!dragging)return;
   featuredStandViewport.scrollLeft=dragStartScroll-(event.clientX-dragStartX);
 });
 const endDrag=(event)=>{
   if(!dragging)return;
   dragging=false;featuredStandViewport.classList.remove('is-dragging');
   featuredStandViewport.releasePointerCapture?.(event.pointerId);
   resume();
 };
 featuredStandViewport.addEventListener('pointerup',endDrag);
 featuredStandViewport.addEventListener('pointercancel',endDrag);

 let nudgeTimer=null;
 const nudge=dir=>{
   paused=true;
   clearTimeout(nudgeTimer);
   const step=Math.max(240,featuredStandViewport.clientWidth*.72);
   featuredStandViewport.scrollBy({left:dir*step,behavior:'smooth'});
   nudgeTimer=setTimeout(()=>{paused=false;last=performance.now()},850);
 };
 featuredStandPrev?.addEventListener('click',()=>nudge(-1));
 featuredStandNext?.addEventListener('click',()=>nudge(1));

 document.addEventListener('visibilitychange',()=>{last=performance.now()});
}
