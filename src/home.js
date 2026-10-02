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


const featuredStandTrack=document.querySelector('#featuredStandTrack');
const featuredStandViewport=document.querySelector('#featuredStandViewport');
const featuredStandDots=document.querySelector('#featuredStandDots');
const featuredStandPrev=document.querySelector('.featured-stand-prev');
const featuredStandNext=document.querySelector('.featured-stand-next');

if(featuredStandTrack&&featuredStandViewport){
 const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const data=await fetch('data/library.json?v=20261002-2').then(r=>r.ok?r.json():[]).catch(()=>[]);
 const preferred=[
   'cizre-selamlasma-okuloncesi-ilkokul-etkinlik-2026',
   'cizre-selamlasma-ortaokul-lise-etkinlik-2026',
   'cizre-selamlasma-okuloncesi-ilkokul-veli-brosur-2026',
   'izmit-selamlasma-akran-zorbaligi-ogretmen-brosuru-2026',
   'avcilar-selamlasma-el-kitapcigi-2026',
   'meb-meslek-gorgu-protokol-selamlasma-2025'
 ];
 const byId=new Map((Array.isArray(data)?data:[]).map(item=>[item.id,item]));
 const items=preferred.map(id=>byId.get(id)).filter(Boolean).filter(item=>item.fileType==='PDF');
 const fallback=(Array.isArray(data)?data:[]).filter(item=>/selam/i.test([item.title,item.topic].join(' '))&&item.fileType==='PDF');
 const resources=[...items,...fallback.filter(x=>!items.some(y=>y.id===x.id))].slice(0,8);

 const featuredCoverMeta=(item)=>{
   const hay=[item.title,item.type,item.area,item.topic].join(' ').toLocaleLowerCase('tr-TR');
   if(hay.includes('veli')) return {theme:'violet',label:'VELİ ÇALIŞMALARI',icon:'♡'};
   if(hay.includes('yıllık plan')||hay.includes('rehberlik program')) return {theme:'blue',label:'REHBERLİK PROGRAMI',icon:'▦'};
   if(hay.includes('çalışma yapra')||hay.includes('form')) return {theme:'sky',label:'ÇALIŞMA YAPRAKLARI',icon:'✓'};
   if(hay.includes('sosyal beceri')||hay.includes('duygu')||hay.includes('iletişim')) return {theme:'coral',label:'DUYGU VE DAVRANIŞ',icon:'☻'};
   if(hay.includes('etkinlik')||hay.includes('sınıf')) return {theme:'green',label:'SINIF İÇİ UYGULAMA',icon:'✎'};
   if(hay.includes('broşür')) return {theme:'amber',label:'BİLGİLENDİRME BROŞÜRÜ',icon:'✦'};
   return {theme:'amber',label:'SELAMLAŞMA',icon:'☼'};
 };
 const coverTitle=(title)=>String(title||'Kaynak').replace(/\s*·\s*2026-2027\s*$/,'').trim();

 const openFeatured=(item)=>{
   const dialog=document.querySelector('#viewerDialog');
   if(!dialog)return window.open(item.file,'_blank','noopener');
   document.querySelector('#viewerCode').textContent=[item.type,item.source].filter(Boolean).join(' · ');
   document.querySelector('#viewerTitle').textContent=item.title;
   document.querySelector('#viewerOpen').href=item.file;
   document.querySelector('#viewerBody').innerHTML='<iframe title="'+esc(item.title)+'" src="'+esc(item.file)+'#toolbar=1" loading="lazy"></iframe>';
   dialog.showModal();
 };

 if(resources.length){
   featuredStandTrack.innerHTML=resources.map((item,index)=>`
    <article class="featured-stand-card" data-featured-index="${index}">
      <div class="featured-stand-preview featured-cover featured-cover--${featuredCoverMeta(item).theme}" aria-hidden="true">
        <div class="featured-cover-top">
          <span class="featured-cover-brand"><img src="assets/logo.png" alt="">PDR KAMPÜS</span>
          <span class="featured-cover-category">${esc(featuredCoverMeta(item).label)}</span>
        </div>
        <strong class="featured-cover-title">${esc(coverTitle(item.title))}</strong>
        <div class="featured-cover-art" aria-hidden="true">
          <span class="featured-cover-art-icon">${featuredCoverMeta(item).icon}</span>
          <i></i><i></i><i></i>
        </div>
        <span class="featured-stand-filetype">${esc(item.fileType||'PDF')}</span>
      </div>
      <div class="featured-stand-card-body">
        <div class="featured-stand-meta"><span class="featured-stand-level">${esc(item.level||'Tüm kademeler')}</span></div>
        <h3>${esc(item.title)}</h3>
        <p class="featured-stand-source">${esc(item.source||'Resmî kaynak')}</p>
        <button type="button" class="featured-stand-open" data-featured-open="${esc(item.id)}">Kaynağı incele</button>
      </div>
    </article>`).join('');

   featuredStandDots.innerHTML=resources.map((_,i)=>'<i class="'+(i===0?'is-active':'')+'"></i>').join('');
   const cards=()=>[...featuredStandTrack.querySelectorAll('.featured-stand-card')];
   const step=()=>{
     const first=cards()[0];
     return first?first.getBoundingClientRect().width+12:280;
   };
   const updateDots=()=>{
     const s=step();
     const idx=Math.max(0,Math.min(resources.length-1,Math.round(featuredStandViewport.scrollLeft/s)));
     [...featuredStandDots.children].forEach((dot,i)=>dot.classList.toggle('is-active',i===idx));
   };
   const go=dir=>{
     const s=step();
     const max=featuredStandViewport.scrollWidth-featuredStandViewport.clientWidth;
     if(dir>0&&featuredStandViewport.scrollLeft+s>=max-4) featuredStandViewport.scrollTo({left:0,behavior:'smooth'});
     else if(dir<0&&featuredStandViewport.scrollLeft<=4) featuredStandViewport.scrollTo({left:max,behavior:'smooth'});
     else featuredStandViewport.scrollBy({left:dir*s,behavior:'smooth'});
   };

   featuredStandNext?.addEventListener('click',()=>go(1));
   featuredStandPrev?.addEventListener('click',()=>go(-1));
   featuredStandViewport.addEventListener('scroll',()=>requestAnimationFrame(updateDots),{passive:true});
   featuredStandTrack.addEventListener('click',e=>{
     const id=e.target.closest('[data-featured-open]')?.dataset.featuredOpen;
     if(!id)return;
     const item=resources.find(x=>x.id===id);
     if(item)openFeatured(item);
   });

   let timer=null;
   const start=()=>{
     if(matchMedia('(prefers-reduced-motion: reduce)').matches)return;
     clearInterval(timer);
     timer=setInterval(()=>go(1),4300);
   };
   const stop=()=>{clearInterval(timer);timer=null};
   start();
   featuredStandViewport.addEventListener('mouseenter',stop);
   featuredStandViewport.addEventListener('mouseleave',start);
   featuredStandViewport.addEventListener('focusin',stop);
   featuredStandViewport.addEventListener('focusout',start);
   featuredStandViewport.addEventListener('pointerdown',stop);
   featuredStandViewport.addEventListener('pointerup',start);
   document.addEventListener('visibilitychange',()=>document.hidden?stop():start());
 }else{
   featuredStandTrack.innerHTML='<p class="featured-stand-loading">Öne çıkan kaynaklar hazırlanıyor.</p>';
   featuredStandPrev.hidden=true;
   featuredStandNext.hidden=true;
 }
}
