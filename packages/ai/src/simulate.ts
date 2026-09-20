import {
  PLAYABLE_CHARACTERS,
  RESOURCE_LIBRARY,
  defaultMatchFormat,
  defaultResolutionOrder,
  defaultResourcesFor,
  baseLibraries,
  type BalanceLibraries,
  type CharacterDefinition,
} from "@veilbreak/content";
import {
  canAct,
  createBattle,
  resolveTurn,
  type BattleState,
  type CreateBattleTeamInput,
  type PlayerAction,
  type ResolveTurnDeps,
} from "@veilbreak/engine";
import { BOT_LEVELS, decideActions, type BotContext, type BotLevel } from "./bots";
import { legalCandidates } from "./candidates";
import { createRandom, shuffled, type Random } from "./prng";

// spec/07 "Balance simulation" + phase-07: a headless bot-vs-bot simulator.
// Pure TypeScript with no Node or DOM APIs, so the same code runs in the dev
// CLI (packages/ai/scripts/sim.ts) and could run inside a browser Worker.

export function defaultSimDeps(libs: BalanceLibraries = baseLibraries()): ResolveTurnDeps {
  return {
    abilities: libs.abilities,
    resolutionOrder: defaultResolutionOrder,
    energyRules: libs.energyRules,
    statusLibrary: libs.statuses,
    passives: libs.passives,
    summonLibrary: libs.summons,
    transformationLibrary: libs.transformations,
    resourceLibrary: RESOURCE_LIBRARY,
  };
}

/** The playable characters as they are under `libs` (phase-12: a balance draft changes their numbers). */
export function playablePool(libs: BalanceLibraries): CharacterDefinition[] {
  return PLAYABLE_CHARACTERS.map((c) => libs.characters[c.id] ?? c);
}

export function teamInput(playerId: string, characters: readonly CharacterDefinition[]): CreateBattleTeamInput {
  return {
    playerId,
    characters: characters.map((c) => ({
      characterId: c.id,
      maxHp: c.baseHp,
      abilityIds: c.abilityIds,
      passiveId: c.passiveId,
      tags: c.tags,
      resources: defaultResourcesFor(c),
    })),
  };
}

/** Degenerate-pattern detector ids (phase-07 "Degenerate-pattern detectors"). */
export const DETECTORS = [
  "turn-limit",
  "state-loop",
  "perpetual-stun",
  "energy-lockout",
  "one-turn-kill",
  "resurrection-loop",
  "rewind-loop",
  "illegal-bot-action",
  "engine-error",
  "stalled",
] as const;
export type DetectorId = (typeof DETECTORS)[number];

export interface DetectorHit {
  detector: DetectorId;
  detail: string;
}

export type MatchWinner = "playerA" | "playerB" | "draw";

export interface MatchRecord {
  seed: number;
  teamA: string[];
  teamB: string[];
  winner: MatchWinner;
  endedBy: "wipe" | "draw" | "turn-limit" | "error";
  turns: number;
  firstInitiative: string;
  rewinds: number;
  hits: DetectorHit[];
  error?: string;
}

export interface MatchConfig {
  deps: ResolveTurnDeps;
  botA: BotLevel;
  botB: BotLevel;
  /** Per-decision time budget; omit for deterministic, fixed-size searches (the CLI default). */
  budgetMs?: number;
  now?: () => number;
  /** Diagnostics: called when a team has had no legal action for the lockout limit (phase-15). */
  onLockout?: (state: BattleState, playerId: string) => void;
}

const STUN_STREAK_LIMIT = 5;
const LOCKOUT_STREAK_LIMIT = 3;
const RESURRECTION_LIMIT = 2;
const LOOP_REPEAT_LIMIT = 3;

/** Everything about a position that matters for "have we been here before", ignoring the turn counter and the log. */
function positionKey(state: BattleState): string {
  return JSON.stringify([state.characters, state.energyPools, state.summons, state.initiativePlayerId]);
}

