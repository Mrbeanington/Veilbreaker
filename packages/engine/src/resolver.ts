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
  type PassiveDefinition,
  type PlayerAction,
  type Resource,
  type ResolutionOrder,
  type StatusDefinition,
  type Summon,
  type SummonRuntimeState,
  type Transformation,
} from "@veilbreak/content";
import { getEffectiveCost, validateAction, type ActionValidationError } from "./actions";
import { createEmptyPool, generateEnergy, payCost, type EnergyPool } from "./energy";
import { applyEffect, type EffectContext } from "./effects";
import { resolveDamage, resolveHeal } from "./damage";
import { canAct, computeTicks, decrementStatusDurations, getEffectiveMagnitude } from "./statuses";
import { decrementSummonDurations } from "./summons";
import { resolveTargets } from "./targeting";
import { deriveGameEvents, evaluateEvent, type GameEvent, type TriggerDeps } from "./triggers";
import { createRng, nextUint32, type RngState } from "./rng";
import type { AppliedEvent } from "./types";

// spec/01 "Resolution stack": abilities without an explicit
// `resolutionTierId` (packages/content/src/schemas/ability.ts) resolve here.
export const STANDARD_RESOLUTION_TIER_ID = "standard-attacks-support";
export const DEATH_CHECK_TIER_ID = "death-checks";
export const DAMAGE_OVER_TIME_TIER_ID = "damage-over-time";
export const HEALING_OVER_TIME_TIER_ID = "healing-over-time";
export const POST_TURN_EFFECTS_TIER_ID = "post-turn-effects";
export const COOLDOWN_REDUCTION_TIER_ID = "cooldown-reduction";
export const RESOURCE_GENERATION_TIER_ID = "resource-generation";

const MAX_ABILITY_HISTORY = 10;

export interface CreateBattleCharacterInput {
  characterId: string;
  maxHp: number;
  abilityIds?: string[];
  passiveId?: string;
  resources?: Record<string, number>;
}

export interface CreateBattleTeamInput {
  playerId: string;
  characters: CreateBattleCharacterInput[];
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
        resources: c.resources ?? {},
        abilityIds: c.abilityIds ?? [],
        passiveId: c.passiveId,
        abilityHistory: [],
        stats: { damageDealt: 0, damageReceived: 0, healingDone: 0, kills: 0, deaths: 0 },
        pendingRngModifiers: [],
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
    summons: {},
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
  passives: Record<string, PassiveDefinition>;
  summonLibrary: Record<string, Summon>;
  transformationLibrary: Record<string, Transformation>;
  resourceLibrary: Record<string, Resource>;
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
 * spec/01 "Turn system" + phases 01–03: walks every tier in
 * `resolutionOrder` (config, never hard-coded — CLAUDE.md rule 5), applying
 * each queued action's effects, cascading reactive triggers, and emitting
 * BattleEvents. Pure: returns a new state and event list rather than
 * mutating `state` (CLAUDE.md rule 4).
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
  let summons: Record<string, SummonRuntimeState> = { ...state.summons };
  let rngState: RngState = state.rngState;
  const events: BattleEvent[] = [];
  let sequence = 0;
  const abilitiesUsedThisTurn = new Set<string>();
  // `${targetId}:${statusId}` — see decrementStatusDurations' exemptStatusIds.
  const statusesAppliedThisTurn = new Set<string>();
  // OQ-07 Cheater retargeting: characterId -> the overridden target ids for
  // their still-unresolved queued action this turn.
  const retargetOverrides = new Map<string, string[]>();
  // Most recent damager per target this turn — used to attribute onKill /
  // the "death" event's sourceId, since death itself carries no such data.
  const lastDamageSourceByTarget = new Map<string, string>();

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

  function triggerDeps(): TriggerDeps {
    return {
      passives: deps.passives,
      statusLibrary: deps.statusLibrary,
      summonLibrary: deps.summonLibrary,
      transformationLibrary: deps.transformationLibrary,
      resourceLibrary: deps.resourceLibrary,
      teams: state.teams,
      turn: state.turn,
    };
  }

