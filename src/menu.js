function normalizeIndexUrl(){
  if(location.pathname==='/index.html'){
    history.replaceState(null,'',location.search||location.hash?'/'+location.search+location.hash:'/');
  }
  document.querySelectorAll('a[href="index.html"],a[href="/index.html"]').forEach(a=>a.setAttribute('href','/'));
}
normalizeIndexUrl();

const faviconLinks=[
  ['icon','/assets/logo.png'],
  ['shortcut icon','/assets/logo.png'],
  ['apple-touch-icon','/assets/logo.png']
];
faviconLinks.forEach(([rel,href])=>{if(document.querySelector('link[rel="'+rel+'"]'))return;const link=document.createElement('link');link.id='pdr-favicon-'+rel.replace(/\s+/g,'-');link.rel=rel;link.href=href;if(rel==='icon')link.type='image/png';document.head.appendChild(link)});

if(!document.querySelector('link[rel="icon"]')){const icon=document.createElement('link');icon.rel='icon';icon.type='image/png';icon.href='/assets/logo.png';document.head.appendChild(icon)}
if(!document.querySelector('link[rel="apple-touch-icon"]')){const apple=document.createElement('link');apple.rel='apple-touch-icon';apple.href='/assets/logo.png';document.head.appendChild(apple)}
// All platform pages use these shared navigation templates.
const platformHeader="<header class=\"header\"><a class=\"brand\" href=\"/\" aria-label=\"PDR Kampüs ana sayfa\"><img src=\"/assets/logo.png\" alt=\"PDR Kampüs logosu\"><strong>PDR<span>Kampüs</span></strong></a><nav class=\"desktop\" aria-label=\"Ana menü\"><a href=\"/kutuphane.html\">Kütüphane</a><a href=\"/konular.html\">Konular</a><a href=\"/topluluk.html\">Topluluk</a><a href=\"/meslektasima-sor.html\">Meslektaşıma Sor</a><a href=\"/calisma-alani.html\">Çalışma Alanım</a><a href=\"https://analiz.pdrkampus.com/\">AGS/PDR Puan Hesaplama</a><a href=\"https://norm.pdrkampus.com/\">PDR Norm Analizi</a><a href=\"/profil.html\">Profil</a></nav><button id=\"menuButton\" class=\"menu-button\" type=\"button\" aria-label=\"Menüyü aç\" aria-controls=\"mobileMenu\" aria-expanded=\"false\">☰</button></header><nav id=\"mobileMenu\" class=\"mobile-menu\" aria-label=\"Mobil menü\" hidden><div class=\"mobile-menu-group\"><span class=\"mobile-menu-label\">KAYNAKLAR</span><div><a href=\"/kutuphane.html\">Kütüphane</a><a href=\"/konular.html\">Konular</a></div></div><div class=\"mobile-menu-group\"><span class=\"mobile-menu-label\">MESLEKTAŞLAR</span><div><a href=\"/topluluk.html\">Topluluk</a><a href=\"/meslektasima-sor.html\">Meslektaşıma Sor</a></div></div><div class=\"mobile-menu-group\"><span class=\"mobile-menu-label\">ARAÇLAR</span><div><a href=\"https://analiz.pdrkampus.com/\">AGS/PDR Puan Hesaplama</a><a href=\"https://norm.pdrkampus.com/\">PDR Norm Analizi</a></div></div><div class=\"mobile-menu-group\"><span class=\"mobile-menu-label\">KİŞİSEL ALAN</span><div><a href=\"/calisma-alani.html\">Çalışma Alanım</a><a href=\"/profil.html\">Profil</a></div></div></nav>";
const platformFooter="<footer class=\"campus-footer\"><div class=\"wrap campus-footer-main\"><div class=\"campus-footer-about\"><a class=\"brand campus-footer-brand\" href=\"/\" aria-label=\"PDR Kampüs ana sayfa\"><img src=\"/assets/logo.png\" alt=\"\"><strong>PDR<span>Kampüs</span></strong></a><p>Psikolojik danışmanlar için kaynak, araç ve meslektaş dayanışması tek kampüste.</p></div><nav class=\"campus-footer-links\" aria-label=\"Kampüsü keşfet\"><h2>KEŞFET</h2><a href=\"/kutuphane.html\">Kütüphane</a><a href=\"/konular.html\">Konular</a><a href=\"/topluluk.html\">Topluluk</a><a href=\"/meslektasima-sor.html\">Meslektaşıma Sor</a></nav><nav class=\"campus-footer-links\" aria-label=\"Araçlar ve kişisel alan\"><h2>ARAÇLAR VE KİŞİSEL ALAN</h2><a href=\"/calisma-alani.html\">Çalışma Alanım</a><a href=\"https://analiz.pdrkampus.com/\">AGS/PDR Puan Hesaplama</a><a href=\"https://norm.pdrkampus.com/\">PDR Norm Analizi</a><a href=\"/profil.html\">Profil</a></nav></div><div class=\"wrap campus-footer-bottom\"><span>© 2026 PDR Kampüs</span><nav class=\"footer-policy-links\" aria-label=\"İletişim ve yasal bilgiler\"><a href=\"/hakkimizda.html\">Hakkımızda</a><a href=\"/iletisim.html\">İletişim</a><a href=\"/gizlilik.html\">Gizlilik</a><a href=\"/kvkk-aydinlatma.html\">KVKK</a><a href=\"/cerez-politikasi.html\">Çerezler</a><a href=\"/kullanim-kosullari.html\">Kullanım koşulları</a><a href=\"/paylasim-kurallari.html\">Paylaşım kuralları</a><button type=\"button\" class=\"footer-consent-button\" data-open-consent>Çerez tercihleri</button></nav><a href=\"#top\" aria-label=\"Sayfanın başına dön\">Yukarı çık ↑</a></div></footer>";
const currentPage=location.pathname;
const oldHeader=document.querySelector('header.header');
const oldMobile=document.querySelector('#mobileMenu');
oldMobile?.remove();
if(oldHeader)oldHeader.outerHTML=platformHeader;
const oldFooter=document.querySelector('footer');
if(oldFooter)oldFooter.outerHTML=platformFooter;
function markCurrentLinks(){
 document.querySelectorAll('header a,.mobile-menu a,footer a').forEach(link=>{
  const url=new URL(link.href,location.origin);
  if(url.origin!==location.origin)return;
  if(url.pathname===currentPage&&!url.hash)link.setAttribute('aria-current','page');
  else if((url.pathname==='/konular.html'&&currentPage.endsWith('/index.html'))||(url.pathname==='/profil.html'&&currentPage==='/hesap.html'))link.dataset.sectionCurrent='true';
 });
}
markCurrentLinks();

