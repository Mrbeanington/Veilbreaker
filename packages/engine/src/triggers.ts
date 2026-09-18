import type {
  BattleTeam,
  Condition,
  Effect,
  PassiveDefinition,
  Resource,
  StatusDefinition,
  Summon,
  Transformation,
  Trigger,
  TriggerEvent,
  TriggerRelation,
} from "@veilbreak/content";
import { applyEffect, type EffectState } from "./effects";
import { evaluateCondition } from "./conditions";
import type { RngState } from "./rng";
import type { AppliedEvent } from "./types";

// phase-03-advanced-systems.md "Triggers and Conditions": event-driven
// reactions, checked against every character's current passive
// (CharacterRuntimeState.passiveId) and every active status's own
// triggerTiming (StatusDefinition.triggerTiming) — the same two places
// spec/02 says trigger hooks live, evaluated through one shared mechanism
// rather than two separate ones.
export interface GameEvent {
  event: TriggerEvent;
  /** The character the event is "about" — who got hit, who died, who acted. */
  subjectId: string;
  /** The event's other participant, if any — who dealt the damage, who got the kill credit, etc. */
  relatedId?: string;
  payload?: Record<string, unknown>;
}

export interface TriggerDeps {
  passives: Record<string, PassiveDefinition>;
  statusLibrary: Record<string, StatusDefinition>;
  summonLibrary: Record<string, Summon>;
  transformationLibrary: Record<string, Transformation>;
  resourceLibrary: Record<string, Resource>;
  teams: [BattleTeam, BattleTeam];
  turn: number;
}

export interface TriggerResult {
  state: EffectState;
  events: AppliedEvent[];
  nextRngState: RngState;
}

// CLAUDE.md rule 9 + phase-03-advanced-systems.md "Add a recursion guard":
// a trigger's own effects can produce events that fire more triggers (a
// passive that deals damage is itself an onDamaged/onDamageDealt event).
// Capped rather than left to recurse indefinitely, which a poorly-designed
// or malicious content loop (A damages B on hit, B damages A on hit) could
// otherwise turn into an infinite/stack-overflowing cascade.
const MAX_TRIGGER_DEPTH = 5;

function relationOf(teams: [BattleTeam, BattleTeam], holderId: string, subjectId: string): TriggerRelation {
  if (holderId === subjectId) return "self";
  const holderTeam = teams.find((t) => t.characterIds.includes(holderId));
  const subjectTeam = teams.find((t) => t.characterIds.includes(subjectId));
  return holderTeam && subjectTeam && holderTeam === subjectTeam ? "ally" : "enemy";
}

function matchesTrigger(trigger: Trigger, gameEvent: GameEvent, relation: TriggerRelation): boolean {
  if (trigger.event !== gameEvent.event) return false;
  return trigger.relation === "any" || trigger.relation === relation;
}

/**
 * Maps the events an effect application actually produced back into the
 * GameEvents that could fire further triggers — this is what makes a
 * cascade possible (and thus what the recursion guard above bounds).
 * "erased" is deliberately NOT mapped to onDeath — that's the entire
 * mechanism behind spec/02's "erasure that bypasses death triggers".
 */
