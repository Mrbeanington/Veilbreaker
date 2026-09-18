import { describe, expect, it } from "vitest";
import { STATUS_LIBRARY, statusDefinitionSchema, type CharacterRuntimeState, type StatusDefinition } from "@veilbreak/content";
import {
  applyStatusToCharacter,
  canAct,
  computeTicks,
  decrementStatusDurations,
  dispelCharacter,
  getEffectiveMagnitude,
  hasStatus,
  removeStatusFromCharacter,
  setStatusMagnitude,
} from "./statuses";

const STUN = STATUS_LIBRARY["status.stun"]!;
const SILENCE = STATUS_LIBRARY["status.silence"]!;
const SHIELD = STATUS_LIBRARY["status.shield"]!;
const BLEED = STATUS_LIBRARY["status.bleed"]!;
const CURSE = STATUS_LIBRARY["status.curse"]!; // dispellable: false

function fresh(): CharacterRuntimeState {
  return { characterId: "c1", currentHp: 100, maxHp: 100, alive: true, cooldowns: {}, statuses: [] };
}

// None of the 32 library statuses use stackRule "none" (every one either
// refreshes or stacks) — this is a test-only fixture for that generic engine
// behavior, same "fixture, not hard-coded" precedent as Phase 01's abilities.
const NO_STACK_STATUS: StatusDefinition = statusDefinitionSchema.parse({
  id: "test.no-stack",
  displayName: "Test No-Stack",
  icon: "icon/test.svg",
  source: "ability",
  defaultTarget: { side: "enemy", scope: "single", count: 1, includeSelf: false, filterTags: [] },
  duration: { turns: 2, permanent: false },
  stackRule: "none",
  visualTreatment: "n/a",
  tooltip: "test fixture",
});

describe("applyStatusToCharacter", () => {
  it("adds a new status with the definition's default duration when none is given", () => {
    const c = applyStatusToCharacter(fresh(), STUN, {});
    expect(hasStatus(c, STUN.id)).toBe(true);
    expect(c.statuses[0]?.remainingTurns).toBe(STUN.duration.turns);
  });

  it("an explicit durationTurns overrides the definition's default", () => {
    const c = applyStatusToCharacter(fresh(), STUN, { durationTurns: 5 });
    expect(c.statuses[0]?.remainingTurns).toBe(5);
  });

  it("stackRule 'none' ignores a reapplication while already active", () => {
    const once = applyStatusToCharacter(fresh(), NO_STACK_STATUS, { durationTurns: 1 });
    const twice = applyStatusToCharacter(once, NO_STACK_STATUS, { durationTurns: 99 });
    expect(twice.statuses[0]?.remainingTurns).toBe(1);
    expect(twice.statuses).toHaveLength(1);
  });

  it("stackRule 'refresh' replaces duration and magnitude but not the stack count", () => {
    const refreshOnce = applyStatusToCharacter(fresh(), STUN, { durationTurns: 1 });
    const refreshTwice = applyStatusToCharacter(refreshOnce, STUN, { durationTurns: 3 });
    expect(refreshTwice.statuses[0]?.remainingTurns).toBe(3);
    expect(refreshTwice.statuses).toHaveLength(1);
  });

  it("stackRule 'stack' accumulates stacks (capped at maxStacks) without resetting duration", () => {
    let c = applyStatusToCharacter(fresh(), SHIELD, { magnitude: 10, durationTurns: 3 });
    c = applyStatusToCharacter(c, SHIELD, { magnitude: 10, durationTurns: 1 });
    expect(c.statuses[0]?.stacks).toBe(2);
    expect(c.statuses[0]?.remainingTurns).toBe(3); // duration untouched by a plain "stack" rule
    expect(getEffectiveMagnitude(c, SHIELD.id)).toBe(20); // magnitude(10) * stacks(2)
  });

  it("stacking respects maxStacks", () => {
    let c = fresh();
    for (let i = 0; i < SHIELD.maxStacks + 5; i++) {
      c = applyStatusToCharacter(c, SHIELD, { magnitude: 10 });
    }
    expect(c.statuses[0]?.stacks).toBe(SHIELD.maxStacks);
  });

  it("stackRule 'stackAndRefresh' accumulates stacks AND resets duration", () => {
    let c = applyStatusToCharacter(fresh(), BLEED, { magnitude: 5, durationTurns: 1 });
    c = applyStatusToCharacter(c, BLEED, { magnitude: 5, durationTurns: 3 });
    expect(c.statuses[0]?.stacks).toBe(2);
    expect(c.statuses[0]?.remainingTurns).toBe(3);
  });
});

