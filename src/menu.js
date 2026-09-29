const button=document.querySelector('#menuButton');
const menu=document.querySelector('#mobileMenu');
function closeMenu(){if(!menu||!button)return;menu.hidden=true;button.setAttribute('aria-expanded','false');button.setAttribute('aria-label','Menüyü aç');button.textContent='☰'}
button?.addEventListener('click',()=>{if(!menu)return;const opening=menu.hidden;menu.hidden=!opening;button.setAttribute('aria-expanded',String(opening));button.setAttribute('aria-label',opening?'Menüyü kapat':'Menüyü aç');button.textContent=opening?'×':'☰'});
menu?.addEventListener('click',event=>{if(event.target.closest('a'))closeMenu()});
document.addEventListener('keydown',event=>{if(event.key==='Escape'&&!menu?.hidden){closeMenu();button?.focus()}});
document.addEventListener('click',event=>{if(!menu?.hidden&&!menu.contains(event.target)&&!button?.contains(event.target))closeMenu()});
window.matchMedia('(min-width:1101px)').addEventListener('change',event=>{if(event.matches)closeMenu()});

const footerBottom=document.querySelector('.campus-footer-bottom');
if(footerBottom&&!document.querySelector('.footer-policy-links, .campus-footer-links a[href="gizlilik.html"]')){
 const links=document.createElement('nav');
 links.className='footer-policy-links';
 links.setAttribute('aria-label','İletişim ve kurallar');
 links.innerHTML='<a href="/iletisim.html">İletişim</a><a href="/gizlilik.html">Gizlilik</a><a href="/paylasim-kurallari.html">Paylaşım kuralları</a>';
 footerBottom.querySelector('span:nth-child(2)')?.replaceWith(links);
}
