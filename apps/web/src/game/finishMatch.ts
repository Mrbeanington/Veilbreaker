import type { Profile, ReplayRecord } from "@veilbreak/persistence";
import { applyMatchProgress, type ProgressMatch, type ProgressReport } from "./progression";
import { buildReplayRecord } from "./replay";
import type { MatchOutcome } from "../screens/MatchScreen";

export interface FinishedMatchInput {
  mode: "hotseat" | "bot" | "trial";
  trialId?: string;
  teamAIds: readonly string[];
  teamBIds: readonly string[];
  seed: number;
}

export interface FinishedMatch {
  profile: Profile;
  report: ProgressReport;
  /** Present when the match recorded its turns; stored so it can be replayed. */
  replay?: ReplayRecord;
}

/**
 * Everything that happens to the profile when a match ends: discoveries,
 * xp, missions, achievements, Legend unlocks, history and the replay record.
 * One pure function so the UI cannot set an unlock by hand (spec/06).
 */
export function finishMatch(profile: Profile, input: FinishedMatchInput, outcome: MatchOutcome, now: number): FinishedMatch {
  const replayId = outcome.turnLog && outcome.energyRules ? `m-${now.toString(36)}-${input.seed.toString(36)}` : undefined;
  const match: ProgressMatch = {
    teamAIds: input.teamAIds,
    teamBIds: input.teamBIds,
    winnerPlayerId: outcome.winnerPlayerId,
    humanTeams: input.mode === "hotseat" ? ["A", "B"] : ["A"],
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
  return { profile: next, report, replay };
}
