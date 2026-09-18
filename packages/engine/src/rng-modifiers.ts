import type { CharacterRuntimeState, RandomOutcomeBranch, RngModifier } from "@veilbreak/content";
import { pickWeighted, type RngState } from "./rng";

// spec/01 "RNG manipulation: force outcome, guarantee min/max, reroll, and
// weight modification, all implemented as modifiers on RandomOutcome"
// (phase-03-advanced-systems.md). Branches carry no inherent numeric value —
// only a weight — so "min"/"max" are read as author-order convention:
// content authors list a RandomOutcome's branches worst to best, and
// guaranteeMin/guaranteeMax pick the first/last branch. See
// docs/DECISIONS.md for the full rationale and how this maps onto spec/01's
// four named manipulations.
export function selectRandomOutcomeBranch(
  branches: readonly RandomOutcomeBranch[],
  modifier: RngModifier | undefined,
  rngState: RngState,
): { branch: RandomOutcomeBranch; nextRngState: RngState } {
  const first = branches[0];
  const last = branches[branches.length - 1];
  if (!first || !last) {
    throw new Error("selectRandomOutcomeBranch: unreachable — RandomOutcome requires at least 2 branches (schema-enforced)");
  }
  const weighted = branches.map((b) => ({ weight: b.weight, value: b }));

  switch (modifier?.mode) {
    case "forceOutcome": {
      const branch = (modifier.branchIndex !== undefined ? branches[modifier.branchIndex] : undefined) ?? first;
      return { branch, nextRngState: rngState };
    }
    case "guaranteeMin":
      return { branch: first, nextRngState: rngState };
    case "guaranteeMax":
      return { branch: last, nextRngState: rngState };
    case "weightBoost": {
      const multiplier = modifier.weightMultiplier ?? 1;
      const boosted = weighted.map((w, i) => (i === weighted.length - 1 ? { ...w, weight: w.weight * multiplier } : w));
      const draw = pickWeighted(rngState, boosted);
      return { branch: draw.value, nextRngState: draw.nextState };
    }
    case "reroll": {
      const firstDraw = pickWeighted(rngState, weighted);
      const secondDraw = pickWeighted(firstDraw.nextState, weighted);
      return { branch: secondDraw.value, nextRngState: secondDraw.nextState };
    }
    default: {
      const draw = pickWeighted(rngState, weighted);
      return { branch: draw.value, nextRngState: draw.nextState };
    }
  }
}

export function queueRngModifier(
  character: CharacterRuntimeState,
  modifier: RngModifier,
): CharacterRuntimeState {
  return { ...character, pendingRngModifiers: [...character.pendingRngModifiers, modifier] };
}

/** Pops the oldest pending modifier (FIFO), if any — a one-shot instruction consumed by the next randomOutcome roll. */
export function consumeRngModifier(character: CharacterRuntimeState): {
  modifier: RngModifier | undefined;
  character: CharacterRuntimeState;
} {
  const [modifier, ...rest] = character.pendingRngModifiers;
  return { modifier, character: { ...character, pendingRngModifiers: rest } };
}
