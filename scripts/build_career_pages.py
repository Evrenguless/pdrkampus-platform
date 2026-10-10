"""Generate crawlable recruitment news and university guides, without global navigation links."""
from datetime import datetime, timezone, timedelta
from html import escape
from pathlib import Path
from urllib.parse import urlparse
import argparse
import json
import re
import xml.etree.ElementTree as ET

ROOT = Path(__file__).resolve().parents[1]
BASE = 'https://pdrkampus.com'
PREFIXES = ('/personel-alim-ilanlari/', '/bolumler/')
NS = 'http://www.sitemaps.org/schemas/sitemap/0.9'
E = escape
MONTHS = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık']


def date_text(value, with_time=False):
    if not value: return 'Resmî ilandan kontrol edin'
    d = datetime.fromisoformat(value)
    text = f'{d.day} {MONTHS[d.month-1]} {d.year}'
    return text + ((' · Saat için resmî ilanı kontrol edin' if len(value) == 10 else f' · {d:%H.%M} (Türkiye saati)') if with_time else '')


def boundary(value):
    return datetime.fromisoformat(value + 'T00:00:00+03:00' if len(value) == 10 else value)


def status(row, now):
    if row.get('withdrawn'):
        return 'withdrawn', 'İlan geri çekildi'
    if not row.get('startsAt') or not row.get('deadline'): return ('unknown', 'Takvimi resmî kaynaktan kontrol edin')
    end = boundary(row['deadline'])
    # A date alone does not prove that applications remain open until midnight.
    if len(row['deadline']) == 10 and end <= now < end + timedelta(days=1):
        return 'unknown', 'Son gün · Saati resmî kaynaktan kontrol edin'
    if now >= end + (timedelta(days=1) if len(row['deadline']) == 10 else timedelta()):
        return 'closed', 'Başvuru sona erdi'
    if now < boundary(row['startsAt']):
        return 'upcoming', 'Başvuru başlayacak'
    return 'open', 'Başvuru açık'


def official_url(value):
    host = urlparse(value).hostname or ''
    assert value.startswith('https://') and (host.endswith('.gov.tr') or host.endswith('.edu.tr')), f'Resmî HTTPS kaynak gerekli: {value}'


def validate(jobs, programs):
    for rows in (jobs['announcements'], programs):
        slugs = [r['slug'] for r in rows]
        assert len(set(slugs)) == len(slugs), 'Tekrarlanan slug'
        assert all(re.fullmatch(r'[a-z0-9]+(?:-[a-z0-9]+)*', s) for s in slugs), 'Geçersiz slug'
    known = {r['slug'] for r in programs}
    datetime.fromisoformat(jobs['reviewedAt'])
    for row in jobs['announcements']:
        for name in ('title', 'institution', 'city', 'category', 'summary', 'kpss', 'selection', 'sourceLabel'):
            assert row[name].strip(), f'Eksik alan: {name}'
        for name in ('sourceUrl', 'documentUrl', 'applyUrl'):
            official_url(row[name])
        start, end = [boundary(row[k]) for k in ('startsAt', 'deadline')]
        assert start.utcoffset() is not None and end.utcoffset() is not None, 'Saat dilimi gerekli'
        assert start < end, 'Başvuru tarihleri hatalı'
        assert row['quota'] > 0 and sum(p['quota'] for p in row['positions']) == row['quota'], 'Kontenjan toplamı hatalı'
        assert all(p['quota'] > 0 for p in row['positions']), 'Pozisyon kontenjanı hatalı'
        assert set(row.get('relatedPrograms', [])) <= known, 'Bölüm bağlantısı bulunamadı'
        assert row['education'] and row['positions'] and row['conditions'] and row['steps'], 'İlan ayrıntısı gerekli'
        assert row['publishedAt'] <= row['updatedAt'] <= jobs['reviewedAt'], 'İlan güncelleme tarihi hatalı'
    for row in programs:
        official_url(row['sourceUrl'])
        assert row['score'] in ('SAY', 'EA', 'SÖZ', 'DİL', 'TYT'), 'Puan türü hatalı'
        assert row['rank'] is None or row['rank'] > 0, 'Başarı sırası hatalı'
        assert row['years'] > 0 and row['ruleYear'] > 0
        datetime.fromisoformat(row['reviewedAt'])


def link(url, label):
    return f'<a href="{E(url)}" target="_blank" rel="noopener noreferrer">{E(label)} ↗</a>'


