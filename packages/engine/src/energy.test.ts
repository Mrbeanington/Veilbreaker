import { describe, expect, it } from "vitest";
import type { Cost, EnergyRules } from "@veilbreak/content";
import { canAfford, createEmptyPool, generateEnergy, payCost, type EnergyPool } from "./energy";
import { createRng } from "./rng";

const rules: EnergyRules = {
  generation: { perLivingCharacter: 1, minPerTeam: 0, mode: "random" },
  poolCap: 10,
  carryover: true,
  initiativePlayerSkipsTurnOneGeneration: true,
};

function cost(partial: Partial<Cost>): Cost {
  return { might: 0, focus: 0, spirit: 0, chaos: 0, neutral: 0, ...partial };
}

describe("generateEnergy", () => {
  it("a minPerTeam floor keeps a last survivor from being starved (phase-15 regression)", () => {
    const floored: EnergyRules = { ...rules, generation: { perLivingCharacter: 2, minPerTeam: 3, mode: "random" } };
    const total = (livingCharacterCount: number) =>
      Object.values(generateEnergy(createEmptyPool(), floored, { livingCharacterCount, isInitiativePlayer: false, isFirstTurn: false }, createRng(7)).pool).reduce((a, b) => a + b, 0);
    expect(total(1)).toBe(3); // 2 per character would be only 2
    expect(total(2)).toBe(4); // the floor never lowers a bigger team's income
    expect(total(3)).toBe(6);
  });

  it("is deterministic for a given seed", () => {
    const a = generateEnergy(createEmptyPool(), rules, {
      livingCharacterCount: 3,
      isInitiativePlayer: false,
      isFirstTurn: false,
    }, createRng(1));
    const b = generateEnergy(createEmptyPool(), rules, {
      livingCharacterCount: 3,
      isInitiativePlayer: false,
      isFirstTurn: false,
    }, createRng(1));
    expect(a.pool).toEqual(b.pool);
    expect(a.nextRngState).toBe(b.nextRngState);
  });

  it("generates exactly perLivingCharacter units per living character (random mode)", () => {
    const result = generateEnergy(createEmptyPool(), rules, {
      livingCharacterCount: 3,
      isInitiativePlayer: false,
      isFirstTurn: false,
    }, createRng(7));
    const total = Object.values(result.pool).reduce((a, b) => a + b, 0);
    expect(total).toBe(3);
  });

  it("skips generation for the initiative player on turn one (OQ-03 default)", () => {
    const result = generateEnergy(createEmptyPool(), rules, {
      livingCharacterCount: 3,
      isInitiativePlayer: true,
      isFirstTurn: true,
    }, createRng(7));
    expect(result.pool).toEqual(createEmptyPool());
  });

  it("does not skip the non-initiative player on turn one", () => {
    const result = generateEnergy(createEmptyPool(), rules, {
      livingCharacterCount: 3,
      isInitiativePlayer: false,
      isFirstTurn: true,
    }, createRng(7));
    const total = Object.values(result.pool).reduce((a, b) => a + b, 0);
    expect(total).toBe(3);
  });

  it("never exceeds the pool cap", () => {
    const nearFullPool: EnergyPool = { MIGHT: 10, FOCUS: 10, SPIRIT: 10, CHAOS: 10 };
    const result = generateEnergy(nearFullPool, rules, {
      livingCharacterCount: 5,
      isInitiativePlayer: false,
      isFirstTurn: false,
    }, createRng(3));
    for (const value of Object.values(result.pool)) {
      expect(value).toBeLessThanOrEqual(10);
    }
  });

  it("fixed mode grants one unit of every family per living character, with no RNG draw", () => {
    const fixedRules: EnergyRules = { ...rules, generation: { perLivingCharacter: 1, minPerTeam: 0, mode: "fixed" } };
    const seed = createRng(11);
    const result = generateEnergy(createEmptyPool(), fixedRules, {
      livingCharacterCount: 1,
      isInitiativePlayer: false,
      isFirstTurn: false,
    }, seed);
    expect(result.pool).toEqual({ MIGHT: 1, FOCUS: 1, SPIRIT: 1, CHAOS: 1 });
    expect(result.nextRngState).toBe(seed);
  });

  it("fixed mode scales with living character count", () => {
    const fixedRules: EnergyRules = { ...rules, generation: { perLivingCharacter: 1, minPerTeam: 0, mode: "fixed" } };
    const result = generateEnergy(createEmptyPool(), fixedRules, {
      livingCharacterCount: 3,
      isInitiativePlayer: false,
      isFirstTurn: false,
    }, createRng(11));
    expect(result.pool).toEqual({ MIGHT: 3, FOCUS: 3, SPIRIT: 3, CHAOS: 3 });
  });
});

