import { describe, expect, it } from "vitest";
import { createRng, nextFloat, nextUint32, pickRandom, pickWeighted, rollDie } from "./rng";

describe("rng", () => {
  it("is deterministic: the same seed produces the same sequence", () => {
    const seqA = [];
    const seqB = [];
    let stateA = createRng(42);
    let stateB = createRng(42);
    for (let i = 0; i < 20; i++) {
      const drawA = nextUint32(stateA);
      const drawB = nextUint32(stateB);
      seqA.push(drawA.value);
      seqB.push(drawB.value);
      stateA = drawA.nextState;
      stateB = drawB.nextState;
    }
    expect(seqA).toEqual(seqB);
  });

  it("different seeds diverge", () => {
    const a = nextUint32(createRng(1));
    const b = nextUint32(createRng(2));
    expect(a.value).not.toBe(b.value);
  });

  it("never mutates its input state (pure function, CLAUDE.md rule 4)", () => {
    const state = createRng(7);
    const before = state;
    nextUint32(state);
    expect(state).toBe(before);
  });

  it("nextFloat stays within [0, 1)", () => {
    let state = createRng(123);
    for (let i = 0; i < 200; i++) {
      const draw = nextFloat(state);
      expect(draw.value).toBeGreaterThanOrEqual(0);
      expect(draw.value).toBeLessThan(1);
      state = draw.nextState;
    }
  });

  it("rollDie stays within [1, sides] over many draws", () => {
    let state = createRng(99);
    const seen = new Set<number>();
    for (let i = 0; i < 500; i++) {
      const draw = rollDie(state, 6);
      expect(draw.value).toBeGreaterThanOrEqual(1);
      expect(draw.value).toBeLessThanOrEqual(6);
      seen.add(draw.value);
      state = draw.nextState;
    }
    // Over 500 rolls of a d6, every face should appear at least once.
    expect(seen.size).toBe(6);
  });

  it("pickRandom only ever returns items from the input list", () => {
    const items = ["a", "b", "c"] as const;
    let state = createRng(5);
    for (let i = 0; i < 50; i++) {
      const draw = pickRandom(state, items);
      expect(items).toContain(draw.value);
      state = draw.nextState;
    }
  });

  it("pickWeighted respects extreme weighting (a zero-weight branch is never chosen)", () => {
    let state = createRng(3);
    for (let i = 0; i < 100; i++) {
      const draw = pickWeighted(state, [
        { weight: 1000, value: "likely" },
        { weight: 0, value: "impossible" },
      ]);
      expect(draw.value).toBe("likely");
      state = draw.nextState;
    }
  });

  it("pickWeighted distributes roughly proportionally to weight", () => {
    let state = createRng(2024);
    const counts = { a: 0, b: 0 };
    const trials = 2000;
    for (let i = 0; i < trials; i++) {
      const draw = pickWeighted(state, [
        { weight: 3, value: "a" as const },
        { weight: 1, value: "b" as const },
      ]);
      counts[draw.value] += 1;
      state = draw.nextState;
    }
    // Expect roughly a 3:1 split; generous tolerance since this is a
    // statistical property, not an exact one.
    const ratio = counts.a / trials;
    expect(ratio).toBeGreaterThan(0.65);
    expect(ratio).toBeLessThan(0.85);
  });

  it("rejects a non-positive die", () => {
    expect(() => rollDie(createRng(1), 0)).toThrow();
  });

  it("rejects an empty list for pickRandom/pickWeighted", () => {
    expect(() => pickRandom(createRng(1), [])).toThrow();
    expect(() => pickWeighted(createRng(1), [])).toThrow();
  });
});
