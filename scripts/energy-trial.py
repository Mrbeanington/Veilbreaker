"""Phase 15 balance experiment: try energy-rule settings and print the spread of character win rates.

Usage: python scripts/energy-trial.py <perLivingCharacter> <minPerTeam> [matches] [level]
Writes a temporary energy-rules.json, runs the simulation, restores the file. Dev tool, not part of the build.
"""
import json
import statistics
import subprocess
import sys
from pathlib import Path

root = Path(__file__).resolve().parent.parent
rules_path = root / "packages/content/src/config/energy-rules.json"
per, floor = int(sys.argv[1]), int(sys.argv[2])
matches = sys.argv[3] if len(sys.argv) > 3 else "10000"
level = sys.argv[4] if len(sys.argv) > 4 else "intermediate"
original = rules_path.read_text(encoding="utf-8")
rules = json.loads(original)
rules["generation"]["perLivingCharacter"] = per
rules["generation"]["minPerTeam"] = floor
label = f"trial-{per}-{floor}-{level}"
try:
    rules_path.write_text(json.dumps(rules, indent=2) + "\n", encoding="utf-8")
    subprocess.run(["pnpm", "sim", "--matches", matches, "--bots", level, "--seed", "31", "--label", label], cwd=root, check=True, capture_output=True, shell=True)
finally:
    rules_path.write_text(original, encoding="utf-8")
report = json.loads(sorted((root / "docs/balance").glob(f"report-*{label}.json"))[-1].read_text(encoding="utf-8"))
rates = [c["winRate"] for c in report["characters"]]
counts = {k: v["count"] for k, v in report["detectors"].items() if v["count"]}
print(f"per={per} floor={floor} {level}: stdev {statistics.pstdev(rates):.1f}, >60: {sum(r > 60 for r in rates)}, <40: {sum(r < 40 for r in rates)}, "
      f"length {report['length']['average']}, first-player {report['initiative']['firstPlayerWinRate']}, legends {report['legends']['legendTeamWinRate']} vs {report['legends']['noLegendTeamWinRate']}")
print("  detectors:", counts)
