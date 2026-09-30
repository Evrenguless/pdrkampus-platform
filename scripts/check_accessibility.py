#!/usr/bin/env python3
from pathlib import Path
from html.parser import HTMLParser
import re, sys

ROOT=Path(__file__).resolve().parents[1]
files=list(ROOT.rglob("*.html"))
errors=[]
warnings=[]

class A11yParser(HTMLParser):
    def __init__(self,path):
        super().__init__()
        self.path=path
        self.ids=[]
        self.inputs=[]
        self.labels_for=set()
        self.buttons=[]
        self.imgs=[]
        self.html_lang=None
    def handle_starttag(self,tag,attrs):
        d=dict(attrs)
        if tag=="html": self.html_lang=d.get("lang")
        if d.get("id"): self.ids.append(d["id"])
        if tag=="label" and d.get("for"): self.labels_for.add(d["for"])
        if tag in ("input","select","textarea"):
            self.inputs.append((tag,d))
        if tag=="button": self.buttons.append(d)
        if tag=="img": self.imgs.append(d)

for path in files:
    text=path.read_text(encoding="utf-8",errors="replace")
    p=A11yParser(path); p.feed(text)
    rel=path.relative_to(ROOT)
    if p.html_lang!="tr":
        warnings.append(f"HTML lang tr değil: {rel} ({p.html_lang})")
    dup={x for x in p.ids if p.ids.count(x)>1}
    for x in sorted(dup):
        errors.append(f"Tekrarlanan id: {rel} -> {x}")
    for d in p.imgs:
        if "alt" not in d:
            errors.append(f"img alt eksik: {rel} -> {d.get('src','?')}")
    for tag,d in p.inputs:
        typ=(d.get("type") or "").lower()
        if typ in ("hidden","submit","button","reset","image"): continue
        ident=d.get("id")
        named=bool(d.get("aria-label") or d.get("aria-labelledby") or d.get("title"))
        if not named and (not ident or ident not in p.labels_for):
            warnings.append(f"Form alanı etiketsiz olabilir: {rel} -> {tag}#{ident or '-'}")
    for d in p.buttons:
        if d.get("aria-label") or d.get("aria-labelledby") or d.get("title"):
            continue
    h1=len(re.findall(r"<h1(?:\s[^>]*)?>.*?</h1>",text,flags=re.I|re.S))
    if h1!=1 and path.name!="404.html":
        warnings.append(f"H1 sayısı {h1}: {rel}")

print(f"Erişilebilirlik audit: {len(files)} HTML dosyası kontrol edildi.")
for w in warnings: print("WARN:",w)
for e in errors: print("ERROR:",e)
print(f"Sonuç: {len(errors)} hata, {len(warnings)} uyarı.")
if errors:
    sys.exit(1)
