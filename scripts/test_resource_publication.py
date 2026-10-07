# -*- coding: utf-8 -*-
import copy
import hashlib
import json
from pathlib import Path
import unittest
import tempfile
import io
import zipfile
import xml.etree.ElementTree as ET
from collect_resources import ROOT
from inspect_resource import assess, extract
from publish_collected_resources import append_resources, publishable
from resource_seo import build_pages


class PublicationTests(unittest.TestCase):
    def setUp(self):
        self.config = json.loads((ROOT / 'collector/config.json').read_text())
        self.text = ('Akran zorbalığı sunumu. Akran ilişkilerinde iletişim ve saygı, güvenli okul ortamı. ' * 4)
        self.row = {'id': 'a' * 24, 'title': 'Akran zorbalığı sunumu', 'file_url': 'https://test.meb.k12.tr/akran-sunum.pdf', 'file_type': 'PDF', 'source_pages': ['https://test.meb.k12.tr/rehberlik.html'], 'source_host': 'test.meb.k12.tr', 'sha256': 'b' * 64, 'status': 'review_ready', 'access_verified_at': '2026-10-07T00:00:00Z', 'discovered_at': '2026-10-07T00:00:00Z'}
        self.row['inspection'] = assess(self.text, self.row['title'], 'pdf', self.config)

    def test_readable_agreeing_document_can_be_added_without_changing_existing(self):
        existing = [{'id': 'original', 'file': 'https://test.meb.k12.tr/original.pdf', 'contentSha256': 'c' * 64}]
        baseline = copy.deepcopy(existing)
        result, added = append_resources(existing, [self.row], [])
        self.assertEqual(existing, baseline); self.assertEqual(result[0], baseline[0]); self.assertEqual(len(added), 1)
        self.assertEqual(result[1]['level'], 'Belirtilmiyor')
        again, added = append_resources(result, [self.row], [])
        self.assertEqual(again, result); self.assertFalse(added)

    def test_identity_number_and_filled_names_stop_publication(self):
        # Synthetic checksum-valid number generated from a numeric prefix, not a real identity.
        prefix = [1, 2, 3, 4, 5, 6, 7, 8, 9]
        prefix.append((sum(prefix[::2]) * 7 - sum(prefix[1::2])) % 10); prefix.append(sum(prefix) % 10)
        for fragment in ['Adı Soyadı: Ahmet Yılmaz', ''.join(map(str, prefix)), 'Öğrenci listesi', '0555 123 45 67', 'ornek@example.com']:
            gate = assess(self.text + fragment, self.row['title'], 'pdf', self.config)
            self.assertFalse(gate['eligible'], fragment)
            self.assertFalse(gate['personal_data_stored'])

    def test_blank_name_field_remains_usable(self):
        gate = assess(self.text + 'Adı Soyadı: ................', self.row['title'], 'pdf', self.config)
        self.assertTrue(gate['eligible'])

    def test_unreadable_or_conflicting_metadata_stays_in_review(self):
        self.assertFalse(assess('', self.row['title'], 'pdf', self.config)['eligible'])
        self.assertFalse(assess('Kariyer seçimi ve meslekler ' * 12, self.row['title'], 'pdf', self.config)['eligible'])
        self.assertFalse(assess(self.text, 'Akran zorbalığı sunumu İlkokul', 'pdf', self.config)['eligible'])
        self.assertFalse(assess(self.text, 'akransunumu', 'pdf', self.config)['eligible'])

    def test_url_hash_and_inspection_gate_fail_closed(self):
        for field, value in [('file_url', 'https://evil.example/a.pdf'), ('file_type', 'DOC'), ('sha256', ''), ('status', 'retry'), ('source_pages', ['http://test.meb.k12.tr/'])]:
            row = copy.deepcopy(self.row); row[field] = value
            self.assertFalse(publishable(row, set(), set()), field)
        row = copy.deepcopy(self.row); row['inspection']['version'] = 1
        self.assertFalse(publishable(row, set(), set()))
        row = copy.deepcopy(self.row); row.pop('inspection')
        self.assertFalse(publishable(row, set(), set()))

    def test_daily_limit_and_duplicate_contents(self):
        rows = []
        for i in range(10):
            row = copy.deepcopy(self.row); row.update(id=f'{i:024x}', file_url=f'https://test.meb.k12.tr/akran-{i}.pdf', sha256=hashlib.sha256(str(i).encode()).hexdigest()); rows.append(row)
            row['inspection']['text_sha256'] = hashlib.sha256(('text-' + str(i)).encode()).hexdigest()
        result, added = append_resources([], rows, [], limit=8)
        self.assertEqual(len(added), 8)
        self.assertEqual(len(result), 8)
        rows[1]['sha256'] = rows[0]['sha256']
        result, added = append_resources([], rows[:2], [])
        self.assertEqual(len(added), 1)

    def test_current_supplementary_catalogue_is_valid_and_unique(self):
        rows = json.loads((ROOT / 'data/collected-resources.json').read_text())
        original = json.loads((ROOT / 'data/library.json').read_text()) + json.loads((ROOT / 'data/forms.json').read_text())
        ids = {r['id'] for r in original}; urls = {r['file'] for r in original}; hashes = set()
        for row in rows:
            self.assertTrue(row['id'].startswith('collected-')); self.assertNotIn(row['id'], ids); ids.add(row['id'])
            self.assertNotIn(row['file'], urls); urls.add(row['file'])
            self.assertNotIn(row['contentSha256'], hashes); hashes.add(row['contentSha256'])
            self.assertEqual(row['sourceType'], 'official')

    def test_resource_pages_preserve_old_sitemap_and_include_real_source_links(self):
        records, _ = append_resources([], [self.row], [])
        with tempfile.TemporaryDirectory() as d:
            root = Path(d); (root/'konu/akran-zorbaligi').mkdir(parents=True); (root/'seo').mkdir()
            (root/'konu/akran-zorbaligi/index.html').write_text('<header></header><nav></nav><footer></footer>')
            (root/'sitemap.xml').write_text('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url><loc>https://pdrkampus.com/original/</loc></url></urlset>')
            (root/'seo/approved-edits.json').write_text(json.dumps({'edits': {'sitemap.xml': {}}}))
            build_pages(root, records)
            urls = {n.text for n in ET.parse(root/'sitemap.xml').iter('{http://www.sitemaps.org/schemas/sitemap/0.9}loc')}
            self.assertIn('https://pdrkampus.com/original/', urls)
            page = root/records[0]['pagePath'].lstrip('/')/'index.html'
            content = page.read_text()
            self.assertIn(self.row['file_url'], content); self.assertIn(self.row['source_pages'][0], content)
            self.assertIn('rel="canonical"', content); self.assertIn('application/ld+json', content)
            before = (root/'sitemap.xml').read_bytes(); build_pages(root, records)
            self.assertEqual(before, (root/'sitemap.xml').read_bytes())

    def test_word_runs_preserve_a_split_school_stage_heading(self):
        stream = io.BytesIO()
        with zipfile.ZipFile(stream,'w') as archive:
            archive.writestr('word/document.xml','<w:document xmlns:w="urn:word"><w:p><w:r><w:t>2. SI</w:t></w:r><w:r><w:t>NIF</w:t></w:r></w:p></w:document>')
        text, _ = extract(stream.getvalue(), 'docx')
        self.assertEqual(text, '2. SINIF')


if __name__ == '__main__': unittest.main()
