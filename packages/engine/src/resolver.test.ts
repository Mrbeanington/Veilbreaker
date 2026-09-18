import { describe, expect, it } from "vitest";
import {
  abilitySchema,
  defaultMatchFormat,
  defaultResolutionOrder,
  type Ability,
  type EnergyRules,
  type MatchFormat,
  type ResolutionOrder,
} from "@veilbreak/content";
import { createBattle, resolveTurn, type CreateBattleTeamInput } from "./resolver";

// "fixed" generation mode grants every family the same amount deterministically
// (no RNG draw — see energy.ts), so a fixture ability's specific family cost
// (e.g. 1 Might) is reliably affordable regardless of seed. The default
// "random" mode is already covered directly by energy.test.ts, as is the
// OQ-03 turn-1 initiative-player skip — disabled here so these integration
// tests aren't sensitive to which side createBattle's coin flip favors,
// which isn't what any test below is exercising.
const testEnergyRules: EnergyRules = {
  generation: { perLivingCharacter: 1, mode: "fixed" },
  poolCap: 10,
  carryover: true,
  initiativePlayerSkipsTurnOneGeneration: false,
};

// Temporary, test-only abilities (phase-01-battle-core.md acceptance
// criteria: "defined in test fixtures, not hard-coded in the engine").
// Parsed through the real schema so a fixture can never silently drift from
// what actual content will look like.
function ability(input: Partial<Ability> & Pick<Ability, "id" | "effects">): Ability {
  return abilitySchema.parse({
    displayName: input.id,
    description: "test fixture",
    cost: { might: 0, focus: 0, spirit: 0, chaos: 0, neutral: 0 },
    target: { side: "enemy", scope: "single", count: 1, includeSelf: false, filterTags: [] },
    ...input,
  });
}

const strike30 = ability({
  id: "test.strike-30",
  cost: { might: 1, focus: 0, spirit: 0, chaos: 0, neutral: 0 },
  effects: [{ kind: "damage", amount: 30 }],
});

const priorityStrike20 = ability({
  id: "test.priority-strike-20",
  cost: { might: 1, focus: 0, spirit: 0, chaos: 0, neutral: 0 },
  resolutionTierId: "priority-abilities",
  effects: [{ kind: "damage", amount: 20 }],
});

const selfHealCooldown2 = ability({
  id: "test.self-heal",
  cost: { neutral: 1, might: 0, focus: 0, spirit: 0, chaos: 0 },
  cooldown: 2,
  target: { side: "self", scope: "single", count: 1, includeSelf: true, filterTags: [] },
  effects: [{ kind: "heal", healingClass: "heal", amount: 20 }],
});

const randomStrike = ability({
  id: "test.random-strike",
  cost: { might: 0, focus: 0, spirit: 0, chaos: 0, neutral: 0 },
  effects: [
    {
      kind: "randomOutcome",
      outcome: {
        rerollable: false,
        branches: [
          { weight: 1, effects: [{ kind: "damage", amount: 10 }] },
          { weight: 1, effects: [{ kind: "damage", amount: 50 }] },
        ],
      },
    },
  ],
});

const abilities: Record<string, Ability> = {
  [strike30.id]: strike30,
  [priorityStrike20.id]: priorityStrike20,
  [selfHealCooldown2.id]: selfHealCooldown2,
  [randomStrike.id]: randomStrike,
};

const TEAM_A: CreateBattleTeamInput = {
  playerId: "playerA",
  characters: [
    { characterId: "a1", maxHp: 100 },
    { characterId: "a2", maxHp: 100 },
    { characterId: "a3", maxHp: 100 },
  ],
};
const TEAM_B: CreateBattleTeamInput = {
  playerId: "playerB",
  characters: [
    { characterId: "b1", maxHp: 100 },
    { characterId: "b2", maxHp: 100 },
    { characterId: "b3", maxHp: 100 },
  ],
};

function deps(resolutionOrder: ResolutionOrder = defaultResolutionOrder) {
  return { abilities, resolutionOrder, energyRules: testEnergyRules };
}

function freshBattle(seed = 1, matchFormat: MatchFormat = defaultMatchFormat) {
  return createBattle([TEAM_A, TEAM_B], seed, {
    balanceVersionId: "test-balance-v1",
    matchFormat,
    energyRules: testEnergyRules,
  });
}

