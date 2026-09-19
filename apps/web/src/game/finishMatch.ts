import { applyRankedMatch, type Profile, type RankedChange, type ReplayRecord } from "@veilbreak/persistence";
import { applyMatchProgress, type ProgressMatch, type ProgressReport } from "./progression";
import { buildReplayRecord } from "./replay";
import type { MatchOutcome } from "../screens/MatchScreen";

export interface FinishedMatchInput {
  mode: "hotseat" | "bot" | "trial" | "friend" | "ranked";
  /** Ranked: the bot the player faced (for the rating change). */
  ranked?: { opponentRating: number; botLevel: string };
  /** Friend matches: which side this device played. */
  humanSide?: "A" | "B";
  trialId?: string;
  /** Overrides the generated id (friend matches use one both players can find again). */
  replayId?: string;
  teamAIds: readonly string[];
  teamBIds: readonly string[];
  seed: number;
}

export interface FinishedMatch {
  profile: Profile;
  report: ProgressReport;
  /** Present when the match recorded its turns; stored so it can be replayed. */
  replay?: ReplayRecord;
  /** Ranked matches only: what the ladder did (rating, division, placements, bests). */
  rankedChange?: RankedChange;
}

/**
 * Everything that happens to the profile when a match ends: discoveries,
 * xp, missions, achievements, Legend unlocks, history and the replay record.
 * One pure function so the UI cannot set an unlock by hand (spec/06).
 */
export function finishMatch(profile: Profile, input: FinishedMatchInput, outcome: MatchOutcome, now: number): FinishedMatch {
  const replayId = outcome.turnLog && outcome.energyRules ? (input.replayId ?? `m-${now.toString(36)}-${input.seed.toString(36)}`) : undefined;
  const match: ProgressMatch = {
    teamAIds: input.teamAIds,
    teamBIds: input.teamBIds,
    winnerPlayerId: outcome.winnerPlayerId,
    humanTeams: input.mode === "hotseat" ? ["A", "B"] : input.mode === "friend" ? [input.humanSide ?? "A"] : ["A"],
    eventLog: outcome.eventLog ?? [],
    mode: input.mode,
    trialId: input.trialId,
    turns: outcome.turns ?? 0,
    finalCharacters: outcome.finalCharacters ?? {},
  };
  const { profile: next, report } = applyMatchProgress(profile, match, replayId, now);
  const replay =
    replayId && outcome.turnLog && outcome.energyRules
      ? buildReplayRecord({
          id: replayId,
          playedAt: now,
          mode: input.mode,
          seed: input.seed,
          energyRules: outcome.energyRules,
          teamAIds: input.teamAIds,
          teamBIds: input.teamBIds,
          turns: outcome.turnLog,
          winnerPlayerId: outcome.winnerPlayerId,
        })
      : undefined;
  if (input.mode !== "ranked" || !input.ranked) return { profile: next, report, replay };
  const result = outcome.winnerPlayerId === null ? "draw" : outcome.winnerPlayerId === "playerA" ? "win" : "loss";
  const { ranked, change } = applyRankedMatch(
    next.ranked,
    {
      id: replayId ?? `m-${now.toString(36)}-${input.seed.toString(36)}`,
      result,
      opponentRating: input.ranked.opponentRating,
      botLevel: input.ranked.botLevel,
      team: input.teamAIds,
      foe: input.teamBIds,
      turns: outcome.turns ?? 0,
    },
    now,
  );
  return { profile: { ...next, ranked }, report, replay, rankedChange: change };
}
