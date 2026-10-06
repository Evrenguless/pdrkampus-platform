const KEY='pdrkampus_assistant_guest_tasks_v1';
export function guestStore(storage) {
 const read=()=>{let value;try{value=JSON.parse(storage.getItem(KEY)||'[]')}catch{throw Error('Tarayıcıdaki plan okunamadı. Depolama iznini kontrol edin.')}if(!Array.isArray(value))throw Error('Tarayıcıdaki plan biçimi geçersiz.');return value.filter(x=>typeof x.id==='string'&&typeof x.title==='string'&&typeof x.completed==='boolean'&&(x.due_date===null||/^\d{4}-\d{2}-\d{2}$/.test(x.due_date))).slice(0,500)};
 const write=tasks=>{try{storage.setItem(KEY,JSON.stringify(tasks))}catch{throw Error('Tarayıcı kaydı yapılamadı. Depolama dolu veya kapalı olabilir.')}};
 return {mode:'guest',async list(){return read()},async add(title,due_date){const tasks=read();if(tasks.length>=500)throw Error('Tarayıcı planında en fazla 500 iş tutulabilir.');const row={id:crypto.randomUUID(),title,due_date,completed:false};write([...tasks,row]);return row},async toggle(id,completed){write(read().map(x=>x.id===id?{...x,completed}:x))},async remove(id){write(read().filter(x=>x.id!==id))}};
}
export function accountStore(client,owner) {
 async function verify(){const {data,error}=await client.auth.getUser();if(error||data.user?.id!==owner)throw Error('Oturum değişti. Sayfayı yenileyip tekrar giriş yapın.');}
 async function check(query){const result=await query;if(result.error)throw Error('Çalışma alanına erişilemedi. Bağlantınızı ve hesap kurulumunu kontrol edin.');return result.data;}
 return {mode:'account',async list(){await verify();return check(client.from('workspace_tasks').select('id,title,due_date,completed').eq('owner_id',owner).order('due_date',{ascending:true,nullsFirst:false}).limit(500))},async add(title,due_date){await verify();return check(client.from('workspace_tasks').insert({owner_id:owner,title,due_date}).select('id,title,due_date,completed').single())},async toggle(id,completed){await verify();return check(client.from('workspace_tasks').update({completed}).eq('id',id).eq('owner_id',owner).select('id').single())},async remove(id){await verify();return check(client.from('workspace_tasks').delete().eq('id',id).eq('owner_id',owner).select('id').single())}};
}
