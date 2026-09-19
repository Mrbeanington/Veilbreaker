# Shiro, the Last Brush (Legend)
**Data:** `shiro.ts` · LEGENDARY · ASSASSIN · 100 HP

## Identity / win condition
Chip a target down, then Final Stroke: below 30% HP the target is **erased** — no death triggers fire (the engine never maps `erased` to `onDeath`). Otherwise it is a 20-damage hit.

## Balance levers
Costs 3 Focus + 2 Spirit, 4-turn cooldown, only 100 HP, and a hard HP threshold: it never erases a healthy enemy.

## Counterplay — concrete counters
- **Tortuga Rex**: Ancient Patience heals him back above 30% before Shiro's window.
- **Mister Whiskers**: Paw Swap redirects a queued Final Stroke onto Whiskers (Nine Lives doesn't stop an erase, so he uses it on a healthy target instead).
- **Father Bell**: Hush silences Shiro for a turn.
Erasure ignores Death Prevention: keep enemies above 30%.

## Tests
`batch1.scenario.test.ts`: Malachar (a real on-death watcher) collects a Soul from an ordinary kill of the same target but none from Final Stroke.

## Deviations
Cultural review flag (OQ-12): art spec is `draft`; region tagged Japanese sumi-e.