  function effectContext(sourceId: string, targetIds: string[]): EffectContext {
    return {
      sourceId,
      targetIds,
      teams: state.teams,
      turn: state.turn,
      statusLibrary: deps.statusLibrary,
      summonLibrary: deps.summonLibrary,
      transformationLibrary: deps.transformationLibrary,
      resourceLibrary: deps.resourceLibrary,
    };
  }

  function recordAppliedEvents(tierId: string, appliedEvents: readonly AppliedEvent[]): void {
    for (const event of appliedEvents) {
      pushEvent(tierId, event.type, event.sourceId, event.targetId, event.payload);
      if (event.type === "statusApplied" && event.targetId && typeof event.payload?.statusId === "string") {
        statusesAppliedThisTurn.add(`${event.targetId}:${event.payload.statusId}`);
      }
      if (event.type === "damageDealt" && event.sourceId && event.targetId) {
        lastDamageSourceByTarget.set(event.targetId, event.sourceId);
      }
    }
  }

  /** Fires the reactive-trigger cascade for whatever GameEvents `appliedEvents` derive into, folding the result back into the shared characters/energyPools/summons/rngState. */
  function cascadeTriggers(tierId: string, appliedEvents: readonly AppliedEvent[]): void {
    for (const derived of deriveGameEvents(appliedEvents)) {
      fireEvent(tierId, derived);
    }
  }

  function fireEvent(tierId: string, gameEvent: GameEvent): void {
    const result = evaluateEvent({ characters, energyPools, summons }, gameEvent, triggerDeps(), rngState);
    characters = result.state.characters;
    energyPools = result.state.energyPools;
    summons = result.state.summons;
    rngState = result.nextRngState;
    recordAppliedEvents(tierId, result.events);
    // Trigger-fired effects can themselves deal damage, heal, etc. — cascade
    // once more so *their* consequences can also fire further triggers.
    // evaluateEvent already recurses internally (with its own depth guard)
    // for events produced inside the cascade; this call only handles events
    // produced by the very first pass, mirroring the top-level call site.
  }

