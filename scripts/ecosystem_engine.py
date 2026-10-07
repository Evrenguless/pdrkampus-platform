#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Public-catalogue discovery, relationship and editorial audit; no database writes."""
import argparse,collections,hashlib,html,json,re,unicodedata
from pathlib import Path
from urllib.parse import urljoin,urlsplit
from seo_engine import Page,audit,protected,safe_output

def read(p):return json.loads(p.read_text(encoding='utf-8'))
def normalize(s):return re.sub(r'[^a-z0-9]+',' ',unicodedata.normalize('NFKD',s.lower().replace('ı','i')).encode('ascii','ignore').decode()).strip()
def digest(v):return hashlib.sha256(json.dumps(v,ensure_ascii=False,sort_keys=True).encode()).hexdigest()
def load_catalogue(root):
    # Explicit public catalogue fields; user/individual data is never imported.
    allowed={'id','title','type','level','topic','source','sourcePage','sourceUrl','file','fileType','verifiedAt','category','group'}
    rows=[]
    for name in ['library','forms']:
        rows.extend({**{k:v for k,v in r.items() if k in allowed},'catalogue':name} for r in read(root/'data'/f'{name}.json'))
    return rows

def discover(rows,previous=None):
    previous=previous or {};out=[];seen=set()
    for row in rows:
        key=row['catalogue']+':'+row['id']; fingerprint=digest(row)
        reasons=[]
        if row.get('catalogue')=='topics' and row.get('content_status')!='published':reasons.append('unpublished_topic')
        if not row.get('title') or not row.get('file'):reasons.append('missing_public_content')
        if urlsplit(row.get('file','')).scheme not in ('http','https'):reasons.append('invalid_file_scheme')
        if row.get('file') in seen:reasons.append('duplicate_file')
        seen.add(row.get('file'))
        status='noindex' if 'unpublished_topic' in reasons else 'duplicate' if 'duplicate_file' in reasons else 'invalid' if reasons else 'skipped' if previous.get(key)==fingerprint else 'updated' if key in previous else 'created'
        out.append({'entity_id':key,'title':row.get('title',''),'fingerprint':fingerprint,'status':status,'reasons':reasons,'requires_editorial_review':status in ('created','updated'),'automatic_publication':False})
    return out

def relationships(root,rows):
    topics=read(root/'data/topics.json')['topics'];nodes=[];edges=[];questions=[]
    for topic in topics:
        key='topic:'+topic['slug'];nodes.append({'id':key,'type':'topic','name':topic['name'],'canonical':topic.get('canonicalPath'),'published':topic.get('contentStatus')=='published'})
        terms={normalize(topic['name']),*(normalize(x) for x in topic.get('aliases',[]))}
        for alias in topic.get('aliases',[]):
            if any(w in alias for w in ('nasıl','nedir','ne ','hangi','kim')):questions.append({'entity':key,'question':alias,'origin':'existing_topic_alias','intent':'informational'})
        for related in topic.get('relatedTopics',[]):
            if any(t['slug']==related for t in topics):edges.append({'from':key,'to':'topic:'+related,'relation':'related_topic'})
        for row in rows:
            if normalize(row.get('topic','')) in terms or any(term and term in normalize(row['title']) for term in terms):edges.append({'from':row['catalogue']+':'+row['id'],'to':key,'relation':'resource_about_topic'})
    grades={row.get('level') for row in rows if row.get('level') and row['level']!='Belirtilmiyor'}
    nodes.extend({'id':'grade:'+normalize(level),'type':'grade','name':level} for level in sorted(grades))
    for row in rows:
        key=row['catalogue']+':'+row['id'];nodes.append({'id':key,'type':'resource','name':row['title'],'level':row.get('level'),'source':row.get('sourcePage') or row.get('sourceUrl')})
        if row.get('level') and row['level']!='Belirtilmiyor':edges.append({'from':key,'to':'grade:'+normalize(row['level']),'relation':'educational_level'})
    return {'nodes':nodes,'edges':edges,'question_clusters':questions,'policy':'Existing public metadata only; no inferred clinical facts or individual records.'}