function matchEnd(events: readonly { type: string; payload?: Record<string, unknown> }[]): { type: string; winner: MatchWinner } | null {
  for (const e of events) {
    if (e.type === "matchEndedInDraw") return { type: e.type, winner: "draw" };
    if (e.type === "matchEndedByTeamWipe" || e.type === "matchEndedByTurnLimit") {
      const w = e.payload?.winnerPlayerId;
      return { type: e.type, winner: w === "playerA" ? "playerA" : w === "playerB" ? "playerB" : "draw" };
    }
  }
  return null;
}

export function runMatch(
  config: MatchConfig,
  seed: number,
  teamA: readonly CharacterDefinition[],
  teamB: readonly CharacterDefinition[],
  random: Random,
): MatchRecord {
  const record: MatchRecord = {
    seed,
    teamA: teamA.map((c) => c.id),
    teamB: teamB.map((c) => c.id),
    winner: "draw",
    endedBy: "turn-limit",
    turns: 0,
    firstInitiative: "",
    rewinds: 0,
    hits: [],
  };
  const hit = (detector: DetectorId, detail: string): void => {
    if (!record.hits.some((h) => h.detector === detector && h.detail === detail)) record.hits.push({ detector, detail });
  };

  const nameless = [...teamA, ...teamB].filter((c) => c.passiveId === "passive.the-nameless-one.not-yet-written").length;
  const stunStreak = new Map<string, number>();
  const lockoutStreak: Record<string, number> = { playerA: 0, playerB: 0 };
  const positions = new Map<string, number>();
  let resurrections = 0;

  try {
    let state = createBattle([teamInput("playerA", teamA), teamInput("playerB", teamB)], seed, {
      balanceVersionId: "sim",
      matchFormat: defaultMatchFormat,
      energyRules: config.deps.energyRules,
    });
    record.firstInitiative = state.initiativePlayerId;
    const ctxBase = { deps: config.deps, random, budgetMs: config.budgetMs, now: config.now } satisfies Omit<BotContext, "boss">;
    const safety = defaultMatchFormat.maxTurns * 3 + 10;

    for (let step = 0; step < safety; step += 1) {
      // --- detectors that look at the position before the turn is planned
      const key = positionKey(state);
      const seen = (positions.get(key) ?? 0) + 1;
      positions.set(key, seen);
      if (seen === LOOP_REPEAT_LIMIT) hit("state-loop", `identical position ${seen} times by turn ${state.turn}`);

      for (const team of state.teams) {
        let anyLegal = false;
        let anyAlive = false;
        for (const id of team.characterIds) {
          const c = state.characters[id];
          if (!c?.alive) continue;
          anyAlive = true;
          const stunned = !canAct(c);
          const streak = stunned ? (stunStreak.get(id) ?? 0) + 1 : 0;
          stunStreak.set(id, streak);
          if (streak === STUN_STREAK_LIMIT) hit("perpetual-stun", `${id} unable to act for ${streak} turns (turn ${state.turn})`);
          if (legalCandidates(state, team.playerId, id, config.deps.abilities).length > 0) anyLegal = true;
        }
        const lock = anyAlive && !anyLegal ? (lockoutStreak[team.playerId] ?? 0) + 1 : 0;
        lockoutStreak[team.playerId] = lock;
        if (lock === LOCKOUT_STREAK_LIMIT) {
          hit("energy-lockout", `${team.playerId} had no legal action for ${lock} turns (turn ${state.turn})`);
          config.onLockout?.(state, team.playerId);
        }
      }

      const plans: Record<string, PlayerAction[]> = {
        playerA: decideActions(config.botA, state, "playerA", { ...ctxBase }),
        playerB: decideActions(config.botB, state, "playerB", { ...ctxBase }),
      };
      let result = resolveTurn(state, plans.playerA ?? [], plans.playerB ?? [], config.deps);
      if (!result.ok) {
        hit("illegal-bot-action", result.errors.map((e) => `${e.action.abilityId}:${e.errors.map((x) => x.code).join("+")}`).join(", "));
        const bad = new Set(result.errors.map((e) => e.action));
        result = resolveTurn(
          state,
          (plans.playerA ?? []).filter((a) => !bad.has(a)),
          (plans.playerB ?? []).filter((a) => !bad.has(a)),
          config.deps,
        );
        if (!result.ok) throw new Error("bot produced unrecoverable illegal actions");
      }

      const before = state;
      state = result.state;
      const rewound = result.events.some((e) => e.type === "turnRewound");
      if (rewound) {
        record.rewinds += 1;
        if (record.rewinds > nameless) hit("rewind-loop", `${record.rewinds} rewinds with ${nameless} Nameless One(s)`);
      } else {
        record.turns += 1;
        for (const e of result.events) {
          if (e.type === "death" && e.targetId) {
            const c = before.characters[e.targetId];
            if (c && c.currentHp === c.maxHp) hit("one-turn-kill", `${e.targetId} killed from full health on turn ${before.turn}`);
          }
        }
      }
      resurrections += result.events.filter((e) => e.type === "resurrected").length;
      if (resurrections > RESURRECTION_LIMIT) hit("resurrection-loop", `${resurrections} resurrections`);

      const end = matchEnd(result.events) ?? matchEnd(state.eventLog.slice(-3));
      if (end) {
        record.winner = end.winner;
        record.endedBy = end.type === "matchEndedInDraw" ? "draw" : end.type === "matchEndedByTurnLimit" ? "turn-limit" : "wipe";
        if (record.endedBy === "turn-limit") hit("turn-limit", `reached turn ${state.turn}`);
        return record;
      }
    }
    hit("stalled", `no result after ${safety} steps`);
    record.endedBy = "turn-limit";
  } catch (error) {
    record.endedBy = "error";
    record.error = error instanceof Error ? `${error.message}` : String(error);
    hit("engine-error", record.error);
  }
  return record;
}

