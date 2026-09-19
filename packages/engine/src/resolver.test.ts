import { describe, expect, it } from "vitest";
import {
  abilitySchema,
  passiveDefinitionSchema,
  defaultMatchFormat,
  defaultResolutionOrder,
  STATUS_LIBRARY,
  type Ability,
  type EnergyRules,
  type MatchFormat,
  type PassiveDefinition,
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

// Phase 02 fixtures — resolutionTierId: "priority-abilities" so these
// resolve before a "standard-attacks-support" action queued the same turn,
// which is what lets the stun/silence/taunt tests below observe a status
// applied earlier in the SAME turn actually blocking/redirecting a later
// action in that turn, not just a future one.
const priorityStun = ability({
  id: "test.priority-stun",
  resolutionTierId: "priority-abilities",
  effects: [{ kind: "applyStatus", statusId: "status.stun", durationTurns: 1 }],
});

const prioritySilence = ability({
  id: "test.priority-silence",
  resolutionTierId: "priority-abilities",
  effects: [{ kind: "applyStatus", statusId: "status.silence", durationTurns: 1 }],
});

const priorityTaunt = ability({
  id: "test.priority-taunt",
  resolutionTierId: "priority-abilities",
  target: { side: "self", scope: "single", count: 1, includeSelf: true, filterTags: [] },
  effects: [{ kind: "applyStatus", statusId: "status.taunt", durationTurns: 1 }],
});

const bigStrike = ability({
  id: "test.big-strike",
  effects: [{ kind: "damage", amount: 999 }],
});

const bleedBolt = ability({
  id: "test.bleed-bolt",
  effects: [{ kind: "applyStatus", statusId: "status.bleed", durationTurns: 2, stacks: 1, magnitude: 15 }],
});

const hasteSelf = ability({
  id: "test.haste-self",
  target: { side: "self", scope: "single", count: 1, includeSelf: true, filterTags: [] },
  effects: [{ kind: "applyStatus", statusId: "status.cooldown-reduction", durationTurns: 5, magnitude: 1 }],
});

// Phase 03 fixtures — Cheater hooks (spec/01) and death extensions (spec/02).
const priorityLockStrike30 = ability({
  id: "test.priority-lock-strike30",
  resolutionTierId: "priority-abilities",
  effects: [{ kind: "applyStatus", statusId: "status.ability-lock", param: "test.strike-30", durationTurns: 3 }],
});

const priorityRetargetToA2 = ability({
  id: "test.priority-retarget",
  resolutionTierId: "priority-abilities",
  target: { side: "self", scope: "single", count: 1, includeSelf: true, filterTags: [] },
  effects: [{ kind: "retargetQueuedAction", queuedCharacterId: "b1", newTargetIds: ["a2"] }],
});

const eraseAbility = ability({
  id: "test.erase-ability",
  effects: [{ kind: "erase" }],
});

const abilities: Record<string, Ability> = {
  [strike30.id]: strike30,
  [priorityStrike20.id]: priorityStrike20,
  [selfHealCooldown2.id]: selfHealCooldown2,
  [priorityLockStrike30.id]: priorityLockStrike30,
  [priorityRetargetToA2.id]: priorityRetargetToA2,
  [eraseAbility.id]: eraseAbility,
  [randomStrike.id]: randomStrike,
  [priorityStun.id]: priorityStun,
  [prioritySilence.id]: prioritySilence,
  [priorityTaunt.id]: priorityTaunt,
  [bigStrike.id]: bigStrike,
  [bleedBolt.id]: bleedBolt,
  [hasteSelf.id]: hasteSelf,
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
  return {
    abilities,
    resolutionOrder,
    energyRules: testEnergyRules,
    statusLibrary: STATUS_LIBRARY,
    passives: {},
    summonLibrary: {},
    transformationLibrary: {},
    resourceLibrary: {},
  };
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

  // Regression: the turn-limit end was only in the log, so a UI watching the
  // turn's returned events never saw the match end and played on past the limit.
  it("also returns the turn-limit event in the turn's own events", () => {
    const state = freshBattle(1, { ...defaultMatchFormat, maxTurns: 1 });
    const result = resolveTurn(state, [{ playerId: "playerA", characterId: "a1", abilityId: strike30.id, targetIds: ["b1"] }], [], deps());
    if (!result.ok) throw new Error("expected a legal turn");
    expect(result.events.some((e) => e.type === "matchEndedByTurnLimit")).toBe(true);
    expect(result.state.eventLog.filter((e) => e.type === "matchEndedByTurnLimit")).toHaveLength(1);
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

describe("resolveTurn — stun and silence prevent action (phase-02-combat-primitives.md)", () => {
  it("a character stunned earlier this same turn cannot act later this turn", () => {
    const state = freshBattle();
    const result = resolveTurn(
      state,
      [{ playerId: "playerA", characterId: "a1", abilityId: strike30.id, targetIds: ["b1"] }],
      [{ playerId: "playerB", characterId: "b1", abilityId: priorityStun.id, targetIds: ["a1"] }],
      deps(),
    );
    if (!result.ok) throw new Error("expected a legal turn");
    expect(result.events.some((e) => e.type === "actionSkippedCannotAct" && e.sourceId === "a1")).toBe(true);
    expect(result.events.some((e) => e.type === "damageDealt" && e.targetId === "b1")).toBe(false);
  });

  it("silence blocks action the same way stun does", () => {
    const state = freshBattle();
    const result = resolveTurn(
      state,
      [{ playerId: "playerA", characterId: "a1", abilityId: strike30.id, targetIds: ["b1"] }],
      [{ playerId: "playerB", characterId: "b1", abilityId: prioritySilence.id, targetIds: ["a1"] }],
      deps(),
    );
    if (!result.ok) throw new Error("expected a legal turn");
    expect(result.events.some((e) => e.type === "actionSkippedCannotAct" && e.sourceId === "a1")).toBe(true);
  });

  it("planning rejects a queued action for an already-stunned character", () => {
    const state = freshBattle();
    const stunTurn = resolveTurn(
      state,
      [],
      [{ playerId: "playerB", characterId: "b1", abilityId: priorityStun.id, targetIds: ["a1"] }],
      deps(),
    );
    if (!stunTurn.ok) throw new Error("expected a legal turn");
    expect(stunTurn.state.characters.a1?.statuses.some((s) => s.statusId === "status.stun")).toBe(true);

    const attempt = resolveTurn(
      stunTurn.state,
      [{ playerId: "playerA", characterId: "a1", abilityId: strike30.id, targetIds: ["b1"] }],
      [],
      deps(),
    );
    expect(attempt.ok).toBe(false);
  });
});

describe("resolveTurn — taunt override", () => {
  it("forces same-turn enemy targeting onto whoever taunted earlier this turn", () => {
    const state = freshBattle();
    const result = resolveTurn(
      state,
      [{ playerId: "playerA", characterId: "a2", abilityId: priorityTaunt.id, targetIds: ["a2"] }],
      [{ playerId: "playerB", characterId: "b1", abilityId: strike30.id, targetIds: ["a1"] }],
      deps(),
    );
    if (!result.ok) throw new Error("expected a legal turn");
    const damageEvent = result.events.find((e) => e.type === "damageDealt");
    expect(damageEvent?.targetId).toBe("a2");
  });
});

describe("resolveTurn — damage-over-time ticking", () => {
  it("ticks Bleed on the turn applied and every turn duration counts down, then stops once it expires", () => {
    // bleedBolt applies Bleed with durationTurns: 2. The turn it's applied
    // doesn't consume any of that duration (ADR-006's cooldown exemption,
    // extended to status durations — see docs/DECISIONS.md): it ticks that
    // turn, then ticks again on each of the 2 turns the duration counts
    // down through, for 3 ticks total before it's removed.
    const state = freshBattle();
    const turn1 = resolveTurn(
      state,
      [{ playerId: "playerA", characterId: "a1", abilityId: bleedBolt.id, targetIds: ["b1"] }],
      [],
      deps(),
    );
    if (!turn1.ok) throw new Error("expected a legal turn");
    expect(turn1.state.characters.b1?.currentHp).toBe(85); // 100 - 15, ticked same turn as applied
    expect(turn1.events.some((e) => e.type === "damageDealt" && e.tierId === "damage-over-time")).toBe(true);
    expect(turn1.state.characters.b1?.statuses.find((s) => s.statusId === "status.bleed")?.remainingTurns).toBe(2);

    const turn2 = resolveTurn(turn1.state, [], [], deps());
    if (!turn2.ok) throw new Error("expected a legal turn");
    expect(turn2.state.characters.b1?.currentHp).toBe(70); // ticked again

    const turn3 = resolveTurn(turn2.state, [], [], deps());
    if (!turn3.ok) throw new Error("expected a legal turn");
    expect(turn3.state.characters.b1?.currentHp).toBe(55); // ticked a third and final time

    const turn4 = resolveTurn(turn3.state, [], [], deps());
    if (!turn4.ok) throw new Error("expected a legal turn");
    expect(turn4.state.characters.b1?.currentHp).toBe(55); // Bleed has expired — no further tick
  });
});

describe("resolveTurn — Cooldown Reduction status speeds up recovery", () => {
  it("an active Cooldown Reduction stack decrements cooldowns by an extra point per turn", () => {
    const state = freshBattle();
    const buffTurn = resolveTurn(
      state,
      [{ playerId: "playerA", characterId: "a1", abilityId: hasteSelf.id, targetIds: ["a1"] }],
      [],
      deps(),
    );
    if (!buffTurn.ok) throw new Error("expected a legal turn");
    expect(buffTurn.state.characters.a1?.statuses.some((s) => s.statusId === "status.cooldown-reduction")).toBe(true);

    const castTurn = resolveTurn(
      buffTurn.state,
      [{ playerId: "playerA", characterId: "a1", abilityId: selfHealCooldown2.id, targetIds: ["a1"] }],
      [],
      deps(),
    );
    if (!castTurn.ok) throw new Error("expected a legal turn");
    expect(castTurn.state.characters.a1?.cooldowns[selfHealCooldown2.id]).toBe(2); // untouched the turn it's set

    const nextTurn = resolveTurn(castTurn.state, [], [], deps());
    if (!nextTurn.ok) throw new Error("expected a legal turn");
    // Normal decrement (1) + Cooldown Reduction (1) = 2, so cooldown 2 -> 0
    // in a single turn instead of two.
    expect(nextTurn.state.characters.a1?.cooldowns[selfHealCooldown2.id]).toBe(0);
  });
});

describe("resolveTurn — simultaneous team wipe is a draw (OQ-09)", () => {
  it("both teams wiped in the same turn ends the match in a draw", () => {
    const soloTeamA: CreateBattleTeamInput = { playerId: "playerA", characters: [{ characterId: "solo-a", maxHp: 50 }] };
    const soloTeamB: CreateBattleTeamInput = { playerId: "playerB", characters: [{ characterId: "solo-b", maxHp: 50 }] };
    const state = createBattle([soloTeamA, soloTeamB], 1, {
      balanceVersionId: "test-balance-v1",
      matchFormat: defaultMatchFormat,
      energyRules: testEnergyRules,
    });
    const result = resolveTurn(
      state,
      [{ playerId: "playerA", characterId: "solo-a", abilityId: bigStrike.id, targetIds: ["solo-b"] }],
      [{ playerId: "playerB", characterId: "solo-b", abilityId: bigStrike.id, targetIds: ["solo-a"] }],
      deps(),
    );
    if (!result.ok) throw new Error("expected a legal turn");
    expect(result.state.characters["solo-a"]?.alive).toBe(false);
    expect(result.state.characters["solo-b"]?.alive).toBe(false);
    const endEvent = result.state.eventLog.find((e) => e.type === "matchEndedInDraw");
    expect(endEvent).toBeDefined();
    expect(endEvent?.payload.winnerPlayerId).toBeNull();
  });

  it("one team wiped (not both) declares the surviving team's player the winner", () => {
    const soloTeamA: CreateBattleTeamInput = {
      playerId: "playerA",
      characters: [{ characterId: "solo-a", maxHp: 999 }],
    };
    const soloTeamB: CreateBattleTeamInput = { playerId: "playerB", characters: [{ characterId: "solo-b", maxHp: 50 }] };
    const state = createBattle([soloTeamA, soloTeamB], 1, {
      balanceVersionId: "test-balance-v1",
      matchFormat: defaultMatchFormat,
      energyRules: testEnergyRules,
    });
    const result = resolveTurn(
      state,
      [{ playerId: "playerA", characterId: "solo-a", abilityId: bigStrike.id, targetIds: ["solo-b"] }],
      [],
      deps(),
    );
    if (!result.ok) throw new Error("expected a legal turn");
    const endEvent = result.state.eventLog.find((e) => e.type === "matchEndedByTeamWipe");
    expect(endEvent).toBeDefined();
    expect(endEvent?.payload.winnerPlayerId).toBe("playerA");
  });
});

describe("resolveTurn — Ability Lock (spec/01 Cheaters 'lock an ability')", () => {
  it("blocks only the named ability, on a later turn once the lock is active", () => {
    const state = freshBattle();
    const lockTurn = resolveTurn(
      state,
      [],
      [{ playerId: "playerB", characterId: "b1", abilityId: priorityLockStrike30.id, targetIds: ["a1"] }],
      deps(),
    );
    if (!lockTurn.ok) throw new Error("expected a legal turn");
    expect(
      lockTurn.state.characters.a1?.statuses.some((s) => s.statusId === "status.ability-lock" && s.param === strike30.id),
    ).toBe(true);

    const lockedAttempt = resolveTurn(
      lockTurn.state,
      [{ playerId: "playerA", characterId: "a1", abilityId: strike30.id, targetIds: ["b1"] }],
      [],
      deps(),
    );
    expect(lockedAttempt.ok).toBe(false);

    const otherAbilityStillWorks = resolveTurn(
      lockTurn.state,
      [{ playerId: "playerA", characterId: "a1", abilityId: randomStrike.id, targetIds: ["b1"] }],
      [],
      deps(),
    );
    expect(otherAbilityStillWorks.ok).toBe(true);
  });
});

describe("resolveTurn — Cheater retargeting (OQ-07)", () => {
  it("redirects a same-turn queued action to a new target", () => {
    const state = freshBattle();
    const result = resolveTurn(
      state,
      [{ playerId: "playerA", characterId: "a1", abilityId: priorityRetargetToA2.id, targetIds: ["a1"] }],
      [{ playerId: "playerB", characterId: "b1", abilityId: strike30.id, targetIds: ["a1"] }],
      deps(),
    );
    if (!result.ok) throw new Error("expected a legal turn");
    const damageEvent = result.events.find((e) => e.type === "damageDealt");
    expect(damageEvent?.targetId).toBe("a2"); // redirected from the requested a1
  });
});

describe("resolveTurn — erasure bypasses onDeath triggers (spec/02)", () => {
  const deathWatcher: PassiveDefinition = passiveDefinitionSchema.parse({
    id: "test.death-watcher",
    displayName: "Death Watcher",
    description: "test fixture: gain Might whenever any character dies",
    trigger: { event: "onDeath", relation: "any" },
    effects: [{ kind: "modifyEnergy", family: "MIGHT", amount: 5 }],
  });

  function depsWithDeathWatcher() {
    return { ...deps(), passives: { [deathWatcher.id]: deathWatcher } };
  }

  function freshBattleWithWatcher() {
    const teamAWithPassive: CreateBattleTeamInput = {
      playerId: "playerA",
      characters: [
        { characterId: "a1", maxHp: 100, passiveId: deathWatcher.id },
        { characterId: "a2", maxHp: 100 },
        { characterId: "a3", maxHp: 100 },
      ],
    };
    return createBattle([teamAWithPassive, TEAM_B], 1, {
      balanceVersionId: "test-balance-v1",
      matchFormat: defaultMatchFormat,
      energyRules: testEnergyRules,
    });
  }

  it("a normal death fires onDeath and the watching passive", () => {
    let state = freshBattleWithWatcher();
    for (let i = 0; i < 4; i++) {
      const result = resolveTurn(
        state,
        [{ playerId: "playerA", characterId: "a1", abilityId: strike30.id, targetIds: ["b1"] }],
        [],
        depsWithDeathWatcher(),
      );
      if (!result.ok) throw new Error(`expected turn ${i} to be legal`);
      state = result.state;
      if (!state.characters.b1?.alive) {
        expect(result.events.some((e) => e.type === "energyModified")).toBe(true);
        return;
      }
    }
    throw new Error("expected b1 to die within 4 strikes");
  });

  it("erasure kills without ever firing onDeath — the watching passive does not react", () => {
    const state = freshBattleWithWatcher();
    const result = resolveTurn(
      state,
      [{ playerId: "playerA", characterId: "a1", abilityId: eraseAbility.id, targetIds: ["b1"] }],
      [],
      depsWithDeathWatcher(),
    );
    if (!result.ok) throw new Error("expected a legal turn");
    expect(result.state.characters.b1?.alive).toBe(false);
    expect(result.events.some((e) => e.type === "erased")).toBe(true);
    expect(result.events.some((e) => e.type === "death")).toBe(false);
    expect(result.events.some((e) => e.type === "energyModified")).toBe(false);
  });
});