const button=document.querySelector('#menuButton');
const menu=document.querySelector('#mobileMenu');
function closeMenu(){if(!menu||!button)return;menu.hidden=true;button.setAttribute('aria-expanded','false');button.setAttribute('aria-label','Menüyü aç');button.textContent='☰'}
button?.addEventListener('click',()=>{if(!menu)return;const opening=menu.hidden;menu.hidden=!opening;button.setAttribute('aria-expanded',String(opening));button.setAttribute('aria-label',opening?'Menüyü kapat':'Menüyü aç');button.textContent=opening?'×':'☰'});
menu?.addEventListener('click',event=>{if(event.target.closest('a'))closeMenu()});
document.addEventListener('keydown',event=>{if(event.key==='Escape'&&!menu?.hidden){closeMenu();button?.focus()}});
document.addEventListener('click',event=>{if(!menu?.hidden&&!menu.contains(event.target)&&!button?.contains(event.target))closeMenu()});
window.matchMedia('(min-width:1101px)').addEventListener('change',event=>{if(event.matches)closeMenu()});

const CONSENT_KEY='pdrkampus_consent_v1';
const consentStyle=document.createElement('style');
consentStyle.textContent=`.consent-banner{position:fixed;z-index:9999;left:18px;right:18px;bottom:18px;max-width:760px;margin:auto;background:#fff;border:1px solid rgba(18,60,49,.16);border-radius:18px;padding:18px;box-shadow:0 22px 70px rgba(0,0,0,.18);font:inherit}.consent-banner[hidden],.consent-modal[hidden]{display:none!important}.consent-banner h2,.consent-modal h2{margin:0 0 8px;font-size:1.15rem}.consent-banner p,.consent-modal p{margin:0 0 14px;line-height:1.55;font-size:.92rem}.consent-actions{display:flex;flex-wrap:wrap;gap:9px}.consent-actions button,.footer-consent-button{font:inherit;cursor:pointer}.consent-actions button{border:1px solid #123c31;border-radius:999px;padding:9px 14px;background:#fff;color:#123c31;font-weight:700}.consent-actions .primary{background:#123c31;color:#fff}.consent-modal{position:fixed;z-index:10000;inset:0;background:rgba(8,22,18,.48);display:grid;place-items:center;padding:20px}.consent-panel{width:min(620px,100%);max-height:85vh;overflow:auto;background:#fff;border-radius:20px;padding:24px;box-shadow:0 25px 90px rgba(0,0,0,.25)}.consent-row{display:flex;justify-content:space-between;gap:20px;align-items:flex-start;padding:15px 0;border-top:1px solid rgba(18,60,49,.12)}.consent-row strong{display:block;margin-bottom:5px}.consent-row small{display:block;line-height:1.45;max-width:420px}.consent-toggle{min-width:46px;height:26px}.footer-consent-button{border:0;background:none;padding:0;color:inherit;text-decoration:underline;text-underline-offset:3px}@media(max-width:600px){.consent-banner{left:10px;right:10px;bottom:10px}.consent-actions button{flex:1 1 auto}}`;
document.head.appendChild(consentStyle);

