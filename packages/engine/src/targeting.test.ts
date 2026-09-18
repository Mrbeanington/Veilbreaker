import { describe, expect, it } from "vitest";
import {
  abilitySchema,
  STATUS_LIBRARY,
  type Ability,
  type BattleState,
  type CharacterRuntimeState,
  type TargetRule,
} from "@veilbreak/content";
import { resolveTargets } from "./targeting";
import { applyStatusToCharacter } from "./statuses";
import { createRng } from "./rng";
import { testCharacter } from "./test-support";

const TAUNT = STATUS_LIBRARY["status.taunt"]!;
const UNTARGETABLE = STATUS_LIBRARY["status.untargetable"]!;

function character(id: string, hp = 100): CharacterRuntimeState {
  return testCharacter({ characterId: id, currentHp: hp });
}

function battleState(characters: CharacterRuntimeState[]): BattleState {
  return {
    balanceVersionId: "test",
    rngState: "1",
    turn: 1,
    matchFormat: { teamSize: 3, maxTurns: 40 },
    turnModel: "simultaneous",
    teams: [
      { playerId: "playerA", characterIds: ["a1", "a2", "a3"] },
      { playerId: "playerB", characterIds: ["b1", "b2", "b3"] },
    ],
    characters: Object.fromEntries(characters.map((c) => [c.characterId, c])),
    summons: {},
    energyPools: {
      playerA: { MIGHT: 0, FOCUS: 0, SPIRIT: 0, CHAOS: 0 },
      playerB: { MIGHT: 0, FOCUS: 0, SPIRIT: 0, CHAOS: 0 },
    },
    initiativePlayerId: "playerA",
    eventLog: [],
  };
}

function abilityWithTarget(target: TargetRule): Ability {
  return abilitySchema.parse({
    id: "test.ability",
    displayName: "test",
    description: "test fixture",
    cost: { might: 0, focus: 0, spirit: 0, chaos: 0, neutral: 0 },
    target,
    effects: [{ kind: "damage", amount: 10 }],
  });
}

const ALL_ALIVE = ["a1", "a2", "a3", "b1", "b2", "b3"].map((id) => character(id));

describe("resolveTargets — side + scope", () => {
  it("self always resolves to the actor", () => {
    const state = battleState(ALL_ALIVE);
    const ability = abilityWithTarget({ side: "self", scope: "single", count: 1, includeSelf: true, filterTags: [] });
    const result = resolveTargets(state, ability, "a1", ["a1"], createRng(1));
    expect(result.targetIds).toEqual(["a1"]);
  });

  it("ally excludes the actor by default", () => {
    const state = battleState(ALL_ALIVE);
    const ability = abilityWithTarget({ side: "ally", scope: "all", count: 3, includeSelf: false, filterTags: [] });
    const result = resolveTargets(state, ability, "a1", [], createRng(1));
    expect(result.targetIds.sort()).toEqual(["a2", "a3"]);
  });

  it("ally includes the actor when includeSelf is true", () => {
    const state = battleState(ALL_ALIVE);
    const ability = abilityWithTarget({ side: "ally", scope: "all", count: 3, includeSelf: true, filterTags: [] });
    const result = resolveTargets(state, ability, "a1", [], createRng(1));
    expect(result.targetIds.sort()).toEqual(["a1", "a2", "a3"]);
  });

  it("enemy 'all' returns the whole opposing team", () => {
    const state = battleState(ALL_ALIVE);
    const ability = abilityWithTarget({ side: "enemy", scope: "all", count: 3, includeSelf: false, filterTags: [] });
    const result = resolveTargets(state, ability, "a1", [], createRng(1));
    expect(result.targetIds.sort()).toEqual(["b1", "b2", "b3"]);
  });

  it("enemy 'random' picks the requested count without repeats", () => {
    const state = battleState(ALL_ALIVE);
    const ability = abilityWithTarget({ side: "enemy", scope: "random", count: 2, includeSelf: false, filterTags: [] });
    const result = resolveTargets(state, ability, "a1", [], createRng(7));
    expect(result.targetIds).toHaveLength(2);
    expect(new Set(result.targetIds).size).toBe(2);
    for (const id of result.targetIds) expect(["b1", "b2", "b3"]).toContain(id);
  });

  it("lowestHp picks the enemy with the least remaining HP", () => {
    const characters = [character("a1"), character("b1", 90), character("b2", 10), character("b3", 50)];
    const state = battleState(characters);
    const ability = abilityWithTarget({ side: "enemy", scope: "lowestHp", count: 1, includeSelf: false, filterTags: [] });
    const result = resolveTargets(state, ability, "a1", [], createRng(1));
    expect(result.targetIds).toEqual(["b2"]);
  });

  it("highestHp picks the enemy with the most remaining HP", () => {
    const characters = [character("a1"), character("b1", 90), character("b2", 10), character("b3", 50)];
    const state = battleState(characters);
    const ability = abilityWithTarget({ side: "enemy", scope: "highestHp", count: 1, includeSelf: false, filterTags: [] });
    const result = resolveTargets(state, ability, "a1", [], createRng(1));
    expect(result.targetIds).toEqual(["b1"]);
  });

  it("single requires an explicit target within the legal pool", () => {
    const state = battleState(ALL_ALIVE);
    const ability = abilityWithTarget({ side: "enemy", scope: "single", count: 1, includeSelf: false, filterTags: [] });
    expect(resolveTargets(state, ability, "a1", [], createRng(1)).error).toBeDefined();
    expect(resolveTargets(state, ability, "a1", ["a2"], createRng(1)).error).toBeDefined(); // ally, illegal for "enemy" side
    expect(resolveTargets(state, ability, "a1", ["b1"], createRng(1)).targetIds).toEqual(["b1"]);
  });

  it("dead characters are never legal targets", () => {
    const characters = ALL_ALIVE.map((c) => (c.characterId === "b1" ? { ...c, alive: false } : c));
    const state = battleState(characters);
    const ability = abilityWithTarget({ side: "enemy", scope: "single", count: 1, includeSelf: false, filterTags: [] });
    expect(resolveTargets(state, ability, "a1", ["b1"], createRng(1)).error).toBeDefined();
  });
});

