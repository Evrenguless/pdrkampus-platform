#!/usr/bin/env python3
from pathlib import Path
import re
import sys
import xml.etree.ElementTree as ET

BASE = "https://evrenguless.github.io/pdrkampus-platform/"
ROOT = Path(__file__).resolve().parents[1]
SITEMAP = ROOT / "sitemap.xml"

def url_to_file(url: str) -> Path:
    rel = url.removeprefix(BASE)
    if rel == "":
        return ROOT / "index.html"
    if rel.endswith("/"):
        return ROOT / rel / "index.html"
    return ROOT / rel

def grab(pattern: str, html: str):
    m = re.search(pattern, html, flags=re.I | re.S)
    return m.group(1).strip() if m else None

tree = ET.parse(SITEMAP)
ns = {"s": "http://www.sitemaps.org/schemas/sitemap/0.9"}
urls = [n.text.strip() for n in tree.findall(".//s:loc", ns) if n.text]

errors = []
warnings = []
titles = {}
descriptions = {}

for url in urls:
    path = url_to_file(url)
    if not path.exists():
        errors.append(f"Sitemap URL dosyası yok: {url} -> {path.relative_to(ROOT)}")
        continue

    html = path.read_text(encoding="utf-8")
    title = grab(r"<title>(.*?)</title>", html)
    desc = grab(r'<meta\s+name=["\']description["\']\s+content=["\'](.*?)["\']', html)
    canonical = grab(r'<link\s+rel=["\']canonical["\']\s+href=["\'](.*?)["\']', html)

    if not title:
        errors.append(f"Title eksik: {path.relative_to(ROOT)}")
    else:
        titles.setdefault(title, []).append(str(path.relative_to(ROOT)))

    if not desc:
        errors.append(f"Meta description eksik: {path.relative_to(ROOT)}")
    else:
        descriptions.setdefault(desc, []).append(str(path.relative_to(ROOT)))

    if not canonical:
        errors.append(f"Canonical eksik: {path.relative_to(ROOT)}")
    elif canonical != url:
        errors.append(
            f"Canonical/sitemap uyumsuz: {path.relative_to(ROOT)} | sitemap={url} | canonical={canonical}"
        )

for value, paths in titles.items():
    if len(paths) > 1:
        warnings.append(f"Aynı title ({len(paths)}): {value} -> {', '.join(paths)}")

for value, paths in descriptions.items():
    if len(paths) > 1:
        warnings.append(f"Aynı description ({len(paths)}): {value} -> {', '.join(paths)}")

for personal in ("profil.html", "calisma-alani.html"):
    p = ROOT / personal
    if p.exists():
        html = p.read_text(encoding="utf-8")
        robots = grab(r'<meta\s+name=["\']robots["\']\s+content=["\'](.*?)["\']', html)
        if not robots or "noindex" not in robots.lower():
            errors.append(f"Kişisel sayfa noindex değil: {personal}")

print(f"SEO audit: {len(urls)} sitemap URL kontrol edildi.")
for w in warnings:
    print("WARN:", w)
for e in errors:
    print("ERROR:", e)

if errors:
    print(f"\n{len(errors)} kritik SEO hatası bulundu.")
    sys.exit(1)

print(f"Başarılı. Kritik hata yok; {len(warnings)} uyarı var.")
