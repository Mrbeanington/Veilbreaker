# Patient Zero
> **Phase 15:** numbers in this note were rebalanced after 30,000-match simulations; the current values are listed in the Phase 15 section at the end.

**Data:** `packages/content/src/data/characters/patient-zero.ts`
**Rarity:** CORE · **Tags:** UNDEAD, EVOLUTION · **HP:** 110 → 140 (The Infected) → 180 (The Outbreak)

## Identity
A slow-building inevitability. Every hit he lands is small on its own, but each one both damages
*and* compounds — Infection ticks every turn it's active, and every landed hit pushes him one step
closer to a stronger, higher-HP form with a stronger finisher. spec/03: "Zombie Evolution character
with at least one dramatic in-match evolution."

## Win condition
Land hits early (any of them — they all build Outbreak Progress) to reach The Infected, then The
Outbreak, while Infection's stacking DoT quietly adds up on whoever he's been fighting. He wins fights
that go long; he's weak if focused down before his first evolution.

## Counterplay
Every evolution threshold is visible (`resource.outbreak-progress` is `visibleToOpponent: true`,
`trackMode: true`), so an opponent always knows exactly how close he is to transforming and can decide
whether to burst him down now or disengage. Infection itself is dispellable (`status.infection`,
`dispellable: true` — inherited from the shared status-fixture defaults) and, like every DoT, ticks as
unmitigated `"affliction"` damage, so damage reduction/shields don't blunt it, but a cleanse does.

## Known counters and synergies
- **Countered by:** burst damage before turn ~4 (his fastest realistic path to The Infected); any
  cleanse/dispel effect, which removes Infection's ongoing damage entirely rather than just reducing it.
- **Synergizes with:** any teammate who benefits from the enemy being forced to make an early,
  high-pressure decision ("kill him now" vs. "let him ramp") — a teammate who threatens lethal burst
  during that decision window gets more value from the pressure than Patient Zero's own numbers alone.

## Ability-by-ability, 5-second readability check
| Ability | One sentence | 5-second read? |
|---|---|---|
| Bite | Deal 15 damage and apply Infection. | Yes. |
| Festering Wound | Deal 10 damage and apply a heavier dose of Infection. | Yes — "heavier" is visible as more stacks in the tooltip. |
| Shambling Grasp | Deal 20 damage and weaken the target. | Yes. |
| Outbreak Pulse | Deal 15 damage and spread Infection to every enemy. | Yes — the AoE is the whole point and is visually obvious in target selection. |
| Cataclysmic Spread (The Outbreak only) | A stronger Outbreak Pulse. | Yes — same shape, bigger numbers, matching the "dramatic evolution" framing. |

## Deviations from a literal reading of spec/03
- **Infection is now a real, ticking status**, not the data-only placeholder Phases 02–03 shipped
  (`docs/OPEN-QUESTIONS.md` OQ-29). It needed zero new engine code: `tickBehavior: "damageOverTime"`
  already generically drives DoT ticking for any status, the same way Bleed/Burn/Poison work — see
  `docs/DECISIONS.md` ADR-011.
- **Evolution is driven by his own passive, not by `Transformation.trigger`.** No engine code
  automatically evaluates a `Transformation`'s own `trigger` condition — nothing calls `transformInto`
  except an ability, passive, or status effect explicitly listing it (confirmed by inspection: no
  reference to `.trigger` on a `Transformation` object anywhere in `packages/engine`). So "at least
  one dramatic in-match evolution" is implemented as his one passive, "The Hunger Grows": every
  landed hit adds Outbreak Progress and checks the two thresholds itself, highest first (so reaching
  The Outbreak can never regress him back to The Infected on a later hit). Logged as OQ-34.
- **The evolution thresholds (4 and 8 Outbreak Progress) and the exact HP/kit changes at each stage**
  are this phase's own numbers — spec/03 names the shape ("→ The Infected → The Outbreak") but not
  specific values.

## Phase 15 balance pass
Changed in `docs/balance/drafts/phase-15-v1.json` (paths as in dev mode):
- `characters/patient-zero/baseHp` is now **100**
