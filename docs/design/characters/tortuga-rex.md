# Tortuga Rex

**Data:** `packages/content/src/data/characters/tortuga-rex.ts`
**Rarity:** CORE · **Tags:** TANK, DEFENDER, BEAST · **HP:** 140

## Identity
An ancient, unkillable wall. He does not out-damage anyone — he outlasts them, then punishes whoever
finally lets their guard down. Every kit decision reinforces "slow offensively, extremely hard to
kill" from spec/03: three of his four abilities are pure defense/sustain, and the one real payoff
(Shellquake) is deliberately weak unless he's already done the slow thing first.

## Win condition
Out-attrition the opponent. Fortress Shell and Ancient Patience keep him alive turn after turn while
his team's other two characters do the actual damage; Shellquake is his own occasional spike, not his
main damage source.

## Counterplay
He has no answer to sustained anti-healing (Anti-Heal blocks Ancient Patience's `heal` outright) or to
burst that ignores flat damage reduction (piercing/affliction damage skip Damage Reduction entirely —
see `packages/engine/src/damage.ts`). A team that brings either can out-race his sustain; a team with
neither will lose a war of attrition against him.

## Known counters and synergies
- **Countered by:** anti-healing specialists (The Plague Doctor, later phases); piercing/affliction-heavy
  attackers, since his one form of mitigation (Damage Reduction) does nothing against either.
- **Synergizes with:** any Taunt-holder on his team is redundant with his own tankiness rather than
  complementary — he's better paired with burst damage dealers who need time to set up, since he buys
  that time for free.

## Ability-by-ability, 5-second readability check
| Ability | One sentence | 5-second read? |
|---|---|---|
| Shell Bash | Deal 30 damage. | Yes — plain damage number, nothing else. |
| Fortress Shell | Reduce incoming damage by 30 for 2 turns. | Yes — the tooltip (`generateAbilityTooltip`) states it exactly. |
| Ancient Patience | Heal 20 and reduce incoming damage by 10 for 2 turns. | Yes — two flat numbers, both familiar mechanics. |
| Shellquake | Deal 40 damage — only 10 if he hasn't set up defensively first. | Borderline: the conditional needs one extra clause ("if defended this fight") but no hidden math — see below. |

Shellquake's condition is deliberately literal rather than clever: it checks whether Tortuga
currently has **any** stack of Damage Reduction active (from either Fortress Shell or Ancient
Patience), not a specific counter or turn-order gimmick. A player only needs to remember "set up,
then Shellquake" — the strength difference (40 vs. 10) is large enough to teach itself after one use.

## Deviations from a literal reading of spec/03
None beyond number selection (spec only names the four abilities and their headline numbers, which
are used verbatim: Shell Bash 30, Fortress Shell reduces by 30, Ancient Patience heals 20, Shellquake
40 "after defensive setup"). The 10-damage Shellquake fallback and Ancient Patience's smaller +10
Damage Reduction are this phase's own additions, needed to make the ability castable at all without
setup and to give Ancient Patience its own "defensive setup" value distinct from Fortress Shell's.
