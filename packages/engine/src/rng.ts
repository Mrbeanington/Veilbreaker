// CLAUDE.md rule 4: "All randomness goes through the seeded RNG stored in
// battle state... Same seed + same actions + same balance version = identical
// result." This is a mulberry32 generator (public-domain, widely used for
// deterministic JS simulations/games) chosen for its simplicity: a single
// 32-bit integer of state, serializable as a decimal string so it fits
// BattleState.rngState (packages/content/src/schemas/battle.ts) without any
// custom (de)serialization code.
//
// Every function here is pure — it takes a state and returns a new state
// alongside a value, never mutating its input — per CLAUDE.md rule 4:
// "Engine functions take state and return new state or events; no hidden
// mutation." This also means the same RngState value can be reused to
// deterministically reproduce the same draw, which is exactly what replay
// verification (spec/02 "Replays and determinism") needs.

const UINT32_MOD = 0x100000000; // 2^32

export type RngState = string;

function toUint32(state: RngState): number {
  return Number(state) >>> 0;
}

/** Seeds a fresh RNG state from any 32-bit integer (e.g. a match seed). */
export function createRng(seed: number): RngState {
  return String(seed >>> 0);
}

/** Draws the next uint32 in [0, 2^32) and the state that produced it. */
export function nextUint32(state: RngState): { value: number; nextState: RngState } {
  const a = (toUint32(state) + 0x6d2b79f5) >>> 0;
  let t = Math.imul(a ^ (a >>> 15), a | 1);
  t = (t + Math.imul(t ^ (t >>> 7), t | 61)) ^ t;
  const value = (t ^ (t >>> 14)) >>> 0;
  return { value, nextState: String(a) };
}

/** Draws the next float in [0, 1). */
export function nextFloat(state: RngState): { value: number; nextState: RngState } {
  const { value, nextState } = nextUint32(state);
  return { value: value / UINT32_MOD, nextState };
}

/** Rolls an n-sided die (1..sides inclusive) — spec/01 "Roll 1–6 with defined outcomes". */
export function rollDie(state: RngState, sides: number): { value: number; nextState: RngState } {
  if (!Number.isInteger(sides) || sides < 1) {
    throw new Error(`rollDie: sides must be a positive integer, got ${sides}`);
  }
  const { value, nextState } = nextUint32(state);
  return { value: (value % sides) + 1, nextState };
}

/** Uniformly picks one element from a non-empty array — spec/01 "Steal one random enemy energy". */
export function pickRandom<T>(state: RngState, items: readonly T[]): { value: T; nextState: RngState } {
  if (items.length === 0) {
    throw new Error("pickRandom: items must be non-empty");
  }
  const { value: index, nextState } = nextUint32(state);
  const item = items[index % items.length];
  if (item === undefined) {
    throw new Error("pickRandom: unreachable — index modulo length was out of range");
  }
  return { value: item, nextState };
}

export interface Weighted<T> {
  weight: number;
  value: T;
}

/**
 * Picks one item according to its relative weight — spec/01 "Deal randomly
 * 20, 30 or 40" and RandomOutcome (packages/content/src/schemas/effect.ts).
 */
export function pickWeighted<T>(
  state: RngState,
  items: readonly Weighted<T>[],
): { value: T; nextState: RngState } {
  if (items.length === 0) {
    throw new Error("pickWeighted: items must be non-empty");
  }
  const totalWeight = items.reduce((sum, item) => sum + item.weight, 0);
  if (totalWeight <= 0) {
    throw new Error("pickWeighted: total weight must be positive");
  }
  const { value: roll, nextState } = nextFloat(state);
  const target = roll * totalWeight;
  let cumulative = 0;
  for (const item of items) {
    cumulative += item.weight;
    if (target < cumulative) {
      return { value: item.value, nextState };
    }
  }
  // Floating-point edge case (roll extremely close to 1): fall back to the
  // last item rather than leaving the draw unresolved.
  const last = items[items.length - 1];
  if (last === undefined) {
    throw new Error("pickWeighted: unreachable — items was non-empty above");
  }
  return { value: last.value, nextState };
}
