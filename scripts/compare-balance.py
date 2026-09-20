"""Compare two sets of simulation reports (average over bot levels): python scripts/compare-balance.py <baseLabelPrefix> <newLabelPrefix> [levels]

A label prefix is the part before the bot level, e.g. p15-base and p15-draft1 for report-*-p15-base-intermediate.json.
"""
import json
import statistics
import sys
from pathlib import Path

root = Path(__file__).resolve().parent.parent / "docs/balance"
base, new = sys.argv[1], sys.argv[2]
levels = sys.argv[3].split(",") if len(sys.argv) > 3 else ["intermediate", "advanced"]


def load(prefix):
    rates, meta = {}, {}
    for level in levels:
        f = sorted(root.glob(f"report-*-{prefix}-{level}.json"))[-1]
        d = json.loads(f.read_text(encoding="utf-8"))
        for c in d["characters"]:
            rates.setdefault(c["id"], []).append(c["winRate"])
        meta[level] = (d["length"]["average"], d["initiative"]["firstPlayerWinRate"], d["legends"]["legendTeamWinRate"], {k: v["count"] for k, v in d["detectors"].items() if v["count"]})
    return {k: sum(v) / len(v) for k, v in rates.items()}, meta


b, bm = load(base)
n, nm = load(new)
for name, r in (("base", b), ("new", n)):
    vals = list(r.values())
    print(f"{name}: stdev {statistics.pstdev(vals):.1f}, >60: {sum(v > 60 for v in vals)}, >65: {sum(v > 65 for v in vals)}, <40: {sum(v < 40 for v in vals)}, <35: {sum(v < 35 for v in vals)}")
for level in levels:
    print(f"  {level}: base {bm[level]}  new {nm[level]}")
moved = sorted(((n[k] - b[k], k) for k in b), key=lambda x: -abs(x[0]))
print("largest moves:")
for delta, k in moved[:24]:
    print(f"  {k:28s} {b[k]:5.1f} -> {n[k]:5.1f} ({delta:+.1f})")
print("still highest:", [(k, round(v, 1)) for k, v in sorted(n.items(), key=lambda x: -x[1])[:8]])
print("still lowest:", [(k, round(v, 1)) for k, v in sorted(n.items(), key=lambda x: x[1])[:8]])
