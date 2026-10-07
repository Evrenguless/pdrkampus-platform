#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Read-only discovery of explicitly public aggregate datasets; no RPC or individual records."""
import argparse,base64,hashlib,json,re,urllib.request
from pathlib import Path
from urllib.parse import urlencode,urlsplit
from seo_engine import safe_output

def public_config(path):
 s=path.read_text();url=re.search(r'\bURL\s*:\s*"([^"]+)"',s);key=re.search(r'\bANON_KEY\s*:\s*"([^"]+)"',s)
 if not url or not key:raise ValueError('Public frontend configuration missing')
 url,key=url[1],key[1]
 if urlsplit(url).hostname!='kausxairsoyjqyvlrgsl.supabase.co' or urlsplit(url).scheme!='https':raise ValueError('Unexpected public project')
 try:
  encoded=key.split('.')[1];claims=json.loads(base64.urlsafe_b64decode(encoded+'='*((4-len(encoded)%4)%4)))
 except Exception:raise ValueError('Expected existing public anon key') from None
 if claims.get('role')!='anon':raise ValueError('Only public anon credentials are allowed')
 return url,key

def sanitize(key,payload):
 if key=='historical_appointments':
  fields=('year','quota','share','applicants','total_appointments')
  return {'rows':[{f:r[f] for f in fields} for r in payload['rows']],'featured_year':payload.get('featured_year')}
 if key=='research_data':
  return {'exam_year':payload['exam_year'],'topics':[{f:r[f] for f in ('name','count','scope','short_name') if f in r} for r in payload['topics']],'asdep':[{f:r[f] for f in ('year','count','threshold','approximate','note') if f in r} for r in payload.get('asdep',[])]}
 if key=='calculation_config':
  stats=payload['official_test_stats'];return {'official_test_stats':{k:{f:stats[k][f] for f in ('mean','std')} for k in ('sozel','sayisal','tarih','cografya','egitim','mevzuat','oabt')}}
 raise ValueError('Individual or unapproved dataset is not exportable')

def fetch(url,key,params):
 req=urllib.request.Request(url+'/rest/v1/pdrkampus_site_datasets?'+urlencode(params,safe='(),:->'),headers={'apikey':key,'Authorization':'Bearer '+key,'Accept':'application/json'})
 with urllib.request.urlopen(req,timeout=30) as r:return json.load(r)

def main():
 ap=argparse.ArgumentParser(description=__doc__);ap.add_argument('--config',type=Path,required=True);ap.add_argument('--output',type=Path,required=True);args=ap.parse_args();root=Path(__file__).resolve().parents[1];out=safe_output(root,args.output)
 if out.exists():raise ValueError('Choose a new output directory')
 url,key=public_config(args.config);rows=fetch(url,key,{'is_public':'eq.true','key':'in.(historical_appointments,research_data)','select':'key,updated_at,payload'})
 stats=fetch(url,key,{'is_public':'eq.true','key':'eq.calculation_config','select':'key,updated_at,stats:payload->official_test_stats'})
 rows.extend({'key':r['key'],'updated_at':r['updated_at'],'payload':{'official_test_stats':r['stats']}} for r in stats)
 if {r['key'] for r in rows}!={'historical_appointments','research_data','calculation_config'}:raise ValueError('Public aggregate source incomplete')
 clean=[{'key':r['key'],'updated_at':r['updated_at'],'payload':sanitize(r['key'],r['payload'])} for r in rows];registry={r['key']:hashlib.sha256(json.dumps(r['payload'],sort_keys=True,ensure_ascii=False).encode()).hexdigest() for r in clean}
 out.mkdir(parents=True);(out/'public-aggregates.json').write_text(json.dumps(clean,ensure_ascii=False,indent=2)+'\n');(out/'registry.json').write_text(json.dumps(registry,indent=2)+'\n');(out/'report.json').write_text(json.dumps({'mode':'read_only_public_aggregate_discovery','keys':list(registry),'database_writes':0,'individual_records_exported':0,'calculation_coefficients_exported':0,'automatic_publication':False},indent=2)+'\n');print(json.dumps({'datasets':len(clean),'database_writes':0,'individual_records_exported':0}))
if __name__=='__main__':main()
