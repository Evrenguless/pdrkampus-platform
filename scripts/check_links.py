#!/usr/bin/env python3
from pathlib import Path
from html.parser import HTMLParser
from urllib.parse import urljoin, urlparse, unquote
from urllib.request import Request, urlopen
from urllib.error import HTTPError, URLError
import sys, socket, os
from concurrent.futures import ThreadPoolExecutor, as_completed
from link_http import check_external

ROOT = Path(__file__).resolve().parents[1]
BASE = "https://pdrkampus.com/"
SKIP_SCHEMES = ("mailto:", "tel:", "javascript:", "data:")
HTML_FILES = list(ROOT.rglob("*.html"))
errors, warnings = [], []
external = {}

class Parser(HTMLParser):
    def __init__(self):
        super().__init__()
        self.refs=[]
        self.ids=set()
    def handle_starttag(self, tag, attrs):
        d=dict(attrs)
        if d.get("id"): self.ids.add(d["id"])
        if tag == "link" and set(d.get("rel", "").split()) & {"preconnect", "dns-prefetch"}: return
        if tag=="a" and d.get("name"): self.ids.add(d["name"])
        for key in ("href","src"):
            v=d.get(key)
            if v: self.refs.append((key,v))

parsers={}
for p in HTML_FILES:
    text=p.read_text(encoding="utf-8", errors="replace")
    parser=Parser()
    parser.feed(text)
    parsers[p]=parser

def local_target(source: Path, ref: str):
    clean=ref.split("?",1)[0].split("#",1)[0]
    if clean.startswith(BASE):
        clean=clean[len(BASE):]
        target=ROOT / clean
    elif clean.startswith("/"):
        target=ROOT / clean.lstrip("/")
    else:
        target=source.parent / clean
    if clean=="":
        target=source
    if target.is_dir():
        target=target/"index.html"
    return target.resolve()

for source, parser in parsers.items():
    for kind, ref in parser.refs:
        ref=ref.strip()
        if not ref or ref.startswith(SKIP_SCHEMES):
            continue
        parsed=urlparse(ref)
        if parsed.scheme in ("http","https") and not ref.startswith(BASE):
            external.setdefault(ref.split("#",1)[0], set()).add(str(source.relative_to(ROOT)))
            continue
        try:
            target=local_target(source,ref)
        except Exception as exc:
            errors.append(f"Geçersiz iç bağlantı: {source.relative_to(ROOT)} -> {ref} ({exc})")
            continue
        try:
            target.relative_to(ROOT.resolve())
        except ValueError:
            errors.append(f"Repo dışına çıkan bağlantı: {source.relative_to(ROOT)} -> {ref}")
            continue
        if not target.exists():
            errors.append(f"Eksik iç hedef: {source.relative_to(ROOT)} -> {ref}")
            continue
        if "#" in ref and target.suffix.lower()==".html":
            # kutuphane.html fragmentleri JS ile data/library.json ve data/forms.json kimliklerinden çözülür.
            # Bunlar scripts/check_seo.py tarafından ayrıca doğrulanıyor.
            if target.name == "kutuphane.html":
                continue
            frag=unquote(ref.split("#",1)[1])
            if frag:
                tp=parsers.get(target)
                if tp is None:
                    txt=target.read_text(encoding="utf-8", errors="replace")
                    tp=Parser(); tp.feed(txt); parsers[target]=tp
                if frag not in tp.ids:
                    warnings.append(f"Eksik fragment hedefi: {source.relative_to(ROOT)} -> {ref}")

checked=0
workers=max(1,min(8,int(os.environ.get('PDR_LINK_WORKERS','6'))))
with ThreadPoolExecutor(max_workers=workers) as pool:
    pending={pool.submit(check_external,url):url for url in sorted(external)}
    for future in as_completed(pending):
        url=pending[future]
        status,detail=future.result()
        checked+=1
        if status is None:
            warnings.append(f"Dış bağlantı doğrulanamadı: {url} ({detail})")
        elif status in (404,410):
            errors.append(f"Kırık dış bağlantı HTTP {status}: {url} | kaynak: {', '.join(sorted(external[url]))}")
        elif status>=400:
            warnings.append(f"Dış bağlantı HTTP {status}: {url} | kaynak: {', '.join(sorted(external[url]))}")
        if checked%100==0 or checked==len(external):
            print(f"External link progress: {checked}/{len(external)}",flush=True)
warnings.sort();errors.sort()

print(f"Link audit: {len(HTML_FILES)} HTML dosyası, {checked} benzersiz dış URL kontrol edildi.")
for w in warnings: print("WARN:",w)
for e in errors: print("ERROR:",e)
print(f"Sonuç: {len(errors)} hata, {len(warnings)} uyarı.")
if errors:
    sys.exit(1)
