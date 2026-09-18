import type {
  BattleTeam,
  CharacterRuntimeState,
  Effect,
  EnergyPool,
  StatusDefinition,
} from "@veilbreak/content";
import { createEmptyPool, richestFamily } from "./energy";
import { resolveDamage, resolveHeal } from "./damage";
import { applyStatusToCharacter, dispelCharacter, removeStatusFromCharacter } from "./statuses";
import { pickWeighted, type RngState } from "./rng";
import type { AppliedEvent } from "./types";

export interface EffectState {
  characters: Record<string, CharacterRuntimeState>;
  energyPools: Record<string, EnergyPool>;
}

export interface EffectContext {
  sourceId: string;
  targetIds: string[];
  teams: [BattleTeam, BattleTeam];
  statusLibrary: Record<string, StatusDefinition>;
}

export interface EffectResult {
  state: EffectState;
  events: AppliedEvent[];
  nextRngState: RngState;
}

function ownerOf(teams: [BattleTeam, BattleTeam], characterId: string): string | undefined {
  return teams.find((team) => team.characterIds.includes(characterId))?.playerId;
}

/**
 * Applies one Effect (packages/content/src/schemas/effect.ts) to battle
 * state. Phase 02 scope: damage (all three types), heal (all three
 * classes), applyStatus/removeStatus (the generic status engine —
 * statuses.ts), modifyCooldown, modifyEnergy, drainEnergy, sequence, and
 * randomOutcome. `summon`, `transformInto`, and `modifyResource` still throw
 * — those belong to Phase 03 ("Advanced systems"), which is also when
 * per-character resource tracking is added to CharacterRuntimeState.
 */
