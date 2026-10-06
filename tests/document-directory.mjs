import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const pages=JSON.parse(read('data/document-directory.json'));
const items=new Map([...JSON.parse(read('data/forms.json')),...JSON.parse(read('data/library.json'))].map(x=>[x.id,x]));
test('48 doküman hedefi özgün URL ve gerçek dosya kaynaklarıyla oluşturulur',()=>{
 assert.equal(pages.length,48);assert.equal(new Set(pages.map(x=>x.slug)).size,48);assert.equal(new Set(pages.map(x=>x.group)).size,8);
 const hub=read('dokumanlar/index.html');
 for(const p of pages){
  assert.ok(hub.includes('/dokumanlar/'+p.slug+'/'));
  const html=read('dokumanlar/'+p.slug+'/index.html');
  assert.ok(html.includes(p.intro));assert.ok(html.includes(p.note));assert.ok(p.sources.length>0);
  for(const id of p.sources){assert.ok(items.has(id),id);assert.ok(html.includes(items.get(id).title),id);assert.ok(html.includes('Dosyayı aç / indir'),id);}
 }
});
test('özgün taslaklar indirilebilir ve resmî dosyalardan ayrılır',()=>{
 let count=0;
 for(const p of pages){const html=read('dokumanlar/'+p.slug+'/index.html');if(!html.includes('documentDraft'))continue;
  count++;assert.ok(html.includes('resmî MEB formu yerine geçmez'));assert.ok(html.includes('sunucuya gönderilmez'));
  const text=read('dokumanlar/taslaklar/'+p.slug+'.txt');assert.ok(text.length>400);assert.ok(text.includes('Resmî belge veya onaylı program değildir.'));
 }
 assert.equal(count,9);
});
test('anasayfa doküman başlıklarını JavaScript olmadan da bağlar',()=>{
 const html=read('index.html');
 for(const p of pages)assert.ok(html.includes('/dokumanlar/'+p.slug+'/'));
 assert.ok(html.indexOf('DOCUMENT DIRECTORY START')<html.indexOf('portal-topic-strip'));
});
