#!/usr/bin/env python3
"""Collect the complete public Kariyer Kapısı list; news is discovery only."""
import argparse, hashlib, json, re, time
from datetime import datetime, timezone, timedelta
from pathlib import Path
from urllib.request import Request, build_opener, HTTPCookieProcessor
from urllib.parse import urlsplit, parse_qs
from urllib.error import HTTPError, URLError
from http.cookiejar import CookieJar
from html import unescape

ROOT = Path(__file__).resolve().parents[1]
TZ = timezone(timedelta(hours=3))
API = 'https://api.kariyerkapisi.gov.tr/api/ilan/GetIseAlimPage'
EXCLUDED = ('Yeterlik Sınavı', 'Görevde Yükselme', 'Yurt Dışı Eğitim', 'Belge Başvurusu', 'Tercih İlanı')
MANUAL = {
 '69465191-48a2-447c-8f55-edb2ecbeb45a': 'nigde-omer-halisdemir-universitesi-2026-eylul-personel',
 '90be2def-8597-49a5-a02e-e49b6649aaa4': 'duzce-universitesi-2026-2-sozlesmeli-personel',
 'be701e43-3849-4ebc-9374-89a2e432c2db': 'csgb-2026-ekim-bilisim-personeli',
}

def official(url):
 p=urlsplit(url)
 if p.scheme != 'https' or p.username or p.password or p.port not in (None,443) or not p.hostname or not (p.hostname.endswith('.gov.tr') or p.hostname.endswith('.edu.tr')):
  raise ValueError('Invalid official URL')
 return url

def instant(value):
 d=datetime.fromisoformat(value)
 return (d if d.tzinfo else d.replace(tzinfo=TZ)).isoformat(timespec='seconds')

def normalize(rows):
 result=[]; excluded=[]; seen=set()
 for row in rows:
  kind=row['ilanTuru']; guid=row['guid']
  if not re.fullmatch(r'[a-f0-9-]{36}',guid) or guid in seen: raise ValueError('Invalid or duplicate public ID')
  seen.add(guid)
  if any(t in kind for t in EXCLUDED):
   excluded.append({'id':guid,'title':row['ilanBaslik'],'reason':kind});continue
  if row.get('onay') != 1 or row.get('sonDurumu') != 'Aktif':continue
  start,end=instant(row['basTarih']),instant(row['bitTarih'])
  if datetime.fromisoformat(start)>=datetime.fromisoformat(end):raise ValueError('Invalid dates')
  url=official(row.get('basvuruLinki') or ('https://kariyerkapisi.gov.tr/IlanDetay?i='+guid))
  result.append({'id':guid,'title':row['ilanBaslik'],'institution':row['kurumAdi'],'unit':row.get('birimAdi') or '',
   'category':kind.rstrip(','),'startsAt':start,'deadline':end,'sourceUrl':url,
   'logoUrl':official('https://kariyerkapisi.gov.tr/UPS/'+row['logo_Path']),
   'manualSlug':MANUAL.get(guid),'withdrawn':False})
 return sorted(result,key=lambda r:(r['startsAt'],r['id']),reverse=True),excluded

class Client:
 def __init__(self):self.opener=build_opener(HTTPCookieProcessor(CookieJar()))
 def get(self,url,payload=None):
  data=json.dumps(payload).encode() if payload is not None else None
  headers={'User-Agent':'PDRKampus-PublicRecruitment/1.0','Accept':'application/json, application/xml, text/html'}
  if data is not None:headers['Content-Type']='application/json'
  for attempt in range(3):
   try:
    with self.opener.open(Request(url,data=data,headers=headers),timeout=25) as r:
     body=r.read(5000001)
     if len(body)>5000000:raise ValueError('Source exceeds limit')
     return body,r.headers
   except HTTPError:raise
   except (URLError,TimeoutError,OSError):
    if attempt==2:raise
    time.sleep(1)

