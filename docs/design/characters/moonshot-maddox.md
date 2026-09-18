# Mason "Moonshot" Maddox

**Data:** `packages/content/src/data/characters/moonshot-maddox.ts`
**Rarity:** CORE · **Tags:** ATHLETE, ATTACKER · **HP:** 100

## Identity
A sports hero whose whole kit is "get on base, then swing for the fences." spec/03: "Simple abilities
advance bases; HOME RUN is a devastating payoff... the mechanic must be visually obvious and
satisfying." Every ability except Home Run Swing is a modest, forgettable hit on its own — the payoff
is entirely in the buildup, which is exactly the baseball feeling the brief asks for.

## Win condition
Load the bases (reach 4), then land Home Run Swing for 60 damage instead of 10. Hustle exists as a
recovery tool: it advances a base *and* shakes off a strike, so a player behind on the count still has
a path back to a real swing rather than being locked out of the payoff entirely.

## Counterplay
Three Strikes fully undoes his progress (bases reset to 0, Strikes reset to 0, and he's stunned for a
turn) the very next time he acts — so an opponent with any way to inflict Strikes can deny the payoff
indefinitely by re-applying them faster than he can burn them off with Hustle. Home Run Swing's own
damage is gated on Bases == 4 exactly, so an opponent watching the visible, `trackMode: true` Bases
counter always knows whether a Home Run Swing is a real threat or a 10-damage whiff.

## Known counters and synergies
- **Countered by:** any character whose kit can apply Strikes (none yet — this needs a real "pitcher"
  character, see Deviations) or that reliably stuns/disrupts him right as he's about to swing.
- **Synergizes with:** a teammate who can protect him for the 3-4 turns it takes to load the bases —
  he has no defensive tools of his own besides Hustle's minor Damage Reduction.

## Ability-by-ability, 5-second readability check
| Ability | One sentence | 5-second read? |
|---|---|---|
| Leadoff Single | Deal 15 damage, advance one base. | Yes. |
| Double Down the Line | Deal 20 damage, advance two bases. | Yes. |
| Hustle | Brace defensively, advance one base, shake off a strike. | Yes — three short clauses, all familiar concepts. |
| Home Run Swing | A huge hit if the bases are loaded; a weak one otherwise. | Yes — the visible Bases counter tells you which one you'll get before you even cast it. |

## Deviations from a literal reading of spec/03
- **All base/strike bookkeeping lives in one passive, "At the Plate," rather than inside each
  ability.** An ability's effects all share the one `TargetRule` the ability itself resolved
  (`packages/engine/src/effects.ts`); an enemy-targeted ability like Leadoff Single can't also modify
  Moonshot's own `resource.bases` in the same cast without a second target. Routing every
  base/strike change through a single `onAbilityUsed` passive — keyed by `usedAbilityLastTurn`, which
  doubles as "the ability just used" since `abilityHistory` is updated before the passive fires —
  avoids that limitation entirely without a new engine primitive. See `docs/DECISIONS.md` ADR-011.
- **The strikeout check resolves on his *next action* after the third Strike, not instantly.** Nothing
  in his kit reacts to `onResourceChanged` (that would need a second standing hook, and a character
  only has one passive slot); checking "3+ strikes" first, before any per-ability logic, inside the
  same `onAbilityUsed` passive means the disruption always lands the moment he next tries to act,
  which is simpler and still fully satisfies "opponents can inflict STRIKES or disrupt his
  advancement."
- **No opposing "pitcher" character exists yet** to actually inflict Strikes in a real match — this
  phase's scenario test (`packages/engine/src/scenarios/moonshot-maddox.scenario.test.ts`) uses a
  minimal test-fixture ability standing in for one, the same convention phase-04-first-five.md itself
  proposes for Father Bell's effect on Malachar.
