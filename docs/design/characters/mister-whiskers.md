# Mister Whiskers
> **Phase 15:** numbers in this note were rebalanced after 30,000-match simulations; the current values are listed in the Phase 15 section at the end.

**Data:** `packages/content/src/data/characters/mister-whiskers.ts`
**Rarity:** CORE · **Tags:** CHEATER, BEAST, ASSASSIN · **HP:** 90

## Identity
A small, fragile trickster who is annoying to fight precisely because he refuses to die on schedule
and refuses to let a fight resolve the way it "should." spec/03: "looks comically harmless.
Manipulates targeting, energy, and randomness." Every ability breaks a different expectation:
Copycat's Gamble is a real coin-flip, Nine Lives' Favor cheats that same coin-flip in his favor,
Paw Swap breaks the "your target stays your target" rule, and Black Cat's Crossing breaks "your
energy is yours."

## Win condition
Survive far longer than his 90 HP suggests (Nine Lives), and waste the opponent's turns and resources
in the meantime (Paw Swap redirects a hit that would have landed cleanly; Black Cat's Crossing quietly
starves an enemy's energy curve). He rarely wins a fight by force — he wins it by making the opponent's
plan not work.

## Counterplay
Nine Lives is finite (9 charges) and each save floors him at exactly 1 HP — a second hit the same turn,
or any hit before his next `onTurnStart` recharges the shield, kills him outright. Paw Swap has a
3-turn cooldown and is always logged the instant it fires (CLAUDE.md rule 9), so an opponent who tracks
the log can simply not queue an attack the turn after they see it used, denying the redirect a real
target. Burst damage that kills him before Nine Lives' `onTurnStart` check ever runs (a status applied
mid-turn, or simultaneous lethal damage from two sources in the same tier) bypasses the save entirely,
since it only re-arms once per turn.

## Known counters and synergies
- **Countered by:** anything that kills faster than once per turn-cycle, or that removes/dispels
  Death Prevention after it's granted but before it's needed (a dispel effect landing between his
  `onTurnStart` grant and the enemy's own action this same turn).
- **Synergizes with:** a teammate who benefits from an enemy's queued attack landing somewhere other
  than intended — Paw Swap is strictly a redirect onto himself right now (see Deviations), so its best
  use today is protecting a low-HP ally, not setting up a counter-attacker.

## Ability-by-ability, 5-second readability check
| Ability | One sentence | 5-second read? |
|---|---|---|
| Copycat's Gamble | Usually a small hit, sometimes a big one. | Yes — a visible gamble, no hidden odds beyond "usually / sometimes." |
| Nine Lives' Favor | Improves the odds of his next gamble. | Yes — reads as "buffs my own luck," no interaction with anything else needed. |
| Paw Swap | Forces an enemy to attack him instead of their real target. | Yes — one clear rule-break, explicitly logged when it fires. |
| Black Cat's Crossing | Steals a little energy from an enemy. | Yes — plain resource theft. |

## The hidden hook toward Whiskers, Devourer of Worlds
spec/03 describes "a hidden transformation/unlock relationship" to a separate SECRET roster entry
(#97). This is **not** a `Transformation` of Mister Whiskers — `Transformation.characterId`/
`fromStageId`/`toStageId` only move one character between stages of *itself*
(`packages/content/src/schemas/transformation.ts`); Whiskers, Devourer of Worlds is a wholly different
`CharacterDefinition` (`whiskers-devourer-of-worlds.ts`). phase-04-first-five.md explicitly allows
this to be "stubbed": the stub ships as a real, schema-valid, TRUE_SECRET character with one
placeholder ability, but the actual unlock condition (almost certainly "spend all nine lives across
enough matches," a progression-system concern) isn't wired up — that belongs to Phase 09's local
profile/unlocks system, not this phase's engine work. Logged as OQ-34.

## Deviations from a literal reading of spec/03
- **Nine Lives is a proactive pre-charge, not a reactive save-on-death.** The engine's
  `evaluateEvent` skips a character's own passive once they're no longer alive
  (`packages/engine/src/triggers.ts`), so a trigger on `onDeath` for the dying character *themselves*
  can never fire for them — by the time the event exists, they're already excluded from the scan. The
  simplest reusable fix (already the pattern the existing Death Prevention status uses) is to grant the
  save *before* the lethal hit lands, at the start of each of his own turns, funded by the Lives
  Remaining resource. Net effect at the table is identical to "9 total saves," just re-armed once per
  turn rather than exactly once per death.
- **Paw Swap's redirect target is fixed to "onto Whiskers himself."** `retargetQueuedAction`'s
  `newTargetIds` is static content data (ADR-011); a real match's actual enemy ids aren't known when
  the ability is authored. Redirecting onto the caster is the one target that's always knowable in
  advance without new engine plumbing. A future "redirect onto a chosen ally" variant needs either a
  second player-selected target slot on the action, or a resolved-at-cast-time TargetRule for
  `retargetQueuedAction` — not built here, logged alongside OQ-36.

## Phase 15 balance pass
Changed in `docs/balance/drafts/phase-15-v1.json` (paths as in dev mode):
- `characters/mister-whiskers/baseHp` is now **100**
