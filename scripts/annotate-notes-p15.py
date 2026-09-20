"""Adds a 'Phase 15 balance pass' section (current values) to every design note whose character the pass changed."""
import json
import re
from collections import defaultdict
from pathlib import Path

root = Path(__file__).resolve().parent.parent
draft = json.loads((root / "docs/balance/drafts/phase-15-v1.json").read_text(encoding="utf-8"))
notes = root / "docs/design/characters"
by_char = defaultdict(list)
for change in draft["changes"]:
    parts = change["path"].split("/")
    if parts[0] == "characters":
        cid = parts[1]
    else:
        cid = parts[1].split(".")[1]
    by_char[cid].append(change)

MARK = "## Phase 15 balance pass"
done = 0
for cid, changes in sorted(by_char.items()):
    f = notes / f"{cid}.md"
    if not f.exists():
        print("no note for", cid)
        continue
    text = f.read_text(encoding="utf-8")
    if MARK in text:
        text = text[: text.index(MARK)].rstrip() + "\n"
    lines = text.split("\n")
    warning = "> **Phase 15:** numbers in this note were rebalanced after 30,000-match simulations; the current values are listed in the Phase 15 section at the end."
    if warning not in text:
        lines.insert(1, warning)
        text = "\n".join(lines)
    rows = "\n".join(f"- `{c['path']}` is now **{c['value']}**" for c in changes)
    text = text.rstrip() + f"\n\n{MARK}\nChanged in `docs/balance/drafts/phase-15-v1.json` (paths as in dev mode):\n{rows}\n"
    f.write_text(text, encoding="utf-8")
    done += 1
print("annotated", done, "notes")