describe("canAfford / payCost", () => {
  it("affords and pays a simple fixed-family cost", () => {
    const pool: EnergyPool = { MIGHT: 2, FOCUS: 0, SPIRIT: 0, CHAOS: 0 };
    const c = cost({ might: 1 });
    expect(canAfford(pool, c)).toBe(true);
    expect(payCost(pool, c)).toEqual({ MIGHT: 1, FOCUS: 0, SPIRIT: 0, CHAOS: 0 });
  });

  it("rejects an unaffordable fixed-family cost even if other families are full", () => {
    const pool: EnergyPool = { MIGHT: 0, FOCUS: 10, SPIRIT: 10, CHAOS: 10 };
    const c = cost({ might: 1 });
    expect(canAfford(pool, c)).toBe(false);
    expect(payCost(pool, c)).toBeNull();
  });

  it("pays a NEUTRAL cost from the richest remaining family (least-damaging assignment)", () => {
    const pool: EnergyPool = { MIGHT: 1, FOCUS: 5, SPIRIT: 0, CHAOS: 0 };
    const c = cost({ neutral: 2 });
    const result = payCost(pool, c);
    // FOCUS (5) is richer than MIGHT (1), so neutral should draw from FOCUS first.
    expect(result).toEqual({ MIGHT: 1, FOCUS: 3, SPIRIT: 0, CHAOS: 0 });
  });

  it("combines a fixed-family cost with a NEUTRAL top-up", () => {
    const pool: EnergyPool = { MIGHT: 2, FOCUS: 4, SPIRIT: 0, CHAOS: 0 };
    const c = cost({ might: 2, neutral: 1 });
    const result = payCost(pool, c);
    expect(result).toEqual({ MIGHT: 0, FOCUS: 3, SPIRIT: 0, CHAOS: 0 });
  });

  it("rejects an unaffordable NEUTRAL cost", () => {
    const pool: EnergyPool = { MIGHT: 1, FOCUS: 0, SPIRIT: 0, CHAOS: 0 };
    const c = cost({ neutral: 2 });
    expect(canAfford(pool, c)).toBe(false);
    expect(payCost(pool, c)).toBeNull();
  });

  it("accepts a valid explicit payment", () => {
    const pool: EnergyPool = { MIGHT: 2, FOCUS: 3, SPIRIT: 0, CHAOS: 0 };
    const c = cost({ might: 1, neutral: 1 });
    const result = payCost(pool, c, { MIGHT: 1, FOCUS: 1, SPIRIT: 0, CHAOS: 0 });
    expect(result).toEqual({ MIGHT: 1, FOCUS: 2, SPIRIT: 0, CHAOS: 0 });
  });

  it("rejects an explicit payment that underpays a fixed family", () => {
    const pool: EnergyPool = { MIGHT: 2, FOCUS: 3, SPIRIT: 0, CHAOS: 0 };
    const c = cost({ might: 2, neutral: 1 });
    // Pays the neutral unit from FOCUS but shorts the mandatory MIGHT:2.
    const result = payCost(pool, c, { MIGHT: 1, FOCUS: 2, SPIRIT: 0, CHAOS: 0 });
    expect(result).toBeNull();
  });

  it("rejects an explicit payment that does not sum to the total cost", () => {
    const pool: EnergyPool = { MIGHT: 2, FOCUS: 3, SPIRIT: 0, CHAOS: 0 };
    const c = cost({ might: 1, neutral: 1 });
    const result = payCost(pool, c, { MIGHT: 1, FOCUS: 0, SPIRIT: 0, CHAOS: 0 });
    expect(result).toBeNull();
  });

  it("rejects an explicit payment exceeding what the pool holds", () => {
    const pool: EnergyPool = { MIGHT: 1, FOCUS: 0, SPIRIT: 0, CHAOS: 0 };
    const c = cost({ might: 1 });
    const result = payCost(pool, c, { MIGHT: 5, FOCUS: 0, SPIRIT: 0, CHAOS: 0 });
    expect(result).toBeNull();
  });

  it("a zero cost is always affordable and is a no-op payment", () => {
    const pool: EnergyPool = { MIGHT: 0, FOCUS: 0, SPIRIT: 0, CHAOS: 0 };
    expect(canAfford(pool, cost({}))).toBe(true);
    expect(payCost(pool, cost({}))).toEqual(pool);
  });
});
