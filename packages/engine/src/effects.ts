import type { CharacterRuntimeState, Effect } from "@veilbreak/content";
import { pickWeighted, type RngState } from "./rng";

export interface EffectContext {
  sourceId: string;
  targetIds: string[];
}

export interface AppliedEvent {
  type: string;
  sourceId?: string;
  targetId?: string;
  payload?: Record<string, unknown>;
}

export interface EffectResult {
  characters: Record<string, CharacterRuntimeState>;
  events: AppliedEvent[];
  nextRngState: RngState;
}

/**
 * Applies one Effect (packages/content/src/schemas/effect.ts) to battle
 * state. Phase 01 scope only: `damage`, `heal`, `sequence`, and
 * `randomOutcome` — enough to prove the resolver, RNG determinism, and tier
 * ordering end-to-end (phase-01-battle-core.md). Every other effect kind
 * belongs to a later phase's system (statuses: Phase 02; transformations,
 * summons, resources, energy manipulation: Phase 03) and throws rather than
 * silently doing nothing, so a future ability definition can't accidentally
 * depend on a mechanic that was never actually built.
 */
export function applyEffect(
  characters: Record<string, CharacterRuntimeState>,
  effect: Effect,
  ctx: EffectContext,
  rngState: RngState,
): EffectResult {
  switch (effect.kind) {
    case "damage": {
      let nextCharacters = characters;
      const events: AppliedEvent[] = [];
      for (const targetId of ctx.targetIds) {
        const target = nextCharacters[targetId];
        if (!target || !target.alive) continue;
        const currentHp = Math.max(0, target.currentHp - effect.amount);
        nextCharacters = { ...nextCharacters, [targetId]: { ...target, currentHp } };
        events.push({
          type: "damageDealt",
          sourceId: ctx.sourceId,
          targetId,
          payload: { amount: effect.amount },
        });
      }
      return { characters: nextCharacters, events, nextRngState: rngState };
    }

    case "heal": {
      let nextCharacters = characters;
      const events: AppliedEvent[] = [];
      for (const targetId of ctx.targetIds) {
        const target = nextCharacters[targetId];
        if (!target || !target.alive) continue;
        const currentHp =
          effect.healingClass === "setHp"
            ? Math.min(target.maxHp, Math.max(0, effect.amount))
            : Math.min(target.maxHp, target.currentHp + effect.amount);
        nextCharacters = { ...nextCharacters, [targetId]: { ...target, currentHp } };
        events.push({
          type: "healed",
          sourceId: ctx.sourceId,
          targetId,
          payload: { amount: effect.amount, healingClass: effect.healingClass },
        });
      }
      return { characters: nextCharacters, events, nextRngState: rngState };
    }

    case "sequence": {
      let nextCharacters = characters;
      let allEvents: AppliedEvent[] = [];
      let state = rngState;
      for (const sub of effect.effects) {
        const result = applyEffect(nextCharacters, sub, ctx, state);
        nextCharacters = result.characters;
        allEvents = allEvents.concat(result.events);
        state = result.nextRngState;
      }
      return { characters: nextCharacters, events: allEvents, nextRngState: state };
    }

    case "randomOutcome": {
      const weightedBranches = effect.outcome.branches.map((branch) => ({
        weight: branch.weight,
        value: branch.effects,
      }));
      const draw = pickWeighted(rngState, weightedBranches);
      let nextCharacters = characters;
      let allEvents: AppliedEvent[] = [];
      let state = draw.nextState;
      for (const sub of draw.value) {
        const result = applyEffect(nextCharacters, sub, ctx, state);
        nextCharacters = result.characters;
        allEvents = allEvents.concat(result.events);
        state = result.nextRngState;
      }
      return { characters: nextCharacters, events: allEvents, nextRngState: state };
    }

    default:
      throw new Error(
        `applyEffect: effect kind "${effect.kind}" is not implemented until a later phase ` +
          `(Phase 01 only supports damage, heal, sequence, and randomOutcome).`,
      );
  }
}
