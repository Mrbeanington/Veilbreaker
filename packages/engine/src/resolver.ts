import {
  COOLDOWN_INCREASE,
  COOLDOWN_REDUCTION,
  type Ability,
  type BattleEvent,
  type BattleState,
  type BattleTeam,
  type CharacterRuntimeState,
  type EnergyRules,
  type MatchFormat,
  type PlayerAction,
  type ResolutionOrder,
  type StatusDefinition,
} from "@veilbreak/content";
import { validateAction, type ActionValidationError } from "./actions";
import { createEmptyPool, generateEnergy, payCost, type EnergyPool } from "./energy";
import { applyEffect } from "./effects";
import { resolveDamage, resolveHeal } from "./damage";
import { canAct, computeTicks, decrementStatusDurations, getEffectiveMagnitude } from "./statuses";
import { resolveTargets } from "./targeting";
import { createRng, nextUint32, type RngState } from "./rng";

// spec/01 "Resolution stack": abilities without an explicit
// `resolutionTierId` (packages/content/src/schemas/ability.ts) resolve here.
export const STANDARD_RESOLUTION_TIER_ID = "standard-attacks-support";
export const DEATH_CHECK_TIER_ID = "death-checks";
export const DAMAGE_OVER_TIME_TIER_ID = "damage-over-time";
export const HEALING_OVER_TIME_TIER_ID = "healing-over-time";
export const POST_TURN_EFFECTS_TIER_ID = "post-turn-effects";
export const COOLDOWN_REDUCTION_TIER_ID = "cooldown-reduction";
export const RESOURCE_GENERATION_TIER_ID = "resource-generation";

export interface CreateBattleTeamInput {
  playerId: string;
  characters: { characterId: string; maxHp: number }[];
}

export interface CreateBattleConfig {
  balanceVersionId: string;
  matchFormat: MatchFormat;
  energyRules: EnergyRules;
  turnModel?: "simultaneous" | "alternating";
}

/**
 * spec/02 "Core models": builds a fresh BattleState for a new match.
 *
 * The resolution order (docs/spec/01-core-rules.md) puts "Resource
 * generation" second-to-last, right before "Next turn" — so a turn's energy
 * generation is really the *previous* turn's last act. Turn 1 has no
 * previous turn, so createBattle performs that one generation pass itself;
 * without it, OQ-03's "no energy on turn 1 for the initiative player" would
 * be vacuous, since *neither* player would have any turn-1 energy otherwise.
 */
export function createBattle(
  teamsInput: [CreateBattleTeamInput, CreateBattleTeamInput],
  seed: number,
  config: CreateBattleConfig,
): BattleState {
  const characters: Record<string, CharacterRuntimeState> = {};
  for (const teamInput of teamsInput) {
    for (const c of teamInput.characters) {
      characters[c.characterId] = {
        characterId: c.characterId,
        currentHp: c.maxHp,
        maxHp: c.maxHp,
        alive: true,
        cooldowns: {},
        statuses: [],
      };
    }
  }

  const teams: [BattleTeam, BattleTeam] = [
    { playerId: teamsInput[0].playerId, characterIds: teamsInput[0].characters.map((c) => c.characterId) },
    { playerId: teamsInput[1].playerId, characterIds: teamsInput[1].characters.map((c) => c.characterId) },
  ];

  // OQ-02: "Initiative alternates each turn (a coin-flip seeded from RNG
  // decides turn 1)."
  const coinFlip = nextUint32(createRng(seed));
  const initiativePlayerId = coinFlip.value % 2 === 0 ? teams[0].playerId : teams[1].playerId;

  let rngState = coinFlip.nextState;
  let energyPools: Record<string, EnergyPool> = {
    [teams[0].playerId]: createEmptyPool(),
    [teams[1].playerId]: createEmptyPool(),
  };
  for (const team of teams) {
    const generated = generateEnergy(
      createEmptyPool(),
      config.energyRules,
      {
        livingCharacterCount: team.characterIds.length,
        isInitiativePlayer: team.playerId === initiativePlayerId,
        isFirstTurn: true,
      },
      rngState,
    );
    energyPools = { ...energyPools, [team.playerId]: generated.pool };
    rngState = generated.nextRngState;
  }

  return {
    balanceVersionId: config.balanceVersionId,
    rngState,
    turn: 1,
    matchFormat: config.matchFormat,
    turnModel: config.turnModel ?? "simultaneous",
    teams,
    characters,
    energyPools,
    initiativePlayerId,
    eventLog: [],
  };
}

export interface ResolveTurnDeps {
  abilities: Record<string, Ability>;
  resolutionOrder: ResolutionOrder;
  energyRules: EnergyRules;
  statusLibrary: Record<string, StatusDefinition>;
}

