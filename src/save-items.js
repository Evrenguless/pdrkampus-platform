import {SUPABASE_URL,SUPABASE_PUBLISHABLE_KEY,authConfigured} from './auth-config.js?v=20260925-2';
if(authConfigured&&window.supabase){
 const client=window.supabase.createClient(SUPABASE_URL,SUPABASE_PUBLISHABLE_KEY);
 const {data:{session}}=await client.auth.getSession();const user=session?.user;
 const saved=new Set();if(user){const {data}=await client.from('workspace_saved_items').select('kind,ref_id').eq('owner_id',user.id).limit(500);for(const x of data||[])saved.add(`${x.kind}:${x.ref_id}`)}
 const key=(kind,id)=>`${kind}:${id}`;
 function enhance(){for(const card of document.querySelectorAll('.form-card,.card,.document-card')){
   if(card.querySelector('.save-resource'))continue;
   const official=card.querySelector('button[data-kind][data-id]'),community=card.querySelector('button[data-community-file]');if(!official&&!community)continue;
   const kind=community?'community_file':official.dataset.kind,ref=community?community.dataset.communityFile:official.dataset.id;
   if(!['tool','library','community_file'].includes(kind)||!ref)continue;
   const button=document.createElement('button');button.type='button';button.className='save-resource';button.dataset.saveKind=kind;button.dataset.saveRef=ref;button.setAttribute('aria-label','Kaynağı kaydet');button.textContent=saved.has(key(kind,ref))?'✓ Kaydedildi':'+ Kaydet';card.append(button)
  }}
 enhance();let scheduled=false;new MutationObserver(()=>{if(scheduled)return;scheduled=true;queueMicrotask(()=>{scheduled=false;enhance()})}).observe(document.body,{childList:true,subtree:true});
 document.addEventListener('click',async e=>{const button=e.target.closest('.save-resource');if(!button)return;e.preventDefault();e.stopPropagation();if(!user){location.href='hesap.html';return}const kind=button.dataset.saveKind,ref_id=button.dataset.saveRef,exists=saved.has(key(kind,ref_id));button.disabled=true;try{const {data:{user:verified}}=await client.auth.getUser();if(verified?.id!==user.id)throw Error('Yeniden giriş yap.');const {error}=exists?await client.from('workspace_saved_items').delete().eq('owner_id',user.id).eq('kind',kind).eq('ref_id',ref_id):await client.from('workspace_saved_items').insert({owner_id:user.id,kind,ref_id});if(error)throw error;exists?saved.delete(key(kind,ref_id)):saved.add(key(kind,ref_id));document.querySelectorAll('.save-resource').forEach(x=>{if(x.dataset.saveKind===kind&&x.dataset.saveRef===ref_id)x.textContent=exists?'+ Kaydet':'✓ Kaydedildi'})}catch(error){button.textContent='Kaydedilemedi';button.title=error.message}finally{button.disabled=false}});
}