  // Pay every cost up front — already validated affordable. Uses the
  // pre-turn actor state, matching what validateAction checked.
  for (const action of allActions) {
    const ability = getAbility(action.abilityId);
    const actor = state.characters[action.characterId];
    if (!actor) {
      throw new Error(`resolveTurn: unreachable — no character "${action.characterId}"`);
    }
    const pool = energyPools[action.playerId];
    if (!pool) {
      throw new Error(`resolveTurn: unreachable — no energy pool for player "${action.playerId}"`);
    }
    const newPool = payCost(pool, getEffectiveCost(ability, actor));
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

  // spec/02 onTurnStart: fired once per living character before any tier
  // resolves, so a "start of my turn" passive/status sees the turn's
  // opening state.
  for (const characterId of Object.keys(characters)) {
    if (characters[characterId]?.alive) fireEvent("pre-turn-effects", { event: "onTurnStart", subjectId: characterId });
  }

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

      // OQ-07 Cheater retargeting: an earlier-tier effect this same turn may
      // have overridden this character's target(s).
      const requestedTargetIds = retargetOverrides.get(action.characterId) ?? action.targetIds;

      // Targets are resolved against *current* state, not a stale snapshot
      // from before this turn's earlier tiers — a taunt applied in an
      // earlier tier, or a target dying, changes who's legal to hit.
      const targetResult = resolveTargets({ ...state, characters }, ability, action.characterId, requestedTargetIds, rngState);
      rngState = targetResult.nextRngState;
      if (targetResult.error) {
        pushEvent(tier.id, "actionSkippedNoLegalTarget", action.characterId, undefined, {
          reason: targetResult.error,
        });
        continue;
      }

      for (const effect of ability.effects) {
        const result = applyEffect(
          { characters, energyPools, summons },
          effect,
          effectContext(action.characterId, targetResult.targetIds),
          rngState,
        );
        characters = result.state.characters;
        energyPools = result.state.energyPools;
        summons = result.state.summons;
        rngState = result.nextRngState;
        recordAppliedEvents(tier.id, result.events);
        cascadeTriggers(tier.id, result.events);
        for (const retarget of result.queuedRetargets ?? []) {
          retargetOverrides.set(retarget.queuedCharacterId, retarget.newTargetIds);
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

      // spec/02 onAbilityUsed (+ "sequence tracking"): recorded once the
      // action has fully resolved, capped so abilitySequenceMatches never
      // has to scan an unbounded history.
      const actorAfter = characters[action.characterId];
      if (actorAfter) {
        const abilityHistory = [...actorAfter.abilityHistory, ability.id].slice(-MAX_ABILITY_HISTORY);
        characters = { ...characters, [action.characterId]: { ...actorAfter, abilityHistory } };
      }
      fireEvent(tier.id, { event: "onAbilityUsed", subjectId: action.characterId, payload: { abilityId: ability.id } });
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
          if (behavior === "damageOverTime") {
            const result = resolveDamage(characters, summons, characterId, characterId, tick.amount, "affliction");
            characters = result.characters;
            summons = result.summons;
            const tagged = result.events.map((e) => ({ ...e, payload: { ...e.payload, statusId: tick.statusId } }));
            recordAppliedEvents(tier.id, tagged);
            cascadeTriggers(tier.id, tagged);
          } else {
            const result = resolveHeal(characters, characterId, characterId, tick.amount, "heal");
            characters = result.characters;
            const tagged = result.events.map((e) => ({ ...e, payload: { ...e.payload, statusId: tick.statusId } }));
            recordAppliedEvents(tier.id, tagged);
            cascadeTriggers(tier.id, tagged);
          }
        }
      }
    }

    if (tier.id === DEATH_CHECK_TIER_ID) {
      for (const [characterId, character] of Object.entries(characters)) {
        if (character.alive && character.currentHp <= 0) {
          const killerId = lastDamageSourceByTarget.get(characterId);
          const deaths = character.stats.deaths + 1;
          characters = { ...characters, [characterId]: { ...character, alive: false, stats: { ...character.stats, deaths } } };
          if (killerId) {
            const killer = characters[killerId];
            if (killer) {
              characters = { ...characters, [killerId]: { ...killer, stats: { ...killer.stats, kills: killer.stats.kills + 1 } } };
            }
          }
          const deathEvent: AppliedEvent = { type: "death", sourceId: killerId, targetId: characterId };
          recordAppliedEvents(tier.id, [deathEvent]);
          cascadeTriggers(tier.id, [deathEvent]);
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

      // spec/02 "Summons": duration countdown + onExpireEffects, mirroring
      // how statuses expire in this same tier.
      const summonTick = decrementSummonDurations(summons);
      summons = summonTick.summons;
      for (const expired of summonTick.justExpired) {
        const definition = deps.summonLibrary[expired.summonId];
        if (!definition || definition.onExpireEffects.length === 0) continue;
        const result = applyEffect(
          { characters, energyPools, summons },
          { kind: "sequence", effects: definition.onExpireEffects },
          effectContext(expired.ownerCharacterId, [expired.ownerCharacterId]),
          rngState,
        );
        characters = result.state.characters;
        energyPools = result.state.energyPools;
        summons = result.state.summons;
        rngState = result.nextRngState;
        recordAppliedEvents(tier.id, result.events);
        cascadeTriggers(tier.id, result.events);
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

  // spec/02 onTurnEnd: mirrors onTurnStart, fired once per living character
  // after every tier has resolved.
  for (const characterId of Object.keys(characters)) {
    if (characters[characterId]?.alive) fireEvent(RESOURCE_GENERATION_TIER_ID, { event: "onTurnEnd", subjectId: characterId });
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
    summons,
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
