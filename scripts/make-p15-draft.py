"""Builds the phase-15 balance draft (docs/balance/drafts/phase-15-v1.json) from a readable list of edits.

Every edit is (path, new value). Paths are the dev-mode paths (see docs/design/balance-workflow.md).
The draft is simulated with `pnpm sim --balance`, then baked into the character source by scripts/bake-p15.py,
which verifies that the new source produces exactly these values.
"""
import json
from pathlib import Path

A = "abilities/ability."
EDITS = [
    # ---- weak older kits: cheaper heavy abilities, a little more health
    ("characters/oni-of-the-red-gate/baseHp", 170),
    (A + "oni-of-the-red-gate.open-the-gate/cost/spirit", 1),
    (A + "oni-of-the-red-gate.open-the-gate/cooldown", 3),
    ("characters/malachar/baseHp", 130),
    (A + "malachar.raise-the-forgotten/cost/spirit", 1),
    (A + "malachar.you-belong-to-me/cost/might", 1),
    (A + "malachar.you-belong-to-me/cost/focus", 1),
    (A + "malachar.you-belong-to-me/cost/spirit", 1),
    (A + "malachar.you-belong-to-me/cost/chaos", 1),
    (A + "malachar.embrace-the-throne/cost/spirit", 2),
    (A + "malachar.embrace-the-throne/cost/chaos", 2),
    (A + "malachar.embrace-the-throne/cost/neutral", 1),
    ("characters/maestro-nocturne/baseHp", 120),
    (A + "maestro-nocturne.staccato/effects/0/amount", 30),
    ("characters/the-referee/baseHp", 110),
    (A + "the-referee.blow-the-whistle/effects/0/amount", 30),
    ("characters/moonshot-maddox/baseHp", 110),
    (A + "moonshot-maddox.home-run-swing/cost/focus", 2),
    (A + "moonshot-maddox.leadoff-single/effects/0/amount", 20),
    ("characters/koschei/baseHp", 140),
    (A + "koschei.winter-touch/effects/0/amount", 30),
    ("characters/zeiron/baseHp", 140),
    (A + "zeiron.wrath-of-the-unchained-sky/cost/might", 3),
    (A + "zeiron.wrath-of-the-unchained-sky/cost/spirit", 2),
    (A + "behemoth.gore/cost/might", 2),
    (A + "behemoth.primordial-stomp/cost/might", 2),
    (A + "behemoth.rampage/cost/might", 3),
    ("characters/puca/baseHp", 110),
    (A + "puca.wild-ride/effects/0/amount", 40),
    ("characters/kappa-kiro/baseHp", 130),
    ("characters/the-marionettist/baseHp", 110),
    (A + "the-marionettist.wooden-fist/effects/0/amount", 30),
    ("characters/the-siren/baseHp", 110),
    (A + "the-siren.shipwreck/cost/chaos", 1),
    ("characters/the-painted-ronin/baseHp", 120),
    ("characters/father-bell/baseHp", 130),
    # ---- strong kits: a little less efficient
    ("passives/passive.the-firebird.rise-from-ashes/effects/1/amount", 30),
    (A + "the-firebird.dawn-light/cooldown", 4),
    ("characters/draugr/baseHp", 130),
    ("passives/passive.draugr.barrow-hunger/effects/0/amount", 10),
    ("characters/patient-zero/baseHp", 100),
    (A + "el-magnifico.flying-elbow/effects/0/ifTrue/0/amount", 60),
    ("characters/king-croak/baseHp", 120),
    (A + "king-croak.frog-curse/cooldown", 5),
    (A + "the-lawyer.cross-examine/cooldown", 4),
    (A + "the-lawyer.sue/cooldown", 4),
    (A + "rusalka.drowning-embrace/effects/0/ifTrue/0/amount", 40),
    (A + "anubian-judge.weigh-the-heart/effects/0/ifTrue/0/amount", 30),
    # ---- round 2 (after the first 15,000-match check at two bot levels)
    (A + "oni-of-the-red-gate.crimson-cleave/effects/0/ifTrue/0/amount", 80),
    (A + "oni-of-the-red-gate.crimson-cleave/effects/0/ifFalse/0/ifTrue/0/amount", 60),
    (A + "oni-of-the-red-gate.crimson-cleave/effects/0/ifFalse/0/ifFalse/0/ifTrue/0/amount", 40),
    (A + "oni-of-the-red-gate.crimson-cleave/effects/0/ifFalse/0/ifFalse/0/ifFalse/0/amount", 20),
    ("transformations/transformation.malachar.to-death-king/trigger/amount", 5),
    (A + "malachar.borrowed-life/effects/0/amount", 30),
    ("characters/kappa-kiro/baseHp", 145),
    (A + "the-gunslinger-qb.long-bomb/effects/0/outcome/branches/0/effects/1/amount", 10),
    ("characters/mister-whiskers/baseHp", 100),
    (A + "the-firebird.glowing-feather/cooldown", 3),
    (A + "el-magnifico.flying-elbow/effects/0/ifTrue/0/amount", 50),
    ("characters/the-lawyer/baseHp", 80),
]

draft = {
    "format": "veilbreak-balance",
    "formatVersion": 1,
    "id": "phase-15-v1",
    "baseVersionId": "phase-05-v1",
    "createdAt": "2026-09-20T00:00:00.000Z",
    "changeNotes": "Phase 15 balance pass: cheaper heavy abilities and more health for the weakest older kits, small trims for the strongest new ones (30,000-match runs at two bot levels).",
    "changes": [{"path": p, "value": v} for p, v in dict(EDITS).items()],
}
out = Path(__file__).resolve().parent.parent / "docs/balance/drafts/phase-15-v1.json"
out.parent.mkdir(parents=True, exist_ok=True)
out.write_text(json.dumps(draft, indent=2) + "\n", encoding="utf-8")
print(f"wrote {out} with {len(dict(EDITS))} edits")
