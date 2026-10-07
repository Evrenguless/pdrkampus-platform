# -*- coding: utf-8 -*-
"""Bounded document text inspection. Never stores document text or personal data."""
import hashlib
import io
import json
from pathlib import Path
import re
import subprocess
import shutil
import sys
import tempfile
import difflib
import xml.etree.ElementTree as ET
import zipfile
from collect_resources import ROOT, classify, fold, INSPECTION_VERSION


def ocr(path):
    if not shutil.which('tesseract'): raise ValueError('OCR not available')
    result = subprocess.run(['tesseract', str(path), 'stdout', '-l', 'tur+eng'], capture_output=True, text=True, check=True, timeout=15)
    return result.stdout


def extract(body, ext):
    if ext in ('doc', 'ppt', 'xls'):
        if not shutil.which('libreoffice'): raise ValueError('Legacy document converter unavailable')
        with tempfile.TemporaryDirectory(prefix='pdr-office-') as d:
            root = Path(d); source = root / ('source.' + ext); source.write_bytes(body); target = {'doc': 'docx', 'ppt': 'pptx', 'xls': 'xlsx'}[ext]
            profile = root/'profile'; (profile/'user').mkdir(parents=True)
            (profile/'user/registrymodifications.xcu').write_text('<?xml version="1.0"?><oor:items xmlns:oor="http://openoffice.org/2001/registry"><item oor:path="/org.openoffice.Office.Common/Security/Scripting"><prop oor:name="MacroSecurityLevel" oor:op="fuse"><value>3</value></prop></item></oor:items>')
            subprocess.run(['libreoffice', '-env:UserInstallation='+profile.as_uri(), '--headless', '--convert-to', target, '--outdir', str(root), str(source)], capture_output=True, check=True, timeout=20)
            text, info = extract((root/('source.'+target)).read_bytes(), target); info['format'] = ext.upper(); info['converted_for_inspection'] = True
            return text, info
    if ext in ('png', 'jpg', 'jpeg', 'webp'):
        with tempfile.TemporaryDirectory(prefix='pdr-pano-') as d:
            source = Path(d)/('source.'+ext); source.write_bytes(body)
            return ocr(source), {'format': ext.upper(), 'ocr': True}
    if ext == 'pdf':
        from pypdf import PdfReader
        reader = PdfReader(io.BytesIO(body), strict=False)
        if reader.is_encrypted or len(reader.pages) > 80: raise ValueError('Encrypted or over 80 pages')
        text = []
        for page_index, page in enumerate(reader.pages, 1):
            stream = page.get_contents()
            if stream is not None and len(stream.get_data()) > 4000000: raise ValueError('PDF stream exceeds limit')
            value = page.extract_text() or ''
            if len(value) < 15:
                if not page.images: continue
                if len(reader.pages) > 10 or not shutil.which('pdftoppm'): raise ValueError('Scanned PDF exceeds OCR bounds')
                with tempfile.TemporaryDirectory(prefix='pdr-ocr-') as d:
                    source = Path(d)/'source.pdf'; source.write_bytes(body); image = Path(d)/'page'
                    index = page_index
                    subprocess.run(['pdftoppm','-f',str(index),'-l',str(index),'-r','110','-singlefile','-png',str(source),str(image)], capture_output=True, check=True, timeout=15)
                    value = ocr(image.with_suffix('.png'))
                    if len(value) < 15: raise ValueError('Unreadable image page requires review')
            text.append(value)
            if sum(map(len, text)) > 400000: raise ValueError('Text exceeds inspection limit')
        fields = reader.get_fields() or {}
        filled = sum(bool(field.get('/V')) and str(field.get('/V')) not in ('/Off', '') for field in fields.values())
        return '\n'.join(text), {'format': 'PDF', 'page_count': len(reader.pages), 'filled_interactive_fields': filled}
    if ext in ('docx', 'pptx', 'xlsx'):
        with zipfile.ZipFile(io.BytesIO(body)) as archive:
            parts = [info for info in archive.infolist() if info.filename.endswith('.xml') and info.filename.startswith(('word/', 'ppt/slides/', 'ppt/notesSlides/', 'xl/'))]
            if sum(info.file_size for info in parts) > 12000000: raise ValueError('Expanded document exceeds limit')
            text = []
            for info in parts:
                root = ET.fromstring(archive.read(info))
                if ext in ('docx', 'pptx'):
                    # Runs within one paragraph must be joined, not split into artificial words.
                    for paragraph in root.iter():
                        if paragraph.tag.split('}')[-1] == 'p':
                            text.append(''.join(node.text or '' for node in paragraph.iter() if node.tag.split('}')[-1] == 't'))
                elif info.filename.endswith('sharedStrings.xml'):
                    for entry in root.iter():
                        if entry.tag.split('}')[-1] == 'si': text.append(''.join(node.text or '' for node in entry.iter() if node.tag.split('}')[-1] == 't'))
                else:
                    for cell in root.iter():
                        if cell.tag.split('}')[-1] == 'c' and cell.get('t') != 's':
                            text.append(''.join(node.text or '' for node in cell.iter() if node.tag.split('}')[-1] in ('t', 'v')))
            result = '\n'.join(text)
            if len(result) > 400000: raise ValueError('Text exceeds inspection limit')
            return result, {'format': ext.upper(), 'slide_count': sum(bool(re.fullmatch(r'ppt/slides/slide\d+\.xml', info.filename)) for info in parts) if ext == 'pptx' else None}
    raise ValueError('Binary office/image formats require manual review in this version')


