import type {
  BattleTeam,
  CharacterRuntimeState,
  Effect,
  EnergyPool,
  Resource,
  StatusDefinition,
  Summon,
  SummonRuntimeState,
  TargetRule,
  Transformation,
} from "@veilbreak/content";
import { LAST_USED_ABILITY, RESURRECTION_LOCK, SOUL_CONSECRATION } from "@veilbreak/content";
import { createEmptyPool, richestFamily } from "./energy";
import { resolveDamage, resolveHeal } from "./damage";
import { applyStatusToCharacter, dispelCharacter, hasStatus, removeStatusFromCharacter } from "./statuses";
import { evaluateCondition, type ConditionState } from "./conditions";
import { createSummonRuntimeState, nextSummonInstanceId } from "./summons";
import { applyTransformation } from "./transformations";
import { consumeRngModifier, queueRngModifier, selectRandomOutcomeBranch } from "./rng-modifiers";
import type { RngState } from "./rng";
import type { AppliedEvent } from "./types";

export interface EffectState {
  characters: Record<string, CharacterRuntimeState>;
  energyPools: Record<string, EnergyPool>;
  summons: Record<string, SummonRuntimeState>;
}

export interface EffectContext {
  sourceId: string;
  targetIds: string[];
  teams: [BattleTeam, BattleTeam];
  turn: number;
  statusLibrary: Record<string, StatusDefinition>;
  summonLibrary: Record<string, Summon>;
  transformationLibrary: Record<string, Transformation>;
  resourceLibrary: Record<string, Resource>;
}

export interface QueuedRetarget {
  queuedCharacterId: string;
  newTargetIds: string[];
}

export interface EffectResult {
  state: EffectState;
  events: AppliedEvent[];
  nextRngState: RngState;
  // OQ-07 / spec/01 Cheaters "change targets after actions are selected":
  // only ever populated by `retargetQueuedAction`. resolver.ts reads this
  // and applies it to its own action-queue override map — applyEffect stays
  // pure and never mutates a queue it doesn't own.
  queuedRetargets?: QueuedRetarget[];
}

function ownerOf(teams: [BattleTeam, BattleTeam], characterId: string): string | undefined {
  return teams.find((team) => team.characterIds.includes(characterId))?.playerId;
}

/** ADR-015: resolves the `@lastUsed` token to the target's most recently used ability; any other value passes through. */
function resolveAbilityToken(value: string | undefined, target: { abilityHistory: readonly string[] }): string | undefined {
  if (value !== LAST_USED_ABILITY) return value;
  return target.abilityHistory[target.abilityHistory.length - 1];
}

function conditionStateOf(state: EffectState, ctx: EffectContext): ConditionState {
  return { teams: ctx.teams, turn: ctx.turn, characters: state.characters };
}

/**
 * phase-04-first-five.md forced this: an ability's effects all share the one
 * TargetRule the ability itself resolved (`ctx.targetIds`) — fine for a
 * simple attack, but Malachar's Borrowed Life ("deal 20 damage [to an enemy]
 * and restore 20 HP [to himself]") needs one effect in the same cast to land
 * on the caster instead. Rather than threading a full BattleState + RNG into
 * EffectContext so every effect could re-run real targeting (ally/random/
 * lowestHp/...), this narrowly recognizes `target: { side: "self", ... }` on
 * the effect itself — trivially resolvable from `ctx.sourceId` alone — and
 * falls back to the ability's shared targets otherwise. See docs/DECISIONS.md
 * ADR-011 and OQ-36 for why the other TargetRule sides aren't supported here.
 */
function resolveEffectTargets(target: TargetRule | undefined, ctx: EffectContext): string[] {
  return target?.side === "self" ? [ctx.sourceId] : ctx.targetIds;
}