describe("resolveTargets — untargetable filtering", () => {
  it("excludes an untargetable enemy from the candidate pool", () => {
    const characters = ALL_ALIVE.map((c) =>
      c.characterId === "b1" ? applyStatusToCharacter(c, UNTARGETABLE, {}) : c,
    );
    const state = battleState(characters);
    const ability = abilityWithTarget({ side: "enemy", scope: "all", count: 3, includeSelf: false, filterTags: [] });
    const result = resolveTargets(state, ability, "a1", [], createRng(1));
    expect(result.targetIds.sort()).toEqual(["b2", "b3"]);
  });

  it("does not prevent a character from targeting itself", () => {
    const characters = ALL_ALIVE.map((c) =>
      c.characterId === "a1" ? applyStatusToCharacter(c, UNTARGETABLE, {}) : c,
    );
    const state = battleState(characters);
    const ability = abilityWithTarget({ side: "self", scope: "single", count: 1, includeSelf: true, filterTags: [] });
    const result = resolveTargets(state, ability, "a1", ["a1"], createRng(1));
    expect(result.targetIds).toEqual(["a1"]);
  });
});

describe("resolveTargets — taunt override", () => {
  it("forces enemy targeting onto the taunting character", () => {
    const characters = ALL_ALIVE.map((c) => (c.characterId === "b2" ? applyStatusToCharacter(c, TAUNT, {}) : c));
    const state = battleState(characters);
    const ability = abilityWithTarget({ side: "enemy", scope: "single", count: 1, includeSelf: false, filterTags: [] });
    // Explicitly requesting b1 is redirected to the taunter, not rejected —
    // taunt overrides the choice, it doesn't make the action illegal.
    expect(resolveTargets(state, ability, "a1", ["b1"], createRng(1)).targetIds).toEqual(["b2"]);
    expect(resolveTargets(state, ability, "a1", ["b2"], createRng(1)).targetIds).toEqual(["b2"]);
  });

  it("forces 'all' scope down to just the taunter(s) too", () => {
    const characters = ALL_ALIVE.map((c) => (c.characterId === "b2" ? applyStatusToCharacter(c, TAUNT, {}) : c));
    const state = battleState(characters);
    const ability = abilityWithTarget({ side: "enemy", scope: "all", count: 3, includeSelf: false, filterTags: [] });
    const result = resolveTargets(state, ability, "a1", [], createRng(1));
    expect(result.targetIds).toEqual(["b2"]);
  });
});
