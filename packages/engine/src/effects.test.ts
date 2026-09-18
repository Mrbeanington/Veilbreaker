import { describe, expect, it } from "vitest";
import {
  summonSchema,
  transformationSchema,
  STATUS_LIBRARY,
  type BattleTeam,
  type CharacterRuntimeState,
  type EnergyPool,
  type Resource,
  type Summon,
  type Transformation,
} from "@veilbreak/content";
import { applyEffect, type EffectContext, type EffectState } from "./effects";
import { createRng } from "./rng";
import { hasStatus } from "./statuses";
import { testCharacter } from "./test-support";

const STUN = STATUS_LIBRARY["status.stun"]!;

function character(id: string, hp = 100): CharacterRuntimeState {
  return testCharacter({ characterId: id, currentHp: hp });
}

function emptyPool(): EnergyPool {
  return { MIGHT: 0, FOCUS: 0, SPIRIT: 0, CHAOS: 0 };
}

const teams: [BattleTeam, BattleTeam] = [
  { playerId: "playerA", characterIds: ["a1"] },
  { playerId: "playerB", characterIds: ["b1"] },
];

function stateWith(characters: CharacterRuntimeState[], pools?: Record<string, EnergyPool>): EffectState {
  return {
    characters: Object.fromEntries(characters.map((c) => [c.characterId, c])),
    energyPools: pools ?? { playerA: emptyPool(), playerB: emptyPool() },
    summons: {},
  };
}

function ctx(overrides: Partial<EffectContext> & Pick<EffectContext, "sourceId" | "targetIds">): EffectContext {
  return {
    teams,
    turn: 1,
    statusLibrary: STATUS_LIBRARY,
    summonLibrary: {},
    transformationLibrary: {},
    resourceLibrary: {},
    ...overrides,
  };
}

describe("applyEffect — applyStatus / removeStatus", () => {
  it("applies a status with the given magnitude and duration", () => {
    const state = stateWith([character("a1"), character("b1")]);
    const result = applyEffect(
      state,
      { kind: "applyStatus", statusId: STUN.id, durationTurns: 2, magnitude: 0 },
      { sourceId: "a1", targetIds: ["b1"], teams, turn: 1, statusLibrary: STATUS_LIBRARY, summonLibrary: {}, transformationLibrary: {}, resourceLibrary: {} },
      createRng(1),
    );
    expect(hasStatus(result.state.characters.b1!, STUN.id)).toBe(true);
    expect(result.events[0]?.type).toBe("statusApplied");
  });

  it("removeStatus removes exactly the named status", () => {
    const applied = applyEffect(
      stateWith([character("a1"), character("b1")]),
      { kind: "applyStatus", statusId: STUN.id },
      { sourceId: "a1", targetIds: ["b1"], teams, turn: 1, statusLibrary: STATUS_LIBRARY, summonLibrary: {}, transformationLibrary: {}, resourceLibrary: {} },
      createRng(1),
    );
    const removed = applyEffect(
      applied.state,
      { kind: "removeStatus", statusId: STUN.id },
      { sourceId: "a1", targetIds: ["b1"], teams, turn: 1, statusLibrary: STATUS_LIBRARY, summonLibrary: {}, transformationLibrary: {}, resourceLibrary: {} },
      createRng(1),
    );
    expect(hasStatus(removed.state.characters.b1!, STUN.id)).toBe(false);
  });

  it("dispelAll removes every dispellable status and nothing else", () => {
    const curse = STATUS_LIBRARY["status.curse"]!; // dispellable: false
    let state = stateWith([character("a1"), character("b1")]);
    state = applyEffect(
      state,
      { kind: "applyStatus", statusId: STUN.id },
      { sourceId: "a1", targetIds: ["b1"], teams, turn: 1, statusLibrary: STATUS_LIBRARY, summonLibrary: {}, transformationLibrary: {}, resourceLibrary: {} },
      createRng(1),
    ).state;
    state = applyEffect(
      state,
      { kind: "applyStatus", statusId: curse.id },
      { sourceId: "a1", targetIds: ["b1"], teams, turn: 1, statusLibrary: STATUS_LIBRARY, summonLibrary: {}, transformationLibrary: {}, resourceLibrary: {} },
      createRng(1),
    ).state;
    const dispelled = applyEffect(
      state,
      { kind: "removeStatus", dispelAll: true },
      { sourceId: "a1", targetIds: ["b1"], teams, turn: 1, statusLibrary: STATUS_LIBRARY, summonLibrary: {}, transformationLibrary: {}, resourceLibrary: {} },
      createRng(1),
    );
    expect(hasStatus(dispelled.state.characters.b1!, STUN.id)).toBe(false);
    expect(hasStatus(dispelled.state.characters.b1!, curse.id)).toBe(true);
  });
});

