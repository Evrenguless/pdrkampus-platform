import json,tempfile,unittest
from pathlib import Path
from resource_design import decorate,guidance,specific_context
from seo_engine import Page
class ResourceDesignTests(unittest.TestCase):
 def setUp(self):
  self.row={'id':'sample','title':'Selamlaşma Panosu','type':'Pano materyali','level':'İlkokul','topic':'Selamlaşma','file':'https://example.meb.k12.tr/pano.pdf','fileType':'PDF','source':'Örnek RAM','sourcePage':'https://example.meb.k12.tr/rehberlik.html'}
  self.source='<html><head><title>Özgün başlık</title><link rel="canonical" href="https://pdrkampus.com/sample/"></head><body><main><h1>Selamlaşma Panosu</h1><p>Özgün kaynak açıklaması.</p><a href="https://example.meb.k12.tr/pano.pdf">Dosya</a></main><script src="/src/menu.js"></script></body></html>'
 def test_canonical_original_content_and_download_preserved(self):
  with tempfile.TemporaryDirectory() as d:
   result=decorate(Path(d),self.source,self.row)
   self.assertIn('Özgün kaynak açıklaması.',result);self.assertIn(self.row['file'],result)
   self.assertEqual(Page(result).canonicals,['https://pdrkampus.com/sample/']);self.assertEqual(len(Page(result).primary_h1),1)
   self.assertIn('resource-preview.js',result);self.assertIn('rol canlandırmaları',result)
   self.assertEqual(decorate(Path(d),result,self.row),result)
 def test_context_distinguishes_teacher_parent_school_and_class(self):
  for a,b in [('Öğretmen Sunumu','Veli Sunumu'),('RİBA Okul Sonuç Çizelgesi','RİBA Sınıf Sonuç Çizelgesi'),('BEP 1. Dönem','BEP 2. Dönem')]:
   self.assertNotEqual(specific_context({**self.row,'title':a}),specific_context({**self.row,'title':b}))
 def test_catalogue_has_no_detail_viewer(self):
  with tempfile.TemporaryDirectory() as d:
   result=decorate(Path(d),self.source);self.assertNotIn('resourcePreviewData',result)
 def test_unavailable_file_not_presented_as_download(self):
  with tempfile.TemporaryDirectory() as d:
   root=Path(d);(root/'seo').mkdir();(root/'seo/link-overrides.json').write_text(json.dumps({'entries':{self.row['file']:{'status':'unavailable'}}}))
   self.assertNotIn('class="resource-download"',decorate(root,self.source,self.row))
 def test_inventory_instructions_do_not_change_scoring(self):
  self.assertIn('değiştirmeden', ' '.join(guidance({**self.row,'title':'Öğrenci Envanteri','type':'Envanter'})[3]))
 def test_existing_format_tile_upgrades_to_real_workbook_cover(self):
  with tempfile.TemporaryDirectory() as d:
   root=Path(d);(root/'data').mkdir()
   (root/'data/library.json').write_text(json.dumps([self.row]))
   (root/'data/resource-previews.json').write_text(json.dumps({'sample':{'thumbnail':'/assets/sample-sheet.jpg','sheets':[{'name':'EYLÜL'}]}}))
   source='<body data-resource-design="1"><article class="catalog-card"><div class="resource-card-cover"><span class="resource-format-tile">XLSX</span></div><h2>Selamlaşma Panosu</h2></article></body>'
   result=decorate(root,source)
   self.assertIn('/assets/sample-sheet.jpg',result);self.assertNotIn('resource-format-tile',result)
   self.assertEqual(result.count('resource-card-cover'),1);self.assertEqual(decorate(root,result),result)
 def test_existing_page_refreshes_old_asset_versions(self):
  with tempfile.TemporaryDirectory() as d:
   source='<head><link href="/src/resource-design.css?v=20261008-1"></head><body data-resource-design="1"><script src="src/library.js?v=20261005-4"></script></body>'
   result=decorate(Path(d),source)
   self.assertNotIn('v=20261008-1',result);self.assertNotIn('v=20261005-4',result)
   self.assertIn('resource-design.css?v=20261008-2',result);self.assertIn('library.js?v=20261008-2',result)
 def test_same_title_sources_use_their_own_document_covers(self):
  with tempfile.TemporaryDirectory() as d:
   root=Path(d);(root/'data').mkdir()
   rows=[{**self.row,'id':'one','pagePath':'/kaynak/yeni/one/'},{**self.row,'id':'two','pagePath':'/kaynak/yeni/two/'}]
   (root/'data/library.json').write_text(json.dumps(rows))
   (root/'data/resource-previews.json').write_text(json.dumps({'one':{'thumbnail':'/assets/one.jpg'},'two':{'thumbnail':'/assets/two.jpg'}}))
   source='<article class="catalog-card"><h2><a href="/kaynak/yeni/one/">Selamlaşma Panosu</a></h2></article>'
   result=decorate(root,source)
   self.assertIn('/assets/one.jpg',result);self.assertNotIn('/assets/two.jpg',result)
 def test_source_page_fallback_is_labelled_and_survives_regeneration(self):
  with tempfile.TemporaryDirectory() as d:
   root=Path(d);(root/'seo').mkdir()
   (root/'seo/source-page-overrides.json').write_text(json.dumps({'entries':{self.row['sourcePage']:{'replacement_url':'https://example.meb.k12.tr/','label':'Kaynak kurumun sitesi'}}}))
   result=decorate(root,self.source,self.row)
   self.assertNotIn(self.row['sourcePage'],result)
   self.assertIn('Kaynak kurumun sitesi',result)
   self.assertEqual(decorate(root,result,self.row),result)
 def test_verified_title_overlay_preserves_record_and_canonical(self):
  with tempfile.TemporaryDirectory() as d:
   root=Path(d);(root/'seo').mkdir()
   (root/'seo/resource-title-overrides.json').write_text(json.dumps({'entries':{'sample':{'title':'Selamlaşma Panosu · Öğrenci Sürümü'}}}))
   row={**self.row,'pagePath':'/kaynak/yeni/sample/'}
   result=decorate(root,self.source,row)
   self.assertIn('<h1>Selamlaşma Panosu · Öğrenci Sürümü</h1>',result)
   self.assertIn('<title>Selamlaşma Panosu · Öğrenci Sürümü',result)
   self.assertEqual(row['title'],self.row['title'])
   self.assertEqual(Page(result).canonicals,['https://pdrkampus.com/sample/'])
   self.assertEqual(decorate(root,result,row),result)
if __name__=='__main__':unittest.main()
