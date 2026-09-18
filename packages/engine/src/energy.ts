import type { Cost, EnergyFamily, EnergyPool, EnergyRules } from "@veilbreak/content";
import { pickRandom, type RngState } from "./rng";

// spec/01 "Energy": the four families a Cost can require directly. NEUTRAL
// is handled separately in payment (any single family may satisfy it) and is
// never itself a family a pool holds energy in.
export const ENERGY_FAMILIES: readonly EnergyFamily[] = ["MIGHT", "FOCUS", "SPIRIT", "CHAOS"];

export type { EnergyPool };

export function createEmptyPool(): EnergyPool {
  return { MIGHT: 0, FOCUS: 0, SPIRIT: 0, CHAOS: 0 };
}

/**
 * spec/01 "Energy" + OQ-03: generates this turn's energy for one player and
 * returns the updated pool alongside the RNG state advanced by every random
 * draw it made (CLAUDE.md rule 4 — no hidden mutation, no untracked
 * randomness). `mode: "fixed"` is not otherwise specified by spec/06; the
 * simplest reusable reading is "every living character grants one unit of
 * every family" (see docs/DECISIONS.md ADR-005), which needs no RNG draw at
 * all — `rngState` passes through unchanged in that branch.
 */
export function generateEnergy(
  pool: EnergyPool,
  rules: EnergyRules,
  params: { livingCharacterCount: number; isInitiativePlayer: boolean; isFirstTurn: boolean },
  rngState: RngState,
): { pool: EnergyPool; nextRngState: RngState } {
  const skipThisPlayer =
    params.isFirstTurn && params.isInitiativePlayer && rules.initiativePlayerSkipsTurnOneGeneration;
  if (skipThisPlayer || params.livingCharacterCount <= 0) {
    return { pool, nextRngState: rngState };
  }

  const unitsPerCharacter = rules.generation.perLivingCharacter;
  const nextPool: EnergyPool = { ...pool };
  let state = rngState;

  const totalUnits = unitsPerCharacter * params.livingCharacterCount;

  if (rules.generation.mode === "fixed") {
    for (const family of ENERGY_FAMILIES) {
      nextPool[family] = Math.min(rules.poolCap, nextPool[family] + totalUnits);
    }
    return { pool: nextPool, nextRngState: state };
  }

  for (let i = 0; i < totalUnits; i++) {
    const draw = pickRandom(state, ENERGY_FAMILIES);
    state = draw.nextState;
    nextPool[draw.value] = Math.min(rules.poolCap, nextPool[draw.value] + 1);
  }
  return { pool: nextPool, nextRngState: state };
}

function fixedFamilyCost(cost: Cost, family: EnergyFamily): number {
  switch (family) {
    case "MIGHT":
      return cost.might;
    case "FOCUS":
      return cost.focus;
    case "SPIRIT":
      return cost.spirit;
    case "CHAOS":
      return cost.chaos;
  }
}

function totalCost(cost: Cost): number {
  return cost.might + cost.focus + cost.spirit + cost.chaos + cost.neutral;
}

export function canAfford(pool: EnergyPool, cost: Cost): boolean {
  let remainingAfterFixed = 0;
  for (const family of ENERGY_FAMILIES) {
    const fixed = fixedFamilyCost(cost, family);
    if (pool[family] < fixed) return false;
    remainingAfterFixed += pool[family] - fixed;
  }
  return remainingAfterFixed >= cost.neutral;
}

/**
 * spec/06 "An in-app dev mode" is out of scope here, but the payment solver
 * it will eventually edit lives here: spec/01 says NEUTRAL cost can be paid
 * by any family, "the payment solver picks the least-damaging assignment,
 * and players may also specify an explicit payment" (docs/phases/phase-01
 * -battle-core.md). Returns the new pool, or `null` if the cost cannot be
 * paid (either genuinely unaffordable, or an invalid explicit payment).
 */
export function payCost(
  pool: EnergyPool,
  cost: Cost,
  explicitPayment?: Partial<EnergyPool>,
): EnergyPool | null {
  if (explicitPayment) {
    return payCostExplicitly(pool, cost, explicitPayment);
  }
  return payCostAutomatically(pool, cost);
}

function payCostExplicitly(
  pool: EnergyPool,
  cost: Cost,
  explicitPayment: Partial<EnergyPool>,
): EnergyPool | null {
  const nextPool: EnergyPool = { ...pool };
  let totalPaid = 0;
  for (const family of ENERGY_FAMILIES) {
    const amount = explicitPayment[family] ?? 0;
    if (amount < 0 || amount > pool[family]) return null;
    if (amount < fixedFamilyCost(cost, family)) return null;
    nextPool[family] = pool[family] - amount;
    totalPaid += amount;
  }
  // An explicit payment must cover the cost exactly — silently accepting an
  // overpayment would waste the player's energy without their intent.
  if (totalPaid !== totalCost(cost)) return null;
  return nextPool;
}

function payCostAutomatically(pool: EnergyPool, cost: Cost): EnergyPool | null {
  if (!canAfford(pool, cost)) return null;

  const nextPool: EnergyPool = { ...pool };
  for (const family of ENERGY_FAMILIES) {
    nextPool[family] -= fixedFamilyCost(cost, family);
  }

  let neutralRemaining = cost.neutral;
  while (neutralRemaining > 0) {
    const richestFamily = ENERGY_FAMILIES.reduce((richest, family) =>
      nextPool[family] > nextPool[richest] ? family : richest,
    );
    if (nextPool[richestFamily] <= 0) {
      // canAfford() already confirmed enough total remains; this would only
      // trip on a logic error above.
      return null;
    }
    nextPool[richestFamily] -= 1;
    neutralRemaining -= 1;
  }

  return nextPool;
}