describe("applyEffect — modifyCooldown", () => {
  it("mode 'set' sets the cooldown directly", () => {
    const state = stateWith([{ ...character("b1"), cooldowns: { "ability.x": 3 } }]);
    const result = applyEffect(
      state,
      { kind: "modifyCooldown", abilityId: "ability.x", mode: "set", amount: 0 },
      { sourceId: "a1", targetIds: ["b1"], teams, turn: 1, statusLibrary: STATUS_LIBRARY, summonLibrary: {}, transformationLibrary: {}, resourceLibrary: {} },
      createRng(1),
    );
    expect(result.state.characters.b1?.cooldowns["ability.x"]).toBe(0);
  });

  it("mode 'delta' adds to the current cooldown, floored at 0", () => {
    const state = stateWith([{ ...character("b1"), cooldowns: { "ability.x": 1 } }]);
    const increased = applyEffect(
      state,
      { kind: "modifyCooldown", abilityId: "ability.x", mode: "delta", amount: 2 },
      { sourceId: "a1", targetIds: ["b1"], teams, turn: 1, statusLibrary: STATUS_LIBRARY, summonLibrary: {}, transformationLibrary: {}, resourceLibrary: {} },
      createRng(1),
    );
    expect(increased.state.characters.b1?.cooldowns["ability.x"]).toBe(3);

    const decreased = applyEffect(
      state,
      { kind: "modifyCooldown", abilityId: "ability.x", mode: "delta", amount: -99 },
      { sourceId: "a1", targetIds: ["b1"], teams, turn: 1, statusLibrary: STATUS_LIBRARY, summonLibrary: {}, transformationLibrary: {}, resourceLibrary: {} },
      createRng(1),
    );
    expect(decreased.state.characters.b1?.cooldowns["ability.x"]).toBe(0);
  });
});

describe("applyEffect — modifyEnergy / drainEnergy", () => {
  it("modifyEnergy affects the source's own player pool", () => {
    const state = stateWith([character("a1")], { playerA: emptyPool(), playerB: emptyPool() });
    const result = applyEffect(
      state,
      { kind: "modifyEnergy", family: "MIGHT", amount: 2 },
      { sourceId: "a1", targetIds: [], teams, turn: 1, statusLibrary: STATUS_LIBRARY, summonLibrary: {}, transformationLibrary: {}, resourceLibrary: {} },
      createRng(1),
    );
    expect(result.state.energyPools.playerA?.MIGHT).toBe(2);
  });

  it("modifyEnergy never drops a family below 0", () => {
    const state = stateWith([character("a1")], { playerA: emptyPool(), playerB: emptyPool() });
    const result = applyEffect(
      state,
      { kind: "modifyEnergy", family: "MIGHT", amount: -5 },
      { sourceId: "a1", targetIds: [], teams, turn: 1, statusLibrary: STATUS_LIBRARY, summonLibrary: {}, transformationLibrary: {}, resourceLibrary: {} },
      createRng(1),
    );
    expect(result.state.energyPools.playerA?.MIGHT).toBe(0);
  });

  it("drainEnergy removes from the target's player and, with grantToSelf, adds to the source's", () => {
    const state = stateWith([character("a1"), character("b1")], {
      playerA: emptyPool(),
      playerB: { MIGHT: 5, FOCUS: 0, SPIRIT: 0, CHAOS: 0 },
    });
    const result = applyEffect(
      state,
      { kind: "drainEnergy", family: "MIGHT", amount: 3, grantToSelf: true },
      { sourceId: "a1", targetIds: ["b1"], teams, turn: 1, statusLibrary: STATUS_LIBRARY, summonLibrary: {}, transformationLibrary: {}, resourceLibrary: {} },
      createRng(1),
    );
    expect(result.state.energyPools.playerB?.MIGHT).toBe(2);
    expect(result.state.energyPools.playerA?.MIGHT).toBe(3);
  });

  it("drainEnergy without grantToSelf just removes it", () => {
    const state = stateWith([character("a1"), character("b1")], {
      playerA: emptyPool(),
      playerB: { MIGHT: 5, FOCUS: 0, SPIRIT: 0, CHAOS: 0 },
    });
    const result = applyEffect(
      state,
      { kind: "drainEnergy", family: "MIGHT", amount: 3, grantToSelf: false },
      { sourceId: "a1", targetIds: ["b1"], teams, turn: 1, statusLibrary: STATUS_LIBRARY, summonLibrary: {}, transformationLibrary: {}, resourceLibrary: {} },
      createRng(1),
    );
    expect(result.state.energyPools.playerB?.MIGHT).toBe(2);
    expect(result.state.energyPools.playerA?.MIGHT).toBe(0);
  });

  it("drainEnergy caps the drain at what's available", () => {
    const state = stateWith([character("a1"), character("b1")], {
      playerA: emptyPool(),
      playerB: { MIGHT: 2, FOCUS: 0, SPIRIT: 0, CHAOS: 0 },
    });
    const result = applyEffect(
      state,
      { kind: "drainEnergy", family: "MIGHT", amount: 10, grantToSelf: true },
      { sourceId: "a1", targetIds: ["b1"], teams, turn: 1, statusLibrary: STATUS_LIBRARY, summonLibrary: {}, transformationLibrary: {}, resourceLibrary: {} },
      createRng(1),
    );
    expect(result.state.energyPools.playerB?.MIGHT).toBe(0);
    expect(result.state.energyPools.playerA?.MIGHT).toBe(2);
  });

  it("drainEnergy family 'any' drains whichever family the target has the most of", () => {
    const state = stateWith([character("a1"), character("b1")], {
      playerA: emptyPool(),
      playerB: { MIGHT: 1, FOCUS: 9, SPIRIT: 0, CHAOS: 0 },
    });
    const result = applyEffect(
      state,
      { kind: "drainEnergy", family: "any", amount: 3, grantToSelf: false },
      { sourceId: "a1", targetIds: ["b1"], teams, turn: 1, statusLibrary: STATUS_LIBRARY, summonLibrary: {}, transformationLibrary: {}, resourceLibrary: {} },
      createRng(1),
    );
    expect(result.state.energyPools.playerB?.FOCUS).toBe(6);
    expect(result.state.energyPools.playerB?.MIGHT).toBe(1);
  });
});

