import json,tempfile,unittest
from datetime import datetime
from pathlib import Path
from collect_recruitment import normalize,official,collect,TZ

class Tests(unittest.TestCase):
 def row(self,**kw):
  r={'guid':'00000000-0000-0000-0000-000000000001','ilanTuru':'Sözleşmeli Personel İlanları','onay':1,'sonDurumu':'Aktif','basTarih':'2026-10-04T09:00:00','bitTarih':'2026-10-11T23:59:00','kurumAdi':'Kurum','ilanBaslik':'Personel alımı','birimAdi':'Birim','logo_Path':'test.png','basvuruLinki':''};r.update(kw);return r
 def test_recruitment_excludes_internal_and_education(self):
  rows,excluded=normalize([self.row(),self.row(guid='00000000-0000-0000-0000-000000000002',ilanTuru='Yeterlik Sınavı İlanları')]);self.assertEqual(len(rows),1);self.assertEqual(len(excluded),1)
 def test_turkey_time_is_added_without_changing_official_hour(self):
  rows,_=normalize([self.row()]);self.assertEqual(rows[0]['deadline'],'2026-10-11T23:59:00+03:00')
 def test_duplicate_and_invalid_dates_rejected(self):
  with self.assertRaises(ValueError):normalize([self.row(),self.row()])
  with self.assertRaises(ValueError):normalize([self.row(bitTarih='2026-10-01T00:00:00')])
 def test_external_credentials_or_unofficial_url_rejected(self):
  for u in ['https://example.com/','https://x.gov.tr.evil.test/','https://me:password@x.gov.tr/','http://x.gov.tr/']:
   with self.assertRaises(ValueError):official(u)
 def test_missing_source_never_erases_previous_snapshot(self):
  class Fake:
   def get(self,*args):return b'{"searchIlan":[]}',{}
  with tempfile.TemporaryDirectory() as d:
   root=Path(d);(root/'data').mkdir();p=root/'data/recruitment-feed.json';p.write_text('{"records":[{"id":"keep"}]}');before=p.read_bytes()
   with self.assertRaises(ValueError):collect(root,Fake(),datetime(2026,10,7,tzinfo=TZ))
   self.assertEqual(p.read_bytes(),before)
 def test_news_failure_does_not_block_official_feed_and_repeat_is_noop(self):
  row=self.row()
  class Fake:
   def get(self,u,*args):
    if 'api.kariyerkapisi' in u:return json.dumps({'searchIlan':[row]}).encode(),{}
    raise OSError('news unavailable')
  with tempfile.TemporaryDirectory() as d:
   root=Path(d);(root/'data').mkdir();now=datetime(2026,10,7,tzinfo=TZ)
   first=collect(root,Fake(),now);before=(root/'data/recruitment-feed.json').read_bytes();second=collect(root,Fake(),datetime(2026,10,8,tzinfo=TZ))
   self.assertTrue(first['changed']);self.assertFalse(second['changed']);self.assertEqual(before,(root/'data/recruitment-feed.json').read_bytes());self.assertTrue(first['newsError'])
if __name__=='__main__':unittest.main()
