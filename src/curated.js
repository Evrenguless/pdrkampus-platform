import {SUPABASE_URL,SUPABASE_PUBLISHABLE_KEY,authConfigured} from './auth-config.js?v=20260925-2';
export async function getCuratedResources(){
 if(!authConfigured||!window.supabase)return {tools:[],library:[]};
 const client=window.supabase.createClient(SUPABASE_URL,SUPABASE_PUBLISHABLE_KEY);
 const {data,error}=await client.from('curated_resources').select('id,kind,title,code,group_name,category,location,area,topic,level,resource_type,file_type,file_url,source_page_url').eq('status','published').order('created_at',{ascending:false}).limit(1000);
 if(error)return {tools:[],library:[]};
 return {
  tools:data.filter(x=>x.kind==='tool').map(x=>({id:'curated-'+x.id,code:x.code||'Kod belirtilmiyor',title:x.title,group:x.group_name,category:x.category,level:x.level,location:x.location,file:x.file_url,fileType:x.file_type,sourceType:'official',sourceUrl:x.source_page_url})),
  library:data.filter(x=>x.kind==='library').map(x=>({id:'curated-'+x.id,title:x.title,type:x.resource_type,level:x.level,area:x.area,topic:x.topic,source:'MEB · yönetici kaydı',sourcePage:x.source_page_url,file:x.file_url,fileType:x.file_type,sourceType:'official'}))
 };
}
