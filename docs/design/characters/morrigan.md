# Morrigan, Mother of Crows (Legend)
**Data:** `morrigan.ts` · LEGENDARY · LEGENDARY/MYTHOLOGY/CURSE/CONTROLLER · 130 HP

## Identity / win condition
The dark prophecy controller. **Mark of the Crows** lays a **Prophecy of Ruin** (`status.crow-prophecy`) on an enemy for 3 turns: if that enemy *ends a turn below half health*, the prophecy comes true for 60 affliction damage and is consumed. Carrion Call is 40 damage, or 60 against a prophesied enemy; Mother's Ward shields an ally for 40; **Storm of Crows** deals 40 to every enemy and prophesies them all.

## Balance levers (spec/03)
Storm of Crows costs Might 3, Spirit 2 and Chaos 1 on a 5-turn cooldown; Mark of the Crows needs both Focus and Spirit. Only 130 HP. **Crows Leave the Dying**: below half health every wound leaves her more exposed (Damage Amplification 10 for a turn). Her prophecy needs the enemy to be hurt first, so she needs partners who deal damage.

## Counterplay
The prophecy is escapable by design ("correct counterplay can escape"):
- **The Firebird**: Dawn Light burns every harmful effect, the prophecy included, off an ally (tested).
- **Domovoi** and **The Valkyrie**: healing keeps an ally above half health, so the prophecy never fires (tested with a healing enemy).
- **The Black Knight**: the anti-Legend who gains advantages against Legendary opponents.
Also: affliction damage ignores Invulnerable, but a stun or silence on Morrigan stops the set-up, and the prophecy simply expires after 3 turns on a healthy target.

## Readability
The prophecy's text is on the status and the ability; nothing about it is hidden once applied.

## Deviations
The prophecy is affliction damage (it cannot be dodged with Invulnerable). Marked DISCOVERABLE. New status `status.crow-prophecy` (35th); Morrigan also has a Legend trial (`trial.morrigan`). Tested in `packages/engine/src/scenarios/region4.scenario.test.ts`.
