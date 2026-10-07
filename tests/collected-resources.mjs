import test from 'node:test';
import assert from 'node:assert/strict';
import {mergeCollectedResources} from '../src/collected-resources.js';

const original=[{id:'original',file:'https://test.meb.k12.tr/old.pdf',title:'Original'}];
const row={id:'collected-'+'a'.repeat(24),file:'https://test.meb.k12.tr/new.pdf',sourcePage:'https://test.meb.k12.tr/rehberlik.html',title:'Akran zorbalığı sunumu',type:'Sunum',level:'Belirtilmiyor',topic:'Akran zorbalığı',sourceType:'official'};
test('supplementary records preserve original identity and reject duplicates',()=>{
 const before=structuredClone(original);const result=mergeCollectedResources(original,[row,row,{...row,file:original[0].file}]);
 assert.deepEqual(original,before);assert.equal(result[0],original[0]);assert.equal(result.length,2);
});
test('unavailable or malformed supplementary catalogue does not remove original records',()=>{
 for(const data of [null,{},[{...row,file:'javascript:alert(1)'}],[{...row,sourcePage:'https://meb.gov.tr.evil.example/'}],[{...row,id:'original'}]])assert.deepEqual(mergeCollectedResources(original,data),original);
});
