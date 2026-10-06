// Group only visible official results. Keep every original identifier and title.
export function groupVisibleResources(rows) {
 const groups=new Map(),result=[];
 for(const row of rows){
  if(row.origin!=='official'||!row.file){result.push(row);continue}
  const existing=groups.get(row.file);
  if(existing){existing.aliases.push({id:row.id,title:row.title});continue}
  const group={...row,aliases:[]};groups.set(row.file,group);result.push(group);
 }
 return result;
}
