import test from 'node:test';
import assert from 'node:assert/strict';
import {existsSync,readFileSync} from 'node:fs';
import {mergeCollectedResources} from '../src/collected-resources.js';
const read=path=>JSON.parse(readFileSync(new URL(path,import.meta.url),'utf8'));

test('every published import passes the live gate and has a real hash-matched preview',()=>{
 const report=read('../_staging/publication-review.json');
 const rows=read('../data/collected-resources.json');
 const manifest=read('../data/resource-previews.json');
 const accepted=new Set(report.publishedIds);
 const imported=rows.filter(row=>accepted.has(row.id));
 assert.equal(report.reviewed,1787);
 assert.equal(report.published+report.held,1787);
 assert.equal(imported.length,report.published);
 assert.equal(mergeCollectedResources([],imported).length,imported.length);
 for(const row of imported){
  assert.equal(row.publicationApproved,true);
  assert.equal(row.licenseVerified,true);
  assert.equal(row.reviewStatus,'approved');
  assert.equal(row.contentSha256,manifest[row.id].sourceSha256);
  assert.ok(row.importId.startsWith('toplanan-'));
  assert.ok(row.approvalBasis.includes('User explicitly authorized'));
  assert.ok(existsSync(new URL('..'+row.pagePath+'index.html',import.meta.url)));
  assert.ok(manifest[row.id].previews.length);
  for(const path of manifest[row.id].previews)assert.ok(existsSync(new URL('..'+path,import.meta.url)));
 }
});
test('held staging identities are absent from the live import catalogue',()=>{
 const report=read('../_staging/publication-review.json');
 const held=new Set(report.heldRecords.map(row=>row.importId));
 const rows=read('../data/collected-resources.json');
 assert.equal(rows.filter(row=>held.has(row.importId)).length,0);
 assert.equal(read('../data/library.json').length,1284);
});
