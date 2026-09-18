import { describe, expect, it } from "vitest";
import { STATUS_LIBRARY, type BattleTeam, type CharacterRuntimeState, type EnergyPool } from "@veilbreak/content";
import { applyEffect, type EffectState } from "./effects";
import { createRng } from "./rng";
import { hasStatus } from "./statuses";

const STUN = STATUS_LIBRARY["status.stun"]!;

function character(id: string, hp = 100): CharacterRuntimeState {
  return { characterId: id, currentHp: hp, maxHp: 100, alive: true, cooldowns: {}, statuses: [] };
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
  };
}

describe("applyEffect — applyStatus / removeStatus", () => {
  it("applies a status with the given magnitude and duration", () => {
    const state = stateWith([character("a1"), character("b1")]);
    const result = applyEffect(
      state,
      { kind: "applyStatus", statusId: STUN.id, durationTurns: 2, magnitude: 0 },
      { sourceId: "a1", targetIds: ["b1"], teams, statusLibrary: STATUS_LIBRARY },
      createRng(1),
    );
    expect(hasStatus(result.state.characters.b1!, STUN.id)).toBe(true);
    expect(result.events[0]?.type).toBe("statusApplied");
  });

  it("removeStatus removes exactly the named status", () => {
    const applied = applyEffect(
      stateWith([character("a1"), character("b1")]),
      { kind: "applyStatus", statusId: STUN.id },
      { sourceId: "a1", targetIds: ["b1"], teams, statusLibrary: STATUS_LIBRARY },
      createRng(1),
    );
    const removed = applyEffect(
      applied.state,
      { kind: "removeStatus", statusId: STUN.id },
      { sourceId: "a1", targetIds: ["b1"], teams, statusLibrary: STATUS_LIBRARY },
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
      { sourceId: "a1", targetIds: ["b1"], teams, statusLibrary: STATUS_LIBRARY },
      createRng(1),
    ).state;
    state = applyEffect(
      state,
      { kind: "applyStatus", statusId: curse.id },
      { sourceId: "a1", targetIds: ["b1"], teams, statusLibrary: STATUS_LIBRARY },
      createRng(1),
    ).state;
    const dispelled = applyEffect(
      state,
      { kind: "removeStatus", dispelAll: true },
      { sourceId: "a1", targetIds: ["b1"], teams, statusLibrary: STATUS_LIBRARY },
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
      { sourceId: "a1", targetIds: ["b1"], teams, statusLibrary: STATUS_LIBRARY },
      createRng(1),
    );
    expect(result.state.characters.b1?.cooldowns["ability.x"]).toBe(0);
  });

  it("mode 'delta' adds to the current cooldown, floored at 0", () => {
    const state = stateWith([{ ...character("b1"), cooldowns: { "ability.x": 1 } }]);
    const increased = applyEffect(
      state,
      { kind: "modifyCooldown", abilityId: "ability.x", mode: "delta", amount: 2 },
      { sourceId: "a1", targetIds: ["b1"], teams, statusLibrary: STATUS_LIBRARY },
      createRng(1),
    );
    expect(increased.state.characters.b1?.cooldowns["ability.x"]).toBe(3);

    const decreased = applyEffect(
      state,
      { kind: "modifyCooldown", abilityId: "ability.x", mode: "delta", amount: -99 },
      { sourceId: "a1", targetIds: ["b1"], teams, statusLibrary: STATUS_LIBRARY },
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
      { sourceId: "a1", targetIds: [], teams, statusLibrary: STATUS_LIBRARY },
      createRng(1),
    );
    expect(result.state.energyPools.playerA?.MIGHT).toBe(2);
  });

  it("modifyEnergy never drops a family below 0", () => {
    const state = stateWith([character("a1")], { playerA: emptyPool(), playerB: emptyPool() });
    const result = applyEffect(
      state,
      { kind: "modifyEnergy", family: "MIGHT", amount: -5 },
      { sourceId: "a1", targetIds: [], teams, statusLibrary: STATUS_LIBRARY },
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
      { sourceId: "a1", targetIds: ["b1"], teams, statusLibrary: STATUS_LIBRARY },
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
      { sourceId: "a1", targetIds: ["b1"], teams, statusLibrary: STATUS_LIBRARY },
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
      { sourceId: "a1", targetIds: ["b1"], teams, statusLibrary: STATUS_LIBRARY },
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
      { sourceId: "a1", targetIds: ["b1"], teams, statusLibrary: STATUS_LIBRARY },
      createRng(1),
    );
    expect(result.state.energyPools.playerB?.FOCUS).toBe(6);
    expect(result.state.energyPools.playerB?.MIGHT).toBe(1);
  });
});

describe("applyEffect — unimplemented kinds still throw (Phase 03 scope)", () => {
  it("summon throws", () => {
    expect(() =>
      applyEffect(
        stateWith([character("a1")]),
        { kind: "summon", summonId: "summon.test" },
        { sourceId: "a1", targetIds: [], teams, statusLibrary: STATUS_LIBRARY },
        createRng(1),
      ),
    ).toThrow(/not implemented/);
  });
});
