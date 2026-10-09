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

test('explicit pending, rejected, partial or non-boolean approvals fail closed',()=>{
 for(const flags of [
  {publicationApproved:false,licenseVerified:false,reviewStatus:'editorial_review_required'},
  {publicationApproved:true,licenseVerified:false,reviewStatus:'approved'},
  {publicationApproved:false,licenseVerified:true,reviewStatus:'approved'},
  {publicationApproved:true,licenseVerified:true,reviewStatus:'editorial_review_required'},
  {publicationApproved:'true',licenseVerified:true,reviewStatus:'approved'},
  {publicationApproved:true}, {reviewStatus:'approved'},
 ])assert.deepEqual(mergeCollectedResources(original,[{...row,...flags}]),original);
 assert.equal(mergeCollectedResources(original,[{...row,publicationApproved:true,licenseVerified:true,reviewStatus:'approved'}]).length,2);
 assert.deepEqual(mergeCollectedResources(original,[null,42]),original);
});

import {readFileSync} from 'node:fs';
const readJson=path=>JSON.parse(readFileSync(new URL(path,import.meta.url),'utf8'));
test('all 1787 staged records stay invisible even with live-compatible IDs',()=>{
 const staging=readJson('../_staging/resources-1787.json');
 assert.equal(staging.length,1787);
 for(const item of staging){
  assert.equal(item.publicationApproved,false);
  assert.equal(item.licenseVerified,false);
  assert.equal(item.reviewStatus,'editorial_review_required');
 }
 const compatible=staging.map((item,index)=>({...item,id:'collected-'+index.toString(16).padStart(24,'0')}));
 assert.deepEqual(mergeCollectedResources(original,compatible),original);
});
test('published catalogue remains intact and staging is never fetched by library',()=>{
 const library=readJson('../data/library.json'),forms=readJson('../data/forms.json'),supplementary=readJson('../data/collected-resources.json');
 assert.equal(library.length,1284);
 const baseline=[...forms,...library];
 const result=mergeCollectedResources(baseline,supplementary);
 assert.deepEqual(result.slice(0,baseline.length),baseline);
 assert.equal(result.length,baseline.length+supplementary.length);
 const source=readFileSync(new URL('../src/library.js',import.meta.url),'utf8');
 assert.doesNotMatch(source,/_staging|resources-1787/);
});
