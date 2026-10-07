// Supplementary official catalogue; original records always take precedence.
export function mergeCollectedResources(original, supplementary) {
 const ids=new Set(original.map(row=>row.id)),files=new Set(original.map(row=>row.file));
 const accepted=[];
 for(const row of Array.isArray(supplementary)?supplementary:[]) {
  let url,source;try{url=new URL(row.file);source=new URL(row.sourcePage)}catch{continue}
  const official=u=>u.protocol==='https:'&&!u.username&&!u.password&&(!u.port||u.port==='443')&&/(?:^|\.)meb\.(?:gov|k12)\.tr$/.test(u.hostname);
  if(!official(url)||!official(source)||!/^collected-[a-f0-9]{24}$/.test(row.id)||!row.title||!row.type||!row.level||!row.topic||row.sourceType!=='official'||ids.has(row.id)||files.has(row.file))continue;
  if(row.pagePath&&!/^\/kaynak\/yeni\/[a-z0-9-]+\/$/.test(row.pagePath))continue;
  accepted.push(row);ids.add(row.id);files.add(row.file);
 }
 return [...original,...accepted];
}
