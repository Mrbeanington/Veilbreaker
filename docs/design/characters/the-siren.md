# The Siren
**Data:** `the-siren.ts` · RARE · MYTHOLOGY/MUSIC/CONTROLLER/MAGE · 100 HP

## Identity / win condition
A song in order (**combo sequences**, **musical sequences**, **songs**). **Lure** (10 damage), then **Lullaby** (10 damage, and it silences if it directly follows Lure), then **Shipwreck**: 60 damage and a stun if the last two abilities used were exactly Lure then Lullaby, otherwise a plain 20. Undertow (the tide) hits every enemy for 10.

## Counterplay
The 60 needs three turns in a fixed order, and any other ability in between resets it; a silence or stun on her breaks the song, and she has 100 HP. Nothing is hidden: the combo is printed in Shipwreck's text.

## Readability
One combo, three verses, spelled out.

## Deviations
The sequence check reads the character's own last two abilities, so passing a turn does not break it, but acting with any other ability does. Tested in `packages/engine/src/scenarios/region1.scenario.test.ts`.
