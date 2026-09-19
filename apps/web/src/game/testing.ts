import { defaultEnergyRules } from "@veilbreak/content";
import { createRandom, decideActions, type BotLevel } from "@veilbreak/ai";
import { resolveTurn } from "@veilbreak/engine";
import type { MatchOutcome } from "../screens/MatchScreen";
import { matchDeps, startMatch } from "./setup";
import type { RecordedTurn } from "./replay";

// Test helper (not shipped): plays a whole match through the real engine with
// bots on both sides and returns exactly what MatchScreen hands to onMatchOver.
export function playRealMatch(teamAIds: string[], teamBIds: string[], seed: number, level: BotLevel = "INTERMEDIATE"): MatchOutcome {
  const deps = matchDeps();
  let state = startMatch(teamAIds, teamBIds, seed);
  const random = createRandom(seed + 1);
  const turnLog: RecordedTurn[] = [];
  let winner: string | null = null;
  for (let i = 0; i < 200; i += 1) {
    const ctx = { deps, random };
    const a = decideActions(level, state, "playerA", ctx);
    const b = decideActions(level, state, "playerB", ctx);
    const result = resolveTurn(state, a, b, deps);
    if (!result.ok) throw new Error("bot produced an illegal plan");
    turnLog.push({ a, b });
    state = result.state;
    const end = result.events.find((e) => e.type.startsWith("matchEnded"));
    if (end) {
      winner = typeof end.payload?.winnerPlayerId === "string" ? end.payload.winnerPlayerId : null;
      break;
    }
  }
  return {
    result: winner ? "win" : "draw",
    winnerPlayerId: winner,
    eventLog: state.eventLog,
    turnLog,
    turns: Math.max(0, state.turn - 1),
    seed,
    energyRules: defaultEnergyRules,
    finalCharacters: Object.fromEntries(Object.entries(state.characters).map(([id, c]) => [id, { hp: c.currentHp, alive: c.alive }])),
  };
}