const testSummon: Summon = summonSchema.parse({
  id: "summon.test-thrall",
  displayName: "Test Thrall",
  occupiesSlot: false,
  hp: 20,
  duration: { turns: 2, permanent: false },
});

const testTransformation: Transformation = transformationSchema.parse({
  id: "transform.test",
  characterId: "a1",
  fromStageId: null,
  toStageId: "test.evolved",
  trigger: { type: "always" },
  changes: { maxHp: 200, abilityIds: ["ability.evolved-strike"] },
});

const testResource: Resource = { id: "resource.souls", displayName: "Souls", startingValue: 0, min: 0, max: 5, visibleToOpponent: true, trackMode: true };

describe("applyEffect — summon", () => {
  it("creates a tracked summon instance owned by the source character", () => {
    const result = applyEffect(
      stateWith([character("a1")]),
      { kind: "summon", summonId: testSummon.id },
      ctx({ sourceId: "a1", targetIds: [], summonLibrary: { [testSummon.id]: testSummon } }),
      createRng(1),
    );
    const instances = Object.values(result.state.summons);
    expect(instances).toHaveLength(1);
    expect(instances[0]).toMatchObject({ summonId: testSummon.id, ownerCharacterId: "a1", currentHp: 20, alive: true });
    expect(result.events[0]?.type).toBe("summonCreated");
  });

  it("throws for an unregistered summon id", () => {
    expect(() =>
      applyEffect(
        stateWith([character("a1")]),
        { kind: "summon", summonId: "summon.unregistered" },
        ctx({ sourceId: "a1", targetIds: [] }),
        createRng(1),
      ),
    ).toThrow(/unknown summon/);
  });
});

describe("applyEffect — transformInto", () => {
  it("applies the transformation's changes to the source character", () => {
    const result = applyEffect(
      stateWith([character("a1")]),
      { kind: "transformInto", transformationId: testTransformation.id },
      ctx({ sourceId: "a1", targetIds: [], transformationLibrary: { [testTransformation.id]: testTransformation } }),
      createRng(1),
    );
    expect(result.state.characters.a1?.maxHp).toBe(200);
    expect(result.state.characters.a1?.abilityIds).toEqual(["ability.evolved-strike"]);
    expect(result.events[0]?.type).toBe("transformed");
  });
});

