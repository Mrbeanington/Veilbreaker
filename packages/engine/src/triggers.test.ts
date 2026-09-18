import { describe, expect, it } from "vitest";
import { passiveDefinitionSchema, STATUS_LIBRARY, type BattleTeam, type PassiveDefinition } from "@veilbreak/content";
import { evaluateEvent, type TriggerDeps } from "./triggers";
import type { EffectState } from "./effects";
import { createRng } from "./rng";
import { testCharacter } from "./test-support";

const teams: [BattleTeam, BattleTeam] = [
  { playerId: "playerA", characterIds: ["a1", "a2"] },
  { playerId: "playerB", characterIds: ["b1"] },
];

function deps(passives: Record<string, PassiveDefinition>): TriggerDeps {
  return {
    passives,
    statusLibrary: STATUS_LIBRARY,
    summonLibrary: {},
    transformationLibrary: {},
    resourceLibrary: {},
    teams,
    turn: 1,
  };
}

function stateWith(passiveByCharacter: Record<string, string>): EffectState {
  const characters = Object.fromEntries(
    ["a1", "a2", "b1"].map((id) => [id, testCharacter({ characterId: id, passiveId: passiveByCharacter[id] })]),
  );
  return {
    characters,
    energyPools: { playerA: { MIGHT: 0, FOCUS: 0, SPIRIT: 0, CHAOS: 0 }, playerB: { MIGHT: 0, FOCUS: 0, SPIRIT: 0, CHAOS: 0 } },
    summons: {},
  };
}

// `trigger` only requires `event` here — `relation` and `effectTarget` both
// have schema defaults, and passiveDefinitionSchema.parse below fills them
// in, so fixtures written before `effectTarget` existed don't all need
// updating just to keep satisfying the (stricter) parsed output type.
type PartialTrigger = Partial<PassiveDefinition["trigger"]> & Pick<PassiveDefinition["trigger"], "event">;

function passive(
  overrides: Partial<Omit<PassiveDefinition, "trigger">> &
    Pick<PassiveDefinition, "id" | "effects"> & { trigger: PartialTrigger },
): PassiveDefinition {
  return passiveDefinitionSchema.parse({
    displayName: overrides.id,
    description: "test fixture",
    ...overrides,
  });
}

describe("evaluateEvent — each trigger type fires its matching passive", () => {
  const cases: { event: import("@veilbreak/content").TriggerEvent; relation?: "self" | "ally" | "enemy" | "any" }[] = [
    { event: "onDamaged" },
    { event: "onDamageDealt" },
    { event: "onHealed" },
    { event: "onStatusApplied" },
    { event: "onResourceChanged" },
    { event: "onHpThreshold" },
    { event: "onDeath" },
    { event: "onKill" },
    { event: "onResurrection" },
    { event: "onTurnStart" },
    { event: "onTurnEnd" },
    { event: "onAbilityUsed" },
  ];

  for (const { event } of cases) {
    it(`fires a passive listening for ${event}`, () => {
      const p = passive({
        id: `test.passive.${event.toLowerCase()}`,
        trigger: { event, relation: "self" },
        effects: [{ kind: "applyStatus", statusId: "status.taunt", durationTurns: 1 }],
      });
      const state = stateWith({ a1: p.id });
      const result = evaluateEvent(state, { event, subjectId: "a1" }, deps({ [p.id]: p }), createRng(1));
      expect(result.events.some((e) => e.type === "statusApplied" && e.targetId === "a1")).toBe(true);
    });
  }

  it("does not fire when the event type doesn't match", () => {
    const p = passive({
      id: "test.passive.mismatch",
      trigger: { event: "onDeath", relation: "self" },
      effects: [{ kind: "applyStatus", statusId: "status.taunt" }],
    });
    const state = stateWith({ a1: p.id });
    const result = evaluateEvent(state, { event: "onHealed", subjectId: "a1" }, deps({ [p.id]: p }), createRng(1));
    expect(result.events).toHaveLength(0);
  });
});

