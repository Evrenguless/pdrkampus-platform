import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { resourceAccess } from '../src/resource-access.js';
import { resourceAccessEntries } from '../src/resource-access-data.js';
const read=p=>fs.readFileSync(new URL('../'+p,import.meta.url),'utf8');
const original=[...JSON.parse(read('data/forms.json')),...JSON.parse(read('data/library.json'))];
test('every reviewed override resolves an original catalogue record without editing its file',()=>{
 for(const [file,entry] of Object.entries(resourceAccessEntries)){
  for(const id of entry.ids){
   const row=original.find(x=>x.id===id);assert.ok(row);assert.equal(row.file,file);
   const before=JSON.stringify(row);const access=resourceAccess({...row,origin:'official'});
   assert.equal(JSON.stringify(row),before);
   if(entry.status==='unavailable'){assert.equal(access.url,null);assert.equal(access.available,false);assert.match(access.sourceUrl,/^https:\/\//);}
   else{assert.equal(access.url,entry.replacement_url);assert.notEqual(access.url,file);}
  }
 }
});
test('unavailable originals are absent from rendered catalogue hyperlinks',()=>{
 const pages=Array.from({length:35},(_,i)=>read('kutuphane/katalog/'+(i?'sayfa/'+(i+1)+'/':'')+'index.html')).join('\n');
 const hrefs=[...pages.matchAll(/href="([^"]+)"/g)].map(x=>x[1].replaceAll('&amp;','&'));
 for(const [file,entry] of Object.entries(resourceAccessEntries)){
  assert.ok(!hrefs.includes(file));
  assert.ok(hrefs.includes(entry.status==='available'?entry.replacement_url:entry.source_url));
 }
 assert.ok(pages.includes('Dosya bağlantısına erişilemiyor.'));
});
test('a member file with the same string bypasses public catalogue access overrides',()=>{
 const file=Object.keys(resourceAccessEntries)[0];assert.deepEqual(resourceAccess({id:'member',origin:'member',file}),{available:true,url:file});
});
test('unreviewed identifiers cannot inherit another document replacement',()=>{
 assert.throws(()=>resourceAccess({id:'unreviewed',origin:'official',file:Object.keys(resourceAccessEntries)[0]}));
});
