const fields = {query:'q',type:'tur',level:'kademe',area:'alan',source:'kaynak'};
export function readLibraryUrl(url) {
  const values = Object.fromEntries(Object.entries(fields).map(([field,param])=>[field,url.searchParams.get(param)||'']));
  if(!['','official','member'].includes(values.source))values.source='';
  return values;
}
export function writeLibraryUrl(url,state) {
  const next = new URL(url.href);
  for(const [field,param] of Object.entries(fields)) {
    if(state[field])next.searchParams.set(param,state[field]);
    else next.searchParams.delete(param);
  }
  return next;
}