export function deriveGameEvents(events: readonly AppliedEvent[]): GameEvent[] {
  const derived: GameEvent[] = [];
  for (const e of events) {
    switch (e.type) {
      case "damageDealt":
        if (e.targetId) {
          derived.push({ event: "onDamaged", subjectId: e.targetId, relatedId: e.sourceId, payload: e.payload });
          derived.push({ event: "onHpThreshold", subjectId: e.targetId, relatedId: e.sourceId, payload: e.payload });
        }
        if (e.sourceId) {
          derived.push({ event: "onDamageDealt", subjectId: e.sourceId, relatedId: e.targetId, payload: e.payload });
        }
        break;
      case "healed":
        if (e.targetId) derived.push({ event: "onHealed", subjectId: e.targetId, relatedId: e.sourceId, payload: e.payload });
        break;
      case "statusApplied":
        if (e.targetId) derived.push({ event: "onStatusApplied", subjectId: e.targetId, relatedId: e.sourceId, payload: e.payload });
        break;
      case "statusExpired":
        if (e.targetId) derived.push({ event: "onStatusExpired", subjectId: e.targetId, payload: e.payload });
        break;
      case "resourceChanged":
        if (e.targetId) derived.push({ event: "onResourceChanged", subjectId: e.targetId, relatedId: e.sourceId, payload: e.payload });
        break;
      case "death":
        // Not "erased" — see the doc comment above.
        if (e.targetId) derived.push({ event: "onDeath", subjectId: e.targetId, relatedId: e.sourceId, payload: e.payload });
        if (e.sourceId) derived.push({ event: "onKill", subjectId: e.sourceId, relatedId: e.targetId, payload: e.payload });
        break;
      case "resurrected":
        if (e.targetId) derived.push({ event: "onResurrection", subjectId: e.targetId, relatedId: e.sourceId, payload: e.payload });
        break;
      default:
        break;
    }
  }
  return derived;
}

export function evaluateEvent(
  state: EffectState,
  gameEvent: GameEvent,
  deps: TriggerDeps,
  rngState: RngState,
  depth = 0,
): TriggerResult {
  if (depth >= MAX_TRIGGER_DEPTH) {
    return {
      state,
      events: [
        {
          type: "recursionGuardTripped",
          payload: { event: gameEvent.event, subjectId: gameEvent.subjectId, depth },
        },
      ],
      nextRngState: rngState,
    };
  }

  let currentState = state;
  let currentRng = rngState;
  let allEvents: AppliedEvent[] = [];

  for (const [holderId, holder] of Object.entries(currentState.characters)) {
    if (!holder.alive) continue;
    const relation = relationOf(deps.teams, holderId, gameEvent.subjectId);
    const conditionState = { teams: deps.teams, turn: deps.turn, characters: currentState.characters };
    const conditionCtx = { selfId: holderId, sourceId: gameEvent.relatedId, targetId: gameEvent.subjectId };

    const reactiveEffectSources: { trigger: Trigger; condition?: Condition; effects: Effect[] }[] = [];

    if (holder.passiveId) {
      const passive = deps.passives[holder.passiveId];
      if (passive) reactiveEffectSources.push({ trigger: passive.trigger, condition: passive.condition, effects: passive.effects });
    }
    for (const active of holder.statuses) {
      const def = deps.statusLibrary[active.statusId];
      if (!def || def.effects.length === 0) continue;
      for (const trigger of def.triggerTiming) {
        reactiveEffectSources.push({ trigger, effects: def.effects });
      }
    }

    for (const source of reactiveEffectSources) {
      if (!matchesTrigger(source.trigger, gameEvent, relation)) continue;
      if (source.trigger.condition && !evaluateCondition(conditionState, source.trigger.condition, conditionCtx)) continue;
      if (source.condition && !evaluateCondition(conditionState, source.condition, conditionCtx)) continue;

      const effectTargetIds = source.trigger.effectTarget === "self" ? [holderId] : [gameEvent.subjectId];
      const result = applyEffect(
        currentState,
        { kind: "sequence", effects: source.effects },
        {
          sourceId: holderId,
          targetIds: effectTargetIds,
          teams: deps.teams,
          turn: deps.turn,
          statusLibrary: deps.statusLibrary,
          summonLibrary: deps.summonLibrary,
          transformationLibrary: deps.transformationLibrary,
          resourceLibrary: deps.resourceLibrary,
        },
        currentRng,
      );
      currentState = result.state;
      currentRng = result.nextRngState;
      allEvents = allEvents.concat(result.events);
    }
  }

  for (const derived of deriveGameEvents(allEvents)) {
    const nested = evaluateEvent(currentState, derived, deps, currentRng, depth + 1);
    currentState = nested.state;
    currentRng = nested.nextRngState;
    allEvents = allEvents.concat(nested.events);
  }

  return { state: currentState, events: allEvents, nextRngState: currentRng };
}