describe("applyEffect — erase (bypasses death triggers)", () => {
  it("kills the target and emits 'erased', never 'death'", () => {
    const result = applyEffect(
      stateWith([character("a1"), character("b1")]),
      { kind: "erase" },
      ctx({ sourceId: "a1", targetIds: ["b1"] }),
      createRng(1),
    );
    expect(result.state.characters.b1?.alive).toBe(false);
    expect(result.events.map((e) => e.type)).toEqual(["erased"]);
  });
});

describe("applyEffect — resurrect", () => {
  it("revives a dead character at the given HP percentage", () => {
    const dead = { ...character("b1"), alive: false, currentHp: 0 };
    const result = applyEffect(
      stateWith([character("a1"), dead]),
      { kind: "resurrect", healthPercent: 50 },
      ctx({ sourceId: "a1", targetIds: ["b1"] }),
      createRng(1),
    );
    expect(result.state.characters.b1?.alive).toBe(true);
    expect(result.state.characters.b1?.currentHp).toBe(50);
    expect(result.events[0]?.type).toBe("resurrected");
  });

  it("resurrection lock blocks the revive", () => {
    // The lock is applied to the LIVING character — applyStatus skips dead
    // targets by design, so a resurrection-lock curse has to land before
    // death, then persist through it (nothing clears statuses on death).
    const lockedAlive = applyEffect(
      stateWith([character("b1")]),
      { kind: "applyStatus", statusId: "status.resurrection-lock" },
      ctx({ sourceId: "b1", targetIds: ["b1"] }),
      createRng(1),
    ).state.characters.b1!;
    const dead = { ...lockedAlive, alive: false, currentHp: 0 };
    const result = applyEffect(
      stateWith([character("a1"), dead]),
      { kind: "resurrect" },
      ctx({ sourceId: "a1", targetIds: ["b1"] }),
      createRng(1),
    );
    expect(result.state.characters.b1?.alive).toBe(false);
    expect(result.events[0]?.type).toBe("resurrectionBlocked");
  });
});

describe("applyEffect — modifyRandomOutcome + randomOutcome", () => {
  const outcome = {
    rerollable: false,
    branches: [
      { weight: 1, effects: [{ kind: "damage" as const, amount: 10 }] },
      { weight: 1, effects: [{ kind: "damage" as const, amount: 50 }] },
    ],
  };

  it("guaranteeMax forces the last (best) branch", () => {
    const queued = applyEffect(
      stateWith([character("a1"), character("b1")]),
      { kind: "modifyRandomOutcome", mode: "guaranteeMax" },
      ctx({ sourceId: "a1", targetIds: ["a1"] }),
      createRng(1),
    );
    const result = applyEffect(
      queued.state,
      { kind: "randomOutcome", outcome },
      ctx({ sourceId: "a1", targetIds: ["b1"] }),
      createRng(1),
    );
    expect(result.state.characters.b1?.currentHp).toBe(50); // 100 - 50, the "max" branch
  });

  it("guaranteeMin forces the first (worst) branch", () => {
    const queued = applyEffect(
      stateWith([character("a1"), character("b1")]),
      { kind: "modifyRandomOutcome", mode: "guaranteeMin" },
      ctx({ sourceId: "a1", targetIds: ["a1"] }),
      createRng(1),
    );
    const result = applyEffect(
      queued.state,
      { kind: "randomOutcome", outcome },
      ctx({ sourceId: "a1", targetIds: ["b1"] }),
      createRng(1),
    );
    expect(result.state.characters.b1?.currentHp).toBe(90); // 100 - 10, the "min" branch
  });

  it("forceOutcome picks the exact branch index", () => {
    const queued = applyEffect(
      stateWith([character("a1"), character("b1")]),
      { kind: "modifyRandomOutcome", mode: "forceOutcome", branchIndex: 1 },
      ctx({ sourceId: "a1", targetIds: ["a1"] }),
      createRng(1),
    );
    const result = applyEffect(
      queued.state,
      { kind: "randomOutcome", outcome },
      ctx({ sourceId: "a1", targetIds: ["b1"] }),
      createRng(1),
    );
    expect(result.state.characters.b1?.currentHp).toBe(50);
  });

  it("weightBoost and reroll are wired through to a real roll (see rng-modifiers.test.ts for their odds/behavior in detail)", () => {
    for (const mode of ["weightBoost", "reroll"] as const) {
      const weightMultiplier = mode === "weightBoost" ? 1000 : undefined;
      const queued = applyEffect(
        stateWith([character("a1"), character("b1")]),
        { kind: "modifyRandomOutcome", mode, weightMultiplier },
        ctx({ sourceId: "a1", targetIds: ["a1"] }),
        createRng(1),
      );
      expect(queued.state.characters.a1?.pendingRngModifiers).toEqual([{ mode, branchIndex: undefined, weightMultiplier }]);
      const result = applyEffect(queued.state, { kind: "randomOutcome", outcome }, ctx({ sourceId: "a1", targetIds: ["b1"] }), createRng(1));
      expect(result.state.characters.a1?.pendingRngModifiers).toHaveLength(0); // consumed
      expect([10, 50]).toContain(100 - (result.state.characters.b1?.currentHp ?? 0));
    }
  });

  it("the modifier is consumed after one roll", () => {
    const queued = applyEffect(
      stateWith([character("a1"), character("b1")]),
      { kind: "modifyRandomOutcome", mode: "guaranteeMax" },
      ctx({ sourceId: "a1", targetIds: ["a1"] }),
      createRng(1),
    );
    expect(queued.state.characters.a1?.pendingRngModifiers).toHaveLength(1);
    const afterFirstRoll = applyEffect(
      queued.state,
      { kind: "randomOutcome", outcome },
      ctx({ sourceId: "a1", targetIds: ["b1"] }),
      createRng(1),
    );
    expect(afterFirstRoll.state.characters.a1?.pendingRngModifiers).toHaveLength(0);
  });
});

