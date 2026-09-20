# The Gatekeeper
**Data:** `the-gatekeeper.ts` · SECRET · FOLKLORE/DEFENDER/CONTROLLER/SECRET · 100 HP

## Identity / win condition
The keeper of the last gate: nothing passes without paying. **Toll of the Gate**: while the Gate is barred (he has the taunt from Bar the Gate), every ability an enemy uses costs that enemy **10 health** (affliction damage). Bar the Gate (a 4-turn cooldown) draws single-target attacks to him and gives Damage Reduction 20; Halberd Thrust is 30; Turn Away raises an enemy's costs and weakens it; Open the Gate heals an ally 20 and lifts every harmful effect.

## Counterplay
The toll only runs on the turn after Bar the Gate (a 4-turn cooldown), and it was 92% in the first simulation when it ran every turn. It does not tax his own team, and it does not stop a burst that kills him first. Affliction damage ignores Damage Reduction and shields, but a healer negates it. A team of one-ability characters barely notices it. DISCOVERABLE secret with a silhouette prompt.

## Readability
The passive is one line and shows in the log for every ability.

## Deviations
First passive that harms the *user* of an enemy ability (an `onAbilityUsed` trigger with a subject-targeted effect). Tested in `packages/engine/src/scenarios/region11.scenario.test.ts`.
