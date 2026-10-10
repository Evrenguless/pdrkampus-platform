import json,tempfile,unittest
from pathlib import Path
from material_presentation import card,indexes
class MaterialAccessTests(unittest.TestCase):
 def render(self,entry):
  with tempfile.TemporaryDirectory() as d:
   root=Path(d)
   for name in ('data','src','seo'):(root/name).mkdir()
   (root/'data/resource-previews.json').write_text('{}')
   (root/'src/resource-page-links.js').write_text('const links = {};')
   (root/'seo/link-overrides.json').write_text(json.dumps({'entries':{'https://example.meb.k12.tr/missing.pdf':entry}}))
   indexes.cache_clear()
   return card(root,{'id':'sample','title':'Materyal','file':'https://example.meb.k12.tr/missing.pdf','fileType':'PDF'})
 def test_unavailable_file_has_no_download_link(self):
  html=self.render({'status':'unavailable','source_url':'https://example.meb.k12.tr/'})
  self.assertNotIn('missing.pdf',html);self.assertNotIn('class="material-download"',html)
  self.assertIn('Dosya bağlantısına erişilemiyor.',html);self.assertIn('Kaynak kurumun sitesini aç',html)
 def test_verified_replacement_is_used(self):
  html=self.render({'replacement_url':'https://example.meb.k12.tr/valid.pdf'})
  self.assertIn('valid.pdf',html);self.assertNotIn('missing.pdf',html)
if __name__=='__main__':unittest.main()
