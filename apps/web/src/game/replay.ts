import { defaultMatchFormat, type BattleEvent, type EnergyRules } from "@veilbreak/content";
import { createBattle, resolveTurn, type BattleState, type PlayerAction } from "@veilbreak/engine";
import type { ReplayRecord } from "@veilbreak/persistence";
import { BALANCE_VERSION_ID, buildTeamInput, matchDeps } from "./setup";

// spec/02 "Replays and determinism": a replay is the setup plus the actions
// chosen each turn. Playing it back re-runs the real engine, so what you watch
// is exactly what happened, and any mismatch is detectable.

export interface RecordedTurn {
  a: PlayerAction[];
  b: PlayerAction[];
  /** Friend matches: the RNG state after the players' salts were mixed in (see packages/protocol). */
  rng?: string;
}

export function buildReplayRecord(input: {
  id: string;
  playedAt: number;
  mode: ReplayRecord["mode"];
  seed: number;
  energyRules: EnergyRules;
  teamAIds: readonly string[];
  teamBIds: readonly string[];
  turns: readonly RecordedTurn[];
  winnerPlayerId: string | null;
}): ReplayRecord {
  return {
    version: 1,
    id: input.id,
    playedAt: input.playedAt,
    mode: input.mode,
    seed: input.seed,
    balanceVersionId: BALANCE_VERSION_ID,
    energyRules: input.energyRules,
    teamAIds: [...input.teamAIds],
    teamBIds: [...input.teamBIds],
    turns: input.turns.map((t) => ({ a: [...t.a], b: [...t.b], ...(t.rng ? { rng: t.rng } : {}) })),
    winnerPlayerId: input.winnerPlayerId,
  };
}

export interface ReplayFrame {
  /** State after this many recorded turns (0 = the opening position). */
  state: BattleState;
  /** Battle events produced by the turn that led here. */
  events: BattleEvent[];
}

export type ReplayRun =
  | { ok: true; frames: ReplayFrame[]; winnerPlayerId: string | null; balanceMismatch: boolean }
  | { ok: false; error: string; frames: ReplayFrame[] };

/** Re-runs a recording through the engine. Fails clearly if an action is no longer legal (for example, the rules changed). */
export function runReplay(record: ReplayRecord): ReplayRun {
  const balanceMismatch = record.balanceVersionId !== BALANCE_VERSION_ID;
  try {
    let state = createBattle([buildTeamInput("playerA", record.teamAIds), buildTeamInput("playerB", record.teamBIds)], record.seed, {
      balanceVersionId: record.balanceVersionId,
      matchFormat: defaultMatchFormat,
      energyRules: record.energyRules,
    });
    const deps = matchDeps(record.energyRules);
    const frames: ReplayFrame[] = [{ state, events: [] }];
    let winner: string | null = null;
    for (const [i, turn] of record.turns.entries()) {
      const result = resolveTurn(turn.rng ? { ...state, rngState: turn.rng } : state, turn.a, turn.b, deps);
      if (!result.ok) return { ok: false, error: `Turn ${i + 1} cannot be replayed: it no longer matches the game's rules.`, frames };
      state = result.state;
      frames.push({ state, events: result.events });
      const end = result.events.find((e) => e.type.startsWith("matchEnded"));
      if (end) winner = typeof end.payload?.winnerPlayerId === "string" ? end.payload.winnerPlayerId : null;
    }
    return { ok: true, frames, winnerPlayerId: winner, balanceMismatch };
  } catch {
    return { ok: false, error: "This replay could not be played back.", frames: [] };
  }
}
