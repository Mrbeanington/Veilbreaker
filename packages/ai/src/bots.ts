import { resolveTurn, type BattleState, type EnergyPool, type PlayerAction, type ResolveTurnDeps } from "@veilbreak/engine";
import { enemyPlayerId, legalCandidates, teamCharacterIds, tryPay, type Candidate } from "./candidates";
import { evaluateState } from "./evaluate";
import { scoreCandidate } from "./heuristics";
import { pickOne, type Random } from "./prng";

// spec/06 "AI": the bot ladder. BEGINNER plays random legal actions;
// INTERMEDIATE scores each action with data-driven heuristics (kills, control,
// defense timing, energy thrift); ADVANCED and EXPERT run a lookahead over real
// engine turns (resolveTurn is pure, so "cloning" the state is just calling it)
// against modelled opponent plans, within a time budget. LEGEND_BOSS is only a
// framework: PvE rule-bending hooks around the EXPERT search.

export const BOT_LEVELS = ["BEGINNER", "INTERMEDIATE", "ADVANCED", "EXPERT", "LEGEND_BOSS"] as const;
export type BotLevel = (typeof BOT_LEVELS)[number];

/** PvE-only rule bending for a Legend boss. Nothing is bent by default; hooks are how a future boss encounter would cheat. */
export interface LegendBossHooks {
  /** May rewrite the state the boss plans against (e.g. grant bonus energy in the planning copy). */
  prepareState?(state: BattleState, playerId: string): BattleState;
  /** May rewrite the boss's chosen actions (e.g. add an extra action). They must still pass engine validation. */
  adjustActions?(state: BattleState, playerId: string, actions: PlayerAction[]): PlayerAction[];
}

export interface BotContext {
  deps: ResolveTurnDeps;
  random: Random;
  /** Wall-clock budget for one decision. Omit for a fixed, deterministic amount of search (what the simulator uses). */
  budgetMs?: number;
  now?: () => number;
  boss?: LegendBossHooks;
}

interface SearchConfig {
  plans: number;
  opponentSamples: number;
  secondPly: boolean;
}
const SEARCH: Record<"ADVANCED" | "EXPERT", SearchConfig> = {
  ADVANCED: { plans: 8, opponentSamples: 1, secondPly: false },
  EXPERT: { plans: 14, opponentSamples: 2, secondPly: true },
};

const candidateCache = new WeakMap<BattleState, Map<string, Candidate[]>>();
function candidatesFor(state: BattleState, playerId: string, characterId: string, ctx: BotContext): Candidate[] {
  let byCharacter = candidateCache.get(state);
  if (!byCharacter) {
    byCharacter = new Map();
    candidateCache.set(state, byCharacter);
  }
  const hit = byCharacter.get(characterId);
  if (hit) return hit;
  const fresh = legalCandidates(state, playerId, characterId, ctx.deps.abilities);
  byCharacter.set(characterId, fresh);
  return fresh;
}

/** One action per living character, chosen by `choose`, keeping the whole plan affordable from the shared pool. */
function buildPlan(
  state: BattleState,
  playerId: string,
  ctx: BotContext,
  choose: (state: BattleState, options: Candidate[]) => Candidate | undefined,
): PlayerAction[] {
  let pool: EnergyPool | undefined = state.energyPools[playerId];
  if (!pool) return [];
  const actions: PlayerAction[] = [];
  for (const characterId of teamCharacterIds(state, playerId)) {
    const options: Candidate[] = [];
    for (const c of candidatesFor(state, playerId, characterId, ctx)) {
      if (tryPay(state, playerId, pool, c)) options.push(c);
    }
    const picked = choose(state, options);
    if (!picked) continue;
    const paid = tryPay(state, playerId, pool, picked);
    if (!paid) continue;
    pool = paid;
    actions.push(picked.action);
  }
  return actions;
}

export function planRandom(state: BattleState, playerId: string, ctx: BotContext): PlayerAction[] {
  return buildPlan(state, playerId, ctx, (_s, options) => pickOne(options, ctx.random));
}

export function planHeuristic(state: BattleState, playerId: string, ctx: BotContext, noise = 0): PlayerAction[] {
  return buildPlan(state, playerId, ctx, (s, options) => {
    let best: Candidate | undefined;
    let bestScore = -Infinity;
    for (const c of options) {
      const score = scoreCandidate(s, c, noise, ctx.random);
      if (score > bestScore) {
        best = c;
        bestScore = score;
      }
    }
    return best;
  });
}

function isOver(state: BattleState): boolean {
  return state.teams.some((t) => t.characterIds.every((id) => !state.characters[id]?.alive));
}

function planLookahead(state: BattleState, playerId: string, ctx: BotContext, cfg: SearchConfig): PlayerAction[] {
  const now = ctx.now ?? Date.now;
  const deadline = ctx.budgetMs === undefined ? Infinity : now() + ctx.budgetMs;
  const foe = enemyPlayerId(state, playerId);

  const foePlans: PlayerAction[][] = [planHeuristic(state, foe, ctx, 0)];
  for (let i = 0; i < cfg.opponentSamples - 1; i += 1) foePlans.push(planHeuristic(state, foe, ctx, 25));

  let best: PlayerAction[] = planHeuristic(state, playerId, ctx, 0);
  let bestScore = -Infinity;
  const seen = new Set<string>();

  for (let k = 0; k < cfg.plans; k += 1) {
    if (k > 0 && now() > deadline) break;
    const mine = k === 0 ? best : planHeuristic(state, playerId, ctx, 12 + k * 4);
    const key = JSON.stringify(mine);
    if (seen.has(key)) continue;
    seen.add(key);

    let total = 0;
    let counted = 0;
    for (const theirs of foePlans) {
      const first = resolveTurn(state, mine, theirs, ctx.deps);
      if (!first.ok) continue;
      let score = evaluateState(first.state, playerId);
      if (cfg.secondPly && !isOver(first.state)) {
        const next = resolveTurn(
          first.state,
          planHeuristic(first.state, playerId, ctx, 0),
          planHeuristic(first.state, foe, ctx, 0),
          ctx.deps,
        );
        if (next.ok) score = score * 0.4 + evaluateState(next.state, playerId) * 0.6;
      }
      total += score;
      counted += 1;
    }
    if (counted === 0) continue;
    const average = total / counted;
    if (average > bestScore) {
      bestScore = average;
      best = mine;
    }
  }
  return best;
}

/** Chooses one action per living character for `playerId`. Always returns a plan the engine will accept. */
export function decideActions(level: BotLevel, state: BattleState, playerId: string, ctx: BotContext): PlayerAction[] {
  switch (level) {
    case "BEGINNER":
      return planRandom(state, playerId, ctx);
    case "INTERMEDIATE":
      return planHeuristic(state, playerId, ctx, 4);
    case "ADVANCED":
      return planLookahead(state, playerId, ctx, SEARCH.ADVANCED);
    case "EXPERT":
      return planLookahead(state, playerId, ctx, SEARCH.EXPERT);
    case "LEGEND_BOSS": {
      const planning = ctx.boss?.prepareState?.(state, playerId) ?? state;
      const actions = planLookahead(planning, playerId, ctx, SEARCH.EXPERT);
      return ctx.boss?.adjustActions?.(state, playerId, actions) ?? actions;
    }
  }
}
