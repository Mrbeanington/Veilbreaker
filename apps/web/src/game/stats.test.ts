import { describe, expect, it } from "vitest";
import { createDefaultProfile, type HistoryEntry } from "@veilbreak/persistence";
import { finishMatch } from "./finishMatch";
import { abilityStats, historyStats, percent } from "./stats";
import { playRealMatch } from "./testing";

const entry = (over: Partial<HistoryEntry> = {}): HistoryEntry => ({
  id: `e-${Math.random()}`,
  playedAt: 1,
  mode: "bot",
  teamAIds: ["hydra", "shiro", "koschei"],
  teamBIds: ["malachar", "behemoth", "zeiron"],
  winnerPlayerId: "playerA",
  turns: 10,
  ...over,
});

describe("win rates from the player's own history", () => {
  it("counts wins, losses and draws, and tallies by character, team and opponent", () => {
    const s = historyStats([
      entry(),
      entry({ winnerPlayerId: "playerB" }),
      entry({ winnerPlayerId: null }),
      entry({ teamAIds: ["hydra", "baba-yaga", "koschei"] }),
    ]);
    expect([s.matches, s.wins, s.losses, s.draws]).toEqual([4, 2, 1, 1]);
    expect(s.byCharacter.find((t) => t.id === "hydra")).toEqual({ id: "hydra", played: 4, won: 2 });
    expect(s.byCharacter.find((t) => t.id === "baba-yaga")).toEqual({ id: "baba-yaga", played: 1, won: 1 });
    expect(s.byTeam.find((t) => t.id === "hydra|koschei|shiro")).toEqual({ id: "hydra|koschei|shiro", played: 3, won: 1 });
    expect(s.byOpponent.find((t) => t.id === "zeiron")).toEqual({ id: "zeiron", played: 4, won: 2 });
    expect(s.byCharacter[0]?.played).toBeGreaterThanOrEqual(s.byCharacter[s.byCharacter.length - 1]!.played); // most used first
  });

  it("counts a friend match from the side this device played, and leaves hotseat out", () => {
    const s = historyStats([entry({ mode: "friend", humanSide: "B", winnerPlayerId: "playerB" }), entry({ mode: "hotseat" })]);
    expect(s.matches).toBe(1);
    expect(s.wins).toBe(1);
    expect(s.byCharacter.map((t) => t.id).sort()).toEqual(["behemoth", "malachar", "zeiron"]); // the B team is "mine"
    expect(s.byOpponent.map((t) => t.id).sort()).toEqual(["hydra", "koschei", "shiro"]);
  });

  it("copes with no history, and rounds percentages", () => {
    expect(historyStats([])).toMatchObject({ matches: 0, wins: 0, byCharacter: [] });
    expect(percent(0, 0)).toBe(0);
    expect(percent(2, 3)).toBe(67);
  });

  it("finishMatch records which side the player was, so stats can use it", () => {
    const team = ["tortuga-rex", "hydra", "plague-doctor"];
    const foe = ["koschei", "baba-yaga", "the-referee"];
    const outcome = playRealMatch(team, foe, 5);
    const bot = finishMatch(createDefaultProfile(), { mode: "bot", teamAIds: team, teamBIds: foe, seed: 5 }, outcome, 10);
    expect(bot.profile.history[0]?.humanSide).toBe("A");
    const friend = finishMatch(createDefaultProfile(), { mode: "friend", humanSide: "B", teamAIds: foe, teamBIds: team, seed: 5 }, outcome, 10);
    expect(friend.profile.history[0]?.humanSide).toBe("B");
    const hotseat = finishMatch(createDefaultProfile(), { mode: "hotseat", teamAIds: team, teamBIds: foe, seed: 5 }, outcome, 10);
    expect(hotseat.profile.history[0]?.humanSide).toBeUndefined();
  });
});

describe("favourite abilities and transformations from stored replays", () => {
  it("count exactly the abilityUsed and transformed events of the player's own side", () => {
    const team = ["patient-zero", "hydra", "nine-tailed-trickster"];
    const foe = ["koschei", "baba-yaga", "the-referee"];
    const outcome = playRealMatch(team, foe, 21);
    const done = finishMatch(createDefaultProfile(), { mode: "bot", teamAIds: team, teamBIds: foe, seed: 21 }, outcome, 100);
    const stats = abilityStats(done.profile.history, [done.replay!]);
    expect(stats.replaysRead).toBe(1);

    const mine = new Set(team);
    const log = outcome.eventLog ?? [];
    const expectedUses = log.filter((e) => e.type === "abilityUsed" && e.sourceId && mine.has(e.sourceId)).length;
    expect(expectedUses).toBeGreaterThan(0);
    expect(stats.abilities.reduce((sum, a) => sum + a.uses, 0)).toBe(expectedUses);
    const expectedTransforms = log.filter((e) => e.type === "transformed" && e.sourceId && mine.has(e.sourceId)).length;
    expect(stats.transformations.reduce((sum, t) => sum + t.count, 0)).toBe(expectedTransforms);
    // Most used first.
    expect(stats.abilities.map((a) => a.uses)).toEqual([...stats.abilities.map((a) => a.uses)].sort((a, b) => b - a));
  });

  it("ignores hotseat replays and replays that can no longer run", () => {
    const team = ["tortuga-rex", "hydra", "plague-doctor"];
    const foe = ["koschei", "baba-yaga", "the-referee"];
    const outcome = playRealMatch(team, foe, 8);
    const hot = finishMatch(createDefaultProfile(), { mode: "hotseat", teamAIds: team, teamBIds: foe, seed: 8 }, outcome, 1);
    expect(abilityStats(hot.profile.history, [hot.replay!]).replaysRead).toBe(0);
    const bot = finishMatch(createDefaultProfile(), { mode: "bot", teamAIds: team, teamBIds: foe, seed: 8 }, outcome, 1);
    const broken = { ...bot.replay!, teamAIds: ["nobody"] };
    expect(abilityStats(bot.profile.history, [broken])).toMatchObject({ replaysRead: 0, abilities: [] });
  });
});
