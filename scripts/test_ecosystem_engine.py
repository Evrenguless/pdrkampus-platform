# -*- coding: utf-8 -*-
import unittest,tempfile,json,sys
from unittest.mock import patch
import ecosystem_engine
from discover_public_analysis import sanitize
from pathlib import Path
from ecosystem_engine import discover,load_catalogue,relationships,editorial
from enrich_seo_content import enrich_schema
from seo_engine import Page,runtime_digest
ROOT=Path(__file__).resolve().parents[1]
class EcosystemTests(unittest.TestCase):
 def test_discovery_changes_and_no_auto_publication(self):
  rows=[{'catalogue':'library','id':'one','title':'Bir kaynak','file':'https://example.org/a.pdf'}];first=discover(rows);registry={r['entity_id']:r['fingerprint'] for r in first};self.assertEqual(discover(rows,registry)[0]['status'],'skipped');rows[0]['title']='Güncellenmiş başlık';self.assertEqual(discover(rows,registry)[0]['status'],'updated');self.assertFalse(first[0]['automatic_publication'])
 def test_live_export_drops_coefficients_and_rejects_individual_dataset(self):
  stats={k:{'mean':1,'std':2} for k in ('sozel','sayisal','tarih','cografya','egitim','mevzuat','oabt')}
  value=sanitize('calculation_config',{'official_test_stats':stats,'p2_model':{'private_coefficient':123},'person_name':'PRIVATE'})
  self.assertEqual(set(value),{'official_test_stats'});self.assertNotIn('PRIVATE',json.dumps(value))
  with self.assertRaises(ValueError):sanitize('p2_ranking_data',{'rows':[]})
 def test_duplicates_and_bad_scheme_blocked(self):
  r={'catalogue':'library','title':'Kaynak','file':'https://example.org/a.pdf'};x=discover([{**r,'id':'a'},{**r,'id':'b'},{**r,'id':'c','file':'javascript:evil'}]);self.assertEqual([v['status'] for v in x],['created','duplicate','invalid'])
 def test_private_fields_not_exported(self):
  with tempfile.TemporaryDirectory() as t:
   root=Path(t);(root/'data').mkdir()
   for n in ['library','forms']:(root/'data'/f'{n}.json').write_text(json.dumps([{'id':'a','title':'A','file':'https://example.org/a','telefon':'PRIVATE','person_name':'PRIVATE','ogrenci_sayisi':42}]))
   rows=load_catalogue(root);self.assertNotIn('PRIVATE',json.dumps(rows));self.assertNotIn('ogrenci_sayisi',rows[0])
 def test_schema_keeps_runtime(self):
  s='<html><head></head><body><main><h1>Konu</h1><h2>Nedir?</h2><p>Bu açıklama mevcut içeriğin tamamını temsil eden yeterli uzunlukta görünür bir cevap olarak yazılmıştır.</p></main><script>window.original=1</script></body></html>';new=enrich_schema(s,'https://pdrkampus.com/test/');self.assertEqual(runtime_digest(s),runtime_digest(new));self.assertIn('FAQPage',new)
 def test_question_heading_cannot_swallow_intervening_sections(self):
  s='<head></head><main><h1>Konu</h1><h2>Birinci soru?</h2><ul><li>Liste</li></ul><h2>İkinci soru?</h2><p>Bu ikinci sorunun yeterli uzunluktaki cevabı mevcut ve görünür kaynak içeriğinde yer alan açıklamadır.</p></main>';new=enrich_schema(s,'https://pdrkampus.com/test/');graph=Page(new).schemas[0]['@graph'];questions=next(n for n in graph if n['@type']=='FAQPage')['mainEntity'];self.assertEqual([q['name'] for q in questions],['İkinci soru?'])
 def test_real_catalogue_and_relationships(self):
  rows=load_catalogue(ROOT);self.assertGreaterEqual(len(rows),1366);self.assertEqual(len({r['id'] for r in rows}),len(rows));graph=relationships(ROOT,rows);self.assertTrue(graph['edges']);self.assertTrue(graph['question_clusters'])
 def test_idempotent_schema(self):
  s='<head></head><main><h1>Konu</h1><p>İçerik</p></main>';x=enrich_schema(s,'https://pdrkampus.com/test/');self.assertEqual(x,enrich_schema(x,'https://pdrkampus.com/test/'))
 def test_changed_source_is_reported_but_publication_stays_blocked(self):
  with tempfile.TemporaryDirectory() as temp:
   output=Path(temp)/'review';report={'protection':{'pass':False,'changed':['data/library.json']},'editorial':[],'near_duplicates':[]}
   with patch('ecosystem_engine.editorial',return_value=report),patch.object(sys,'argv',['engine','--root',str(ROOT),'--output',str(output)]):
    self.assertEqual(ecosystem_engine.main(),1)
   self.assertTrue((output/'discovery.json').exists());self.assertFalse(json.loads((output/'audit.json').read_text())['quality_gate_pass'])
 def test_all_current_pages_have_visible_faqs_and_no_duplicates(self):
  r=editorial(ROOT);self.assertTrue(r['protection']['pass']);self.assertFalse(r['near_duplicates']);self.assertFalse([p for p in r['editorial'] if p['faq_issues']])
if __name__=='__main__':unittest.main()
