"""Shared material card presentation; original records and preview assets are read-only."""
import json,re
from html import escape as e
from urllib.parse import quote
from functools import lru_cache

@lru_cache(maxsize=1)
def indexes(root):
 previews=json.loads((root/'data/resource-previews.json').read_text())
 links=json.loads(re.search(r'=\s*(\{.*\})\s*;', (root/'src/resource-page-links.js').read_text(),re.S).group(1))
 return previews,links

def preview(root,row):
 item=indexes(root)[0].get(row['id'],{})
 src=item.get('thumbnail') or next(iter(item.get('previews',[])),None)
 return src if src and (root/src.lstrip('/')).is_file() else None

def card(root,row):
 src=preview(root,row);link=indexes(root)[1].get(row['id'],'/kutuphane.html#'+row['id'])
 visual='<img src="'+e(src,quote=True)+'" alt="'+e(row['title'],quote=True)+' — ilk sayfa önizlemesi" loading="lazy" decoding="async" width="320" height="240">' if src else '<span class="material-format">'+e(row.get('fileType','Dosya'))+'<small>Dosya bilgilerini incele</small></span>'
 file=quote(row['file'],safe='/:?=&%#@+;,-._~')
 return '<article class="catalog-card material-resource"><a class="material-preview" href="'+e(link,quote=True)+'">'+visual+'</a><div class="material-card-body"><p class="catalog-kicker">'+e(row.get('type',''))+' · '+e(row.get('level',''))+'</p><h2><a href="'+e(link,quote=True)+'">'+e(row['title'])+'</a></h2><p class="material-source">'+e(row.get('source','MEB'))+'</p><div class="material-actions"><a class="material-open" href="'+e(link,quote=True)+'">Önizlemeyi incele</a><a class="material-download" href="'+e(file,quote=True)+'" target="_blank" rel="noopener noreferrer">Dosyayı aç / indir</a></div></div></article>'

def hero(title,desc,art='peer-support'):
 return '<section class="material-hero"><div><p class="catalog-kicker"><a href="/kutuphane.html">PDR Kampüs Kütüphanesi</a> / Materyaller</p><h1>'+e(title)+'</h1><p class="catalog-lead">'+e(desc)+'</p></div><img src="/assets/campus-'+art+'.webp" alt="" width="300" height="200" decoding="async"></section>'
