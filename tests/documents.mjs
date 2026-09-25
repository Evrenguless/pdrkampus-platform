import test from 'node:test';
import assert from 'node:assert/strict';
import {documentItems,filterDocuments} from '../src/documents.js';
const items=documentItems([{id:'f',title:'Görüşme Formu',level:'Ortaokul',category:'Görüşme',group:'Bireyi Tanıma'}],[{id:'r',title:'Veli Sunumu',type:'Sunum',level:'Tüm kademeler',topic:'Akran zorbalığı',area:'Veli'}]);
test('resmî kaynaklar tür ve kaynakla ayrılır',()=>{assert.deepEqual(filterDocuments(items,{type:'Form'}).map(x=>x.id),['f']);assert.deepEqual(filterDocuments(items,{source:'MEB · Yayın'}).map(x=>x.id),['r'])});
test('tüm kademeler kaynağı seçilen kademede görünür',()=>{assert.deepEqual(filterDocuments(items,{level:'Ortaokul'}).map(x=>x.id),['f','r']);assert.deepEqual(filterDocuments(items,{level:'Lise'}).map(x=>x.id),['r'])});
