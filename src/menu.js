const button=document.querySelector('#menuButton');
const menu=document.querySelector('#mobileMenu');
function closeMenu(){if(!menu||!button)return;menu.hidden=true;button.setAttribute('aria-expanded','false');button.setAttribute('aria-label','Menüyü aç');button.textContent='☰'}
button?.addEventListener('click',()=>{if(!menu)return;const opening=menu.hidden;menu.hidden=!opening;button.setAttribute('aria-expanded',String(opening));button.setAttribute('aria-label',opening?'Menüyü kapat':'Menüyü aç');button.textContent=opening?'×':'☰'});
menu?.addEventListener('click',event=>{if(event.target.closest('a'))closeMenu()});
document.addEventListener('keydown',event=>{if(event.key==='Escape'&&!menu?.hidden){closeMenu();button?.focus()}});
document.addEventListener('click',event=>{if(!menu?.hidden&&!menu.contains(event.target)&&!button?.contains(event.target))closeMenu()});
window.matchMedia('(min-width:1101px)').addEventListener('change',event=>{if(event.matches)closeMenu()});

const footerBottom=document.querySelector('.campus-footer-bottom');
if(footerBottom){
 let links=footerBottom.querySelector('.footer-policy-links');
 if(!links){links=document.createElement('nav');links.className='footer-policy-links';links.setAttribute('aria-label','Gizlilik ve yasal bilgiler');const replace=footerBottom.querySelector('span:nth-child(2)');replace?replace.replaceWith(links):footerBottom.insertBefore(links,footerBottom.lastElementChild)}
 links.innerHTML='<a href="/iletisim.html">İletişim</a><a href="/gizlilik.html">Gizlilik</a><a href="/kvkk-aydinlatma.html">KVKK</a><a href="/cerez-politikasi.html">Çerezler</a><a href="/kullanim-kosullari.html">Kullanım koşulları</a><a href="/paylasim-kurallari.html">Paylaşım kuralları</a><button type="button" class="footer-consent-button" data-open-consent>Çerez tercihleri</button>';
}

const CONSENT_KEY='pdrkampus_consent_v1';
const consentStyle=document.createElement('style');
consentStyle.textContent=`.consent-banner{position:fixed;z-index:9999;left:18px;right:18px;bottom:18px;max-width:760px;margin:auto;background:#fff;border:1px solid rgba(18,60,49,.16);border-radius:18px;padding:18px;box-shadow:0 22px 70px rgba(0,0,0,.18);font:inherit}.consent-banner[hidden],.consent-modal[hidden]{display:none!important}.consent-banner h2,.consent-modal h2{margin:0 0 8px;font-size:1.15rem}.consent-banner p,.consent-modal p{margin:0 0 14px;line-height:1.55;font-size:.92rem}.consent-actions{display:flex;flex-wrap:wrap;gap:9px}.consent-actions button,.footer-consent-button{font:inherit;cursor:pointer}.consent-actions button{border:1px solid #123c31;border-radius:999px;padding:9px 14px;background:#fff;color:#123c31;font-weight:700}.consent-actions .primary{background:#123c31;color:#fff}.consent-modal{position:fixed;z-index:10000;inset:0;background:rgba(8,22,18,.48);display:grid;place-items:center;padding:20px}.consent-panel{width:min(620px,100%);max-height:85vh;overflow:auto;background:#fff;border-radius:20px;padding:24px;box-shadow:0 25px 90px rgba(0,0,0,.25)}.consent-row{display:flex;justify-content:space-between;gap:20px;align-items:flex-start;padding:15px 0;border-top:1px solid rgba(18,60,49,.12)}.consent-row strong{display:block;margin-bottom:5px}.consent-row small{display:block;line-height:1.45;max-width:420px}.consent-toggle{min-width:46px;height:26px}.footer-consent-button{border:0;background:none;padding:0;color:inherit;text-decoration:underline;text-underline-offset:3px}@media(max-width:600px){.consent-banner{left:10px;right:10px;bottom:10px}.consent-actions button{flex:1 1 auto}}`;
document.head.appendChild(consentStyle);

function readConsent(){try{return JSON.parse(localStorage.getItem(CONSENT_KEY)||'null')}catch{return null}}
function saveConsent(analytics){const value={necessary:true,analytics:Boolean(analytics),updatedAt:new Date().toISOString()};localStorage.setItem(CONSENT_KEY,JSON.stringify(value));window.PDRConsent=value;window.dispatchEvent(new CustomEvent('pdrconsentchange',{detail:value}));return value}
window.PDRConsent=readConsent()||{necessary:true,analytics:false,updatedAt:null};

const banner=document.createElement('section');
banner.className='consent-banner';banner.setAttribute('role','dialog');banner.setAttribute('aria-label','Çerez tercihleri');
banner.innerHTML='<h2>Gizlilik tercihlerin</h2><p>PDR Kampüs, oturum ve temel özellikler için gerekli tarayıcı depolamasını kullanır. Analitik teknolojiler yalnızca izin verirsen çalıştırılır. Şu anda reklam/pazarlama çerezi kullanılmıyor. <a href="/cerez-politikasi.html">Ayrıntılar</a></p><div class="consent-actions"><button type="button" data-consent="necessary">Yalnızca gerekli</button><button type="button" data-consent="manage">Tercihleri yönet</button><button type="button" class="primary" data-consent="all">Tümünü kabul et</button></div>';
document.body.appendChild(banner);

const modal=document.createElement('div');modal.className='consent-modal';modal.hidden=true;
modal.innerHTML='<div class="consent-panel" role="dialog" aria-modal="true" aria-labelledby="consentTitle"><h2 id="consentTitle">Çerez ve depolama tercihleri</h2><p>Tercihini istediğin zaman değiştirebilirsin.</p><div class="consent-row"><div><strong>Zorunlu</strong><small>Oturum, güvenlik ve tercih kaydı gibi temel işlevler. Kapatılamaz.</small></div><input class="consent-toggle" type="checkbox" checked disabled aria-label="Zorunlu depolama etkin"></div><div class="consent-row"><div><strong>Analitik</strong><small>Kullanımın toplu ölçümü için isteğe bağlı kategori. Şu anda etkin bir analitik aracı yoktur.</small></div><input id="consentAnalytics" class="consent-toggle" type="checkbox" aria-label="Analitik tercihi"></div><div class="consent-actions"><button type="button" data-consent-close>Kapat</button><button type="button" class="primary" data-consent-save>Tercihi kaydet</button></div></div>';
document.body.appendChild(modal);

function openConsent(){const current=readConsent();modal.querySelector('#consentAnalytics').checked=Boolean(current?.analytics);modal.hidden=false;modal.querySelector('#consentAnalytics').focus()}
function closeConsent(){modal.hidden=true}
if(readConsent())banner.hidden=true;
banner.addEventListener('click',e=>{const a=e.target.closest('[data-consent]')?.dataset.consent;if(!a)return;if(a==='manage')return openConsent();saveConsent(a==='all');banner.hidden=true});
document.addEventListener('click',e=>{if(e.target.closest('[data-open-consent]')){e.preventDefault();openConsent()}});
modal.addEventListener('click',e=>{if(e.target===modal||e.target.closest('[data-consent-close]'))closeConsent();if(e.target.closest('[data-consent-save]')){saveConsent(modal.querySelector('#consentAnalytics').checked);banner.hidden=true;closeConsent()}});
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!modal.hidden)closeConsent()});
