import { describe, expect, it } from "vitest";
import type { RandomOutcomeBranch } from "@veilbreak/content";
import { consumeRngModifier, queueRngModifier, selectRandomOutcomeBranch } from "./rng-modifiers";
import { createRng } from "./rng";
import { testCharacter } from "./test-support";

const worst: RandomOutcomeBranch = { weight: 1, effects: [{ kind: "damage", amount: 10 }] };
const best: RandomOutcomeBranch = { weight: 1, effects: [{ kind: "damage", amount: 50 }] };
const branches = [worst, best];

describe("selectRandomOutcomeBranch", () => {
  it("with no modifier, draws a weighted branch normally", () => {
    const { branch } = selectRandomOutcomeBranch(branches, undefined, createRng(1));
    expect(branches).toContain(branch);
  });

  it("forceOutcome picks the exact index", () => {
    const { branch } = selectRandomOutcomeBranch(branches, { mode: "forceOutcome", branchIndex: 1 }, createRng(1));
    expect(branch).toBe(best);
  });

  it("guaranteeMin always picks the first (worst) branch", () => {
    for (let seed = 0; seed < 10; seed++) {
      const { branch } = selectRandomOutcomeBranch(branches, { mode: "guaranteeMin" }, createRng(seed));
      expect(branch).toBe(worst);
    }
  });

  it("guaranteeMax always picks the last (best) branch", () => {
    for (let seed = 0; seed < 10; seed++) {
      const { branch } = selectRandomOutcomeBranch(branches, { mode: "guaranteeMax" }, createRng(seed));
      expect(branch).toBe(best);
    }
  });

  it("weightBoost heavily favors the last branch without making it certain", () => {
    let bestCount = 0;
    let state = createRng(7);
    const trials = 200;
    for (let i = 0; i < trials; i++) {
      const draw = selectRandomOutcomeBranch(branches, { mode: "weightBoost", weightMultiplier: 50 }, state);
      if (draw.branch === best) bestCount += 1;
      state = draw.nextRngState;
    }
    // 50x boost on an equal-weight pair means best should win the large
    // majority of draws, but "boost" (unlike guaranteeMax) never forces it.
    expect(bestCount / trials).toBeGreaterThan(0.9);
  });

  it("reroll draws twice, and the two draws differ from a single unmodified draw's state", () => {
    const single = selectRandomOutcomeBranch(branches, undefined, createRng(1));
    const rerolled = selectRandomOutcomeBranch(branches, { mode: "reroll" }, createRng(1));
    expect(rerolled.nextRngState).not.toBe(single.nextRngState);
  });

  it("throws for an out-of-range branch list (schema guarantees at least 2, but defends anyway)", () => {
    expect(() => selectRandomOutcomeBranch([], undefined, createRng(1))).toThrow(/unreachable/);
  });
});

describe("queueRngModifier / consumeRngModifier", () => {
  it("consume returns undefined and the character unchanged when nothing is queued", () => {
    const character = testCharacter({ characterId: "a1" });
    const { modifier, character: after } = consumeRngModifier(character);
    expect(modifier).toBeUndefined();
    expect(after.pendingRngModifiers).toEqual([]);
  });

  it("queue then consume returns the modifier and clears the queue (FIFO)", () => {
    let character = testCharacter({ characterId: "a1" });
    character = queueRngModifier(character, { mode: "guaranteeMax" });
    character = queueRngModifier(character, { mode: "guaranteeMin" });
    const first = consumeRngModifier(character);
    expect(first.modifier).toEqual({ mode: "guaranteeMax" });
    const second = consumeRngModifier(first.character);
    expect(second.modifier).toEqual({ mode: "guaranteeMin" });
    expect(second.character.pendingRngModifiers).toEqual([]);
  });
});