export type ResolveTurnResult =
  | { ok: true; state: BattleState; events: BattleEvent[] }
  | { ok: false; errors: { action: PlayerAction; errors: ActionValidationError[] }[] };

function otherTeamOf(state: BattleState, playerId: string): BattleTeam {
  const other = state.teams.find((team) => team.playerId !== playerId);
  if (!other) {
    throw new Error(`resolveTurn: no team other than "${playerId}" — BattleState.teams must have exactly 2 entries`);
  }
  return other;
}

function teamOf(state: BattleState, playerId: string): BattleTeam {
  const team = state.teams.find((t) => t.playerId === playerId);
  if (!team) {
    throw new Error(`resolveTurn: unknown playerId "${playerId}"`);
  }
  return team;
}

/** OQ-09 "simultaneous team wipe": draw if both teams are fully dead, a win for whoever still has a living character otherwise, or null if the match continues. */
function checkTeamWipe(
  characters: Record<string, CharacterRuntimeState>,
  teams: [BattleTeam, BattleTeam],
): { outcome: "win" | "draw"; winnerPlayerId: string | null } | null {
  const isWiped = (team: BattleTeam) => team.characterIds.every((id) => !characters[id]?.alive);
  const [teamA, teamB] = teams;
  const aWiped = isWiped(teamA);
  const bWiped = isWiped(teamB);
  if (aWiped && bWiped) return { outcome: "draw", winnerPlayerId: null };
  if (aWiped) return { outcome: "win", winnerPlayerId: teamB.playerId };
  if (bWiped) return { outcome: "win", winnerPlayerId: teamA.playerId };
  return null;
}

/**
 * spec/01 "Turn system" + phase-01/02: walks every tier in
 * `resolutionOrder` (config, never hard-coded — CLAUDE.md rule 5), applying
 * each queued action's effects and emitting BattleEvents. Pure: returns a
 * new state and event list rather than mutating `state` (CLAUDE.md rule 4).
 */
