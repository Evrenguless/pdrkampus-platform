// Homepage collections reuse the existing catalogue routes and document previews.
const host=document.querySelector('#pathwayDetails');
const buttons=[...document.querySelectorAll('[data-home-pathway]')];
let active=null;
function close(){
 host.hidden=true;
 active?.setAttribute('aria-expanded','false');
 active?.focus();
 active=null;
}
for(const button of buttons){
 button.addEventListener('click',()=>{
  const template=document.querySelector(`#home-pathway-${button.dataset.homePathway}`);
  if(!host||!template)return;
  if(active===button&&!host.hidden){close();return}
  for(const item of buttons)item.setAttribute('aria-expanded',String(item===button));
  active=button;
  host.replaceChildren(template.content.cloneNode(true));
  host.hidden=false;
  host.querySelector('.pathway-close').addEventListener('click',close);
  host.scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth',block:'start'});
 });
}
