# Madame Fortuna (Legend)
**Data:** `madame-fortuna.ts` · LEGENDARY · LEGENDARY/FOLKLORE/CHEATER/RANDOM · 110 HP

## Identity / win condition
A probability Cheater. She cannot change what a roll offers, only which branch it lands on. **Fortune's Favour** forces an ally's next random outcome to its **best** branch; **Ill Omen** forces an enemy's to its **worst**; Turn the Card is a draw for an enemy (60 in 1 of 5, 30 in 2, 10 in 2); **Wheel of Fortune** spins for every enemy: a stun, 40 and weakened, or 70.

## Balance levers (spec/03)
Rule-break: each rigged roll costs Focus and Chaos on a 2-turn cooldown, is logged when queued and is spent by the target's very next roll. Wheel of Fortune costs Chaos 3, Spirit 2 and Focus 1 on a 5-turn cooldown and can land on its weakest branch. 110 HP. **Fortune Turns**: below half health every wound forces her own next roll to its worst outcome. Her rigging does nothing for characters with no random abilities, so she needs gamblers on her team.

## Counterplay
The cheat is narrow and readable:
- **Father Bell**: Hush silences her so no roll can be rigged (tested).
- **Mister Whiskers**: steals the Chaos every one of her abilities needs.
- Characters with no random abilities (most of the roster) are untouched by Fortune's Favour and Ill Omen.
- The rigged roll is spent by the first random ability the target uses, so a target can burn it on a throwaway roll.
- Her own passive punishes being hurt: once she is below half health her draws land on the worst outcome.

## Readability
The queued roll is a logged event (`rngModifierQueued`), and every branch of her own draws is printed on the ability.

## Deviations
First Legend to be a Cheater with a documented rule-break and counterplay (as the Gambler and Emperor Zero are). Random branches throughout the game are listed worst to best, so `guaranteeMin` and `guaranteeMax` mean what they say. Marked DISCOVERABLE. She has a Legend trial (`trial.madame-fortuna`, against her, The Gambler and The Referee). Tested in `packages/engine/src/scenarios/region6.scenario.test.ts`.
