import type { BattleTeam, CharacterRuntimeState, Condition, TargetRef } from "@veilbreak/content";
import { hasStatus } from "./statuses";

// phase-03-advanced-systems.md "Triggers and Conditions". A Condition is
// evaluated relative to whichever character it's attached to (`selfId`) and,
// for a reactive trigger, the event's other participants (`sourceId` —
// whoever caused the event; `targetId` — who else it involved). "ally"/
// "enemy" resolve to the first living teammate/opponent of `selfId` — a
// simple, deterministic pick rather than "any"/"all" semantics, since these
// Condition variants ask about ONE character, not a set (docs/DECISIONS.md).
export interface ConditionContext {
  selfId: string;
  sourceId?: string;
  targetId?: string;
}

// A structural subset of BattleState — every field evaluateCondition
// actually reads. triggers.ts evaluates conditions against an
// in-progress EffectState (characters + energyPools + summons, no `turn` or
// `eventLog`), so it builds one of these directly instead of needing a full
// BattleState. A real BattleState satisfies this shape too, unchanged.
export interface ConditionState {
  teams: [BattleTeam, BattleTeam];
  turn: number;
  characters: Record<string, CharacterRuntimeState>;
}

function resolveTargetRef(state: ConditionState, ctx: ConditionContext, ref: TargetRef): string | undefined {
  switch (ref) {
    case "self":
      return ctx.selfId;
    case "source":
      return ctx.sourceId;
    case "target":
      return ctx.targetId;
    case "any":
      return ctx.selfId;
    case "ally": {
      const team = state.teams.find((t) => t.characterIds.includes(ctx.selfId));
      return team?.characterIds.find((id) => id !== ctx.selfId && state.characters[id]?.alive);
    }
    case "enemy": {
      const team = state.teams.find((t) => t.characterIds.includes(ctx.selfId));
      const enemyTeam = state.teams.find((t) => t !== team);
      return enemyTeam?.characterIds.find((id) => state.characters[id]?.alive);
    }
  }
}

export function evaluateCondition(state: ConditionState, condition: Condition, ctx: ConditionContext): boolean {
  switch (condition.type) {
    case "always":
      return true;

    case "hpBelowPercent": {
      const character = resolveCharacter(state, ctx, condition.target);
      if (!character) return false;
      return (character.currentHp / character.maxHp) * 100 < condition.percent;
    }

    case "hasStatus": {
      const character = resolveCharacter(state, ctx, condition.target);
      return character ? hasStatus(character, condition.statusId) : false;
    }

    case "hasTag": {
      const character = resolveCharacter(state, ctx, condition.target);
      return character ? (character.tags ?? []).includes(condition.tag) : false;
    }

    case "resourceAtLeast": {
      const character = resolveCharacter(state, ctx, condition.target);
      return character ? (character.resources[condition.resourceId] ?? 0) >= condition.amount : false;
    }

    case "turnAtLeast":
      return state.turn >= condition.turn;

    case "damageReceivedAtLeast": {
      const character = resolveCharacter(state, ctx, condition.target);
      return character ? character.stats.damageReceived >= condition.amount : false;
    }

    case "damageDealtAtLeast": {
      const character = resolveCharacter(state, ctx, condition.target);
      return character ? character.stats.damageDealt >= condition.amount : false;
    }

    case "healingDoneAtLeast": {
      const character = resolveCharacter(state, ctx, condition.target);
      return character ? character.stats.healingDone >= condition.amount : false;
    }

    case "deathCountAtLeast": {
      const character = resolveCharacter(state, ctx, condition.target);
      return character ? character.stats.deaths >= condition.count : false;
    }

    case "killCountAtLeast": {
      const character = resolveCharacter(state, ctx, condition.target);
      return character ? character.stats.kills >= condition.count : false;
    }

    case "teamComposition": {
      const selfTeam = state.teams.find((t) => t.characterIds.includes(ctx.selfId));
      const relevantTeam = condition.side === "ally" ? selfTeam : state.teams.find((t) => t !== selfTeam);
      if (!relevantTeam) return false;
      return condition.characterIds.every((id) => relevantTeam.characterIds.includes(id));
    }

    case "usedAbilityLastTurn": {
      const character = resolveCharacter(state, ctx, condition.target);
      if (!character || character.abilityHistory.length === 0) return false;
      return character.abilityHistory[character.abilityHistory.length - 1] === condition.abilityId;
    }

    case "abilitySequenceMatches": {
      const character = resolveCharacter(state, ctx, condition.target);
      if (!character) return false;
      const recent = character.abilityHistory.slice(-condition.sequence.length);
      if (recent.length !== condition.sequence.length) return false;
      return recent.every((abilityId, i) => abilityId === condition.sequence[i]);
    }

    case "repeatedAbility": {
      const character = resolveCharacter(state, ctx, condition.target);
      const history = character?.abilityHistory ?? [];
      return history.length >= 2 && history[history.length - 1] === history[history.length - 2];
    }

    case "secretScript":
      // No secret scripts are registered in docs/DECISIONS.md's Custom
      // script registry yet — always false until one is added and justified
      // (CLAUDE.md rule 3).
      return false;

    case "not":
      return !evaluateCondition(state, condition.condition, ctx);

    case "and":
      return condition.conditions.every((c) => evaluateCondition(state, c, ctx));

    case "or":
      return condition.conditions.some((c) => evaluateCondition(state, c, ctx));
  }
}

function resolveCharacter(state: ConditionState, ctx: ConditionContext, ref: TargetRef) {
  const id = resolveTargetRef(state, ctx, ref);
  return id ? state.characters[id] : undefined;
}