describe("createBattle", () => {
  it("starts every character at full HP and alive", () => {
    const state = freshBattle();
    for (const characterId of ["a1", "a2", "a3", "b1", "b2", "b3"]) {
      const character = state.characters[characterId];
      expect(character?.alive).toBe(true);
      expect(character?.currentHp).toBe(character?.maxHp);
    }
  });

  it("picks initiative deterministically from the seed", () => {
    const first = freshBattle(1);
    const second = freshBattle(1);
    expect(first.initiativePlayerId).toBe(second.initiativePlayerId);
    expect(["playerA", "playerB"]).toContain(first.initiativePlayerId);
  });
});

describe("resolveTurn — determinism", () => {
  it("produces an identical event log for identical inputs (same seed, same actions)", () => {
    const actionsA = [{ playerId: "playerA", characterId: "a1", abilityId: randomStrike.id, targetIds: ["b1"] }];
    const actionsB: never[] = [];

    const runOnce = () => {
      const state = freshBattle(2024);
      const result = resolveTurn(state, actionsA, actionsB, deps());
      if (!result.ok) throw new Error("expected a legal turn");
      return result;
    };

    const first = runOnce();
    const second = runOnce();
    expect(first.events).toEqual(second.events);
    expect(first.state.rngState).toBe(second.state.rngState);
  });
});

describe("resolveTurn — illegal action rejection", () => {
  it("rejects an unknown ability instead of silently dropping it", () => {
    const state = freshBattle();
    const result = resolveTurn(
      state,
      [{ playerId: "playerA", characterId: "a1", abilityId: "no-such-ability", targetIds: ["b1"] }],
      [],
      deps(),
    );
    expect(result.ok).toBe(false);
    if (result.ok) throw new Error("expected rejection");
    expect(result.errors[0]?.errors).toContainEqual({ code: "unknownAbility", abilityId: "no-such-ability" });
  });

  it("rejects an action the player cannot afford", () => {
    const expensive = ability({
      id: "test.expensive",
      cost: { might: 5, focus: 0, spirit: 0, chaos: 0, neutral: 0 },
      effects: [{ kind: "damage", amount: 10 }],
    });
    const state = freshBattle();
    const result = resolveTurn(
      state,
      [{ playerId: "playerA", characterId: "a1", abilityId: expensive.id, targetIds: ["b1"] }],
      [],
      { ...deps(), abilities: { ...abilities, [expensive.id]: expensive } },
    );
    expect(result.ok).toBe(false);
    if (result.ok) throw new Error("expected rejection");
    expect(result.errors[0]?.errors).toContainEqual({
      code: "cannotAfford",
      characterId: "a1",
      abilityId: expensive.id,
    });
  });

  it("rejects targeting an enemy-only ability at an ally", () => {
    const state = freshBattle();
    const result = resolveTurn(
      state,
      [{ playerId: "playerA", characterId: "a1", abilityId: strike30.id, targetIds: ["a2"] }],
      [],
      deps(),
    );
    expect(result.ok).toBe(false);
    if (result.ok) throw new Error("expected rejection");
    expect(result.errors[0]?.errors.some((e) => e.code === "invalidTarget")).toBe(true);
  });

  it("does not mutate the input state when rejecting", () => {
    const state = freshBattle();
    const snapshot = JSON.parse(JSON.stringify(state));
    resolveTurn(
      state,
      [{ playerId: "playerA", characterId: "a1", abilityId: "no-such-ability", targetIds: ["b1"] }],
      [],
      deps(),
    );
    expect(state).toEqual(snapshot);
  });
});

describe("resolveTurn — tier ordering read from config", () => {
  it("resolves a priority-abilities action before a standard-attacks-support action by default", () => {
    const state = freshBattle();
    const result = resolveTurn(
      state,
      [{ playerId: "playerA", characterId: "a1", abilityId: strike30.id, targetIds: ["b1"] }],
      [{ playerId: "playerB", characterId: "b2", abilityId: priorityStrike20.id, targetIds: ["a2"] }],
      deps(),
    );
    if (!result.ok) throw new Error("expected a legal turn");
    const damageEvents = result.events.filter((e) => e.type === "damageDealt");
    expect(damageEvents[0]?.sourceId).toBe("b2"); // priority-abilities (tier 4) before standard (tier 6)
    expect(damageEvents[1]?.sourceId).toBe("a1");
  });

  it("reordering the resolution-order config reorders the resulting events", () => {
    const swapped: ResolutionOrder = {
      tiers: defaultResolutionOrder.tiers.map((tier) => {
        if (tier.id === "priority-abilities") return { ...tier, order: 6 };
        if (tier.id === "standard-attacks-support") return { ...tier, order: 4 };
        return tier;
      }),
    };

    const state = freshBattle();
    const result = resolveTurn(
      state,
      [{ playerId: "playerA", characterId: "a1", abilityId: strike30.id, targetIds: ["b1"] }],
      [{ playerId: "playerB", characterId: "b2", abilityId: priorityStrike20.id, targetIds: ["a2"] }],
      deps(swapped),
    );
    if (!result.ok) throw new Error("expected a legal turn");
    const damageEvents = result.events.filter((e) => e.type === "damageDealt");
    // With the tiers' order values swapped, standard-attacks-support now
    // resolves first — proving order comes from config, not from code.
    expect(damageEvents[0]?.sourceId).toBe("a1");
    expect(damageEvents[1]?.sourceId).toBe("b2");
  });
});

