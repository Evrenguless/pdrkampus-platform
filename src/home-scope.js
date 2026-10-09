import {homeCatalogCounts} from './home-catalog-counts.js';
import {getCuratedResources} from './curated.js?v=20260926-1';
import {SUPABASE_URL,SUPABASE_PUBLISHABLE_KEY,authConfigured} from './auth-config.js?v=20260925-2';
const host=document.querySelector('.home-scope');
const client=authConfigured&&window.supabase?.createClient(SUPABASE_URL,SUPABASE_PUBLISHABLE_KEY);
const number=new Intl.NumberFormat('tr-TR');
let busy=false;
async function load(path){
 const response=await fetch(path,{cache:'no-cache',signal:AbortSignal.timeout(15000)});
 if(!response.ok)throw Error('Katalog yüklenemedi');
 return response.json();
}
async function members(){
 if(!client)return [];
 const {data,error}=await client.from('community_documents').select('id,file_storage_key').eq('review_status','approved').order('created_at',{ascending:false}).limit(1000);
 if(error)throw error;
 return data||[];
}
async function refresh(){
 if(!host||busy||document.hidden)return;
 busy=true;
 try{
  const [forms,resources,supplementary,topicData,curated,memberRows]=await Promise.all([
   load('/data/forms.json'),load('/data/library.json'),load('/data/collected-resources.json'),load('/data/topics.json'),getCuratedResources(),members()
  ]);
  const counts=homeCatalogCounts({forms,resources,supplementary,curated,members:memberRows,topics:topicData.topics});
  for(const [id,key] of [['scopeLibrary','library'],['scopeForms','forms'],['scopeTopics','topics']])document.getElementById(id).textContent=number.format(counts[key]);
  host.dataset.countsStatus='ready';
 }catch{host.dataset.countsStatus='retry'}
 finally{busy=false}
}
refresh();
// Revalidate while the page is open and whenever the visitor returns to it.
setInterval(refresh,60000);
window.addEventListener('focus',refresh);
document.addEventListener('visibilitychange',refresh);