describe("setStatusMagnitude / removeStatusFromCharacter", () => {
  it("collapses to a single stack at the new magnitude", () => {
    let c = applyStatusToCharacter(fresh(), SHIELD, { magnitude: 10 });
    c = applyStatusToCharacter(c, SHIELD, { magnitude: 10 });
    expect(getEffectiveMagnitude(c, SHIELD.id)).toBe(20);
    c = setStatusMagnitude(c, SHIELD.id, 5);
    expect(getEffectiveMagnitude(c, SHIELD.id)).toBe(5);
    expect(c.statuses[0]?.stacks).toBe(1);
  });

  it("removes the status entirely when set to 0 or below", () => {
    let c = applyStatusToCharacter(fresh(), SHIELD, { magnitude: 10 });
    c = setStatusMagnitude(c, SHIELD.id, 0);
    expect(hasStatus(c, SHIELD.id)).toBe(false);
  });

  it("removeStatusFromCharacter removes regardless of dispellable", () => {
    const c = applyStatusToCharacter(fresh(), CURSE, {});
    expect(hasStatus(removeStatusFromCharacter(c, CURSE.id), CURSE.id)).toBe(false);
  });
});

describe("dispelCharacter", () => {
  it("removes dispellable statuses but keeps non-dispellable ones", () => {
    let c = applyStatusToCharacter(fresh(), STUN, {}); // dispellable: true
    c = applyStatusToCharacter(c, CURSE, {}); // dispellable: false
    const dispelled = dispelCharacter(c, STATUS_LIBRARY);
    expect(hasStatus(dispelled, STUN.id)).toBe(false);
    expect(hasStatus(dispelled, CURSE.id)).toBe(true);
  });
});

describe("decrementStatusDurations", () => {
  it("decrements by 1 and removes a status once it reaches 0", () => {
    let c = applyStatusToCharacter(fresh(), STUN, { durationTurns: 2 });
    c = decrementStatusDurations(c);
    expect(c.statuses[0]?.remainingTurns).toBe(1);
    c = decrementStatusDurations(c);
    expect(hasStatus(c, STUN.id)).toBe(false);
  });

  it("never decrements a permanent status (remainingTurns: null)", () => {
    const deathPrevention = STATUS_LIBRARY["status.death-prevention"]!; // permanent: true in the library
    let c = applyStatusToCharacter(fresh(), deathPrevention, {});
    expect(c.statuses[0]?.remainingTurns).toBeNull();
    c = decrementStatusDurations(c);
    expect(hasStatus(c, deathPrevention.id)).toBe(true);
    expect(c.statuses[0]?.remainingTurns).toBeNull();
  });
});

describe("computeTicks", () => {
  it("returns magnitude*stacks for every active status matching the requested tick behavior", () => {
    let c = applyStatusToCharacter(fresh(), BLEED, { magnitude: 10, stacks: 1 });
    c = applyStatusToCharacter(c, BLEED, { magnitude: 10, stacks: 1 }); // stackAndRefresh -> stacks 2
    const ticks = computeTicks(c, STATUS_LIBRARY, "damageOverTime");
    expect(ticks).toEqual([{ statusId: BLEED.id, amount: 20 }]);
    expect(computeTicks(c, STATUS_LIBRARY, "healOverTime")).toEqual([]);
  });
});

describe("canAct", () => {
  it("is false while stunned or silenced, true otherwise", () => {
    expect(canAct(fresh())).toBe(true);
    expect(canAct(applyStatusToCharacter(fresh(), STUN, {}))).toBe(false);
    expect(canAct(applyStatusToCharacter(fresh(), SILENCE, {}))).toBe(false);
  });
});