def section(ident, title, body):
    return f'<section id="{ident}"><h2>{E(title)}</h2>{body}</section>'


def paras(items):
    return ''.join(f'<p>{E(s)}</p>' for s in items)


def items(rows, ordered=False):
    tag = 'ol' if ordered else 'ul'
    return f'<{tag}>' + ''.join(f'<li>{E(s)}</li>' for s in rows) + f'</{tag}>'


def facts(pairs):
    return '<dl class="career-facts">' + ''.join(f'<div><dt>{E(k)}</dt><dd>{E(str(v))}</dd></div>' for k, v in pairs) + '</dl>'


def badge(row, now):
    key, label = status(row, now)
    return f'<span class="career-status" data-start="{E((row.get("startsAt") or ""))}" data-deadline="{E((row.get("deadline") or ""))}" data-withdrawn="{str(row.get("withdrawn", False)).lower()}" data-status="{key}">{label} · {date_text(now.isoformat())} itibarıyla</span>'


def breadcrumb(group, title=None):
    path = '/personel-alim-ilanlari/' if group == 'Personel alım ilanları' else '/bolumler/'
    tail = f'<a href="{path}">{E(group)}</a><span aria-hidden="true">/</span><span aria-current="page">{E(title)}</span>' if title else f'<span aria-current="page">{E(group)}</span>'
    return '<nav class="career-breadcrumb" aria-label="İçerik yolu"><a href="/">PDR Kampüs</a><span aria-hidden="true">/</span>' + tail + '</nav>'


def hero(kicker, title, lead, aside):
    return f'<div class="career-hero"><div><p class="career-kicker">{E(kicker)}</p><h1>{E(title)}</h1><p class="career-lead">{E(lead)}</p></div><aside class="career-guide-link">{aside}</aside></div>'


def options(values):
    return '<option value="">Tümü</option>' + ''.join(f'<option value="{E(v)}">{E(v)}</option>' for v in sorted(set(values)))


def toolbar(kind, fields):
    body = '<label for="careerQuery">' + ('İlan ara' if kind == 'jobs' else 'Bölüm ara') + '<input id="careerQuery" name="q" type="search" placeholder="' + ('Kurum, şehir veya pozisyon' if kind == 'jobs' else 'Bölüm adı veya alan') + '"></label>'
    for key, label, values in fields:
        body += f'<label for="career-{key}">{E(label)}<select id="career-{key}" name="{key}">{options(values)}</select></label>'
    return f'<form class="career-toolbar" data-filter="{kind}" hidden>{body}<button type="reset">Temizle</button></form>'


def structured(kind, title, path, published=None, updated=None):
    data = {'@context': 'https://schema.org', '@type': kind, 'headline' if kind.endswith('Article') else 'name': title, 'url': BASE + path, 'inLanguage': 'tr-TR'}
    if published:
        data.update(datePublished=published, dateModified=updated, author={'@type': 'Organization', 'name': 'PDR Kampüs', 'url': BASE + '/'}, publisher={'@type': 'Organization', 'name': 'PDR Kampüs', 'url': BASE + '/'}, mainEntityOfPage={'@type': 'WebPage', '@id': BASE + path})
    return data


