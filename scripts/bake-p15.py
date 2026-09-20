"""Bakes docs/balance/drafts/phase-15-v1.json into the character source files.

Run from the repository root:  python scripts/bake-p15.py
It edits the numbers in packages/content/src/data/characters/*.ts, then the caller verifies
(scripts/verify-bake.ts) that every tunable now equals 'before + draft' and nothing else moved.
"""
import json
import re
import sys
from pathlib import Path

root = Path(__file__).resolve().parent.parent
chars_dir = root / "packages/content/src/data/characters"
draft = json.loads((root / "docs/balance/drafts/phase-15-v1.json").read_text(encoding="utf-8"))
before = json.loads((root / "docs/balance/drafts/.before-p15.json").read_text(encoding="utf-8"))


def file_for(char_id: str) -> Path:
    p = chars_dir / f"{char_id}.ts"
    if not p.exists():
        raise SystemExit(f"no character file for {char_id}")
    return p


def block(text: str, marker: str) -> tuple[int, int]:
    i = text.index(marker)
    j = text.find("\nexport const ", i + 1)
    return i, (len(text) if j < 0 else j)


def sub_in_block(text: str, marker: str, pattern: str, repl: str) -> str:
    i, j = block(text, marker)
    segment = text[i:j]
    new, n = re.subn(pattern, repl, segment, count=1)
    if n != 1:
        raise SystemExit(f"could not patch {marker}: {pattern}")
    return text[:i] + new + text[j:]


for change in draft["changes"]:
    path, value = change["path"], change["value"]
    old = before[path]
    parts = path.split("/")
    kind = parts[0]
    if kind == "characters":
        f = file_for(parts[1])
        t = f.read_text(encoding="utf-8")
        t2, n = re.subn(r"baseHp: %d\b" % old, "baseHp: %d" % value, t, count=1)
        if n != 1:
            raise SystemExit(f"baseHp not found for {parts[1]}")
        f.write_text(t2, encoding="utf-8")
    elif kind == "abilities":
        ability_id = parts[1]  # ability.<char>.<name>
        char_id = ability_id.split(".")[1]
        f = file_for(char_id)
        t = f.read_text(encoding="utf-8")
        marker = f'id: "{ability_id}"'
        if parts[2] == "cost":
            fam = parts[3]
            t = sub_in_block(t, marker, r"(cost:\s*\{[^}]*\b%s:\s*)%d\b" % (fam, old), r"\g<1>%d" % value)
        elif parts[2] == "cooldown":
            t = sub_in_block(t, marker, r"cooldown:\s*%d\b" % old, "cooldown: %d" % value)
        elif "amount" == parts[-1]:
            t = sub_in_block(t, marker, r"amount:\s*%d\b" % old, "amount: %d" % value)
        else:
            raise SystemExit(f"unhandled ability path {path}")
        f.write_text(t, encoding="utf-8")
    elif kind == "passives":
        passive_id = parts[1]  # passive.<char>.<name>
        f = file_for(passive_id.split(".")[1])
        t = f.read_text(encoding="utf-8")
        t = sub_in_block(t, f'id: "{passive_id}"', r"amount:\s*%d\b" % old, "amount: %d" % value)
        f.write_text(t, encoding="utf-8")
    elif kind == "transformations":
        tid = parts[1]  # transformation.<char>.<name>
        f = file_for(tid.split(".")[1])
        t = f.read_text(encoding="utf-8")
        t = sub_in_block(t, f'id: "{tid}"', r"amount:\s*%d\b" % old, "amount: %d" % value)
        f.write_text(t, encoding="utf-8")
    else:
        raise SystemExit(f"unhandled path {path}")
print(f"baked {len(draft['changes'])} changes")