describe("applyEffect — retargetQueuedAction (OQ-07 Cheater retargeting)", () => {
  it("reports the requested retarget without touching battle state itself", () => {
    const state = stateWith([character("a1"), character("b1")]);
    const result = applyEffect(
      state,
      { kind: "retargetQueuedAction", queuedCharacterId: "b1", newTargetIds: ["a1"] },
      ctx({ sourceId: "a1", targetIds: [] }),
      createRng(1),
    );
    expect(result.state).toBe(state); // no state change — this is purely a signal to the caller
    expect(result.queuedRetargets).toEqual([{ queuedCharacterId: "b1", newTargetIds: ["a1"] }]);
    expect(result.events[0]?.type).toBe("queuedActionRetargeted");
  });
});

describe("applyEffect — modifyResource", () => {
  it("clamps to the resource definition's min/max", () => {
    const state = stateWith([character("a1")]);
    const result = applyEffect(
      state,
      { kind: "modifyResource", resourceId: testResource.id, amount: 100 },
      ctx({ sourceId: "a1", targetIds: ["a1"], resourceLibrary: { [testResource.id]: testResource } }),
      createRng(1),
    );
    expect(result.state.characters.a1?.resources[testResource.id]).toBe(5); // clamped to max
  });

  it("never drops below the resource's min", () => {
    const state = stateWith([character("a1")]);
    const result = applyEffect(
      state,
      { kind: "modifyResource", resourceId: testResource.id, amount: -100 },
      ctx({ sourceId: "a1", targetIds: ["a1"], resourceLibrary: { [testResource.id]: testResource } }),
      createRng(1),
    );
    expect(result.state.characters.a1?.resources[testResource.id]).toBe(0); // clamped to min
  });
});

describe("applyEffect — conditional", () => {
  it("runs ifTrue when the condition holds, ifFalse otherwise", () => {
    const lowHp = { ...character("a1", 10) };
    const trueCase = applyEffect(
      stateWith([lowHp, character("b1")]),
      {
        kind: "conditional",
        condition: { type: "hpBelowPercent", target: "self", percent: 50 },
        ifTrue: [{ kind: "damage", amount: 5 }],
        ifFalse: [{ kind: "heal", healingClass: "heal", amount: 5 }],
      },
      ctx({ sourceId: "a1", targetIds: ["b1"] }),
      createRng(1),
    );
    expect(trueCase.state.characters.b1?.currentHp).toBe(95);

    const fullHp = character("a1", 100);
    const falseCase = applyEffect(
      stateWith([fullHp, character("b1")]),
      {
        kind: "conditional",
        condition: { type: "hpBelowPercent", target: "self", percent: 50 },
        ifTrue: [{ kind: "damage", amount: 5 }],
        ifFalse: [{ kind: "heal", healingClass: "heal", amount: 5 }],
      },
      ctx({ sourceId: "a1", targetIds: ["b1", "a1"] }),
      createRng(1),
    );
    // ifFalse heals — "self" target here resolves via ConditionContext.selfId,
    // not the ability's own TargetRule, so it heals whichever ids were passed.
    expect(falseCase.state.characters.a1?.currentHp).toBe(100); // already full, clamped
  });
});
