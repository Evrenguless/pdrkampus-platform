import {SUPABASE_URL,SUPABASE_PUBLISHABLE_KEY,authConfigured} from './auth-config.js?v=20260925-2';
const $=s=>document.querySelector(s);
const client=authConfigured&&window.supabase?.createClient(SUPABASE_URL,SUPABASE_PUBLISHABLE_KEY,{auth:{detectSessionInUrl:true}});
let mode='signin',recovering=false;
const messages={signin:'Giriş yap',signup:'Kayıt ol',reset:'Şifre bağlantısı gönder',recovery:'Yeni şifreyi kaydet'};
function setMessage(text,isError=false){const el=$('#accountMessage');el.textContent=text;el.classList.toggle('error',isError)}
function setMode(value){mode=value;$('#accountTitle').textContent=value==='signup'?'Hesap oluştur':value==='reset'?'Şifremi sıfırla':value==='recovery'?'Yeni şifre belirle':'Giriş yap';$('#accountSubmit').textContent=messages[value];$('#nameRow').hidden=value!=='signup';$('#emailRow').hidden=value==='recovery';$('#passwordRow').hidden=value==='reset';$('#displayName').required=value==='signup';$('#email').required=value!=='recovery';$('#password').required=value!=='reset';$('#passwordLabel').textContent=value==='recovery'?'Yeni şifre':'Şifre';$('#password').autocomplete=value==='recovery'||value==='signup'?'new-password':'current-password';$('#switches').hidden=value==='recovery';$('#signInTab').classList.toggle('active',value==='signin');$('#signUpTab').classList.toggle('active',value==='signup');setMessage('')}
function showUser(user,profile){$('#accountFormPanel').hidden=true;$('#accountProfile').hidden=false;$('#profileName').textContent=profile?.display_name||'PDR Kampüs üyesi';$('#profileEmail').textContent=user.email||'';$('#profileStatus').textContent=profile?'Hesabın etkin.':'Hesabın etkin. Profil kaydı henüz oluşturulmamış; veritabanı kurulumunu kontrol et.'}
async function refreshUser(){const {data:{user},error}=await client.auth.getUser();if(error)throw error;if(recovering)return;if(!user){$('#accountFormPanel').hidden=false;$('#accountProfile').hidden=true;return}const {data:profile}=await client.from('profiles').select('display_name').eq('id',user.id).maybeSingle();showUser(user,profile)}
if(!authConfigured){$('#accountFormPanel').hidden=true;$('#setupNotice').hidden=false;$('#setupNotice').textContent='Hesap sistemi henüz kurulmadı. Yeni Supabase projesi bağlandıktan sonra kayıt ve giriş açılacak.'}
else if(!client){$('#accountFormPanel').hidden=true;$('#setupNotice').hidden=false;$('#setupNotice').textContent='Giriş hizmeti yüklenemedi. Sayfayı yenileyin.'}
else {
  client.auth.onAuthStateChange(event=>{if(event==='PASSWORD_RECOVERY'){recovering=true;setMode('recovery');$('#accountFormPanel').hidden=false;$('#accountProfile').hidden=true;setMessage('Yeni şifreni belirle.')}else if(event==='SIGNED_IN'&&!recovering){setTimeout(()=>refreshUser().catch(()=>{}),0)}});
  if(new URLSearchParams(location.search).has('error'))setMessage('Doğrulama bağlantısı geçersiz veya süresi dolmuş. Yeni bir bağlantı iste.',true);
  refreshUser().catch(e=>setMessage(e.message,true));
  $('#signInTab').addEventListener('click',()=>setMode('signin'));
  $('#signUpTab').addEventListener('click',()=>setMode('signup'));
  $('#forgotPassword').addEventListener('click',()=>setMode('reset'));
  $('#accountForm').addEventListener('submit',async e=>{e.preventDefault();const email=$('#email').value.trim(),password=$('#password').value,name=$('#displayName').value.trim();$('#accountSubmit').disabled=true;setMessage('İşleniyor…');try{
    if(mode==='signup'){if(name.length<2)throw Error('Görünen ad en az 2 karakter olmalı.');const {data,error}=await client.auth.signUp({email,password,options:{data:{display_name:name},emailRedirectTo:new URL('hesap.html',location.href).href}});if(error)throw error;$('#password').value='';if(!data.session)setMessage('Kayıt isteği alındı. E-postana gelen doğrulama bağlantısını aç.');else await refreshUser()}
    else if(mode==='signin'){const {error}=await client.auth.signInWithPassword({email,password});if(error)throw error;$('#password').value='';await refreshUser()}
    else if(mode==='reset'){const {error}=await client.auth.resetPasswordForEmail(email,{redirectTo:new URL('hesap.html',location.href).href});if(error)throw error;setMessage('Eğer bu e-posta için hesap varsa şifre bağlantısı gönderildi.')}
    else {const {error}=await client.auth.updateUser({password});if(error)throw error;$('#password').value='';recovering=false;await refreshUser()}
  }catch(err){setMessage(err.message||'İşlem tamamlanamadı.',true)}finally{$('#accountSubmit').disabled=false}});
  $('#signOut').addEventListener('click',async()=>{const {error}=await client.auth.signOut();if(error){$('#profileStatus').textContent=error.message;return}$('#accountProfile').hidden=true;$('#accountFormPanel').hidden=false;setMode('signin')});
}