def generate():
    jobs = json.loads((ROOT / 'data/recruitment.json').read_text())
    programs = json.loads((ROOT / 'data/programs.json').read_text())
    validate(jobs, programs)
    now = datetime.fromisoformat(jobs['reviewedAt'] + 'T00:00:00+03:00')
    shell = (ROOT / 'scripts/templates/career-shell.txt').read_text()
    header, footer = shell.split('<!-- CONTENT -->')
    outputs, modified = {}, {}

    def page(path, title, description, body, schema, lastmod):
        url = BASE + path
        schema_text = json.dumps(schema, ensure_ascii=False).replace('<', '\\u003c')
        html = f'''<!doctype html>
<html lang="tr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="theme-color" content="#f6f5f0"><title>{E(title)} | PDR Kampüs</title>
<meta name="description" content="{E(description)}"><link rel="canonical" href="{url}">
<meta property="og:title" content="{E(title)} | PDR Kampüs"><meta property="og:description" content="{E(description)}">
<meta property="og:type" content="{'article' if schema['@type'].endswith('Article') else 'website'}"><meta property="og:url" content="{url}">
<link rel="icon" href="/assets/logo.png"><link rel="stylesheet" href="/src/style.css"><link rel="stylesheet" href="/src/shell-refresh.css"><link rel="stylesheet" href="/src/design-system.css"><link rel="stylesheet" href="/src/career.css?v=20261006-1">
<script type="application/ld+json">{schema_text}</script></head><body id="top">
<a class="career-skip" href="#careerContent">İçeriğe geç</a>{header}<main id="careerContent" class="career-shell">{body}</main>{footer}
<script type="module" src="/src/menu.js?v=20261005-2"></script><script type="module" src="/src/career.js?v=20261007-1"></script></body></html>
'''
        outputs[path.strip('/') + '/index.html'] = html
        modified[url] = lastmod

    announcements = sorted(jobs['announcements'], key=lambda r: r['publishedAt'], reverse=True)
    feed_path = ROOT / 'data/recruitment-feed.json'
    feed = json.loads(feed_path.read_text()) if feed_path.exists() else {'records': []}
    feed_rows = feed['records']
    checked_day = feed.get('updatedAt', jobs['reviewedAt'])[:10]
    now = datetime.fromisoformat(checked_day + 'T00:00:00+03:00')
    cards = ''
    for row in announcements:
        row = dict(row)
        live = next((r for r in feed_rows if r.get('manualSlug') == row['slug']), None)
        if live:
            row.update(startsAt=live['startsAt'], deadline=live['deadline'])
        path = PREFIXES[0] + row['slug'] + '/'
        search_text = ' '.join([row['title'], row['institution'], row['city'], row['summary']] + [p['name'] for p in row['positions']])
        cards += f'<article class="career-card" data-career-card data-search="{E(search_text)}" data-city="{E(row["city"])}" data-education="{E(json.dumps(row["education"], ensure_ascii=False))}"><div class="career-card-body"><div class="career-tags"><span class="career-tag">{E(row["category"])}</span>{badge(row, now)}</div><h2><a href="{path}">{E(row["title"])}</a></h2><p>{E(row["summary"])}</p>' + facts([('Görev yeri', row['city']), ('Kontenjan', f'{row["quota"]} kişi'), ('Öğrenim', ', '.join(row['education'])), ('Son başvuru', date_text(row['deadline'], True))]) + f'</div><div class="career-card-footer"><time datetime="{row["publishedAt"]}">{date_text(row["publishedAt"])}</time><a href="{path}" aria-label="{E(row["title"])}: ilan detayları">İlanı incele →</a></div></article>'
        body = breadcrumb('Personel alım ilanları', row['title']) + hero('PERSONEL ALIMI · ' + row['city'], row['title'], row['summary'], '<strong>Başvuru takvimi</strong>' + badge(row, now) + facts([('Son başvuru', date_text(row['deadline'], True))]))
        body += f'<p class="career-meta">Kaynak ilan: <time datetime="{row["publishedAt"]}">{date_text(row["publishedAt"])}</time> · İçerik kontrolü: <time datetime="{row["updatedAt"]}">{date_text(row["updatedAt"])}</time></p>'
        overview = facts([('Kurum', row['institution']), ('Kontenjan', f'{row["quota"]} kişi'), ('Başlangıç', date_text(row['startsAt'], True)), ('Bitiş', date_text(row['deadline'], True))]) + paras([row['kpss'], row['selection']])
        positions = '<div class="career-table-wrap" tabindex="0" role="region" aria-label="Pozisyon tablosu, yatay kaydırılabilir"><table class="career-table"><caption>Pozisyonlar ve mezuniyet koşulları</caption><thead><tr><th scope="col">Pozisyon / ilan kodu</th><th scope="col">Kontenjan</th><th scope="col">Koşullar</th></tr></thead><tbody>'
        for p in row['positions']:
            positions += f'<tr><td><strong>{E(p["name"])}</strong><br>{E(p["code"])}<br>{E(p["education"])}</td><td>{p["quota"]}</td><td>{E(p["requirements"])}</td></tr>'
        positions += '</tbody></table></div>'
        article = section('ozet', 'İlan özeti ve KPSS şartı', overview) + section('pozisyonlar', 'Hangi pozisyonlara alım yapılacak?', positions) + section('sartlar', 'Başvuru koşulları', items(row['conditions'])) + section('basvuru', 'Nasıl başvurulur?', items(row['steps'], True) + f'<p data-apply-note>{"Başvuru süresi sona erdi. Sonuç duyuruları için kurumun sayfasını izleyin." if status(row, now)[0] == "closed" else "Başvuru, kurumun resmî sistemi üzerinden yapılır."}</p><a class="career-action" data-apply-link data-start="{(row.get("startsAt") or "")}" data-deadline="{(row.get("deadline") or "")}" data-withdrawn="{str(row.get("withdrawn", False)).lower()}" href="{row["applyUrl"]}" target="_blank" rel="noopener noreferrer"{ " hidden" if status(row, now)[0] != "open" else ""}>Resmî başvuru sistemine git ↗</a>') + section('kaynaklar', 'Resmî kaynaklar', link(row['sourceUrl'], row['sourceLabel']) + '<p>' + link(row['documentUrl'], 'Tam ilan metni / resmî ilan ayrıntıları') + '</p>')
        aside = '<div class="career-box"><h2>Bu ilanda</h2>' + ''.join(f'<a href="#{i}">{label}</a>' for i, label in [('ozet', 'İlan özeti'), ('pozisyonlar', 'Pozisyonlar'), ('sartlar', 'Başvuru koşulları'), ('basvuru', 'Başvuru adımları'), ('kaynaklar', 'Resmî kaynaklar')]) + '</div><div class="career-box"><h2>İlgili bölümler</h2>'
        aside += ''.join(f'<a href="/bolumler/{p["slug"]}/">{E(p["name"])}</a>' for p in programs if p['slug'] in row.get('relatedPrograms', []))
        aside += '<a href="/bolumler/">Bölüm rehberini incele →</a><a href="/personel-alim-ilanlari/">Tüm ilanlar →</a></div>'
        body += '<div class="career-notice">Bu özet tam ilan metninin yerine geçmez. Pozisyonun tüm koşulları ve kurumun değişiklik duyuruları başvuruda esas alınır.</div><div class="career-layout"><article class="career-article">' + article + '</article><aside class="career-aside">' + aside + '</aside></div>'
        page(path, row['title'], row['summary'], body, structured('NewsArticle', row['title'], path, row['publishedAt'], row['updatedAt']), row['updatedAt'])

    imported = [r for r in feed_rows if not r.get('manualSlug')]
    for row in imported:
        official_url(row['sourceUrl'])
        logo = '' if row.get('logoUrl') == 'https://kariyerkapisi.gov.tr/img/logo-kariyerkapisi.png' else f'<img src="{E(row["logoUrl"])}" alt="" width="64" height="64" loading="lazy">'
        cards += f'<article class="career-card" data-career-card data-search="{E(row["title"]+" "+row["institution"])}" data-city="Resmî ilanda" data-education="[&quot;Resmî ilanda&quot;]"><div class="career-card-body"><div class="career-tags"><span class="career-tag">{E(row["category"])}</span>{badge(row, now)}</div>{logo}<h2><a href="{E(row["sourceUrl"])}" aria-label="{E(row["title"])}" target="_blank" rel="noopener noreferrer">{E(row["title"][:100] + ("…" if len(row["title"]) > 100 else ""))}</a></h2><p><strong>{E(row["institution"])}</strong><br>{E(row["unit"])}</p>' + facts([('Başvuru başlangıcı', date_text(row['startsAt'],True)), ('Son başvuru', date_text(row['deadline'],True))]) + '<p>Kontenjan, öğrenim ve KPSS koşulları için tam resmî ilanı inceleyin.</p></div><div class="career-card-footer"><span>Kariyer Kapısı · resmî kayıt</span>' + link(row['sourceUrl'],'Resmî ilanı incele ↗') + '</div></article>'
    all_rows = announcements + [{'city':'Resmî ilanda','education':['Resmî ilanda']} for r in imported]

    title = 'Personel Alım İlanları'
    desc = 'Kamu ve üniversite personel alım ilanları: kontenjan, mezuniyet ve KPSS koşulları, başvuru tarihleri ve resmî ilan bağlantıları.'
    body = breadcrumb('Personel alım ilanları') + hero('KARİYER · İLAN AKIŞI', title, desc, '<strong>Tercihten kariyere</strong><p>Üniversiteye giriş koşulları ve başarı sırası açıklamalarını inceleyin.</p><a href="/bolumler/">Bölüm rehberi →</a>')
    body += '<div class="career-notice"><img src="https://kariyerkapisi.gov.tr/img/logo-kariyerkapisi.png" alt="Kariyer Kapısı" width="100" height="35" loading="lazy"> <strong>Kamu İşe Alım İlanları</strong> · Resmî veri akışı</div>'
    body += toolbar('jobs', [('city', 'Şehir', [r['city'] for r in all_rows]), ('education', 'Öğrenim', [x for r in all_rows for x in r['education']])])
    # Stable status keys are independent of translated labels.
    body = body.replace('<button type="reset">Temizle</button></form>', '<label for="career-status">Başvuru durumu<select id="career-status" name="status"><option value="">Tümü</option><option value="open">Başvuru açık</option><option value="upcoming">Başvuru başlayacak</option><option value="closed">Başvuru sona erdi</option><option value="withdrawn">İlan geri çekildi</option><option value="unknown">Takvimi kontrol edin</option></select></label><button type="reset">Temizle</button></form>', 1)
    body += f'<div class="career-results"><span data-result-count aria-live="polite">{len(all_rows)} ilan</span><span>Resmî alım kayıtları · Kaynak kontrolü: {date_text(checked_day)}</span></div><div class="career-grid career-news-grid">{cards}</div><p class="career-empty" data-empty hidden>Seçtiğiniz koşullara uygun ilan bulunamadı. Filtreleri temizleyerek tüm ilanları görebilirsiniz.</p><noscript><p>Arama ve durumların anlık güncellenmesi için JavaScript gerekir. İlan metinleri ve bağlantılar aşağıda erişilebilir; tarihleri resmî duyurudan kontrol edin.</p></noscript><div class="career-notice">Kariyer Kapısı’nın tüm kamuya açık alım kayıtları otomatik izlenir. Kurum içi yükselme, yeterlik ve eğitim başvuruları alım olarak gösterilmez. Kamu İş İlanları haberleri resmî doğrulama için taranır; bu kaynakların dışında kalan alımlar bulunabilir. Başvuru öncesinde kurumun güncel duyurusunu kontrol edin.</div>'
    page(PREFIXES[0], title, desc, body, structured('CollectionPage', title, PREFIXES[0]), checked_day)

    program_cards = ''
    for row in programs:
        path = PREFIXES[1] + row['slug'] + '/'
        rank = f'{row["rank"]:,}'.replace(',', '.') if row['rank'] is not None else None
        rank_label = f'İlk {rank}' if rank else 'Genel baraj tanımlı değil'
        degree = 'Ön lisans' if row['years'] == 2 else 'Lisans'
        program_cards += f'<article class="career-card" data-career-card data-search="{E(row["name"] + " " + row["area"])}" data-score="{row["score"]}" data-degree="{degree}"><div class="career-card-body"><div class="career-tags"><span class="career-tag">{row["score"]}</span><span class="career-tag">{E(row["area"])}</span></div><h2><a href="{path}">{E(row["name"])}</a></h2><p>{E(row["summary"])}</p>' + facts([('Eğitim', f'{row["years"]} yıl · {degree}'), (f'{row["ruleYear"]} başarı sırası koşulu', rank_label)]) + f'</div><div class="career-card-footer"><span>Koşullar ve sıralama</span><a href="{path}" aria-label="{E(row["name"])}: bölüm rehberi">Bölümü incele →</a></div></article>'
        title = row['name'] + ': Giriş Koşulları ve Başarı Sırası'
        desc = f'{row["name"]} puan türü {row["score"]}, eğitim süresi {row["years"]} yıl. Başarı sırası koşulu, tercih kontrolü ve resmî program verileri.'
        rule = f'{row["ruleYear"]} ÖSYM kılavuzunun Tablo 1B bölümünde bu program grubu için ilk {rank} içinde olma koşulu yer alır. Bu koşul tercih edebilmek için gereklidir; yerleşmeyi garanti etmez.' if rank else f'{row["ruleYear"]} ÖSYM kılavuzunun Tablo 1B bölümünde bu bölüm için genel bir başarı sırası barajı tanımlanmıyor. Bu, puan ve kontenjan koşulları olmadan yerleşilebileceği anlamına gelmez. Program koduna ait özel koşulları ayrıca okuyun.'
        body = breadcrumb('Bölüm rehberi', row['name']) + hero('ÜNİVERSİTE · ' + row['area'], row['name'], row['summary'], '<strong>Kısa bilgiler</strong>' + facts([('Puan türü', row['score']), ('Eğitim süresi', f'{row["years"]} yıl'), ('Program', degree), ('Koşul yılı', row['ruleYear'])]))
        body += f'<p class="career-meta">Kaynak kontrolü: <time datetime="{row["reviewedAt"]}">{date_text(row["reviewedAt"])}</time> · Hazırlık sınıfı ve özel koşullar program koduna göre değişebilir.</p>'
        session = 'TYT oturumuyla hesaplanan yerleştirme puanı kullanılır.' if row['score'] == 'TYT' else 'TYT ve ilgili AYT testleriyle hesaplanan yerleştirme puanı kullanılır.'
        article = section('giris', 'Bölüme nasıl öğrenci alınır?', paras([f'{row["name"]}, {row["score"]} puan türüyle öğrenci alır. ' + session, f'Eğitim süresi {row["years"]} yıldır. Dil hazırlığı, burs/ücret ve program koduna bağlı koşullar tercih kılavuzunda ayrıca kontrol edilmelidir.']))
        article += section('siralama', 'Başarı sırası şartı nedir?', paras([rule, 'Başarı sırası koşulu, bir programı tercih etmek için gereken sınırdır. Taban başarı sırası ise belirli bir yıl ve kontenjan türünde o programa yerleşen son adayın sırasıdır. Üniversite, öğretim dili ve burs oranı değiştiğinde taban sırası da değişebilir.', 'Tek bir “bölüm taban sıralaması” yoktur. Geçmiş veriyi program kodu ve yılıyla birlikte YÖK Atlas üzerinden inceleyin. Geçmiş sonuçlar gelecek yıl için kesin yerleşme vaadi oluşturmaz.']))
        article += section('tercih', 'Tercih öncesinde neleri kontrol etmelisiniz?', paras([row['consider']]) + items(['Üniversite, program kodu, öğretim dili ve burs/ücret bilgisini eşleştirin.', 'Genel kontenjanı ve yararlanacağınız özel kontenjanın koşullarını ayrı değerlendirin.', 'Geçmiş başarı sıralarını kontenjan değişiklikleriyle birlikte karşılaştırın.', 'Kılavuzdaki koşul numaralarını açın; programın eğitim süresi ve varsa hazırlık sınıfını okuyun.', 'Şehir, barınma ve eğitim giderlerini tercih kararına dahil edin.']))
        article += section('kaynaklar', 'Puan ve sıralama verileri nereden okunur?', '<p>' + link(row['sourceUrl'], row['sourceLabel']) + '</p><p>' + link('https://yokatlas.yok.gov.tr/' + ('onlisans-anasayfa.php' if degree == 'Ön lisans' else 'lisans-anasayfa.php'), 'YÖK Atlas · ' + degree + ' programlarını karşılaştır') + '</p><p>YÖK Atlas’ta bölüm adını arayıp üniversite ve program kodunu seçin. Görüntülenen veri yılını ve kontenjan türünü kontrol edin.</p>')
        article += section('mezuniyet', 'Mezuniyet sonrası alımlar nasıl takip edilir?', '<p>Üniversiteye giriş koşulları ile işe alım koşulları ayrı süreçlerdir. Kamu ilanlarında kabul edilen diploma adı, KPSS yılı/puan türü ve ek koşullar ilan bazında incelenir. Bu bölüme yerleşmek veya mezun olmak tek başına bir işe atanma hakkı sağlamaz.</p><a href="/personel-alim-ilanlari/">Personel alım ilanlarını incele →</a>')
        aside = '<div class="career-box"><h2>Bu sayfada</h2>' + ''.join(f'<a href="#{i}">{E(label)}</a>' for i, label in [('giris', 'Puan türü ve eğitim'), ('siralama', 'Başarı sırası koşulu'), ('tercih', 'Tercih kontrolü'), ('kaynaklar', 'Resmî veriler'), ('mezuniyet', 'Mezuniyet sonrası')]) + '</div><div class="career-box"><h2>İlgili bölümler</h2>'
        aside += ''.join(f'<a href="/bolumler/{p["slug"]}/">{E(p["name"])}</a>' for p in [p for p in programs if p['slug'] != row['slug'] and (p['area'] == row['area'] or p['score'] == row['score'])][:4])
        aside += '<a href="/bolumler/">Tüm bölümler →</a><a href="/yks/tercih-nasil-yapilir/">YKS tercih rehberi →</a></div>'
        body += f'<div class="career-notice">Koşullar {row["ruleYear"]} kılavuzuna aittir. Sonraki tercih dönemlerinde yayımlanan güncel kılavuz ve değişiklik duyuruları esas alınmalıdır.</div><div class="career-layout"><article class="career-article">{article}</article><aside class="career-aside">{aside}</aside></div>'
        page(path, title, desc, body, structured('Article', title, path, row['reviewedAt'], row['reviewedAt']), row['reviewedAt'])
    title = 'Üniversite Bölümleri: Giriş Koşulları ve Başarı Sırası'
    desc = 'PDR, psikoloji, hukuk, tıp, mühendislik ve diğer üniversite bölümlerinin puan türleri, eğitim süreleri ve başarı sırası koşulları.'
    body = breadcrumb('Bölüm rehberi') + hero('YKS · BÖLÜM REHBERİ', title, desc, '<strong>Başarı sırası ≠ taban sırası</strong><p>Tercih için gereken sınır ile geçen yıl yerleşen son adayın sırasını ayrı değerlendirin.</p><a href="#bolumler">Bölümleri karşılaştır ↓</a>')
    body += toolbar('programs', [('score', 'Puan türü', [r['score'] for r in programs]), ('degree', 'Program düzeyi', ['Lisans', 'Ön lisans'])]) + f'<div class="career-results"><span data-result-count aria-live="polite">{len(programs)} bölüm</span><span>Koşullar: 2026 ÖSYM kılavuzu</span></div><div id="bolumler" class="career-grid">{program_cards}</div><p class="career-empty" data-empty hidden>Aramanızla eşleşen bölüm bulunamadı. Filtreleri temizleyerek tüm bölümleri görebilirsiniz.</p><noscript><p>Bölümler aşağıda listelenir. Arama için JavaScript’i etkinleştirebilirsiniz.</p></noscript><div class="career-notice">Bu rehber farklı alanlardan bir başlangıç seçkisidir; bölümlerin popülerlik sıralaması değildir. Üniversite bazında taban puan ve sıralamalar için YÖK Atlas bağlantılarını kullanın.</div>'
    page(PREFIXES[1], title, desc, body, structured('CollectionPage', title, PREFIXES[1]), max(p['reviewedAt'] for p in programs))

    ET.register_namespace('', NS)
    tree = ET.parse(ROOT / 'sitemap.xml')
    for node in list(tree.getroot()):
        if any(node.find(f'{{{NS}}}loc').text.startswith(BASE + prefix) for prefix in PREFIXES):
            tree.getroot().remove(node)
    for url, lastmod in modified.items():
        node = ET.SubElement(tree.getroot(), f'{{{NS}}}url')
        ET.SubElement(node, f'{{{NS}}}loc').text = url
        ET.SubElement(node, f'{{{NS}}}lastmod').text = lastmod
    tree.getroot()[:] = sorted(tree.getroot(), key=lambda n: n.find(f'{{{NS}}}loc').text)
    ET.indent(tree, space='  ')
    outputs['sitemap.xml'] = '<?xml version="1.0" encoding="UTF-8"?>\n' + ET.tostring(tree.getroot(), encoding='unicode') + '\n'
    from enrich_seo_content import enrich_schema
    for path in list(outputs):
        if path.endswith(".html"):
            outputs[path]=enrich_schema(outputs[path],BASE+"/"+path[:-10] if path.endswith("/index.html") else BASE+"/"+path)
    return outputs


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--check', action='store_true', help='Verify committed output without changing files')
    args = parser.parse_args()
    outputs = generate()
    existing = {str(p.relative_to(ROOT)) for prefix in PREFIXES for p in (ROOT / prefix.strip('/')).glob('*/index.html')}
    stale = existing - outputs.keys()
    if stale:
        raise SystemExit('Veriden çıkarılmış sayfalar bulundu; eski adreslerin arşiv/yönlendirme kararını verin: ' + ', '.join(sorted(stale)))
    for path, content in outputs.items():
        dest = ROOT / path
        if args.check:
            if not dest.exists() or dest.read_text() != content:
                raise SystemExit('Üretilen sayfa güncel değil: ' + path)
        else:
            dest.parent.mkdir(parents=True, exist_ok=True)
            dest.write_text(content)
    print(f'{len(outputs)-1} kariyer sayfası ve sitemap doğrulandı.')


if __name__ == '__main__':
    main()
