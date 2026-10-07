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
if __name__=='__main__':unittest.main()
