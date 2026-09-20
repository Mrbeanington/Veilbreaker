# Orpheon, the Final Song (Legend)
**Data:** `orpheon.ts` · LEGENDARY · LEGENDARY/MUSIC/MAGE/CONTROLLER · 130 HP

## Identity / win condition
A performance in three parts. **Verse** is 20 and begins the song (stage 1); **Chorus** is 40 and raises it to stage 2, but only from the Verse (otherwise 10); **Finale** is 70 to every enemy, but only after the Chorus (otherwise 10), and ends the performance; Rest Note shields him for 30.

## Balance levers (spec/03)
The Finale costs Spirit 3 and Focus 2 on a 5-turn cooldown; the song takes three turns and every step is visible. **Interrupted Song**: a stun or a silence on him resets the performance to the start at once. 130 HP, and only Rest Note to defend himself. The Verse and Chorus use Focus and Spirit, so energy denial stalls the whole song.

## Counterplay
The performance is the vulnerability, and the roster interrupts it in several ways:
- **Father Bell**: Hush silences him and the song starts over (tested).
- **The Marionettist**: Marionette Dance stuns him and the song starts over (tested).
- Any other stun or silence does the same, including **Glass Case**, **Bewitch** and **Record Scratch**.
- **Mister Whiskers**-style energy theft starves the Finale.
He also has no answer to being burst down in the three turns it takes.

## Readability
The stage is a visible pip counter, and each ability says what it needs.

## Deviations
Interruption resets the performance through a passive on `onStatusApplied` (a stun or silence on him). He has a Legend trial (`trial.orpheon`, against him, Maestro Nocturne and The Gambler). Tested in `packages/engine/src/scenarios/region10.scenario.test.ts`.
