# -*- coding: utf-8 -*-
import copy
import io
import json
from pathlib import Path
import tempfile
import unittest
import zipfile
from collect_resources import ROOT, Links, allowed, canonical, classify, collect, file_signature, resource_link, source_title, write_outputs


class CollectorTests(unittest.TestCase):
    def setUp(self):
        self.config = json.loads((ROOT / 'collector/config.json').read_text())
        self.config.update(seed_pages=['https://test.meb.k12.tr/'], seed_batch=1, max_pages=4, max_file_checks=4)
        self.page = 'https://test.meb.k12.tr/'
        self.file = self.page + 'dosyalar/akran-zorbaligi-sunum.pdf'

    def fake(self, pages, files):
        def get(url, limit):
            if url in pages: return pages[url].encode(), {'Content-Type': 'text/html; charset=utf-8'}, url
            if url in files: return files[url], {'Content-Type': 'application/pdf'}, url
            raise OSError('Unreachable test URL')
        return get

    def test_official_boundaries_and_unsafe_schemes(self):
        for url in ['https://meb.gov.tr.evil.example/a.pdf', 'https://evilmeb.k12.tr/a.pdf', 'http://127.0.0.1/a.pdf', 'https://u:p@test.meb.k12.tr/a', 'https://test.meb.k12.tr:8000/a', 'javascript:alert(1)']:
            self.assertFalse(allowed(url, self.config['allowed_domains']))
        self.assertTrue(allowed(self.file, self.config['allowed_domains']))

    def test_fragments_and_unicode_identity(self):
        self.assertEqual(canonical(self.file + '#p=2'), self.file)
        self.assertEqual(canonical(self.page + 'afiş.pdf'), canonical(self.page + 'afi%C5%9F.pdf'))
        self.assertNotEqual(canonical(self.file + '?id=1'), canonical(self.file + '?id=2'))

    def test_real_format_checks_reject_html_and_mislabelled_ooxml(self):
        self.assertFalse(file_signature(b'<html>access denied</html>', 'pdf'))
        self.assertTrue(file_signature(b'%PDF-1.7\nbody', 'pdf'))
        stream = io.BytesIO()
        with zipfile.ZipFile(stream, 'w') as z:
            z.writestr('[Content_Types].xml', '<Types/>'); z.writestr('word/document.xml', '<document/>')
        self.assertTrue(file_signature(stream.getvalue(), 'docx'))
        self.assertFalse(file_signature(stream.getvalue(), 'pptx'))

    def test_classification_uses_explicit_level_only(self):
        result = classify('Dijital güvenlik pano — İlkokul', self.config)
        self.assertEqual(result['levels'], ['İlkokul']); self.assertEqual(result['material_type'], 'Pano')
        self.assertIn('Dijital güvenlik', result['topics'])
        self.assertEqual(classify('Akran zorbalığı sunumu', self.config)['levels'], [])

    def test_known_catalogue_unchanged_and_repeat_run_is_idempotent(self):
        known = self.page + 'dosyalar/veli-form.pdf'
        catalogue = [{'id': 'original', 'file': known, 'sourcePage': self.page}]
        baseline = copy.deepcopy(catalogue)
        get = self.fake({self.page: f'<a href="{known}">Veli formu</a><a href="{self.file}">Akran zorbalığı sunumu</a>'}, {self.file: b'%PDF-1.7\nnew'})
        state, report = collect(self.config, catalogue, {}, get)
        self.assertEqual(len(state['candidates']), 1); self.assertEqual(report['new_candidates'], 1)
        self.assertEqual(state['candidates'][0]['status'], 'review_ready')
        second, report2 = collect(self.config, catalogue, state, get)
        self.assertEqual(second['candidates'], state['candidates']); self.assertEqual(report2['new_candidates'], 0)
        self.assertEqual(catalogue, baseline); self.assertEqual(report['database_writes'], 0)

    def test_content_duplicate_and_retry(self):
        second = self.page + 'dosyalar/pano.pdf'; third = self.page + 'dosyalar/envanter.pdf'
        get = self.fake({self.page: ''.join(f'<a href="{u}">Rehberlik sunumu</a>' for u in [self.file, second, third])}, {self.file: b'%PDF-1.7\nsame', second: b'%PDF-1.7\nsame'})
        state, report = collect(self.config, [], {}, get)
        self.assertEqual(report['statuses'], {'review_ready': 1, 'duplicate': 1, 'retry': 1})
        retry = next(row for row in state['candidates'] if row['status'] == 'retry')
        self.assertEqual(retry['file_url'], third)

    def test_page_file_limits_preserve_pending_work(self):
        self.config.update(max_pages=1, max_file_checks=1)
        second = self.page + 'dosyalar/pano.pdf'
        get = self.fake({self.page: f'<a href="{self.file}">Sunum</a><a href="{second}">Pano</a><a href="/rehberlik.html">Rehberlik</a>'}, {self.file: b'%PDF-1.7\na', second: b'%PDF-1.7\nb'})
        state, report = collect(self.config, [], {}, get)
        self.assertEqual(report['visited_pages'], 1); self.assertEqual(report['file_checks'], 1)
        self.assertEqual(report['statuses']['pending_check'], 1)
        self.assertIn(self.page + 'rehberlik.html', state['frontier'])

    def test_published_candidate_stops_reappearing(self):
        get = self.fake({self.page: f'<a href="{self.file}">Akran sunumu</a>'}, {self.file: b'%PDF-1.7\nx'})
        state, _ = collect(self.config, [], {}, get)
        second, report = collect(self.config, [{'file': self.file}], state, get)
        self.assertEqual(second['candidates'][0]['status'], 'already_catalogued')
        self.assertEqual(report['file_checks'], 0)

    def test_export_escapes_source_html_and_spreadsheet_formulas(self):
        get = self.fake({self.page: f'<a href="{self.file}">=HYPERLINK(&quot;evil&quot;) sunum &lt;script&gt;</a>'}, {self.file: b'%PDF-1.7\nx'})
        state, report = collect(self.config, [], {}, get)
        with tempfile.TemporaryDirectory() as d:
            output = Path(d) / 'exports'; write_outputs(output, state, report)
            self.assertNotIn('<script>', (output / 'index.html').read_text())
            self.assertIn("'=HYPERLINK", (output / 'review.csv').read_text(encoding='utf-8-sig'))

    def test_anchor_extracts_nested_title_and_img_alt(self):
        links = Links('<title>RAM</title><a href="p.pdf"><strong>Rehberlik</strong><img alt="pano"></a>')
        self.assertEqual(links.links, [('p.pdf', 'Rehberlik pano')])

    def test_news_thumbnails_and_school_schedules_are_not_materials(self):
        self.assertFalse(resource_link(self.page + 'resimler/k_123.jpg', 'Rehberlik pano'))
        self.assertFalse(resource_link(self.page + 'sinav_takvimi.pdf', 'Sınav takvimi'))
        self.assertFalse(resource_link(self.page + 'ogrenci_listesi.xlsx', 'Öğrenci listesi'))
        self.assertTrue(resource_link(self.page + 'resimler/akran-afisi.png', 'Akran zorbalığı afişi'))
        self.assertEqual(source_title('/dosyalar/6ac5de6ca8d95629736886_plan.pdf', '6ac5de6ca8d95629736886_plan.pdf'), 'plan')
        self.assertEqual(source_title('Tıklayınız.', '12345678_rehberlik_sunumu.pdf'), 'rehberlik sunumu')
        self.assertNotIn('Kriz ve yas', classify('Yasal haklar', self.config)['topics'])


if __name__ == '__main__': unittest.main()
