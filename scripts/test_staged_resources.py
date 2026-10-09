import copy
import hashlib
import json
import unittest
from pathlib import Path
from review_staged_resources import ROOT, audit, validate_staging
import test_resource_publication
from publish_collected_resources import publishable


class StagingTests(unittest.TestCase):
    def test_import_is_exact_and_unapproved(self):
        path = ROOT / '_staging/resources-1787.json'
        self.assertEqual(hashlib.sha256(path.read_bytes()).hexdigest(),
                         '12c107ce49abe8914d0cd4052b61d466d03d1e16a1e9f4cb7a8a4a05b0e699f2')
        rows = json.loads(path.read_text())
        validate_staging(rows)
        changed = copy.deepcopy(rows)
        changed[0]['publicationApproved'] = True
        with self.assertRaises(ValueError): validate_staging(changed)
        self.assertEqual(len({r['id'] for r in rows}), 1787)
        self.assertEqual(len({r['sha256'] for r in rows}), 1787)

    def test_audit_preserves_rows_and_identifies_category_and_title_problems(self):
        row = {'id': 'x', 'sha256': 'y', 'file': 'https://example.test/a.pdf',
               'title': 'İndir', 'topic': 'unknown', 'level': 'Belirtilmemiş'}
        before = copy.deepcopy(row)
        report = audit([row], [])
        self.assertEqual(row, before)
        self.assertIn('unknown_category', report['issues'][0]['reasons'])
        self.assertIn('short_or_generic_title', report['issues'][0]['reasons'])
        self.assertEqual(report['public_additions'], 0)

    def test_collector_cannot_override_explicit_pending_import(self):
        fixture = test_resource_publication.PublicationTests()
        fixture.setUp()
        self.assertTrue(publishable(fixture.row, set(), set()))
        for flags in [dict(publicationApproved=False, licenseVerified=False, reviewStatus='editorial_review_required'),
                      dict(publicationApproved=True),
                      dict(publicationApproved=True, licenseVerified=True, reviewStatus='editorial_review_required')]:
            self.assertFalse(publishable(dict(fixture.row, **flags), set(), set()))

    def test_pages_excludes_staging(self):
        self.assertIn('  - _staging', (ROOT / '_config.yml').read_text())


if __name__ == '__main__': unittest.main()
