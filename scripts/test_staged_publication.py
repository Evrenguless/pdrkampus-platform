import copy
import hashlib
import tempfile
import unittest
from pathlib import Path
from unittest.mock import Mock, patch
from prepare_staged_publication import candidate, prepare_one
import test_resource_publication
from publish_collected_resources import append_resources
from build_resource_previews import build


class ImportTests(unittest.TestCase):
    def setUp(self):
        self.body = b'%PDF-fixture'
        self.row = {'id':'toplanan-test', 'title':'Akran zorbalığı sunumu',
                    'file':'https://test.meb.k12.tr/akran-sunum.pdf', 'fileType':'PDF',
                    'sourcePage':'https://test.meb.k12.tr/rehberlik.html',
                    'sha256':hashlib.sha256(self.body).hexdigest(),
                    'publicationApproved':False, 'licenseVerified':False, 'reviewStatus':'editorial_review_required'}
        self.approval = {'approvedAt':'2026-10-09T14:40:00Z','basis':'explicit user permission'}
        self.config = {'allowed_domains':['meb.gov.tr','meb.k12.tr'],'max_file_bytes':15728640}
        self.fetcher = Mock()
        self.fetcher.get.return_value = (self.body, {}, self.row['file'])

    def test_unknown_domain_and_existing_content_never_downloaded(self):
        for row, hashes in [(dict(self.row, file='https://example.test/a.pdf'),set()),(self.row,{self.row['sha256']})]:
            result = prepare_one(row,self.approval,self.config,self.fetcher,Path('/tmp'),set(),hashes)
            self.assertNotEqual(result['status'],'ready')
        self.fetcher.get.assert_not_called()

    def test_source_changes_and_redirect_to_existing_fail_closed(self):
        row=dict(self.row,sha256='a'*64)
        self.assertEqual(prepare_one(row,self.approval,self.config,self.fetcher,Path('/tmp'),set(),set())['reason'],'source_changed_since_import')
        result=prepare_one(self.row,self.approval,self.config,self.fetcher,Path('/tmp'),{self.row['file']},set())
        self.assertEqual(result['status'],'duplicate')

    def test_https_downgrade_cannot_be_published(self):
        self.fetcher.get.return_value=(self.body,{},self.row['file'].replace('https://','http://'))
        result=prepare_one(self.row,self.approval,self.config,self.fetcher,Path('/tmp'),set(),set())
        self.assertEqual(result['reason'],'redirect_outside_https_policy')

    def test_inspection_and_real_preview_are_both_required(self):
        baseline=copy.deepcopy(self.row)
        fixture=test_resource_publication.PublicationTests();fixture.setUp()
        for gate in [dict(eligible=False,review_reasons=['personal_data']), fixture.row['inspection']]:
            with patch('prepare_staged_publication.inspect', return_value=gate), patch('prepare_staged_publication.build', return_value={}) as render:
                result=prepare_one(self.row,self.approval,self.config,self.fetcher,Path('/tmp'),set(),set())
                self.assertNotEqual(result['status'],'ready')
                if not gate['eligible']: render.assert_not_called()
        with patch('prepare_staged_publication.inspect',return_value=fixture.row['inspection']), patch('prepare_staged_publication.build',return_value={'thumbnail':'/a.jpg','previews':['/a.jpg']}) as render:
            result=prepare_one(self.row,self.approval,self.config,self.fetcher,Path('/tmp'),set(),set())
            self.assertEqual(result['status'],'ready')
            self.assertEqual(render.call_args.kwargs['source_body'],self.body)
        self.assertEqual(self.row,baseline)

    def test_publication_retains_explicit_approval_and_import_identity(self):
        fixture=test_resource_publication.PublicationTests();fixture.setUp()
        row=dict(fixture.row,publicationApproved=True,licenseVerified=True,reviewStatus='approved',approvalBasis='user permission',approvedAt=self.approval['approvedAt'],importId=self.row['id'])
        records,ids=append_resources([], [row], [])
        self.assertEqual(len(ids),1)
        for key in ('publicationApproved','licenseVerified','reviewStatus','approvalBasis','approvedAt','importId'):
            self.assertEqual(records[0][key],row[key])

    def test_cached_preview_rejects_hash_mismatch(self):
        with tempfile.TemporaryDirectory() as directory:
            root=Path(directory);(root/'seo').mkdir();(root/'seo/link-overrides.json').write_text('{"entries":{}}')
            row={'id':'test','file':self.row['file'],'fileType':'PDF','contentSha256':'a'*64}
            with self.assertRaisesRegex(ValueError,'hash mismatch'):
                build(row,root=root,source_body=self.body)


if __name__ == '__main__': unittest.main()