// ---------------------------------------------------------------- batch + stats

export interface BatchConfig extends MatchConfig {
  matches: number;
  seed: number;
  pool?: readonly CharacterDefinition[];
  onProgress?: (done: number, total: number) => void;
}

export interface CharacterStats {
  id: string;
  legend: boolean;
  games: number;
  wins: number;
  draws: number;
  winRate: number;
}

export interface SimReport {
  meta: { matches: number; seed: number; botA: BotLevel; botB: BotLevel; poolSize: number; teamSize: number; maxTurns: number };
  sides: { playerAWins: number; playerBWins: number; draws: number };
  initiative: { firstPlayerWins: number; secondPlayerWins: number; draws: number; firstPlayerWinRate: number };
  length: { average: number; min: number; max: number; turnLimitHits: number };
  characters: CharacterStats[];
  legends: { legendTeamGames: number; legendTeamWinRate: number; noLegendTeamGames: number; noLegendTeamWinRate: number; perLegend: CharacterStats[] };
  /** counter[a][b] = { games, wins } for `a` when on the opposite team from `b`. */
  counterMatrix: Record<string, Record<string, { games: number; wins: number }>>;
  detectors: Record<DetectorId, { count: number; examples: { seed: number; teamA: string[]; teamB: string[]; detail: string }[] }>;
  errors: { seed: number; message: string }[];
}

export function runBatch(config: BatchConfig): { report: SimReport; records: MatchRecord[] } {
  const pool = config.pool ?? PLAYABLE_CHARACTERS;
  const teamSize = defaultMatchFormat.teamSize;
  const master = createRandom(config.seed);
  const records: MatchRecord[] = [];

  for (let i = 0; i < config.matches; i += 1) {
    const matchSeed = Math.floor(master() * 2 ** 31);
    const picks = shuffled(pool, master).slice(0, teamSize * 2);
    const botRandom = createRandom(matchSeed ^ 0x9e3779b9);
    // Alternate which bot sits in which seat so seat effects average out.
    records.push(runMatch(config, matchSeed, picks.slice(0, teamSize), picks.slice(teamSize), botRandom));
    config.onProgress?.(i + 1, config.matches);
  }
  return { report: summarize(config, pool, records), records };
}

const rate = (wins: number, games: number): number => (games === 0 ? 0 : Math.round((wins / games) * 1000) / 10);