/**
 * Applies one Effect (packages/content/src/schemas/effect.ts) to battle
 * state. Phase 03 completes the interpreter: transformInto, summon, erase,
 * resurrect, modifyRandomOutcome, retargetQueuedAction, modifyResource, and
 * conditional join Phase 01/02's damage/heal/applyStatus/removeStatus/
 * modifyCooldown/modifyEnergy/drainEnergy/sequence/randomOutcome. Every
 * Effect kind the schema defines is now implemented.
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
      let summons = state.summons;
      const events: AppliedEvent[] = [];
      for (const targetId of ctx.targetIds) {
        // The schema defaults damageType to "normal" at parse time, but the
        // hand-written Effect union still marks it optional (a raw literal
        // built without going through the schema, as tests sometimes do,
        // shouldn't be forced to spell it out every time).
        const result = resolveDamage(characters, summons, ctx.sourceId, targetId, effect.amount, effect.damageType ?? "normal");
        characters = result.characters;
        summons = result.summons;
        events.push(...result.events);
      }
      return { state: { ...state, characters, summons }, events, nextRngState: rngState };
    }

    case "heal": {
      let characters = state.characters;
      const events: AppliedEvent[] = [];
      for (const targetId of resolveEffectTargets(effect.target, ctx)) {
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
        const param = resolveAbilityToken(effect.param, target);
        if (effect.param === LAST_USED_ABILITY && param === undefined) continue;
        characters = {
          ...characters,
          [targetId]: applyStatusToCharacter(target, definition, {
            durationTurns: effect.durationTurns,
            stacks: effect.stacks,
            magnitude: effect.magnitude,
            param,
          }),
        };
        events.push({
          type: "statusApplied",
          sourceId: ctx.sourceId,
          targetId,
          payload: { statusId: effect.statusId, magnitude: effect.magnitude ?? 0, param },
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

    case "modifyResource": {
      const definition = ctx.resourceLibrary[effect.resourceId];
      let characters = state.characters;
      const events: AppliedEvent[] = [];
      for (const targetId of resolveEffectTargets(effect.target, ctx)) {
        const target = characters[targetId];
        if (!target) continue;
        const current = target.resources[effect.resourceId] ?? definition?.startingValue ?? 0;
        const min = definition?.min ?? 0;
        const max = definition?.max;
        let next = current + effect.amount;
        next = Math.max(min, next);
        if (max !== undefined) next = Math.min(max, next);
        characters = { ...characters, [targetId]: { ...target, resources: { ...target.resources, [effect.resourceId]: next } } };
        events.push({
          type: "resourceChanged",
          sourceId: ctx.sourceId,
          targetId,
          payload: { resourceId: effect.resourceId, value: next, delta: next - current },
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

    case "modifyCooldown": {
      let characters = state.characters;
      const events: AppliedEvent[] = [];
      for (const targetId of ctx.targetIds) {
        const target = characters[targetId];
        if (!target) continue;
        const abilityId = resolveAbilityToken(effect.abilityId, target);
        if (abilityId === undefined) continue;
        const current = target.cooldowns[abilityId] ?? 0;
        const next = Math.max(0, effect.mode === "set" ? effect.amount : current + effect.amount);
        characters = {
          ...characters,
          [targetId]: { ...target, cooldowns: { ...target.cooldowns, [abilityId]: next } },
        };
        events.push({
          type: "cooldownModified",
          sourceId: ctx.sourceId,
          targetId,
          payload: { abilityId, turnsRemaining: next },
        });
      }
      return { state: { ...state, characters }, events, nextRngState: rngState };
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

    case "summon": {
      const definition = ctx.summonLibrary[effect.summonId];
      if (!definition) {
        throw new Error(`applyEffect: unknown summon "${effect.summonId}" — is it registered in the summon library?`);
      }
      const instanceId = nextSummonInstanceId(state.summons, ctx.sourceId, effect.summonId);
      const runtime = createSummonRuntimeState(definition, ctx.sourceId, instanceId);
      const summons = { ...state.summons, [instanceId]: runtime };
      return {
        state: { ...state, summons },
        events: [{ type: "summonCreated", sourceId: ctx.sourceId, payload: { summonId: effect.summonId, instanceId } }],
        nextRngState: rngState,
      };
    }

    case "transformInto": {
      const transformation = ctx.transformationLibrary[effect.transformationId];
      if (!transformation) {
        throw new Error(`applyEffect: unknown transformation "${effect.transformationId}"`);
      }
      const source = state.characters[ctx.sourceId];
      if (!source) {
        throw new Error(`applyEffect: unreachable — unknown source character "${ctx.sourceId}"`);
      }
      const transformed = applyTransformation(source, transformation);
      const characters = { ...state.characters, [ctx.sourceId]: transformed };
      return {
        state: { ...state, characters },
        events: [
          {
            type: "transformed",
            sourceId: ctx.sourceId,
            payload: { transformationId: effect.transformationId, toStageId: transformation.toStageId },
          },
        ],
        nextRngState: rngState,
      };
    }

    case "erase": {
      // spec/02 "erasure that bypasses death triggers": sets alive=false
      // directly, emitting "erased" rather than "death" — resolver.ts's
      // death-checks tier only fires "death" for a character it *itself*
      // finds at <=0 HP with alive still true, so an already-erased
      // character is silently skipped there, and the trigger system never
      // sees an onDeath event for them.
      let characters = state.characters;
      const events: AppliedEvent[] = [];
      for (const targetId of ctx.targetIds) {
        const target = characters[targetId];
        if (!target?.alive) continue;
        characters = { ...characters, [targetId]: { ...target, currentHp: 0, alive: false } };
        events.push({ type: "erased", sourceId: ctx.sourceId, targetId });
      }
      return { state: { ...state, characters }, events, nextRngState: rngState };
    }

    case "resurrect": {
      let characters = state.characters;
      const events: AppliedEvent[] = [];
      for (const targetId of ctx.targetIds) {
        const target = characters[targetId];
        if (!target || target.alive) continue;
        // spec/03 "Consecration must block ... resurrection": Father Bell's
        // effect isn't built until his own phase, but the rule itself is
        // general (any consecrated death, by anyone) so it lives here next
        // to the equivalent Resurrection Lock check rather than waiting.
        if (hasStatus(target, RESURRECTION_LOCK.id) || hasStatus(target, SOUL_CONSECRATION.id)) {
          events.push({ type: "resurrectionBlocked", sourceId: ctx.sourceId, targetId });
          continue;
        }
        const percent = effect.healthPercent ?? 50;
        const currentHp = Math.max(1, Math.round((percent / 100) * target.maxHp));
        characters = { ...characters, [targetId]: { ...target, alive: true, currentHp } };
        events.push({ type: "resurrected", sourceId: ctx.sourceId, targetId, payload: { healthPercent: percent } });
      }
      return { state: { ...state, characters }, events, nextRngState: rngState };
    }

    case "modifyRandomOutcome": {
      let characters = state.characters;
      const events: AppliedEvent[] = [];
      for (const targetId of ctx.targetIds) {
        const target = characters[targetId];
        if (!target) continue;
        characters = {
          ...characters,
          [targetId]: queueRngModifier(target, {
            mode: effect.mode,
            branchIndex: effect.branchIndex,
            weightMultiplier: effect.weightMultiplier,
          }),
        };
        events.push({ type: "rngModifierQueued", sourceId: ctx.sourceId, targetId, payload: { mode: effect.mode } });
      }
      return { state: { ...state, characters }, events, nextRngState: rngState };
    }

    case "retargetQueuedAction": {
      // Both fields default from context when content omits them (see the
      // Effect union's doc comment): static ability data can't hardcode a
      // real match's actual enemy ids.
      const queuedCharacterId = effect.queuedCharacterId ?? ctx.targetIds[0];
      if (!queuedCharacterId) {
        return { state, events: [], nextRngState: rngState };
      }
      const newTargetIds = effect.newTargetIds ?? [ctx.sourceId];
      return {
        state,
        events: [
          {
            type: "queuedActionRetargeted",
            sourceId: ctx.sourceId,
            payload: { queuedCharacterId, newTargetIds },
          },
        ],
        nextRngState: rngState,
        queuedRetargets: [{ queuedCharacterId, newTargetIds }],
      };
    }

    case "rewindTurn":
      // The resolver owns the actual restore (it holds the turn-start state);
      // this only records the request. See ADR-015.
      return {
        state,
        events: [{ type: "rewindRequested", sourceId: ctx.sourceId, payload: { persistResourceId: effect.persistResourceId } }],
        nextRngState: rngState,
      };

    case "conditional": {
      const isTrue = evaluateCondition(conditionStateOf(state, ctx), effect.condition, {
        selfId: ctx.sourceId,
        sourceId: ctx.sourceId,
        targetId: ctx.targetIds[0],
      });
      const branch = isTrue ? effect.ifTrue : (effect.ifFalse ?? []);
      return applySequence(state, branch, ctx, rngState);
    }

    case "sequence":
      return applySequence(state, effect.effects, ctx, rngState);

    case "randomOutcome": {
      // spec/01 "RNG manipulation": a pending modifier queued on the roller
      // (modifyRandomOutcome, above) is consumed here — one-shot, cleared
      // whether or not this roll used it.
      const source = state.characters[ctx.sourceId];
      let characters = state.characters;
      let modifier;
      if (source) {
        const consumed = consumeRngModifier(source);
        modifier = consumed.modifier;
        characters = { ...characters, [ctx.sourceId]: consumed.character };
      }
      const { branch, nextRngState } = selectRandomOutcomeBranch(effect.outcome.branches, modifier, rngState);
      return applySequence({ ...state, characters }, branch.effects, ctx, nextRngState);
    }

    default:
      // Every Effect kind the schema defines is implemented above — this is
      // unreachable unless the schema grows a new kind this file hasn't
      // caught up with yet.
      throw new Error(`applyEffect: unhandled effect kind "${(effect as Effect).kind}"`);
  }
}

function applySequence(
  state: EffectState,
  effects: readonly Effect[],
  ctx: EffectContext,
  rngState: RngState,
): EffectResult {
  let currentState = state;
  let allEvents: AppliedEvent[] = [];
  let allRetargets: QueuedRetarget[] = [];
  let nextState = rngState;
  for (const sub of effects) {
    const result = applyEffect(currentState, sub, ctx, nextState);
    currentState = result.state;
    allEvents = allEvents.concat(result.events);
    if (result.queuedRetargets) allRetargets = allRetargets.concat(result.queuedRetargets);
    nextState = result.nextRngState;
  }
  return {
    state: currentState,
    events: allEvents,
    nextRngState: nextState,
    ...(allRetargets.length > 0 ? { queuedRetargets: allRetargets } : {}),
  };
}
