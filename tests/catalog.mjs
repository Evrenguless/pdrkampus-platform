import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const forms=JSON.parse(readFileSync(new URL('../data/forms.json',import.meta.url),'utf8'));
const library=JSON.parse(readFileSync(new URL('../data/library.json',import.meta.url),'utf8'));
const all=[...forms,...library];

test('her katalog kaydında benzersiz kimlik, dosya ve gerekli alanlar bulunur',()=>{
 const ids=new Set(),files=new Set();
 for(const item of all){
  const label=item.id||item.title||'kimliksiz kayıt';
  for(const key of ['id','title','level','file','fileType','sourceType'])assert.ok(item[key],`${label}: ${key} eksik`);
  assert.ok(!ids.has(item.id),`${label}: yinelenen kimlik`);ids.add(item.id);
  assert.ok(!files.has(item.file),`${label}: aynı dosyaya ikinci bağımsız kart`);files.add(item.file);
  const url=new URL(item.file);
  assert.equal(url.protocol,'https:',`${label}: güvenli dosya adresi gerekli`);
  assert.match(url.hostname,/\.meb\.(?:gov\.tr|k12\.tr)$/,`${label}: kaynak alan adı`);
  assert.equal(item.sourceType,'official',`${label}: kaynak türü`);
  assert.ok(['PDF','XLSX'].includes(item.fileType),`${label}: dosya türü`);
  assert.ok(decodeURIComponent(url.pathname).toLowerCase().endsWith('.'+item.fileType.toLowerCase()),`${label}: uzantı/tür uyumsuz`);
  assert.ok(item.sourcePage||item.sourceUrl,`${label}: kaynak sayfası yok`);
  if(item.levels){
   assert.ok(Array.isArray(item.levels)&&item.levels.length>1,`${label}: çoklu kademe`);
   for(const level of item.levels)assert.ok(['Okul öncesi','İlkokul','Ortaokul','Lise'].includes(level),`${label}: geçersiz kademe ${level}`);
  }
  if(item.grades)for(const grade of item.grades)assert.ok(Number.isInteger(grade)&&grade>=1&&grade<=12,`${label}: geçersiz sınıf`);
 }
});

test('2026 esenlik kartları doğru dosya başlığıyla eşleşir',()=>{
 const expected={
  '01':'Rehber_OgretmenPsikolojik','02':'Ogretmen_Kitap','03':'Ebeveyn_Kitap','04':'Okul_Oncesi_Öğrenci_PP',
  '05':'Okul_Öncesi-İlkokul_Veli','06':'Okuloncesi-Ilkokul_Öğretmen','07':'Ilkokul_Farkındalık','08':'İlkokul_Öğrenci_PP',
  '09':'İlkokul_Öğrencilerinin_Dijital','12':'Ortaokul_Farkındalık','13':'Ortaokul_Öğrenci_PP',
  '14':'Ortaokul_Öğrencilerinin_Dijital','15':'Ortaokul-LIise_Veli','16':'Ortaokul-Lise_Öğretmen',
  '17':'Ortaokul_Esenlik_Bireysel','18':'Ortaokul_Dijital_Esenlik','19':'Lise_Farkındalık',
  '20':'_Lise.pdf','21':'Lise_Öğrencilerinin_Dijital','24':'Lise_Esenlik_Bireysel'
 };
 const rows=library.filter(item=>item.id.startsWith('esenlik-2026-'));
 assert.equal(rows.length,Object.keys(expected).length);
 for(const item of rows){
  const suffix=item.id.slice(-2),filename=decodeURIComponent(new URL(item.file).pathname.split('/').at(-1));
  assert.ok(filename.includes(expected[suffix]),`${item.id}: yanlış PDF (${filename})`);
 }
 assert.ok(!rows.some(item=>item.level==='Lise'&&item.topic==='Dijital esenlik'&&item.title.includes('Bireysel')));
});

test('psikolojik sağlamlık dosyaları kademe ve materyal türüne göre eşleşir',()=>{
 const rows=library.filter(item=>item.id.startsWith('psikososyal-2025-'));
 assert.equal(rows.length,32);
 const schoolGroups=[['Okul öncesi','28150031'],['İlkokul','28150408'],['Ortaokul','28150620'],['Lise','28150838']];
 const material=['Program','Afiş','Broşür','Broşür','Sunum','Sunum'];
 for(let group=0;group<4;group++)for(let offset=0;offset<6;offset++){
  const item=rows[3+group*6+offset],filename=decodeURIComponent(new URL(item.file).pathname.split('/').at(-1));
  assert.equal(item.level,schoolGroups[group][0],item.id);
  assert.equal(item.type,material[offset],item.id);
  assert.ok(filename.includes(group===3&&offset===1?'28150837':schoolGroups[group][1]),`${item.id}: yanlış kademe PDF'si`);
  assert.ok(filename.includes(['program','afis','velibrosur','ogretmenbrosur','velisunu','ogretmensunu'][offset]),`${item.id}: yanlış materyal PDF'si`);
 }
 for(const [i,token] of ['dogalafetkitabi','olumyaskitabi','gockitabi','intiharkitabi','terorkitabi'].entries()){
  const item=rows[27+i];assert.ok(item.file.includes(token),`${item.id}: yanlış güçlendirici destek kitabı`);
 }
});
