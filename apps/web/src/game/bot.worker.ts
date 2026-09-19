import { createRandom, decideActions, type BotLevel } from "@veilbreak/ai";
import type { BattleState, PlayerAction } from "@veilbreak/engine";
import { matchDeps } from "./setup";

// phase-05 "The bot runs in a Web Worker", extended in phase-07: the decision
// logic (level ladder, lookahead, time budget) lives in @veilbreak/ai; this file
// is the thread boundary. The lookahead levels stop searching when their time
// budget is spent, so a slow device gets a shallower search, never a frozen UI.
// Typed as a minimal message-passing interface rather than the ambient
// `DedicatedWorkerGlobalScope` lib, which conflicts with the DOM lib apps/web needs.

export interface BotRequest {
  state: BattleState;
  playerId: string;
  /** Defaults to INTERMEDIATE. */
  level?: BotLevel;
  /** Per-decision search budget for ADVANCED and above. */
  budgetMs?: number;
}

export type BotResponse = PlayerAction[];

export const DEFAULT_BOT_LEVEL: BotLevel = "INTERMEDIATE";
const DEFAULT_BUDGET_MS = 400;

interface WorkerScope {
  onmessage: ((event: MessageEvent<BotRequest>) => void) | null;
  postMessage: (message: BotResponse) => void;
}

const scope = self as unknown as WorkerScope;
const deps = matchDeps();

scope.onmessage = (event) => {
  const { state, playerId, level = DEFAULT_BOT_LEVEL, budgetMs = DEFAULT_BUDGET_MS } = event.data;
  // A per-request seed keeps a given position's decision reproducible for debugging.
  const random = createRandom(state.turn * 7919 + state.eventLog.length);
  scope.postMessage(decideActions(level, state, playerId, { deps, random, budgetMs }));
};
