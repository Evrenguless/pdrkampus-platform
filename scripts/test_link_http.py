import unittest
from http.server import ThreadingHTTPServer,BaseHTTPRequestHandler
from threading import Thread
from link_http import check_external,transport_url
class Handler(BaseHTTPRequestHandler):
 def log_message(self,*a):pass
 def do_HEAD(self):
  self.send_response(405 if self.path=='/fallback' else 404 if self.path=='/missing' else 403 if self.path=='/restricted' else 200);self.end_headers()
 def do_GET(self):self.send_response(200);self.end_headers()
class Tests(unittest.TestCase):
 @classmethod
 def setUpClass(cls):
  cls.server=ThreadingHTTPServer(('127.0.0.1',0),Handler);cls.thread=Thread(target=cls.server.serve_forever,daemon=True);cls.thread.start();cls.base='http://127.0.0.1:'+str(cls.server.server_port)
 @classmethod
 def tearDownClass(cls):cls.server.shutdown();cls.server.server_close();cls.thread.join()
 def test_head_fallback(self):self.assertEqual(check_external(self.base+'/fallback')[0],200)
 def test_broken_link_remains_error(self):self.assertEqual(check_external(self.base+'/missing')[0],404)
 def test_restricted_link_is_not_reported_as_404(self):self.assertEqual(check_external(self.base+'/restricted')[0],403)
 def test_unicode_and_percent_encoding_preserved(self):
  self.assertEqual(transport_url('https://example.com/İlkokul%20A.pdf?q=ç&x=%2F'),'https://example.com/%C4%B0lkokul%20A.pdf?q=%C3%A7&x=%2F')
 def test_credentials_and_other_schemes_rejected(self):
  for url in ['file:///etc/passwd','https://name:secret@example.com/']:
   self.assertIsNone(check_external(url)[0])
if __name__=='__main__':unittest.main(verbosity=2)
