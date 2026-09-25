const button=document.querySelector('#menuButton');
const menu=document.querySelector('#mobileMenu');
button?.addEventListener('click',()=>{menu.hidden=!menu.hidden;button.setAttribute('aria-expanded',String(!menu.hidden))});
menu?.addEventListener('click',e=>{if(e.target.closest('a')){menu.hidden=true;button.setAttribute('aria-expanded','false')}});