export function summarize(config: BatchConfig, pool: readonly CharacterDefinition[], records: readonly MatchRecord[]): SimReport {
  const legendIds = new Set(pool.filter((c) => c.tags.includes("LEGENDARY")).map((c) => c.id));
  const stats = new Map<string, { games: number; wins: number; draws: number }>();
  for (const c of pool) stats.set(c.id, { games: 0, wins: 0, draws: 0 });
  const counter: SimReport["counterMatrix"] = {};
  const detectors = Object.fromEntries(DETECTORS.map((d) => [d, { count: 0, examples: [] }])) as unknown as SimReport["detectors"];
  const errors: SimReport["errors"] = [];

  let a = 0;
  let b = 0;
  let draws = 0;
  let firstWins = 0;
  let secondWins = 0;
  let turns = 0;
  let minTurns = Infinity;
  let maxTurns = 0;
  let turnLimitHits = 0;
  let legendGames = 0;
  let legendWins = 0;
  let plainGames = 0;
  let plainWins = 0;

  for (const r of records) {
    if (r.winner === "playerA") a += 1;
    else if (r.winner === "playerB") b += 1;
    else draws += 1;
    if (r.winner !== "draw") {
      if (r.winner === r.firstInitiative) firstWins += 1;
      else secondWins += 1;
    }
    turns += r.turns;
    minTurns = Math.min(minTurns, r.turns);
    maxTurns = Math.max(maxTurns, r.turns);
    if (r.endedBy === "turn-limit") turnLimitHits += 1;
    if (r.error) errors.push({ seed: r.seed, message: r.error });

    for (const h of r.hits) {
      const d = detectors[h.detector];
      d.count += 1;
      if (d.examples.length < 5) d.examples.push({ seed: r.seed, teamA: r.teamA, teamB: r.teamB, detail: h.detail });
    }

    const sides: [string[], string[], MatchWinner][] = [
      [r.teamA, r.teamB, "playerA"],
      [r.teamB, r.teamA, "playerB"],
    ];
    for (const [mine, theirs, seat] of sides) {
      const won = r.winner === seat;
      const drew = r.winner === "draw";
      const hasLegend = mine.some((id) => legendIds.has(id));
      if (r.endedBy !== "error") {
        if (hasLegend) {
          legendGames += 1;
          if (won) legendWins += 1;
        } else {
          plainGames += 1;
          if (won) plainWins += 1;
        }
      }
      for (const id of mine) {
        const s = stats.get(id);
        if (!s) continue;
        s.games += 1;
        if (won) s.wins += 1;
        if (drew) s.draws += 1;
        for (const foe of theirs) {
          const row = (counter[id] ??= {});
          const cell = (row[foe] ??= { games: 0, wins: 0 });
          cell.games += 1;
          if (won) cell.wins += 1;
        }
      }
    }
  }

  const characters: CharacterStats[] = pool
    .map((c) => {
      const s = stats.get(c.id) ?? { games: 0, wins: 0, draws: 0 };
      return { id: c.id, legend: legendIds.has(c.id), ...s, winRate: rate(s.wins, s.games) };
    })
    .sort((x, y) => y.winRate - x.winRate);
  const total = records.length;
  const decided = firstWins + secondWins;

  return {
    meta: {
      matches: total,
      seed: config.seed,
      botA: config.botA,
      botB: config.botB,
      poolSize: pool.length,
      teamSize: defaultMatchFormat.teamSize,
      maxTurns: defaultMatchFormat.maxTurns,
    },
    sides: { playerAWins: a, playerBWins: b, draws },
    initiative: { firstPlayerWins: firstWins, secondPlayerWins: secondWins, draws, firstPlayerWinRate: rate(firstWins, decided) },
    length: { average: total === 0 ? 0 : Math.round((turns / total) * 10) / 10, min: total === 0 ? 0 : minTurns, max: maxTurns, turnLimitHits },
    characters,
    legends: {
      legendTeamGames: legendGames,
      legendTeamWinRate: rate(legendWins, legendGames),
      noLegendTeamGames: plainGames,
      noLegendTeamWinRate: rate(plainWins, plainGames),
      perLegend: characters.filter((c) => c.legend),
    },
    counterMatrix: counter,
    detectors,
    errors,
  };
}

export function parseBotLevel(value: string): BotLevel {
  const upper = value.toUpperCase().replace("-", "_");
  const found = BOT_LEVELS.find((l) => l === upper);
  if (!found) throw new Error(`unknown bot level "${value}" (expected one of ${BOT_LEVELS.join(", ")})`);
  return found;
}
