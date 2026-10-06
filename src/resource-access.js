import { resourceAccessEntries } from './resource-access-data.js';
// Resolve access only after grouping original catalogue files. Member storage stays separate.
export function resourceAccess(item) {
 if (item.origin !== 'official') return { available: true, url: item.file };
 const entry = resourceAccessEntries[item.file];
 if (!entry) return { available: true, url: item.file };
 if (!entry.ids.includes(item.id)) throw new Error('Unreviewed resource access identifier');
 return entry.status === 'available'
  ? { available: true, url: entry.replacement_url }
  : { available: false, url: null, sourceUrl: entry.source_url, sourceLabel: entry.source_label };
}