describe("resolveTurn — cooldowns", () => {
  it("blocks reuse for exactly `cooldown` turns", () => {
    let state = freshBattle();
    const cast = () =>
      resolveTurn(state, [{ playerId: "playerA", characterId: "a1", abilityId: selfHealCooldown2.id, targetIds: ["a1"] }], [], deps());

    const turn1 = cast();
    if (!turn1.ok) throw new Error("expected turn 1 to be legal");
    state = turn1.state;

    // Turn 2: still on cooldown.
    const turn2 = resolveTurn(state, [{ playerId: "playerA", characterId: "a1", abilityId: selfHealCooldown2.id, targetIds: ["a1"] }], [], deps());
    expect(turn2.ok).toBe(false);

    // Advance one turn with a no-op action set instead (pass).
    const passed = resolveTurn(state, [], [], deps());
    if (!passed.ok) throw new Error("expected the pass turn to be legal");
    state = passed.state;

    // Turn 3: still on cooldown (2 blocked turns total: turn 2 and turn 3).
    const turn3 = resolveTurn(state, [{ playerId: "playerA", characterId: "a1", abilityId: selfHealCooldown2.id, targetIds: ["a1"] }], [], deps());
    expect(turn3.ok).toBe(false);

    const passedAgain = resolveTurn(state, [], [], deps());
    if (!passedAgain.ok) throw new Error("expected the pass turn to be legal");
    state = passedAgain.state;

    // Turn 4: off cooldown.
    const turn4 = resolveTurn(state, [{ playerId: "playerA", characterId: "a1", abilityId: selfHealCooldown2.id, targetIds: ["a1"] }], [], deps());
    expect(turn4.ok).toBe(true);
  });
});

describe("resolveTurn — death checks", () => {
  it("marks a character not alive once its HP reaches 0 and emits a death event", () => {
    let state = freshBattle();
    for (let i = 0; i < 4; i++) {
      const result = resolveTurn(state, [{ playerId: "playerA", characterId: "a1", abilityId: strike30.id, targetIds: ["b1"] }], [], deps());
      if (!result.ok) throw new Error(`expected turn ${i} to be legal`);
      state = result.state;
      if (!state.characters.b1?.alive) {
        expect(result.events.some((e) => e.type === "death" && e.targetId === "b1")).toBe(true);
        return;
      }
    }
    throw new Error("expected b1 to die within 4 strikes of 30 against 100 HP");
  });
});

describe("resolveTurn — max-turn rule (OQ-14)", () => {
  it("ends the match by remaining HP percentage once maxTurns is exceeded", () => {
    const oneTurnFormat: MatchFormat = { ...defaultMatchFormat, maxTurns: 1 };
    const state = freshBattle(1, oneTurnFormat);
    const result = resolveTurn(state, [{ playerId: "playerA", characterId: "a1", abilityId: strike30.id, targetIds: ["b1"] }], [], deps());
    if (!result.ok) throw new Error("expected a legal turn");
    const endEvent = result.state.eventLog.find((e) => e.type === "matchEndedByTurnLimit");
    expect(endEvent).toBeDefined();
    expect(endEvent?.payload.winnerPlayerId).toBe("playerA");
  });
});

describe("resolveTurn — initiative alternation (OQ-02)", () => {
  it("flips initiative every turn", () => {
    const state = freshBattle();
    const firstInitiative = state.initiativePlayerId;
    const result = resolveTurn(state, [], [], deps());
    if (!result.ok) throw new Error("expected a legal turn");
    expect(result.state.initiativePlayerId).not.toBe(firstInitiative);
  });
});
