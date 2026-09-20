# Aurelia, Empress of the Sun (Legend)
**Data:** `aurelia.ts` · LEGENDARY · LEGENDARY/MYTHOLOGY/SUPPORT/DEFENDER · 140 HP

## Identity / win condition
The ultimate defensive support. **Sun's Vigil** puts **Sun Guard** (`status.sun-guard`, the 36th status) on another ally for 2 turns: they cannot fall below 1 health, however hard or often they are hit, and it is not consumed. **Zenith Aegis** does the same for every ally, herself included, for a turn. Radiant Lance is 30; Solar Mend heals 20. It delays a death; it never cancels one.

## Balance levers (spec/03)
Sun's Vigil costs Spirit 2 and Focus 1 on a 4-turn cooldown and cannot target herself; Zenith Aegis costs Spirit 3 and Focus 2 on a 6-turn cooldown and lasts a single turn. 140 HP. **Setting Sun**: below half health every wound leaves her more exposed (Damage Amplification 10 for a turn). She does no burst of her own, so a guarded team still needs a way to win.

## Counterplay
Sun Guard buys time, it does not buy survival:
- **Father Bell**: Hush silences her so no Vigil or Aegis can be cast (tested).
- **Shiro**: erasure bypasses the floor, so a guarded ally at 1 health is simply erased (tested).
- **Mister Whiskers**: steals the energy the guard needs.
Also: it ends, and the ally is then still at 1 health; a dispel removes it early; healing-blocking and stun on Aurelia stop the setup. Damage over time is held too, but only while the guard lasts.

## Readability
Sun Guard's text is on the status and both abilities, and the log shows each blow that is held at 1.

## Deviations
Sun Guard is a new status with an engine hook in `applyHp` (damage.ts); unlike Death Prevention it is a standing floor, not a single save (ADR-026). Marked DISCOVERABLE. Aurelia also has a Legend trial (`trial.aurelia`). Tested in `packages/engine/src/scenarios/region5.scenario.test.ts`.