describe("evaluateEvent — relation filtering (onDeath any/ally/enemy)", () => {
  const makeDeathPassive = (relation: "self" | "ally" | "enemy" | "any") =>
    passive({
      id: `test.ondeath.${relation}`,
      trigger: { event: "onDeath", relation },
      effects: [{ kind: "applyStatus", statusId: "status.taunt" }],
    });

  it("relation 'ally' fires only when a teammate (not itself) dies", () => {
    const p = makeDeathPassive("ally");
    const state = stateWith({ a1: p.id });
    // a2 (teammate of a1) dies:
    const allyDeath = evaluateEvent(state, { event: "onDeath", subjectId: "a2" }, deps({ [p.id]: p }), createRng(1));
    expect(allyDeath.events.some((e) => e.type === "statusApplied")).toBe(true);
    // a1 itself dies — relation is "self", not "ally", so it should not fire:
    const selfDeath = evaluateEvent(state, { event: "onDeath", subjectId: "a1" }, deps({ [p.id]: p }), createRng(1));
    expect(selfDeath.events).toHaveLength(0);
    // b1 (enemy) dies — also not "ally":
    const enemyDeath = evaluateEvent(state, { event: "onDeath", subjectId: "b1" }, deps({ [p.id]: p }), createRng(1));
    expect(enemyDeath.events).toHaveLength(0);
  });

  it("relation 'enemy' fires only when an opponent dies", () => {
    const p = makeDeathPassive("enemy");
    const state = stateWith({ a1: p.id });
    const enemyDeath = evaluateEvent(state, { event: "onDeath", subjectId: "b1" }, deps({ [p.id]: p }), createRng(1));
    expect(enemyDeath.events.some((e) => e.type === "statusApplied")).toBe(true);
    const allyDeath = evaluateEvent(state, { event: "onDeath", subjectId: "a2" }, deps({ [p.id]: p }), createRng(1));
    expect(allyDeath.events).toHaveLength(0);
  });

  it("relation 'any' fires regardless of whose death it is", () => {
    const p = makeDeathPassive("any");
    const state = stateWith({ a1: p.id });
    for (const subjectId of ["a1", "a2", "b1"]) {
      const result = evaluateEvent(state, { event: "onDeath", subjectId }, deps({ [p.id]: p }), createRng(1));
      expect(result.events.some((e) => e.type === "statusApplied")).toBe(true);
    }
  });
});

describe("evaluateEvent — an extra condition must also hold", () => {
  it("does not fire when trigger.condition is false", () => {
    const p = passive({
      id: "test.conditional-passive",
      trigger: {
        event: "onDamaged",
        relation: "self",
        condition: { type: "hpBelowPercent", target: "self", percent: 10 },
      },
      effects: [{ kind: "applyStatus", statusId: "status.taunt" }],
    });
    const state = stateWith({ a1: p.id }); // a1 at full HP — condition false
    const result = evaluateEvent(state, { event: "onDamaged", subjectId: "a1" }, deps({ [p.id]: p }), createRng(1));
    expect(result.events).toHaveLength(0);
  });
});

describe("evaluateEvent — recursion guard", () => {
  it("stops a self-perpetuating damage cascade instead of recursing forever", () => {
    // A passive-fired effect's targetIds is always [gameEvent.subjectId] —
    // triggers.ts doesn't resolve a TargetRule the way an ability's own
    // action does (see docs/DECISIONS.md), so the cleanest way to force a
    // genuine cascade is a self-targeting effect: "when damaged, take 1 more
    // affliction damage" re-fires its own onDamaged trigger indefinitely
    // without the depth cap.
    const selfHarm = passive({
      id: "test.self-harm-loop",
      trigger: { event: "onDamaged", relation: "self" },
      effects: [{ kind: "damage", amount: 1, damageType: "affliction" }],
    });
    const state = stateWith({ a1: selfHarm.id });
    const result = evaluateEvent(
      state,
      { event: "onDamaged", subjectId: "a1" },
      deps({ [selfHarm.id]: selfHarm }),
      createRng(1),
    );
    expect(result.events.some((e) => e.type === "recursionGuardTripped")).toBe(true);
  });
});

describe("evaluateEvent — Trigger.effectTarget (ADR-011, OQ-31a)", () => {
  it("defaults to 'subject': effects land on whoever the event is about", () => {
    const p = passive({
      id: "test.effect-target.default",
      trigger: { event: "onDeath", relation: "any" },
      effects: [{ kind: "applyStatus", statusId: "status.taunt" }],
    });
    const state = stateWith({ a1: p.id });
    // a1 holds the passive, b1 is who died — a "subject" target means b1
    // (the corpse), not a1 (the holder), receives the effect.
    const result = evaluateEvent(state, { event: "onDeath", subjectId: "b1" }, deps({ [p.id]: p }), createRng(1));
    expect(result.events.find((e) => e.type === "statusApplied")?.targetId).toBe("b1");
  });

  it("'self' redirects the effect onto the trigger holder instead", () => {
    // Malachar's shape exactly: "whenever ANY character dies, *I* gain a
    // Soul" — the effect must land on the passive holder, not the corpse.
    const p = passive({
      id: "test.effect-target.self",
      trigger: { event: "onDeath", relation: "any", effectTarget: "self" },
      effects: [{ kind: "modifyResource", resourceId: "resource.souls", amount: 1 }],
    });
    const state = stateWith({ a1: p.id });
    const result = evaluateEvent(state, { event: "onDeath", subjectId: "b1" }, deps({ [p.id]: p }), createRng(1));
    const resourceEvent = result.events.find((e) => e.type === "resourceChanged");
    expect(resourceEvent?.targetId).toBe("a1");
  });
});
