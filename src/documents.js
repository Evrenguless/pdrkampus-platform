export const documentTypes = ['Form', 'Sunum', 'Etkinlik kitabı', 'Farkındalık programı', 'Program', 'Broşür', 'Kılavuz', 'Bülten', 'Etkinlik', 'Pano materyali', 'Afiş', 'Mesleki kaynak'];

export function documentItems(forms, resources) {
  return [
    ...forms.map(item => ({ id: item.id, kind: 'tool', title: item.title, type: 'Form', level: item.level, topic: item.category, group: item.group, source: 'MEB · Form Haritası', item })),
    ...resources.map(item => ({ id: item.id, kind: 'library', title: item.title, type: item.type, level: item.level, topic: item.topic, group: item.area, source: 'MEB · Yayın', item }))
  ];
}

export function filterDocuments(items, { query = '', type = '', level = '', source = '' } = {}) {
  const q = query.trim().toLocaleLowerCase('tr-TR');
  return items.filter(x => (!type || x.type === type) && (!level || x.level === level || x.level === 'Tüm kademeler' || x.item.levels?.includes(level)) && (!source || x.source === source) && (!q || [x.title, x.type, x.level, x.topic, x.group].some(v => String(v || '').toLocaleLowerCase('tr-TR').includes(q))));
}
