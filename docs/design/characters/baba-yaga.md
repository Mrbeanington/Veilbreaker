# Baba Yaga
**Data:** `baba-yaga.ts` · RARE · FOLKLORE/MAGE/SUMMONER/CONTROLLER · 120 HP

## Identity / win condition
A hospitable horror. Hut on Legs summons an attached, 40 HP damage-absorbing hut (3 turns); Mortar Flight makes her untargetable; Blighted Brew is damage plus poison; Evil Eye weakens. Passive **Old Hunger**: whenever an enemy dies she heals 20 (via `effectTarget: "self"`, ADR-011).

## Counterplay
The hut only absorbs `normal`/`piercing` damage, not affliction (Patient Zero's Infection). Mortar Flight is one turn on a 3-turn cooldown. **Plague Doctor**'s Anti-Heal blanks Old Hunger's healing.

## Readability
Four self-explanatory abilities; the passive is one sentence.

## Tests
Hut absorption, Mortar Flight untargetability (via the real `validateAction`), and Old Hunger, in `batch2.scenario.test.ts`.
