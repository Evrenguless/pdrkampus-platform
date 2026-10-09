import {mergeCollectedResources} from './collected-resources.js';
import {groupVisibleResources} from './resource-groups.js';
// Mirror the library's merge, type filtering and file-grouping rules.
export function homeCatalogCounts({forms,resources,curated={tools:[],library:[]},supplementary=[],members=[],topics=[]}){
 const allForms=[...forms,...curated.tools];
 const original=[...forms,...resources,...curated.tools,...curated.library];
 const additions=mergeCollectedResources(original,supplementary).slice(original.length);
 const official=[...allForms.map(row=>({...row,type:'Form',origin:'official'})),...[...resources,...curated.library,...additions].map(row=>({...row,origin:'official'}))];
 const documents=[...official,...members.map(row=>({...row,origin:'member'}))];
 return {
  library:groupVisibleResources(documents).length,
  forms:groupVisibleResources(official.filter(row=>row.type==='Form')).length,
  topics:topics.filter(row=>row.indexable&&row.contentStatus==='published').length
 };
}
