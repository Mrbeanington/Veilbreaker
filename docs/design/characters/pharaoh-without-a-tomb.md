# The Pharaoh Without a Tomb
**Data:** `pharaoh-without-a-tomb.ts` · RARE · MYTHOLOGY/SUPPORT/SUMMONER · 140 HP

## Identity / win condition
A king with no throne. Scepter Strike is 20; **Raise the Guard** conjures a royal guard with 40 health for 3 turns; **Royal Decree** shields every ally for 20; Royal Tribute takes 1 energy from the enemy team for himself.

## Counterplay
Everything he does is small and cooldown-gated. Area damage clears the guard; energy denial answers Tribute.

## Readability
Every ability is a single effect.

## Deviations
The scepter constant is prefixed to avoid clashing with The Midnight Tsar's (ability constants must be unique package-wide). Tested in `packages/engine/src/scenarios/region5.scenario.test.ts`.
