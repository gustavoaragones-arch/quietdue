#!/usr/bin/env python3
"""Shorten FAQ answers to max 2 sentences; first sentence kept as direct answer lead."""
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
GUIDE = ROOT / "fertility-timing-guide"


def shorten_answer(text: str, max_sentences: int = 2) -> str:
    text = text.strip()
    if not text:
        return text
    # Split on sentence boundaries (simple)
    parts = re.split(r"(?<=[.!?])\s+", text)
    parts = [p.strip() for p in parts if p.strip()]
    if not parts:
        return text
    return " ".join(parts[:max_sentences])


def process_file(path: Path) -> bool:
    html = path.read_text(encoding="utf-8")
    m = re.search(
        r'(<script type="application/ld\+json">\s*\n)(\s*\{"@context":"https://schema.org","@type":"FAQPage","mainEntity":.*?\}\s*)(\n\s*</script>)',
        html,
        re.DOTALL,
    )
    if not m:
        return False
    json_str = m.group(2).strip()
    try:
        data = json.loads(json_str)
    except json.JSONDecodeError:
        return False
    if data.get("@type") != "FAQPage":
        return False
    entities = data.get("mainEntity") or []
    changed = False
    for ent in entities:
        ans = ent.get("acceptedAnswer") or {}
        t = ans.get("text")
        if not t:
            continue
        new_t = shorten_answer(t, 2)
        if new_t != t:
            ans["text"] = new_t
            changed = True
    if not changed:
        return False
    new_json = json.dumps(data, ensure_ascii=False, separators=(",", ":"))
    new_block = m.group(1) + "  " + new_json + m.group(3)
    html = html[: m.start()] + new_block + html[m.end() :]

    # Sync in-page <dd> in faq-section: replace each dd after dt matching question name
    for ent in entities:
        qname = ent.get("name", "")
        text = (ent.get("acceptedAnswer") or {}).get("text", "")
        if not qname or not text:
            continue
        # Escape for regex
        q_esc = re.escape(qname)
        pat = rf"(<dt>{q_esc}</dt>\s*<dd>)([\s\S]*?)(</dd>)"
        mm = re.search(pat, html)
        if mm:
            html = html[: mm.start()] + mm.group(1) + text + mm.group(3) + html[mm.end() :]

    path.write_text(html, encoding="utf-8")
    return True


def main():
    n = 0
    for p in sorted(GUIDE.glob("*/index.html")):
        if process_file(p):
            n += 1
            print("FAQ shortened:", p.parent.name)
    hub = GUIDE / "index.html"
    if process_file(hub):
        n += 1
        print("FAQ shortened: hub")
    print("Total:", n)


if __name__ == "__main__":
    main()
