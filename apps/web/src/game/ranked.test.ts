import { describe, expect, it } from "vitest";
import { CHARACTER_LIBRARY } from "@veilbreak/content";
import { PLACEMENT_MATCHES, createRanked, createDefaultProfile, divisionIndexFor, seasonIdFor, type RankedState } from "@veilbreak/persistence";
import { finishMatch } from "./finishMatch";
import { planRankedMatch, settleTeams } from "./ranked";
import { runReplay } from "./replay";
import { playRealMatch } from "./testing";
import { PICKABLE_CHARACTERS } from "./roster";

const NOW = Date.UTC(2026, 8, 19, 12);
const placedAt = (rating: number): RankedState => ({ ...createRanked(), season: seasonIdFor(NOW), rating, division: divisionIndexFor(rating), placements: PLACEMENT_MATCHES, peakRating: rating });
const legendsIn = (ids: string[]) => ids.filter((id) => CHARACTER_LIBRARY[id]?.rarity === "LEGENDARY").length;

describe("planning a ranked match", () => {
  it("is reproducible from the seed and the standing", () => {
    expect(planRankedMatch(placedAt(900), 1234)).toEqual(planRankedMatch(placedAt(900), 1234));
    expect(planRankedMatch(placedAt(900), 1234)).not.toEqual(planRankedMatch(placedAt(900), 1235));
  });

  it("scales the bot with the player's division, and uses the rating (not the hidden placement) while unplaced", () => {
    expect(planRankedMatch(placedAt(100), 1).botLevel).toBe("BEGINNER");
    expect(planRankedMatch(placedAt(450), 1).botLevel).toBe("INTERMEDIATE");
    expect(planRankedMatch(placedAt(900), 1).botLevel).toBe("ADVANCED");
    expect(planRankedMatch(placedAt(1300), 1).botLevel).toBe("EXPERT");
    expect(planRankedMatch(createRanked(), 1).botLevel).toBe("INTERMEDIATE"); // starting rating, unplaced
  });

  it("brings three fighters below Diamond and four from Diamond, all real and playable", () => {
    const playable = new Set(PICKABLE_CHARACTERS.map((c) => c.id));
    for (const [rating, size, pickBan] of [[100, 3, false], [1100, 3, false], [1250, 4, true], [1600, 4, true]] as const) {
      for (let seed = 1; seed <= 30; seed += 1) {
        const plan = planRankedMatch(placedAt(rating), seed);
        expect(plan.pickBan).toBe(pickBan);
        expect(plan.botDraft).toHaveLength(size);
        expect(new Set(plan.botDraft).size).toBe(size);
        expect(plan.botDraft.every((id) => playable.has(id))).toBe(true);
        expect(Math.abs(plan.opponentRating - rating)).toBeLessThanOrEqual(60);
      }
    }
  });

  it("applies the Legend policy of OQ-05 to the bot", () => {
    for (let seed = 1; seed <= 200; seed += 1) {
      expect(legendsIn(planRankedMatch(placedAt(500), seed).botDraft)).toBeLessThanOrEqual(1);
      expect(legendsIn(planRankedMatch(placedAt(1000), seed).botDraft)).toBeLessThanOrEqual(2);
    }
  });
});

describe("pick and ban", () => {
  const plan = planRankedMatch(placedAt(1300), 77);
  const mine = ["tortuga-rex", "hydra", "plague-doctor", "baba-yaga"];

  it("without pick/ban the drafts are the teams", () => {
    const low = planRankedMatch(placedAt(300), 5);
    const teams = settleTeams(low, mine.slice(0, 3));
    expect(teams).toEqual({ teamAIds: mine.slice(0, 3), teamBIds: low.botDraft });
  });

  it("each side loses exactly the fighter the other banned", () => {
    const ban = plan.botDraft[2]!;
    const teams = settleTeams(plan, mine, ban);
    expect(teams.teamAIds).toHaveLength(3);
    expect(teams.teamBIds).toHaveLength(3);
    expect(teams.teamBIds).not.toContain(ban);
    expect(teams.playerBanned).toBe(ban);
    expect(mine).toContain(teams.banned);
    expect(teams.teamAIds).not.toContain(teams.banned);
    expect(settleTeams(plan, mine, ban)).toEqual(teams); // the bot's ban is deterministic too
  });

  it("an expert bot bans the strongest of the player's four", () => {
    expect(settleTeams(plan, mine, plan.botDraft[0]!).banned).toBe("tortuga-rex"); // highest measured win rate of the four
  });

  it("refuses a ban that is not one of the bot's four", () => {
    expect(() => settleTeams(plan, mine)).toThrow(/ban/i);
    expect(() => settleTeams(plan, mine, "not-a-fighter")).toThrow(/ban/i);
  });
});

describe("finishing a ranked match", () => {
  const team = ["tortuga-rex", "hydra", "plague-doctor"];
  const foe = ["koschei", "baba-yaga", "the-referee"];

  it("updates the ladder, the profile history and the replay together", () => {
    const outcome = playRealMatch(team, foe, 42);
    const before = { ...createDefaultProfile(), ranked: placedAt(800) };
    const done = finishMatch(before, { mode: "ranked", ranked: { opponentRating: 820, botLevel: "ADVANCED" }, teamAIds: team, teamBIds: foe, seed: 42 }, outcome, NOW);

    expect(done.rankedChange).toBeDefined();
    expect(outcome.winnerPlayerId === "playerA" ? done.rankedChange!.delta > 0 : done.rankedChange!.delta <= 0).toBe(true);
    expect(done.profile.ranked.recent[0]).toMatchObject({ result: outcome.winnerPlayerId === "playerA" ? "win" : outcome.winnerPlayerId === null ? "draw" : "loss", botLevel: "ADVANCED", team, foe });
    expect(done.profile.ranked.usage["tortuga-rex"]?.played).toBe(1);
    expect(done.profile.history[0]).toMatchObject({ mode: "ranked", teamAIds: team, teamBIds: foe });
    expect(done.profile.matchesPlayed).toBe(1);
    expect(done.replay?.mode).toBe("ranked");
    const run = runReplay(done.replay!);
    expect(run.ok).toBe(true);
    expect(done.profile.ranked.pending).toBeNull();
  });

  it("other modes never touch the ladder", () => {
    const outcome = playRealMatch(team, foe, 43);
    const before = { ...createDefaultProfile(), ranked: placedAt(800) };
    const done = finishMatch(before, { mode: "bot", teamAIds: team, teamBIds: foe, seed: 43 }, outcome, NOW);
    expect(done.rankedChange).toBeUndefined();
    expect(done.profile.ranked).toEqual(before.ranked);
  });

  it("five real matches complete the placements and reveal a division", () => {
    let profile = createDefaultProfile();
    for (let i = 0; i < PLACEMENT_MATCHES; i += 1) {
      const seed = 100 + i;
      const outcome = playRealMatch(team, foe, seed);
      const done = finishMatch(profile, { mode: "ranked", ranked: { opponentRating: profile.ranked.rating, botLevel: "INTERMEDIATE" }, teamAIds: team, teamBIds: foe, seed }, outcome, NOW + i);
      expect(done.rankedChange!.placed).toBe(i === PLACEMENT_MATCHES - 1);
      profile = done.profile;
    }
    expect(profile.ranked.placements).toBe(PLACEMENT_MATCHES);
    expect(profile.ranked.wins + profile.ranked.losses + profile.ranked.draws).toBe(PLACEMENT_MATCHES);
    expect(profile.ranked.bests.matches).toBe(PLACEMENT_MATCHES);
  });
});
