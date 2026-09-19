# Nemesis
**Data:** `nemesis.ts` · RARE · MYTHOLOGY/CONTROLLER/CURSE · 130 HP

## Identity / win condition
**Grudge** (0-5) rises whenever an *ally* is damaged (**Scales Must Balance**; her own wounds do not count). Just Deserts is 20, or 30 with three Grudge. **Reckoning** is 30, or 60 with three Grudge (spending them). **Mirror of Hubris** reflects damage aimed at her for a turn back at the attacker. Curse of Hubris curses and weakens.

## Counterplay
She is strongest when her allies are hurt, which is a real cost. The reflect is one turn on a 4-turn cooldown: an enemy that does not attack her (or uses an ability that is not Normal damage) wastes it. The curse status has no engine hook of its own; the Weakness is the effect.

## Readability
"Every hit on my friends is a Grudge".

## Deviations
Reflect redirects Normal damage only (engine rule), so Affliction and Piercing get through. Tested in `packages/engine/src/scenarios/region1.scenario.test.ts`.
