# Maestro Nocturne
> **Phase 15:** numbers in this note were rebalanced after 30,000-match simulations; the current values are listed in the Phase 15 section at the end.
**Data:** `maestro-nocturne.ts` · RARE · MUSIC/SUPPORT/CONTROLLER · 100 HP

## Identity / win condition
Tempo. **Adagio** stops an enemy's cooldowns ticking for three turns; **Allegro** doubles an ally's tick speed; **Da Capo** makes an ally's most recent ability ready again (uses the generic `@lastUsed` ability token, ADR-015); Staccato is 20 damage. **Perfect Tempo** (passive) shaves a turn off Da Capo's cooldown whenever he uses any ability, so a busy Maestro gets his big reset sooner.

## Counterplay
He is fragile (100 HP) and does little damage himself. Adagio does nothing against kits with no cooldowns. Da Capo is wasted on an ally that has not used a cooldown ability. **Father Bell**'s Hush shuts him off entirely, and **Shiro** can pick him off quickly.

## Readability
Three cooldown verbs: slow them, speed us, reset us.

## Deviations
Using Da Capo itself also triggers Perfect Tempo, so its effective cooldown is 3, not 4. Accepted; balance pass in Phase 07.

## Phase 15 balance pass
Changed in `docs/balance/drafts/phase-15-v1.json` (paths as in dev mode):
- `characters/maestro-nocturne/baseHp` is now **120**
- `abilities/ability.maestro-nocturne.staccato/effects/0/amount` is now **30**