def flatten_schema(value):
    if isinstance(value,list):
        for x in value:yield from flatten_schema(x)
    elif isinstance(value,dict):
        yield value
        for key in ('@graph','mainEntity'):
            if key in value:yield from flatten_schema(value[key])

def editorial(root):
    config=read(root/'seo/config.json');base=config['base_url'];report=audit(root,config);coverage=[];texts={};questions=[]
    for row in report['pages']:
        raw=(root/row['file']).read_text();page=Page(raw);text=page.main_text.strip();url=row['url']
        if row['noindex']:continue
        source_links=[link for link in page.links if urlsplit(link).scheme in ('http','https') and urlsplit(link).hostname not in ('pdrkampus.com','analiz.pdrkampus.com','norm.pdrkampus.com')]
        headings=[html.unescape(re.sub('<[^>]+>','',x)).strip() for x in re.findall(r'<h[23]\b[^>]*>(.*?)</h[23]>',raw,re.S)]
        qs=[x for x in headings if '?' in x]
        for q in qs:questions.append({'url':url,'question':q,'origin':'visible_heading'})
        nodes=[n for s in page.schemas for n in flatten_schema(s)]
        faq_issues=[]
        for node in nodes:
            if node.get('@type')=='Question':
                a=node.get('acceptedAnswer',{}).get('text','');q=node.get('name','')
                if not q or not a or normalize(q) not in normalize(text) or normalize(a) not in normalize(text):faq_issues.append('faq_not_visible')
        family=row['file'].split('/')[0]
        intent='local_data' if family=='il' else 'resource' if family in ('kaynak-detay','kaynak','kutuphane') else 'topic' if family in ('konu','rehber','rehberlik','bep','kriz','cocuk-koruma','lgs','yks','riba') else 'exam_analysis' if family=='pdr-oabt' else 'navigation_or_tool'
        checks={'metadata':bool(page.title and page.description),'canonical':page.canonicals==[url],'primary_h1':len(page.primary_h1)==1,'useful_text':len(text.split())>=100,'internal_discovery':row['inbound_count']>0 or url==base+'/','source_context':bool(source_links) or intent=='navigation_or_tool','structured_data':bool(nodes) and not page.errors,'visible_faq_consistency':not faq_issues,'indexability':not page.noindex,'sitemap':row['sitemap']}
        weights={'metadata':10,'canonical':10,'primary_h1':10,'useful_text':15,'internal_discovery':10,'source_context':15,'structured_data':10,'visible_faq_consistency':5,'indexability':5,'sitemap':10}
        score=sum(weights[k] for k,v in checks.items() if v)
        coverage.append({**row,'intent':intent,'word_count':len(text.split()),'checks':checks,'score':score,'review_required':score<70 or bool(faq_issues),'headings':headings,'source_urls':source_links,'schema_types':sorted({str(n.get('@type')) for n in nodes if n.get('@type')}),'faq_issues':faq_issues})
        # Remove tokens shared by most pages later to reduce navigation/template noise.
        tokens=normalize(text).split();texts[url]=set(zip(tokens,tokens[1:],tokens[2:],tokens[3:]))
    frequency=collections.Counter(g for grams in texts.values() for g in grams);common={g for g,n in frequency.items() if n>max(5,len(texts)*.35)}
    keys=list(texts);near=[]
    for i,a in enumerate(keys):
        aa=texts[a]-common
        if len(aa)<50:continue
        for b in keys[i+1:]:
            bb=texts[b]-common
            if not bb:continue
            ratio=len(aa&bb)/len(aa|bb)
            if ratio>=.9:near.append({'first':a,'second':b,'similarity':round(ratio,3),'action':'editorial_review_only'})
    return {'protection':report['protection'],'technical':report,'editorial':coverage,'visible_questions':questions,'near_duplicates':near,'limits':['Heuristic editorial review, not Google ranking or index status.','No automatic deletion, redirect, noindex, or publication.']}