def has_identity(text):
    for value in re.findall(r'(?<!\d)[1-9]\d{10}(?!\d)', text):
        digits = list(map(int, value))
        if ((sum(digits[0:9:2]) * 7 - sum(digits[1:8:2])) % 10 == digits[9] and sum(digits[:10]) % 10 == digits[10]):
            return True
    return False


def assess(text, title, ext, config):
    if len(title.split()) < 2:
        source_key = re.sub(r'[^a-z]', '', fold(title))
        for line in text.splitlines()[:20]:
            line = ' '.join(line.split())
            key = re.sub(r'[^a-z]', '', fold(line))
            if 8 <= len(line) <= 140 and len(line.split()) >= 2 and difflib.SequenceMatcher(None, source_key, key).ratio() >= .75:
                title = line; break
    normalized = fold(text)
    flags = []
    if len(text.strip()) < 120: flags.append('insufficient_readable_text')
    if has_identity(text): flags.append('identity_number_pattern')
    if re.search(r'(ogrenci|personel|sinif)\s+(listesi|listeleri|notlari|puanlari)', normalized): flags.append('individual_list_context')
    if re.search(r'(?i:ad[iı]?\s*soyad[iı]?)\s*[:：]\s*[A-ZÇĞİÖŞÜ][a-zçğıöşü]+\s+[A-ZÇĞİÖŞÜ][a-zçğıöşü]+', text): flags.append('filled_name_field')
    if re.search(r'(?<!\d)(?:\+?90\s*)?0?5\d{2}[\s().-]*\d{3}[\s.-]*\d{2}[\s.-]*\d{2}(?!\d)', text): flags.append('mobile_contact_pattern')
    emails = re.findall(r'[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}', text)
    if any(not value.lower().endswith(('.meb.gov.tr', '.meb.k12.tr', '@meb.gov.tr')) for value in emails): flags.append('personal_email_pattern')
    source = classify(title, config); content = classify(text, config)
    topics = sorted(set(source['topics']) & set(content['topics']))
    levels = sorted(set(source['levels']) & set(content['levels']))
    kind = source['material_type']
    if ext in ('pptx', 'ppt'): kind = 'Sunum'
    if kind == 'Belirtilmiyor': kind = classify(text[:1200], config)['material_type']
    if not topics: flags.append('topic_not_supported_by_document')
    if kind == 'Belirtilmiyor': flags.append('material_type_unclear')
    if len(title.split()) < 2 or len(title) < 8 or len(title) > 180: flags.append('title_requires_review')
    # Do not assert a school stage unless source metadata AND document agree.
    if source['levels'] and not levels: flags.append('school_stage_conflict')
    return {'version': INSPECTION_VERSION, 'eligible': not flags, 'title': title, 'review_reasons': flags, 'text_sha256': hashlib.sha256(' '.join(text.split()).encode()).hexdigest(), 'text_characters': len(text), 'topics': topics, 'levels': levels, 'material_type': kind, 'method': 'full_readable_document_text_and_source_metadata', 'personal_data_stored': False}


def inspect(body, ext, title):
    with tempfile.TemporaryDirectory(prefix='pdr-resource-') as d:
        path = Path(d) / 'document'; path.write_bytes(body)
        try:
            result = subprocess.run([sys.executable, str(Path(__file__).resolve()), str(path), ext, title], capture_output=True, timeout=45, check=True, text=True)
            return json.loads(result.stdout)
        except (subprocess.SubprocessError, ValueError) as error:
            return {'version': INSPECTION_VERSION, 'eligible': False, 'review_reasons': ['document_inspection_failed'], 'method': 'bounded_document_inspection', 'personal_data_stored': False}


if __name__ == '__main__':
    try:
        if sys.platform.startswith('linux'):
            import resource
            resource.setrlimit(resource.RLIMIT_AS, (1536 * 1024 * 1024, 1536 * 1024 * 1024))
        config = json.loads((ROOT / 'collector/config.json').read_text())
        text, info = extract(Path(sys.argv[1]).read_bytes(), sys.argv[2])
        result = assess(text, sys.argv[3], sys.argv[2], config)
        result['document_info'] = info
        if info.get('filled_interactive_fields'):
            result['eligible'] = False; result['review_reasons'].append('filled_interactive_form')
        result['word_count'] = len(text.split())
        print(json.dumps(result, ensure_ascii=False))
    except Exception:
        print(json.dumps({'version': INSPECTION_VERSION, 'eligible': False, 'review_reasons': ['unreadable_or_unsupported_document'], 'personal_data_stored': False}))