def news_scan(client,now):
 total=0; newest=None; candidates=[]
 for page in range(1,21):
  body,headers=client.get('https://www.kamuisilanlari.com/wp-json/wp/v2/posts?per_page=100&page='+str(page))
  posts=json.loads(body)
  if not isinstance(posts,list):raise ValueError('Unexpected news response')
  for p in posts:
   total+=1;date=p['date'][:10];newest=max(newest or date,date)
   # Old publication dates are reported, never relabelled as new/open jobs.
   if date >= (now-timedelta(days=90)).date().isoformat():
    candidates.append({'url':p['link'],'title':unescape(re.sub('<[^>]+>','',p['title']['rendered'])),'publishedAt':date,'status':'official_verification_required'})
  if page>=int(headers.get('X-WP-TotalPages','1')):break
 else:raise ValueError('News pagination incomplete')
 return {'scanned':total,'newestPublishedAt':newest,'candidates':candidates}

def collect(root,client,now):
 payload={'krM_ID':0,'searchText':'','il':'0','ilanTuru':'0'}
 body,_=client.get(API,payload);raw=json.loads(body)
 if not isinstance(raw.get('searchIlan'),list) or not raw['searchIlan']:raise ValueError('Official list missing/empty; preserving last snapshot')
 rows,excluded=normalize(raw['searchIlan'])
 news_error=None
 try:news=news_scan(client,now)
 except Exception as e:news={'scanned':None,'candidates':[]};news_error=str(e)
 target=root/'data/recruitment-feed.json'
 old=json.loads(target.read_text()) if target.exists() else {'records':[]}
 # Keep dated archives. A disappeared source record is never automatically called cancelled.
 current={r['id']:r for r in rows}
 for r in old['records']:
  if r['id'] not in current:current[r['id']]=r
 rows=sorted(current.values(),key=lambda r:(r['startsAt'],r['id']),reverse=True)
 changed=rows!=old['records']
 if changed:
  target.write_text(json.dumps({'source':API,'updatedAt':now.isoformat(timespec='seconds'),'records':rows},ensure_ascii=False,indent=2)+'\n')
 report={'checkedAt':now.isoformat(timespec='seconds'),'sourceRecords':len(raw['searchIlan']),'recruitmentRecords':len(current),
  'open':sum(datetime.fromisoformat(r['startsAt'])<=now<datetime.fromisoformat(r['deadline']) for r in rows),
  'upcoming':sum(now<datetime.fromisoformat(r['startsAt']) for r in rows),'excluded':excluded,'news':news,'newsError':news_error,'changed':changed}
 return report

def refresh_review_hashes(root):
 # Only generated recruitment HTML and its generator are permitted here.
 import importlib.util
 spec=importlib.util.spec_from_file_location('seo_guard',root/'scripts/seo_engine.py');e=importlib.util.module_from_spec(spec);spec.loader.exec_module(e)
 baseline=json.loads((root/'seo/protected-files.json').read_text());p=root/'seo/approved-edits.json';a=json.loads(p.read_text())
 for name in [n for n in baseline['files'] if n.startswith('personel-alim-ilanlari/') or n in ('scripts/build_career_pages.py','sitemap.xml')]:
  path=root/name
  if name in baseline['files']:
   existing=a['edits'].get(name,{})
   if existing.get('baseline_sha256') == baseline['files'][name] and existing.get('reviewed_sha256') == e.digest(path):
    continue
   row={'baseline_sha256':baseline['files'][name],'reviewed_sha256':e.digest(path),'reason':'Generated official public recruitment snapshot; application and other datasets preserved'}
   if name.endswith('.html'):row['runtime_sha256']=e.runtime_digest(path.read_text())
   a['edits'][name]=row
 p.write_text(json.dumps(a,ensure_ascii=False,indent=2)+'\n')

if __name__=='__main__':
 parser=argparse.ArgumentParser();parser.add_argument('--report',type=Path,required=True);parser.add_argument('--refresh-hashes',action='store_true');args=parser.parse_args()
 if args.refresh_hashes:refresh_review_hashes(ROOT)
 else:
  report=collect(ROOT,Client(),datetime.now(TZ));args.report.parent.mkdir(parents=True,exist_ok=True);args.report.write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n');print(json.dumps({k:report[k] for k in ('sourceRecords','recruitmentRecords','open','upcoming','changed','newsError')},ensure_ascii=False))