export function applyEffect(
  state: EffectState,
  effect: Effect,
  ctx: EffectContext,
  rngState: RngState,
): EffectResult {
  switch (effect.kind) {
    case "damage": {
      let characters = state.characters;
      const events: AppliedEvent[] = [];
      for (const targetId of ctx.targetIds) {
        // The schema defaults damageType to "normal" at parse time, but the
        // hand-written Effect union still marks it optional (a raw literal
        // built without going through the schema, as tests sometimes do,
        // shouldn't be forced to spell it out every time).
        const result = resolveDamage(characters, ctx.sourceId, targetId, effect.amount, effect.damageType ?? "normal");
        characters = result.characters;
        events.push(...result.events);
      }
      return { state: { ...state, characters }, events, nextRngState: rngState };
    }

    case "heal": {
      let characters = state.characters;
      const events: AppliedEvent[] = [];
      for (const targetId of ctx.targetIds) {
        const result = resolveHeal(characters, ctx.sourceId, targetId, effect.amount, effect.healingClass);
        characters = result.characters;
        events.push(...result.events);
      }
      return { state: { ...state, characters }, events, nextRngState: rngState };
    }

    case "applyStatus": {
      const definition = ctx.statusLibrary[effect.statusId];
      if (!definition) {
        throw new Error(`applyEffect: unknown status "${effect.statusId}" — is it registered in STATUS_LIBRARY?`);
      }
      let characters = state.characters;
      const events: AppliedEvent[] = [];
      for (const targetId of ctx.targetIds) {
        const target = characters[targetId];
        if (!target?.alive) continue;
        characters = {
          ...characters,
          [targetId]: applyStatusToCharacter(target, definition, {
            durationTurns: effect.durationTurns,
            stacks: effect.stacks,
            magnitude: effect.magnitude,
          }),
        };
        events.push({
          type: "statusApplied",
          sourceId: ctx.sourceId,
          targetId,
          payload: { statusId: effect.statusId, magnitude: effect.magnitude ?? 0 },
        });
      }
      return { state: { ...state, characters }, events, nextRngState: rngState };
    }

    case "removeStatus": {
      let characters = state.characters;
      const events: AppliedEvent[] = [];
      for (const targetId of ctx.targetIds) {
        const target = characters[targetId];
        if (!target) continue;
        if (effect.dispelAll) {
          characters = { ...characters, [targetId]: dispelCharacter(target, ctx.statusLibrary) };
          events.push({ type: "statusesDispelled", sourceId: ctx.sourceId, targetId });
        } else if (effect.statusId) {
          characters = { ...characters, [targetId]: removeStatusFromCharacter(target, effect.statusId) };
          events.push({
            type: "statusRemoved",
            sourceId: ctx.sourceId,
            targetId,
            payload: { statusId: effect.statusId },
          });
        }
      }
      return { state: { ...state, characters }, events, nextRngState: rngState };
    }

    case "modifyCooldown": {
      let characters = state.characters;
      const events: AppliedEvent[] = [];
      for (const targetId of ctx.targetIds) {
        const target = characters[targetId];
        if (!target) continue;
        const current = target.cooldowns[effect.abilityId] ?? 0;
        const next = Math.max(0, effect.mode === "set" ? effect.amount : current + effect.amount);
        characters = {
          ...characters,
          [targetId]: { ...target, cooldowns: { ...target.cooldowns, [effect.abilityId]: next } },
        };
        events.push({
          type: "cooldownModified",
          sourceId: ctx.sourceId,
          targetId,
          payload: { abilityId: effect.abilityId, turnsRemaining: next },
        });
      }
      return { state: { ...state, characters }, events, nextRngState: rngState };
    }

    case "modifyEnergy": {
      if (effect.family === "neutral") {
        // Neutral is a payment concept (any family may satisfy it), not
        // something a pool holds directly — nothing to add or remove.
        return { state, events: [], nextRngState: rngState };
      }
      const playerId = ownerOf(ctx.teams, ctx.sourceId);
      if (!playerId) {
        throw new Error(`applyEffect: unreachable — no owning player for character "${ctx.sourceId}"`);
      }
      const pool = state.energyPools[playerId];
      if (!pool) {
        throw new Error(`applyEffect: unreachable — no energy pool for player "${playerId}"`);
      }
      const nextAmount = Math.max(0, pool[effect.family] + effect.amount);
      const energyPools = { ...state.energyPools, [playerId]: { ...pool, [effect.family]: nextAmount } };
      return {
        state: { ...state, energyPools },
        events: [
          {
            type: "energyModified",
            sourceId: ctx.sourceId,
            payload: { playerId, family: effect.family, amount: effect.amount },
          },
        ],
        nextRngState: rngState,
      };
    }

    case "drainEnergy": {
      const sourcePlayerId = ownerOf(ctx.teams, ctx.sourceId);
      let energyPools = state.energyPools;
      const events: AppliedEvent[] = [];
      for (const targetId of ctx.targetIds) {
        const targetPlayerId = ownerOf(ctx.teams, targetId);
        if (!targetPlayerId) continue;
        const targetPool = energyPools[targetPlayerId];
        if (!targetPool) continue;

        const family = effect.family === "any" ? richestFamily(targetPool) : effect.family;
        const drained = Math.min(effect.amount, targetPool[family]);
        if (drained <= 0) continue;

        energyPools = { ...energyPools, [targetPlayerId]: { ...targetPool, [family]: targetPool[family] - drained } };

        // Uncapped by design (see docs/DECISIONS.md): applyEffect has no
        // EnergyRules in scope to check the pool cap against. A future
        // phase can thread it through if a real ability needs the cap
        // enforced on a granted steal.
        if (effect.grantToSelf && sourcePlayerId) {
          const sourcePool = energyPools[sourcePlayerId] ?? createEmptyPool();
          energyPools = {
            ...energyPools,
            [sourcePlayerId]: { ...sourcePool, [family]: sourcePool[family] + drained },
          };
        }

        events.push({
          type: "energyDrained",
          sourceId: ctx.sourceId,
          targetId,
          payload: { family, amount: drained, grantedToSelf: effect.grantToSelf },
        });
      }
      return { state: { ...state, energyPools }, events, nextRngState: rngState };
    }

    case "sequence": {
      let currentState = state;
      let allEvents: AppliedEvent[] = [];
      let nextState = rngState;
      for (const sub of effect.effects) {
        const result = applyEffect(currentState, sub, ctx, nextState);
        currentState = result.state;
        allEvents = allEvents.concat(result.events);
        nextState = result.nextRngState;
      }
      return { state: currentState, events: allEvents, nextRngState: nextState };
    }

    case "randomOutcome": {
      const weightedBranches = effect.outcome.branches.map((branch) => ({
        weight: branch.weight,
        value: branch.effects,
      }));
      const draw = pickWeighted(rngState, weightedBranches);
      let currentState = state;
      let allEvents: AppliedEvent[] = [];
      let nextState = draw.nextState;
      for (const sub of draw.value) {
        const result = applyEffect(currentState, sub, ctx, nextState);
        currentState = result.state;
        allEvents = allEvents.concat(result.events);
        nextState = result.nextRngState;
      }
      return { state: currentState, events: allEvents, nextRngState: nextState };
    }

    default:
      throw new Error(
        `applyEffect: effect kind "${effect.kind}" is not implemented until a later phase ` +
          `(Phase 02 supports damage, heal, applyStatus, removeStatus, modifyCooldown, modifyEnergy, ` +
          `drainEnergy, sequence, and randomOutcome).`,
      );
  }
}