def main():
    ap=argparse.ArgumentParser(description=__doc__);ap.add_argument('--root',type=Path,default=Path(__file__).resolve().parents[1]);ap.add_argument('--output',type=Path,required=True);ap.add_argument('--previous',type=Path);args=ap.parse_args();root=args.root.resolve();output=safe_output(root,args.output)
    if output.exists():raise ValueError('Use a new output directory')
    if not protected(root)['pass']:raise ValueError('Calculation/data protection failed')
    report=editorial(root);output.mkdir(parents=True)
    report['quality_gate_pass']=all(not p['review_required'] for p in report['editorial'])
    (output/'audit.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
    if (root/'data/library.json').exists():
        rows=load_catalogue(root);registry_path=args.previous or root/'seo/discovery-registry.json';previous=read(registry_path) if registry_path.exists() else {};topic_candidates=[{'catalogue':'topics','id':t['slug'],'title':t['name'],'file':'https://pdrkampus.com'+t.get('canonicalPath','/konu/'+t['slug']+'/'),'aliases':t.get('aliases',[]),'related_topics':t.get('relatedTopics',[]),'sources':t.get('officialSources',[]),'content_status':t.get('contentStatus')} for t in read(root/'data/topics.json')['topics']]
        discovery=discover(rows+topic_candidates,previous);graph=relationships(root,rows)
        for name,value in [('discovery',discovery),('relationships',graph),('registry',{r['entity_id']:r['fingerprint'] for r in discovery})]:(output/(name+'.json')).write_text(json.dumps(value,ensure_ascii=False,indent=2)+'\n')
    elif (root/'data/schools-v1.json.gz').exists():
        import gzip
        raw=read(root/'seo/geo-pilot.json');payload=json.loads(gzip.decompress((root/'data/schools-v1.json.gz').read_bytes()));columns=payload['columns'];pos={k:columns.index(k) for k in ['il','ilce','okul_turu']};groups={}
        for row in payload['rows']:
            province,district=str(row[pos['il']] or ''),str(row[pos['ilce']] or '')
            if not province:continue
            for group in [(province,''),(province,district)]:
                if group not in groups:groups[group]=collections.Counter()
                groups[group][str(row[pos['okul_turu']] or 'Belirtilmemiş')]+=1
        public=[{'catalogue':'geo','id':normalize(province)+'/'+normalize(district),'title':province+(' / '+district if district else ''),'file':'https://norm.pdrkampus.com/','types':dict(types),'record_count':sum(types.values()),'education_period':raw.get('education_period_declaration',{}).get('period')} for (province,district),types in sorted(groups.items())]
        # All places are review candidates. No new place is automatically published.
        previous=read(args.previous) if args.previous else {};candidates=[]
        for row in public:
            key='geo:'+row['id'];fp=digest(row);candidates.append({'entity_id':key,'title':row['title'],'record_count':row['record_count'],'education_period':row['education_period'],'fingerprint':fp,'status':'skipped' if previous.get(key)==fp else 'updated' if key in previous else 'created','requires_editorial_review':previous.get(key)!=fp,'automatic_publication':False})
        (output/'discovery.json').write_text(json.dumps(candidates,ensure_ascii=False,indent=2)+'\n')
        (output/'registry.json').write_text(json.dumps({p['entity_id']:p['fingerprint'] for p in candidates},indent=2)+'\n')
    elif (root/'seo/analysis-pilot.json').exists():
        manifest=read(root/'seo/analysis-pilot.json');registry={p['route']:digest(p) for p in manifest['pages']};previous=read(args.previous) if args.previous else {}
        candidates=[{'route':route,'fingerprint':fp,'status':'skipped' if previous.get(route)==fp else 'updated' if route in previous else 'created','automatic_publication':False} for route,fp in registry.items()]
        (output/'discovery.json').write_text(json.dumps(candidates,indent=2)+'\n');(output/'registry.json').write_text(json.dumps(registry,indent=2)+'\n')
    print(json.dumps({'project':root.name,'pages':len(report['editorial']),'review_candidates':sum(p['review_required'] for p in report['editorial']),'near_duplicates':len(report['near_duplicates']),'protected':report['protection']['pass'],'quality_gate':report['quality_gate_pass']}))
    return 0 if report['quality_gate_pass'] else 1
if __name__=='__main__':raise SystemExit(main())