export function resolveTurn(
  state: BattleState,
  actionsA: PlayerAction[],
  actionsB: PlayerAction[],
  deps: ResolveTurnDeps,
): ResolveTurnResult {
  const allActions = [...actionsA, ...actionsB];

  // spec: "an illegal action is rejected during planning, never silently
  // dropped mid-resolution" — validate everything before resolving anything.
  const validationFailures: { action: PlayerAction; errors: ActionValidationError[] }[] = [];
  for (const action of allActions) {
    const errors = validateAction(state, action, deps.abilities);
    if (errors.length > 0) validationFailures.push({ action, errors });
  }
  if (validationFailures.length > 0) {
    return { ok: false, errors: validationFailures };
  }

  function getAbility(abilityId: string): Ability {
    const ability = deps.abilities[abilityId];
    if (!ability) {
      // Unreachable: validateAction above already rejected unknown abilities.
      throw new Error(`resolveTurn: unreachable — ability "${abilityId}" passed validation but is unknown`);
    }
    return ability;
  }

  let characters = state.characters;
  let energyPools: Record<string, EnergyPool> = { ...state.energyPools };
  let rngState: RngState = state.rngState;
  const events: BattleEvent[] = [];
  let sequence = 0;
  const abilitiesUsedThisTurn = new Set<string>();
  // `${targetId}:${statusId}` — see decrementStatusDurations' exemptStatusIds.
  const statusesAppliedThisTurn = new Set<string>();

  function pushEvent(
    tierId: string,
    type: string,
    sourceId?: string,
    targetId?: string,
    payload: Record<string, unknown> = {},
  ): void {
    events.push({
      turn: state.turn,
      tierId,
      turnRelativeSequence: sequence,
      type,
      sourceId,
      targetId,
      payload,
      knowledgeLevel: "PUBLIC",
    });
    sequence += 1;
  }

  // Pay every cost up front — already validated affordable.
  for (const action of allActions) {
    const ability = getAbility(action.abilityId);
    const pool = energyPools[action.playerId];
    if (!pool) {
      throw new Error(`resolveTurn: unreachable — no energy pool for player "${action.playerId}"`);
    }
    const newPool = payCost(pool, ability.cost);
    if (!newPool) {
      throw new Error(`resolveTurn: unreachable — action for "${action.playerId}" passed affordability validation but payCost failed`);
    }
    energyPools = { ...energyPools, [action.playerId]: newPool };
  }

  // OQ-02: initiative player's actions resolve first within each tier, in
  // ally-slot order (1→3); then the other player's, same rule.
  function orderByTeamSlots(team: BattleTeam): PlayerAction[] {
    return team.characterIds
      .map((characterId) => allActions.find((action) => action.characterId === characterId))
      .filter((action): action is PlayerAction => action !== undefined);
  }
  const initiativeTeam = teamOf(state, state.initiativePlayerId);
  const nonInitiativeTeam = otherTeamOf(state, state.initiativePlayerId);
  const orderedActions = [...orderByTeamSlots(initiativeTeam), ...orderByTeamSlots(nonInitiativeTeam)];

  const tiers = [...deps.resolutionOrder.tiers].sort((a, b) => a.order - b.order);
  for (const tier of tiers) {
    const tierActions = orderedActions.filter((action) => {
      const ability = getAbility(action.abilityId);
      return (ability.resolutionTierId ?? STANDARD_RESOLUTION_TIER_ID) === tier.id;
    });

    for (const action of tierActions) {
      const actor = characters[action.characterId];
      if (!actor || !actor.alive) {
        pushEvent(tier.id, "actionSkippedActorNotAlive", action.characterId);
        continue;
      }
      // Stun/Silence may have been applied by an earlier tier this same
      // turn, so this is re-checked here, not just at planning time
      // (actions.ts) — the same reasoning as the alive check above.
      if (!canAct(actor)) {
        pushEvent(tier.id, "actionSkippedCannotAct", action.characterId);
        continue;
      }

      const ability = getAbility(action.abilityId);

      // Targets are resolved against *current* state, not a stale snapshot
      // from before this turn's earlier tiers — a taunt applied in an
      // earlier tier, or a target dying, changes who's legal to hit.
      const targetResult = resolveTargets(
        { ...state, characters },
        ability,
        action.characterId,
        action.targetIds,
        rngState,
      );
      rngState = targetResult.nextRngState;
      if (targetResult.error) {
        pushEvent(tier.id, "actionSkippedNoLegalTarget", action.characterId, undefined, {
          reason: targetResult.error,
        });
        continue;
      }

      for (const effect of ability.effects) {
        const result = applyEffect(
          { characters, energyPools },
          effect,
          {
            sourceId: action.characterId,
            targetIds: targetResult.targetIds,
            teams: state.teams,
            statusLibrary: deps.statusLibrary,
          },
          rngState,
        );
        characters = result.state.characters;
        energyPools = result.state.energyPools;
        rngState = result.nextRngState;
        for (const event of result.events) {
          pushEvent(tier.id, event.type, event.sourceId, event.targetId, event.payload);
          if (event.type === "statusApplied" && event.targetId && typeof event.payload?.statusId === "string") {
            statusesAppliedThisTurn.add(`${event.targetId}:${event.payload.statusId}`);
          }
        }
      }

      if (ability.cooldown > 0) {
        const updatedActor = characters[action.characterId];
        if (!updatedActor) {
          throw new Error(`resolveTurn: unreachable — actor "${action.characterId}" vanished mid-resolution`);
        }
        characters = {
          ...characters,
          [action.characterId]: {
            ...updatedActor,
            cooldowns: { ...updatedActor.cooldowns, [ability.id]: ability.cooldown },
          },
        };
        // A cooldown set THIS turn must not be reduced by this same turn's
        // cooldown-reduction tier below — otherwise "cooldown: N" would only
        // ever block N-1 turns (see docs/DECISIONS.md ADR-006).
        abilitiesUsedThisTurn.add(`${action.characterId}:${ability.id}`);
      }
    }

    if (tier.id === DAMAGE_OVER_TIME_TIER_ID || tier.id === HEALING_OVER_TIME_TIER_ID) {
      // spec/02 "DoT, HoT": which statuses tick, and by how much, is data
      // (StatusDefinition.tickBehavior + the active status's magnitude*stacks)
      // — never a hard-coded status id here. DoT ticks are unmitigated
      // ("affliction"): Bleed/Burn/Poison are meant to punish reliably
      // regardless of the target's defenses (see docs/DECISIONS.md).
      const behavior = tier.id === DAMAGE_OVER_TIME_TIER_ID ? "damageOverTime" : "healOverTime";
      for (const [characterId, character] of Object.entries(characters)) {
        if (!character.alive) continue;
        for (const tick of computeTicks(character, deps.statusLibrary, behavior)) {
          if (tick.amount <= 0) continue;
          const result =
            behavior === "damageOverTime"
              ? resolveDamage(characters, characterId, characterId, tick.amount, "affliction")
              : resolveHeal(characters, characterId, characterId, tick.amount, "heal");
          characters = result.characters;
          for (const event of result.events) {
            pushEvent(tier.id, event.type, event.sourceId, event.targetId, {
              ...event.payload,
              statusId: tick.statusId,
            });
          }
        }
      }
    }

    if (tier.id === DEATH_CHECK_TIER_ID) {
      for (const [characterId, character] of Object.entries(characters)) {
        if (character.alive && character.currentHp <= 0) {
          characters = { ...characters, [characterId]: { ...character, alive: false } };
          pushEvent(tier.id, "death", undefined, characterId);
        }
      }
    }

    if (tier.id === POST_TURN_EFFECTS_TIER_ID) {
      for (const [characterId, character] of Object.entries(characters)) {
        const exempt = new Set(
          character.statuses
            .map((s) => s.statusId)
            .filter((statusId) => statusesAppliedThisTurn.has(`${characterId}:${statusId}`)),
        );
        characters = { ...characters, [characterId]: decrementStatusDurations(character, exempt) };
      }
    }

    if (tier.id === COOLDOWN_REDUCTION_TIER_ID) {
      for (const [characterId, character] of Object.entries(characters)) {
        // spec/02 Cooldown Increase/Reduction: each stack shifts the normal
        // 1-per-turn decrement up or down; it can't go negative (cooldowns
        // never count *up* on their own).
        const speedUp = getEffectiveMagnitude(character, COOLDOWN_REDUCTION.id);
        const slowDown = getEffectiveMagnitude(character, COOLDOWN_INCREASE.id);
        const decrementAmount = Math.max(0, 1 + speedUp - slowDown);
        const reducedCooldowns: Record<string, number> = {};
        for (const [abilityId, turnsRemaining] of Object.entries(character.cooldowns)) {
          const wasJustSet = abilitiesUsedThisTurn.has(`${characterId}:${abilityId}`);
          reducedCooldowns[abilityId] = wasJustSet
            ? turnsRemaining
            : Math.max(0, turnsRemaining - decrementAmount);
        }
        characters = { ...characters, [characterId]: { ...character, cooldowns: reducedCooldowns } };
      }
    }

    if (tier.id === RESOURCE_GENERATION_TIER_ID) {
      for (const team of state.teams) {
        const livingCharacterCount = team.characterIds.filter(
          (characterId) => characters[characterId]?.alive,
        ).length;
        const pool = energyPools[team.playerId];
        if (!pool) {
          throw new Error(`resolveTurn: unreachable — no energy pool for player "${team.playerId}"`);
        }
        const generated = generateEnergy(
          pool,
          deps.energyRules,
          {
            livingCharacterCount,
            isInitiativePlayer: team.playerId === state.initiativePlayerId,
            isFirstTurn: state.turn === 1,
          },
          rngState,
        );
        energyPools = { ...energyPools, [team.playerId]: generated.pool };
        rngState = generated.nextRngState;
      }
    }
  }

  // OQ-09 "simultaneous team wipe": checked once, using the final state
  // after every tier has run. Takes precedence over the max-turn tiebreak
  // below — if the match already ended by wipe, it didn't also run out the
  // clock.
  const wipeResult = checkTeamWipe(characters, state.teams);
  if (wipeResult) {
    pushEvent(
      DEATH_CHECK_TIER_ID,
      wipeResult.outcome === "draw" ? "matchEndedInDraw" : "matchEndedByTeamWipe",
      undefined,
      undefined,
      { winnerPlayerId: wipeResult.winnerPlayerId },
    );
  }

  const nextTurn = state.turn + 1;
  const nextInitiativePlayerId = otherTeamOf(state, state.initiativePlayerId).playerId;

  let nextState: BattleState = {
    ...state,
    turn: nextTurn,
    characters,
    energyPools,
    rngState,
    initiativePlayerId: nextInitiativePlayerId,
    eventLog: [...state.eventLog, ...events],
  };

  // OQ-14: "40 turns; then the team with the higher total remaining HP
  // percentage wins; if tied, draw."
  if (!wipeResult && nextTurn > state.matchFormat.maxTurns) {
    const hpPercent = (team: BattleTeam): number => {
      let currentTotal = 0;
      let maxTotal = 0;
      for (const characterId of team.characterIds) {
        const character = characters[characterId];
        if (!character) continue;
        currentTotal += character.currentHp;
        maxTotal += character.maxHp;
      }
      return maxTotal === 0 ? 0 : currentTotal / maxTotal;
    };
    const [teamA, teamB] = state.teams;
    const percentA = hpPercent(teamA);
    const percentB = hpPercent(teamB);
    const winnerPlayerId = percentA === percentB ? null : percentA > percentB ? teamA.playerId : teamB.playerId;
    nextState = {
      ...nextState,
      eventLog: [
        ...nextState.eventLog,
        {
          turn: state.turn,
          tierId: RESOURCE_GENERATION_TIER_ID,
          turnRelativeSequence: sequence,
          type: "matchEndedByTurnLimit",
          payload: { winnerPlayerId, teamAHpPercent: percentA, teamBHpPercent: percentB },
          knowledgeLevel: "PUBLIC",
        },
      ],
    };
    sequence += 1;
  }

  return { ok: true, state: nextState, events };
}
