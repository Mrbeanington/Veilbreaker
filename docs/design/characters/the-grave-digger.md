# The Grave Digger
**Data:** `the-grave-digger.ts` · RARE · FOLKLORE/SUPPORT/CONTROLLER · 130 HP

## Identity / win condition
The man who knows where everyone is buried. Spade Swing is 20, Gravedigger's Grip is 30, Fresh Earth shields a friend for 30, and **Exhume** digs a fallen ally back up at **30% health** for Spirit 3 and Focus 1 on a 6-turn cooldown.

## Counterplay
Exhume is the second resurrection on the roster after **Nekomata**'s Rise Again, but on another character and repeatable. It can be blocked by Resurrection Lock and Soul Consecration (**Father Bell**), it needs a fallen ally, and the ally comes back at 30%. It cannot target the living.

## Readability
The cost and cooldown are printed.

## Deviations
Uses `includeDead` target rules as Nekomata does. Tested in `packages/engine/src/scenarios/region7.scenario.test.ts`.
