import { TAUNT, UNTARGETABLE, type Ability, type BattleState, type BattleTeam, type TargetRule } from "@veilbreak/content";
import { hasStatus } from "./statuses";
import { pickRandom, type RngState } from "./rng";

export interface ResolveTargetsResult {
  targetIds: string[];
  nextRngState: RngState;
  error?: string;
}

function teamOf(state: BattleState, characterId: string): BattleTeam | undefined {
  return state.teams.find((team) => team.characterIds.includes(characterId));
}

interface CandidatePool {
  ids: string[];
  /** True when `ids` was narrowed down to taunter(s) only — see resolveTargets' "single" handling: a taunt redirects the attack, it doesn't make the action illegal. */
  forcedByTaunt: boolean;
}

/**
 * spec/02 "TargetRule evaluation": every character this ability could
 * legally target, before scope narrows it down to which/how-many — alive,
 * on the right side, not untargetable, and forced down to any taunter(s) on
 * the enemy side.
 */
function candidatePool(state: BattleState, actorId: string, target: TargetRule): CandidatePool {
  if (target.side === "self") {
    return { ids: [actorId], forcedByTaunt: false };
  }

  const actorTeam = teamOf(state, actorId);
  if (!actorTeam) return { ids: [], forcedByTaunt: false };

  let pool: string[];
  if (target.side === "ally") {
    pool = actorTeam.characterIds.filter((id) => target.includeSelf || id !== actorId);
  } else if (target.side === "enemy") {
    const enemyTeam = state.teams.find((team) => team !== actorTeam);
    pool = enemyTeam ? [...enemyTeam.characterIds] : [];
  } else {
    pool = state.teams.flatMap((team) => team.characterIds).filter((id) => target.includeSelf || id !== actorId);
  }

  pool = pool.filter((id) => state.characters[id]?.alive);

  // Untargetable filtering never excludes targeting yourself.
  pool = pool.filter((id) => {
    if (id === actorId) return true;
    const character = state.characters[id];
    return !character || !hasStatus(character, UNTARGETABLE.id);
  });

  // Taunt override: on the enemy side, a taunting character forces every
  // other candidate out of the pool.
  let forcedByTaunt = false;
  if (target.side === "enemy" || target.side === "any") {
    const taunters = pool.filter((id) => {
      const character = state.characters[id];
      return character && !isOnActorTeam(state, actorId, id) && hasStatus(character, TAUNT.id);
    });
    if (taunters.length > 0) {
      pool = taunters;
      forcedByTaunt = true;
    }
  }

  return { ids: pool, forcedByTaunt };
}

function isOnActorTeam(state: BattleState, actorId: string, candidateId: string): boolean {
  const actorTeam = teamOf(state, actorId);
  const candidateTeam = teamOf(state, candidateId);
  return !!actorTeam && actorTeam === candidateTeam;
}

function selectByScope(
  state: BattleState,
  candidates: CandidatePool,
  target: TargetRule,
  explicitTargetIds: string[],
  rngState: RngState,
): ResolveTargetsResult {
  const pool = candidates.ids;
  switch (target.scope) {
    case "single": {
      // A taunt redirects the attack onto the taunter regardless of what was
      // explicitly selected — it doesn't make the action illegal. (If it did,
      // Taunt would make the taunter's team immune to being attacked at all,
      // rather than forcing attacks onto its own tank.)
      if (candidates.forcedByTaunt) {
        return { targetIds: pool.slice(0, target.count), nextRngState: rngState };
      }
      if (explicitTargetIds.length === 0) {
        return { targetIds: [], nextRngState: rngState, error: "no target selected" };
      }
      const chosen = explicitTargetIds.slice(0, target.count);
      const illegal = chosen.filter((id) => !pool.includes(id));
      if (illegal.length > 0) {
        return { targetIds: [], nextRngState: rngState, error: `illegal target(s): ${illegal.join(", ")}` };
      }
      return { targetIds: chosen, nextRngState: rngState };
    }

    case "all":
      return { targetIds: pool, nextRngState: rngState };

    case "random": {
      let remaining = [...pool];
      let state2 = rngState;
      const chosen: string[] = [];
      for (let i = 0; i < target.count && remaining.length > 0; i++) {
        const draw = pickRandom(state2, remaining);
        chosen.push(draw.value);
        remaining = remaining.filter((id) => id !== draw.value);
        state2 = draw.nextState;
      }
      return { targetIds: chosen, nextRngState: state2 };
    }

    case "lowestHp":
    case "highestHp": {
      const sorted = [...pool].sort((a, b) => {
        const hpA = state.characters[a]?.currentHp ?? 0;
        const hpB = state.characters[b]?.currentHp ?? 0;
        if (hpA !== hpB) return target.scope === "lowestHp" ? hpA - hpB : hpB - hpA;
        return a.localeCompare(b); // deterministic tie-break
      });
      return { targetIds: sorted.slice(0, target.count), nextRngState: rngState };
    }

    case "adjacent":
      throw new Error('resolveTargets: TargetRule.scope "adjacent" is not implemented until a later phase');
  }
}

export function resolveTargets(
  state: BattleState,
  ability: Ability,
  actorId: string,
  explicitTargetIds: string[],
  rngState: RngState,
): ResolveTargetsResult {
  const candidates = candidatePool(state, actorId, ability.target);
  if (candidates.ids.length === 0) {
    return { targetIds: [], nextRngState: rngState, error: "no legal targets available" };
  }
  return selectByScope(state, candidates, ability.target, explicitTargetIds, rngState);
}
