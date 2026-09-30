#!/usr/bin/env python3
from pathlib import Path
import re, sys

ROOT=Path(__file__).resolve().parents[1]
SKIP={".git","node_modules"}
patterns=[
    ("Supabase service role", re.compile(r"service[_-]?role", re.I)),
    ("Supabase secret key", re.compile(r"sb_secret_[A-Za-z0-9_-]+")),
    ("Service role assignment", re.compile(r"SUPABASE_SERVICE_ROLE(?:_KEY)?\\s*[:=]\\s*[\\"\'][^\\"\']{16,}[\\"\']", re.I)),
    ("Private key block", re.compile(r"-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----")),
]
allowed_files={
    Path("scripts/check_frontend_secrets.py"),
    Path(".github/workflows/security-audit.yml"),
}
errors=[]
scanned=0
for path in ROOT.rglob("*"):
    if not path.is_file() or any(part in SKIP for part in path.parts):
        continue
    rel=path.relative_to(ROOT)
    if rel in allowed_files:
        continue
    if path.suffix.lower() not in {".html",".js",".mjs",".ts",".json",".css",".md",".yml",".yaml",".txt"}:
        continue
    try:
        text=path.read_text(encoding="utf-8",errors="replace")
    except Exception:
        continue
    scanned+=1
    for label,pat in patterns:
        if pat.search(text):
            errors.append(f"{label}: {rel}")

print(f"Frontend secret audit: {scanned} metin dosyası kontrol edildi.")
for e in errors:
    print("ERROR:",e)
print(f"Sonuç: {len(errors)} hata.")
if errors:
    sys.exit(1)
