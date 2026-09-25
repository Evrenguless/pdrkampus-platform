export const guestKey='pdrkampus_platform_bookmarks_guest_v1';
export const userKey=id=>'pdrkampus_platform_bookmarks_user_'+id+'_v1';
export const bookmarkKey=(kind,id)=>kind+':'+id;
export function readBookmarks(storage,key){try{const v=JSON.parse(storage.getItem(key)||'[]');return new Set(Array.isArray(v)?v.filter(x=>typeof x==='string'&&/^(form|resource):[\w-]+$/.test(x)):[])}catch{return new Set()}}
export function writeBookmarks(storage,key,items){storage.setItem(key,JSON.stringify([...items].sort()))}
export function toggleBookmark(items,key){const next=new Set(items);if(next.has(key))next.delete(key);else next.add(key);return next}
