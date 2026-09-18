# Malachar, Lord of the Last Breath

**Data:** `packages/content/src/data/characters/malachar.ts`
**Rarity:** SECRET · **Tags:** NECROMANCER, SUMMONER, UNDEAD, CONTROLLER · **HP:** 115 → 150 (the Death King)

## Identity
An economy built on other people's deaths. Every death anywhere in the match (his own team's or the
enemy's) feeds his one resource, Souls, which in turn fuels everything else he does: a damage-absorbing
Thrall, a bonus-damage Corpse Command, a temporary fourth fighter, and eventually his own ascension.
spec/03: "Intentionally oppressive if allowed to establish his engine. He should be genuinely
frightening." — the frightening part is structural, not just flavor: the longer a fight runs and the
more things die, the stronger he gets, with no cap on how many kills anyone can feed him.

## Win condition
Survive long enough for deaths to happen (his own team's early losses count too), then spend the
resulting Souls on Raise the Forgotten/Corpse Command for tempo, or bank toward You Belong to Me and
Embrace the Throne for a late-game spike. He is weakest in the opening turns, before any Soul economy
exists at all.

## Counterplay
**Father Bell.** Every Soul-fueled mechanic — Souls themselves, Raise the Forgotten, Corpse Command,
and (separately, at the engine level) resurrection generally — is blocked by Soul Consecration on the
character who died. spec/03 is explicit that this relationship should never be stated to players
("Never display 'FATHER BELL COUNTERS MALACHAR.' Players discover the relationship organically") —
this doc is design-internal, not player-facing text, so it's named plainly here on purpose.

## Known counters and synergies
- **Countered by:** Father Bell (see above, once he exists — Phase 06+); anything that denies deaths
  altogether (Death Prevention-style effects on the rest of the cast starve his entire economy).
- **Synergizes with:** a teammate who can force early trades (even losing trades) just to seed his
  Soul count — Malachar benefits from *any* death, including his own team's.

## Ability-by-ability, 5-second readability check
| Ability | One sentence | 5-second read? |
|---|---|---|
| Raise the Forgotten | Spend 2 Souls to summon a Thrall that absorbs 20 damage. | Yes. |
| Borrowed Life | Deal 20 damage and take that HP for himself. | Yes — the classic lifesteal shape. |
| Corpse Command | A bonus-damage strike if he has 3+ Souls banked. | Yes — same "banked resource unlocks a bigger number" pattern as Moonshot's Home Run. |
| You Belong to Me | Extremely expensive; spend 6 Souls to field a temporary fourth fighter. | Yes, with one caveat below — "under his control" is simplified to "an inert extra body," not a fully independent unit. |
| Embrace the Throne | At 8 Souls, ascend into the Death King. | Yes. |

## Deviations from a literal reading of spec/03
These four are the direct, logged consequence of two real engine limits: **(1)** `TargetRule`-based
ability targeting can never select a dead character — `resolveTargets`' candidate pool always filters
to `alive` (`packages/engine/src/targeting.ts`) — so no ability can literally "target this specific
corpse." **(2)** a Condition's `"enemy"`/`"ally"` target refs only ever resolve to a *living*
character (`packages/engine/src/conditions.ts`), so a condition can't ask "is there an eligible dead
enemy" either. Building real corpse-identity targeting is a bigger, more speculative feature than any
of this phase's acceptance criteria needed — logged as OQ-36 rather than guessed at.

- **Corpse Command doesn't literally borrow a defeated character's ability.** It's simplified into a
  Soul-fueled bonus-damage strike on his existing target. A literal "use a simplified version of
  <specific corpse>'s ability" needs a `CharacterDefinition`-aware lookup the engine doesn't have yet
  (the same gap that keeps `hasTag`/`secretScript` always returning `false` — see OQ-31b).
- **Raise the Forgotten summons a Thrall from nothing, not from a specific corpse.** Same reason —
  there's no way to select or reference which enemy's corpse is being raised.
- **You Belong to Me summons a slot-occupying `Summon` (a true "temporary fourth fighter," per
  spec/03's own coverage list) rather than resurrecting a specific enemy onto his team.** A slot-
  occupying summon doesn't independently act or get targeted yet (`docs/DECISIONS.md` ADR-010 point 8,
  OQ-32) — this is the closest honest expression of "temporarily resurrect a defeated character under
  Malachar's control" the current engine supports, not a silent downgrade.
- **Consecration's four blocks (souls, resurrection, thralls, corpse use) route through two
  mechanisms, not four independent ones.** Resurrection is a direct, generic engine check (any
  consecrated character blocks a `resurrect` effect, same as Resurrection Lock —
  `packages/engine/src/effects.ts`). Souls, Thralls, and Corpse Command all draw from the *same* Souls
  resource, and that resource simply never grows from a consecrated death (`passive.malachar.
  the-dead-remember`'s condition) — so a consecrated kill starves all three at once, which is a
  faithful reading of "cannot generate Souls, be turned into a Thrall, or have its abilities
  commanded" even though it doesn't track *which* specific corpse was consecrated. Tested in
  `packages/engine/src/scenarios/malachar.scenario.test.ts` with a minimal test-fixture ability
  standing in for Father Bell's real (not-yet-built) passive, exactly as phase-04-first-five.md itself
  proposes.
- **`Trigger.effectTarget: "self"` is a new, small engine addition** (`docs/DECISIONS.md` ADR-011)
  needed for "The Dead Remember" to work at all: a reactive effect previously always landed on
  whoever the triggering event was *about* (the corpse), never on the trigger's holder — which made
  "whenever ANYONE dies, *I* gain a Soul" structurally impossible before this phase.
