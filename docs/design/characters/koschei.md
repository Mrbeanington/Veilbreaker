# Koschei the Deathless
**Data:** `koschei.ts` · SECRET · UNDEAD/FOLKLORE/CONTROLLER · 120 HP

## Identity / win condition
His death is hidden in nested things: the **Death Seals** resource (starts 1, max 3). At each turn start a spare Seal is spent to grant Death Prevention (the Nine Lives pre-charge pattern), so his next killing blow leaves him at 1 HP. Hide the Needle banks a Seal; Deathless Fury hits for 45 with 2+ Seals (20 otherwise); Iron Grip stuns; Winter Touch is 20 damage.

## Counterplay
Seals are a visible pip resource and finite. Two lethal hits in one turn beat a single Seal (the save floors him at 1, then the second kills). **Shiro**'s erasure ignores Death Prevention entirely. Stun-locking him from gaining Seals, or starving his Spirit (**Mister Whiskers**'s energy drain), stops the refill.

## Readability
Everything is a number or a pip. "Seals: hold at least 2 for full Fury" is the only rule to remember.

## Deviations
"Relics" is modelled by the Seals resource plus the passive that spends them; a physical, destructible relic object would need targetable summons (OQ-32). Tested in `batch2.scenario.test.ts`.
