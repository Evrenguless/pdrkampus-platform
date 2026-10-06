import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {dateKey,parseDate,weekDates,taskSummary,filterPacks,activityText,reportText} from '../src/assistant-core.js';
import {guestStore,accountStore} from '../src/assistant-store.js';
const packs=JSON.parse(readFileSync(new URL('../data/assistant-packs.json',import.meta.url),'utf8'));
test('hafta yıl ve ay sınırını doğru geçer, hafta sonu aynı pazartesiye döner',()=>{
 assert.deepEqual(weekDates('2027-01-03'),['2026-12-28','2026-12-29','2026-12-30','2026-12-31','2027-01-01']);
 assert.equal(dateKey(parseDate('2026-10-06')),'2026-10-06');
 assert.throws(()=>parseDate('2026-02-30'));assert.throws(()=>parseDate('2026-10-00'));assert.throws(()=>parseDate(''));
});
test('bugün, gecikmiş ve tarihsiz görevler doğru sayılır',()=>{
 assert.deepEqual(taskSummary([{due_date:'2026-10-06',completed:false},{due_date:'2026-10-05',completed:false},{due_date:'2026-10-05',completed:true},{due_date:null,completed:false}],'2026-10-06'),{open:3,today:1,overdue:1});
});
test('Türkçe arama ve kademe filtresi uyumsuz etkinliği dışlar',()=>{
 assert.equal(filterPacks(packs,'','RIBA')[0].id,'riba-ihtiyac-analizi');
 assert.equal(filterPacks(packs,'Okul öncesi','kariyer').length,0);
 assert.equal(filterPacks(packs,'Lise','kariyer').length,1);
});
test('etkinlik süresi tam toplanır ve kademe uyumsuzluğu reddedilir',()=>{
 for(const minutes of [20,30,40]){const text=activityText(packs[0],'İlkokul',minutes);const total=[...text.matchAll(/\((\d+) dk\)/g)].reduce((n,m)=>n+Number(m[1]),0);assert.equal(total,minutes);assert.ok(text.includes('MEB onaylı program'));}
 assert.throws(()=>activityText(packs.find(x=>x.id==='kariyer-kesif-atolyesi'),'Okul öncesi',30));assert.throws(()=>activityText(packs[0],'İlkokul',-1));
});
const values={month:'2026-10',sessions:'0',activities:'2',parents:'1',teachers:'0',participations:'30'};
test('rapor geçersiz sayıları reddeder ve katılımı tekil öğrenci gibi sunmaz',()=>{
 const result=reportText(values);assert.ok(result.includes('benzersiz kişi sayısı değildir'));assert.ok(result.includes('Sonuç değerlendirmesi eklenmedi'));
 for(const n of ['-1','1.5','abc','','100001'])assert.throws(()=>reportText({...values,sessions:n}));
 assert.throws(()=>reportText({...values,month:'2026-13'}));
});
test('misafir görevleri yenilemede korunur, tamamlama ve silme yalnız seçilen görevi değiştirir',async()=>{
 const map=new Map(),storage={getItem:k=>map.get(k),setItem:(k,v)=>map.set(k,v)};
 const first=guestStore(storage),a=await first.add('Etkinlik hazırla','2026-10-06'),b=await first.add('Veli semineri planla',null);
 const reopened=guestStore(storage);assert.equal((await reopened.list()).length,2);await reopened.toggle(a.id,true);assert.equal((await first.list()).find(x=>x.id===a.id).completed,true);await reopened.remove(a.id);assert.deepEqual((await first.list()).map(x=>x.id),[b.id]);
});
test('depolama hatası başarı gibi bildirilmez',async()=>{
 const store=guestStore({getItem:()=>null,setItem:()=>{throw Error('quota')}});await assert.rejects(store.add('Hazırlık','2026-10-06'),/kaydı yapılamadı/);
 await assert.rejects(guestStore({getItem:()=>'{broken'}).list(),/okunamadı/);
});
test('hesap değiştiğinde hiçbir tablo işlemi yapılmaz',async()=>{
 let called=false;const store=accountStore({auth:{getUser:async()=>({data:{user:{id:'other'}},error:null})},from:()=>{called=true}},'owner');
 for(const action of [()=>store.list(),()=>store.add('Test',null),()=>store.toggle('id',true),()=>store.remove('id')])await assert.rejects(action(),/Oturum değişti/);
 assert.equal(called,false);
});
test('hesap işlemleri owner_id filtresi ve hata kontrolü içerir',async()=>{
 const filters=[],calls=[];const query={select(){return this},eq(k,v){filters.push([k,v]);return this},order(){return this},limit(){return this},update(v){calls.push(v);return this},delete(){return this},insert(v){calls.push(v);return this},single(){return this},then(resolve){resolve({data:[],error:null})}};
 const store=accountStore({auth:{getUser:async()=>({data:{user:{id:'owner'}},error:null})},from:name=>{assert.equal(name,'workspace_tasks');return query}},'owner');
 await store.list();await store.toggle('id',true);await store.remove('id');await store.add('Test',null);
 assert.equal(filters.filter(([k,v])=>k==='owner_id'&&v==='owner').length,3);assert.equal(calls.at(-1).owner_id,'owner');
 query.then=resolve=>resolve({error:{message:'offline'}});await assert.rejects(store.list(),/erişilemedi/);
});
test('sekiz paket, indirilebilir şablon ve yerel rehber hedefleri eksiksiz',()=>{
 assert.equal(packs.length,8);assert.equal(new Set(packs.map(x=>x.id)).size,8);
 for(const p of packs){assert.equal(p.checklist.length,4);assert.equal(p.activity.steps.length,4);assert.ok(p.intro.length>120);assert.ok(p.sections.every(s=>s.body.length>200));assert.ok(p.sources.every(s=>new URL(s.url).hostname.endsWith('meb.gov.tr')));const html=readFileSync(new URL('..'+p.path+'index.html',import.meta.url),'utf8');assert.ok(html.includes(p.title));}
});