function readConsent(){try{return JSON.parse(localStorage.getItem(CONSENT_KEY)||'null')}catch{return null}}
function saveConsent(analytics){const value={necessary:true,analytics:Boolean(analytics),updatedAt:new Date().toISOString()};localStorage.setItem(CONSENT_KEY,JSON.stringify(value));window.PDRConsent=value;window.dispatchEvent(new CustomEvent('pdrconsentchange',{detail:value}));return value}
window.PDRConsent=readConsent()||{necessary:true,analytics:false,updatedAt:null};

const GA_MEASUREMENT_ID='G-1WQ10WJHVW';
window.dataLayer=window.dataLayer||[];
window.gtag=window.gtag||function(){window.dataLayer.push(arguments)};
window.gtag('consent','default',{
  analytics_storage:window.PDRConsent.analytics?'granted':'denied',
  ad_storage:'denied',
  ad_user_data:'denied',
  ad_personalization:'denied'
});
window.gtag('js',new Date());
window.gtag('config',GA_MEASUREMENT_ID);
if(!document.querySelector('script[data-pdr-google-analytics]')){
  const gaScript=document.createElement('script');
  gaScript.async=true;
  gaScript.src='https://www.googletagmanager.com/gtag/js?id='+encodeURIComponent(GA_MEASUREMENT_ID);
  gaScript.dataset.pdrGoogleAnalytics='true';
  document.head.appendChild(gaScript);
}
window.addEventListener('pdrconsentchange',event=>{
  window.gtag('consent','update',{
    analytics_storage:event.detail?.analytics?'granted':'denied'
  });
});

const banner=document.createElement('section');
banner.className='consent-banner';banner.setAttribute('role','dialog');banner.setAttribute('aria-label','Çerez tercihleri');
banner.innerHTML='<h2>Gizlilik tercihlerin</h2><p>PDR Kampüs, oturum ve temel özellikler için gerekli tarayıcı depolamasını kullanır. Google Analytics yalnızca analitik izni verirsen ölçüm depolamasını etkinleştirir. Reklam/pazarlama çerezi kullanılmıyor. <a href="/cerez-politikasi.html">Ayrıntılar</a></p><div class="consent-actions"><button type="button" data-consent="necessary">Yalnızca gerekli</button><button type="button" data-consent="manage">Tercihleri yönet</button><button type="button" class="primary" data-consent="all">Tümünü kabul et</button></div>';
document.body.appendChild(banner);

const modal=document.createElement('div');modal.className='consent-modal';modal.hidden=true;
modal.innerHTML='<div class="consent-panel" role="dialog" aria-modal="true" aria-labelledby="consentTitle"><h2 id="consentTitle">Çerez ve depolama tercihleri</h2><p>Tercihini istediğin zaman değiştirebilirsin.</p><div class="consent-row"><div><strong>Zorunlu</strong><small>Oturum, güvenlik ve tercih kaydı gibi temel işlevler. Kapatılamaz.</small></div><input class="consent-toggle" type="checkbox" checked disabled aria-label="Zorunlu depolama etkin"></div><div class="consent-row"><div><strong>Analitik</strong><small>Kullanımın toplu ölçümü için Google Analytics. Yalnızca izin verdiğinde analitik depolaması etkinleşir.</small></div><input id="consentAnalytics" class="consent-toggle" type="checkbox" aria-label="Analitik tercihi"></div><div class="consent-actions"><button type="button" data-consent-close>Kapat</button><button type="button" class="primary" data-consent-save>Tercihi kaydet</button></div></div>';
document.body.appendChild(modal);

let consentOpener=null;
function consentFocusables(){return [...modal.querySelectorAll('button,input:not([disabled]),a[href],[tabindex]:not([tabindex="-1"])')].filter(el=>!el.hidden)}
function openConsent(){const current=readConsent();consentOpener=document.activeElement;modal.querySelector('#consentAnalytics').checked=Boolean(current?.analytics);modal.hidden=false;modal.querySelector('#consentAnalytics').focus()}
function closeConsent(){modal.hidden=true;const target=consentOpener;consentOpener=null;if(target&&typeof target.focus==='function')target.focus()}
if(readConsent())banner.hidden=true;
banner.addEventListener('click',e=>{const a=e.target.closest('[data-consent]')?.dataset.consent;if(!a)return;if(a==='manage')return openConsent();saveConsent(a==='all');banner.hidden=true});
document.addEventListener('click',e=>{if(e.target.closest('[data-open-consent]')){e.preventDefault();openConsent()}});
modal.addEventListener('click',e=>{if(e.target===modal||e.target.closest('[data-consent-close]'))closeConsent();if(e.target.closest('[data-consent-save]')){saveConsent(modal.querySelector('#consentAnalytics').checked);banner.hidden=true;closeConsent()}});
document.addEventListener('keydown',e=>{if(modal.hidden)return;if(e.key==='Escape'){e.preventDefault();closeConsent();return}if(e.key==='Tab'){const items=consentFocusables();if(!items.length)return;const first=items[0],last=items[items.length-1];if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus()}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus()}}});
