import { describe, expect, it } from "vitest";
import {
  APEX_DIVISION,
  DEMOTION_BUFFER,
  DIVISIONS,
  K_PLACEMENT,
  K_RANKED,
  MAX_PAST_SEASONS,
  MAX_RECENT,
  PLACEMENT_CEILING,
  PLACEMENT_MATCHES,
  RANKED_START_RATING,
  applyRankedMatch,
  beginRankedMatch,
  createRanked,
  divisionIndexFor,
  expectedPermille,
  forfeitUnfinished,
  isPlaced,
  matchmakingDivision,
  rankedSchema,
  ratingChange,
  rollSeason,
  seasonIdFor,
  seasonStartRating,
  settleDivision,
  shownDivision,
  standing,
  usageRanking,
  type RankedMatchInput,
  type RankedResult,
  type RankedState,
} from "./ranked";
import { MIGRATIONS, PROFILE_VERSION, createDefaultProfile, parseProfile } from "./profile";
import { decodeTransfer, encodeTransfer, exportBackup, importBackup } from "./codec";
import { ID_TABLE } from "./testing";

const SEPT = Date.UTC(2026, 8, 19, 12);
const OCT = Date.UTC(2026, 9, 2, 12);

let counter = 0;
const match = (result: RankedResult, opponentRating: number, extra: Partial<RankedMatchInput> = {}): RankedMatchInput => ({
  id: `m${(counter += 1)}`,
  result,
  opponentRating,
  botLevel: "INTERMEDIATE",
  team: ["hydra", "shiro", "koschei"],
  foe: ["malachar", "behemoth", "zeiron"],
  turns: 12,
  ...extra,
});

/** Plays results in order against an opponent equal to the player's own rating. */
function play(start: RankedState, results: RankedResult[], now = SEPT): RankedState {
  return results.reduce((r, result) => applyRankedMatch(r, match(result, r.rating), now).ranked, start);
}

const placed = (rating: number, division = divisionIndexFor(rating)): RankedState => ({ ...createRanked(), season: seasonIdFor(SEPT), rating, division, placements: PLACEMENT_MATCHES, peakRating: rating, peakDivision: division });

describe("divisions", () => {
  it("has five named divisions of three tiers, then the apex, in rating order", () => {
    expect(DIVISIONS).toHaveLength(16);
    expect(DIVISIONS[0]).toMatchObject({ label: "Bronze III", floor: 0 });
    expect(DIVISIONS[2]).toMatchObject({ label: "Bronze I", floor: 200 });
    expect(DIVISIONS[3]).toMatchObject({ label: "Silver III", floor: 300 });
    expect(DIVISIONS[14]).toMatchObject({ label: "Diamond I", floor: 1400 });
    expect(DIVISIONS[APEX_DIVISION]).toMatchObject({ label: "Veilbreaker", floor: 1500 });
    expect(DIVISIONS.every((d, i) => d.index === i && (i === 0 || d.floor > (DIVISIONS[i - 1]?.floor ?? 0)))).toBe(true);
  });

  it("maps every rating to a division, clamped at both ends", () => {
    expect(divisionIndexFor(0)).toBe(0);
    expect(divisionIndexFor(99)).toBe(0);
    expect(divisionIndexFor(100)).toBe(1);
    expect(divisionIndexFor(1499)).toBe(14);
    expect(divisionIndexFor(1500)).toBe(APEX_DIVISION);
    expect(divisionIndexFor(9999)).toBe(APEX_DIVISION);
    expect(divisionIndexFor(-50)).toBe(0);
  });
});

describe("rating math", () => {
  it("expected scores are symmetric, even at equal ratings, and follow the standard curve", () => {
    expect(expectedPermille(1000, 1000)).toBe(500);
    for (const [a, b] of [[1000, 1200], [400, 900], [1500, 300]] as const) expect(expectedPermille(a, b) + expectedPermille(b, a)).toBe(1000);
    expect(expectedPermille(1200, 1000)).toBe(760); // +200 is about 76%
    expect(expectedPermille(1000, 1400)).toBe(91); // -400 is about 9%
  });

  it("a win against an equal opponent is worth half of K, and a loss costs the same", () => {
    expect(ratingChange(800, 800, "win", K_RANKED)).toBe(K_RANKED / 2);
    expect(ratingChange(800, 800, "loss", K_RANKED)).toBe(-K_RANKED / 2);
    expect(ratingChange(800, 800, "win", K_PLACEMENT)).toBe(K_PLACEMENT / 2);
  });

  it("beating a stronger opponent pays more than beating a weaker one", () => {
    expect(ratingChange(800, 1000, "win", K_RANKED)).toBeGreaterThan(ratingChange(800, 600, "win", K_RANKED));
    expect(ratingChange(800, 600, "loss", K_RANKED)).toBeLessThan(ratingChange(800, 1000, "loss", K_RANKED));
  });

  it("a win always gains at least one point and a loss always costs at least one, however lopsided", () => {
    expect(ratingChange(2000, 100, "win", K_RANKED)).toBe(1);
    expect(ratingChange(100, 2000, "loss", K_RANKED)).toBe(-1);
  });

  it("a draw moves both players toward parity (OQ-09)", () => {
    expect(ratingChange(1000, 1000, "draw", K_RANKED)).toBe(0);
    expect(ratingChange(1200, 1000, "draw", K_RANKED)).toBeLessThan(0); // the favourite slips
    expect(ratingChange(1000, 1200, "draw", K_RANKED)).toBeGreaterThan(0); // the underdog gains
  });

  it("is deterministic: the same inputs always give the same change", () => {
    const input = match("win", 950);
    expect(applyRankedMatch(placed(900), input, SEPT)).toEqual(applyRankedMatch(placed(900), input, SEPT));
  });
});

describe("placement flow", () => {
  it("starts unranked at the starting rating, with no division shown", () => {
    const r = createRanked();
    expect(r.rating).toBe(RANKED_START_RATING);
    expect(isPlaced(r)).toBe(false);
    expect(shownDivision(r)).toBeNull();
    expect(standing(r)).toBe("unplaced");
    expect(matchmakingDivision(r)).toBe(divisionIndexFor(RANKED_START_RATING)); // bots still scale from the rating
  });

  it("shows no division until the last placement match, and moves faster than later matches", () => {
    let r = createRanked();
    for (let i = 1; i < PLACEMENT_MATCHES; i += 1) {
      const step = applyRankedMatch(r, match("win", r.rating), SEPT);
      expect(step.change.divisionAfter).toBeNull();
      expect(step.change.placed).toBe(false);
      expect(step.change.placementsLeft).toBe(PLACEMENT_MATCHES - i);
      expect(step.change.delta).toBeGreaterThan(0);
      r = step.ranked;
    }
    const last = applyRankedMatch(r, match("win", r.rating), SEPT);
    expect(last.change.placed).toBe(true);
    expect(last.change.divisionAfter).not.toBeNull();
    expect(last.change.placementsLeft).toBe(0);
    expect(isPlaced(last.ranked)).toBe(true);
  });

  it("five wins place higher than five losses, and both land in a real division", () => {
    const wins = play(createRanked(), Array(5).fill("win"));
    const losses = play(createRanked(), Array(5).fill("loss"));
    expect(wins.rating).toBeGreaterThan(RANKED_START_RATING);
    expect(losses.rating).toBeLessThan(RANKED_START_RATING);
    expect(wins.division).toBeGreaterThan(losses.division);
    expect(shownDivision(wins)).not.toBeNull();
  });

  it("placement matches use the larger K, later matches the smaller", () => {
    const first = applyRankedMatch(createRanked(), match("win", RANKED_START_RATING), SEPT);
    expect(first.change.delta).toBe(K_PLACEMENT / 2);
    const later = applyRankedMatch(placed(800), match("win", 800), SEPT);
    expect(later.change.delta).toBe(K_RANKED / 2);
  });

  it("a hot placement cannot start above Gold I", () => {
    let r: RankedState = { ...createRanked(), season: seasonIdFor(SEPT), rating: 1180, division: 11, placements: PLACEMENT_MATCHES - 1, peakRating: 1180 };
    r = applyRankedMatch(r, match("win", 1180), SEPT).ranked;
    expect(r.division).toBe(PLACEMENT_CEILING);
    expect(r.rating).toBeLessThan(DIVISIONS[PLACEMENT_CEILING + 1]!.floor);
  });

  it("the placement match count is recorded in the recent list with no division shown until placed", () => {
    const r = applyRankedMatch(createRanked(), match("loss", 400), SEPT).ranked;
    expect(r.recent[0]).toMatchObject({ result: "loss", division: -1 });
  });
});

describe("promotion and demotion", () => {
  it("promotes as soon as the rating reaches the next floor", () => {
    let r = placed(595, 5); // Silver I, 500-599
    const step = applyRankedMatch(r, match("win", 700), SEPT);
    expect(step.ranked.rating).toBeGreaterThanOrEqual(600);
    expect(step.change.promoted).toBe(true);
    expect(step.change.divisionBefore?.label).toBe("Silver I");
    expect(step.change.divisionAfter?.label).toBe("Gold III");
    r = step.ranked;
    expect(r.division).toBe(6);
  });

  it("does not demote for a small dip below the floor (the buffer)", () => {
    const r = placed(505, 5);
    const step = applyRankedMatch(r, match("loss", 505), SEPT); // -12 -> 493, still within the buffer
    expect(step.ranked.rating).toBeLessThan(500);
    expect(step.ranked.rating).toBeGreaterThanOrEqual(500 - DEMOTION_BUFFER);
    expect(step.change.demoted).toBe(false);
    expect(step.ranked.division).toBe(5);
  });

  it("demotes once the rating falls well below the floor", () => {
    let r = placed(505, 5);
    for (let i = 0; i < 4; i += 1) r = applyRankedMatch(r, match("loss", r.rating), SEPT).ranked;
    expect(r.rating).toBeLessThan(500 - DEMOTION_BUFFER);
    expect(r.division).toBe(4);
  });

  it("settleDivision: up is immediate, down needs the buffer, and both are stable at rest", () => {
    expect(settleDivision(5, 600)).toBe(6);
    expect(settleDivision(5, 500)).toBe(5);
    expect(settleDivision(5, 480)).toBe(5);
    expect(settleDivision(5, 479)).toBe(4);
    expect(settleDivision(0, 0)).toBe(0); // nothing below the bottom
    expect(settleDivision(APEX_DIVISION, 1500)).toBe(APEX_DIVISION);
    expect(settleDivision(APEX_DIVISION, 1479)).toBe(14);
  });

  it("cannot drop below zero rating", () => {
    let r = placed(3, 0);
    for (let i = 0; i < 5; i += 1) r = applyRankedMatch(r, match("loss", 900), SEPT).ranked;
    expect(r.rating).toBe(0);
    expect(r.division).toBe(0);
  });

  it("reports how close a placed player is to moving, without the number", () => {
    expect(standing(placed(580, 5))).toBe("climbing");
    expect(standing(placed(510, 5))).toBe("at-risk");
    expect(standing(placed(550, 5))).toBe("steady");
    expect(standing(placed(5, 0))).toBe("steady"); // nothing to fall to
  });
});

describe("streaks, records and personal bests", () => {
  it("counts win and loss streaks, and a draw ends either", () => {
    const seq = (results: RankedResult[]) => play(placed(800), results).streak;
    expect(seq(["win", "win", "win"])).toBe(3);
    expect(seq(["win", "win", "loss"])).toBe(-1);
    expect(seq(["loss", "loss"])).toBe(-2);
    expect(seq(["win", "win", "draw"])).toBe(0);
    expect(seq(["loss", "win"])).toBe(1);
  });

  it("keeps the season record and best streak", () => {
    const r = play(placed(800), ["win", "win", "win", "loss", "draw", "win"]);
    expect(r).toMatchObject({ wins: 4, losses: 1, draws: 1, bestStreak: 3 });
    expect(r.bests).toMatchObject({ winStreak: 3, seasonWins: 4 });
  });

  it("tracks the peak rating and division", () => {
    const r = play(placed(590, 5), ["win", "win", "loss"]);
    expect(r.peakRating).toBeGreaterThanOrEqual(r.rating);
    expect(r.peakDivision).toBeGreaterThanOrEqual(6);
    expect(r.bests.rating).toBe(r.peakRating);
  });

  it("calls out new personal bests, but not on the very first match", () => {
    const first = applyRankedMatch(createRanked(), match("win", 400), SEPT);
    expect(first.change.newBests).toEqual([]);
    const second = applyRankedMatch(first.ranked, match("win", first.ranked.rating), SEPT);
    expect(second.change.newBests).toContain("Highest rating");
  });

  it("records the fastest win, and only wins count", () => {
    let r = placed(800);
    r = applyRankedMatch(r, match("win", 800, { turns: 14 }), SEPT).ranked;
    r = applyRankedMatch(r, match("loss", 800, { turns: 3 }), SEPT).ranked;
    expect(r.bests.fastestWinTurns).toBe(14);
    const faster = applyRankedMatch(r, match("win", 800, { turns: 9 }), SEPT);
    expect(faster.ranked.bests.fastestWinTurns).toBe(9);
    expect(faster.change.newBests).toContain("Fastest win");
  });

  it("counts character usage for the team the player used, by wins", () => {
    let r = placed(800);
    r = applyRankedMatch(r, match("win", 800, { team: ["hydra", "shiro", "koschei"] }), SEPT).ranked;
    r = applyRankedMatch(r, match("loss", 800, { team: ["hydra", "baba-yaga", "koschei"] }), SEPT).ranked;
    expect(r.usage.hydra).toEqual({ played: 2, won: 1 });
    expect(r.usage.shiro).toEqual({ played: 1, won: 1 });
    expect(r.usage["baba-yaga"]).toEqual({ played: 1, won: 0 });
    expect(usageRanking(r)[0]?.id).toBe("hydra");
  });

  it("keeps only the most recent matches", () => {
    const r = play(placed(800), Array(MAX_RECENT + 5).fill("win"));
    expect(r.recent).toHaveLength(MAX_RECENT);
    expect(r.recent[0]?.id).toBe(`m${counter}`);
  });
});

describe("seasons", () => {
  it("names seasons by calendar month in UTC", () => {
    expect(seasonIdFor(Date.UTC(2026, 8, 19))).toBe("2026-09");
    expect(seasonIdFor(Date.UTC(2026, 0, 1, 0, 0, 0))).toBe("2026-01");
    expect(seasonIdFor(Date.UTC(2026, 11, 31, 23, 59, 59))).toBe("2026-12");
  });

  it("the first visit only stamps the season; nothing is archived or reset", () => {
    const r = rollSeason(createRanked(), SEPT);
    expect(r.rolledOver).toBe(false);
    expect(r.ranked.season).toBe("2026-09");
    expect(r.archived).toBeUndefined();
  });

  it("the same season changes nothing, and rolling twice is the same as once", () => {
    const start = play({ ...createRanked(), season: "2026-09" }, ["win", "win", "win", "win", "win", "win", "loss"]);
    expect(rollSeason(start, SEPT).ranked).toBe(start);
    const once = rollSeason(start, OCT);
    expect(once.rolledOver).toBe(true);
    const twice = rollSeason(once.ranked, OCT);
    expect(twice.rolledOver).toBe(false);
    expect(twice.ranked).toBe(once.ranked);
  });

  it("rollover archives the finished season, keeps half of the rating gain, and asks for placements again", () => {
    const start = play({ ...createRanked(), season: "2026-09" }, ["win", "win", "win", "win", "win", "win", "win", "loss"]);
    const before = start.rating;
    const { ranked, archived, rolledOver } = rollSeason(start, OCT);
    expect(rolledOver).toBe(true);
    expect(archived).toMatchObject({ season: "2026-09", wins: 7, losses: 1, draws: 0, placed: true, peakRating: start.peakRating });
    expect(ranked.season).toBe("2026-10");
    expect(ranked.rating).toBe(seasonStartRating(before));
    expect(ranked.rating).toBeGreaterThan(RANKED_START_RATING);
    expect(ranked.rating).toBeLessThan(before);
    expect(ranked).toMatchObject({ placements: 0, wins: 0, losses: 0, draws: 0, streak: 0, bestStreak: 0 });
    expect(isPlaced(ranked)).toBe(false);
    expect(ranked.pastSeasons[0]).toEqual(archived);
  });

  it("all-time bests, usage and recent matches survive a rollover", () => {
    const start = play({ ...createRanked(), season: "2026-09" }, ["win", "win", "win"]);
    const { ranked } = rollSeason(start, OCT);
    expect(ranked.bests).toEqual(start.bests);
    expect(ranked.usage).toEqual(start.usage);
    expect(ranked.recent).toEqual(start.recent);
  });

  it("the season start rating pulls toward the starting rating from either side, never below zero", () => {
    expect(seasonStartRating(1000)).toBe(700);
    expect(seasonStartRating(RANKED_START_RATING)).toBe(RANKED_START_RATING);
    expect(seasonStartRating(200)).toBe(300);
    expect(seasonStartRating(0)).toBe(200);
  });

  it("a season with no matches is not archived", () => {
    const { ranked, archived } = rollSeason({ ...createRanked(), season: "2026-08" }, SEPT);
    expect(archived).toBeUndefined();
    expect(ranked.pastSeasons).toEqual([]);
    expect(ranked.season).toBe("2026-09");
  });

  it("skipping several months archives once, and only the newest seasons are kept", () => {
    let r: RankedState = { ...createRanked(), season: "2026-01" };
    r = applyRankedMatch(r, match("win", 400), Date.UTC(2026, 0, 5)).ranked;
    const skipped = rollSeason(r, Date.UTC(2026, 5, 5));
    expect(skipped.ranked.pastSeasons).toHaveLength(1);
    expect(skipped.ranked.season).toBe("2026-06");

    let long = { ...createRanked(), season: "2000-01" };
    for (let i = 0; i < MAX_PAST_SEASONS + 5; i += 1) {
      const month = new Date(Date.UTC(2000, i, 5));
      long = applyRankedMatch(rollSeason(long, month.getTime()).ranked, match("win", long.rating), month.getTime()).ranked;
    }
    long = rollSeason(long, Date.UTC(2010, 0, 5)).ranked;
    expect(long.pastSeasons).toHaveLength(MAX_PAST_SEASONS);
    expect((long.pastSeasons[0]?.season ?? "") > (long.pastSeasons[1]?.season ?? "")).toBe(true); // newest first
  });

  it("finishing a match after the calendar has moved on rolls the season first, then counts the match", () => {
    const start = play({ ...createRanked(), season: "2026-09" }, ["win", "win", "win", "win", "win", "win"], SEPT);
    const step = applyRankedMatch(start, match("win", start.rating), OCT);
    expect(step.change.seasonRolledOver).toBe(true);
    expect(step.ranked.season).toBe("2026-10");
    expect(step.ranked.wins).toBe(1);
    expect(step.ranked.placements).toBe(1);
    expect(step.ranked.pastSeasons[0]?.wins).toBe(6);
  });
});

describe("the ladder finds a player's level (simulated players)", () => {
  // A player of fixed true strength meets bots rated near their own rating and wins with the Elo probability.
  function climb(strength: number, matches: number, seed: number): RankedState {
    let state = seed >>> 0;
    const next = () => {
      state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
      return state / 4294967296;
    };
    let r: RankedState = { ...createRanked(), season: seasonIdFor(SEPT) };
    for (let i = 0; i < matches; i += 1) {
      const opponent = r.rating + (Math.floor(next() * 7) - 3) * 20;
      const result: RankedResult = next() * 1000 < expectedPermille(strength, opponent) ? "win" : "loss";
      r = applyRankedMatch(r, match(result, opponent), SEPT).ranked;
    }
    return r;
  }

  it("a stronger player ends up in a higher division than a weaker one", () => {
    const strong = climb(1100, 400, 1);
    const middle = climb(700, 400, 1);
    const weak = climb(250, 400, 1);
    expect(strong.division).toBeGreaterThan(middle.division);
    expect(middle.division).toBeGreaterThan(weak.division);
  });

  it("settles near the player's true strength and does not flip between divisions every match", () => {
    for (const strength of [300, 700, 1100]) {
      const r = climb(strength, 500, 7);
      expect(Math.abs(r.rating - strength)).toBeLessThan(200);
    }
    // Once settled, divisions change rarely: count changes across a long stretch.
    let r = climb(700, 300, 3);
    let changes = 0;
    let state = 99;
    for (let i = 0; i < 200; i += 1) {
      state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
      const opponent = r.rating;
      const result: RankedResult = (state / 4294967296) * 1000 < expectedPermille(700, opponent) ? "win" : "loss";
      const step = applyRankedMatch(r, match(result, opponent), SEPT);
      if (step.change.promoted || step.change.demoted) changes += 1;
      r = step.ranked;
    }
    expect(changes).toBeLessThan(40);
  });

  it("placements alone cannot reach the top, however well they go", () => {
    const r = climb(2500, PLACEMENT_MATCHES, 5);
    expect(isPlaced(r)).toBe(true);
    expect(r.division).toBeLessThanOrEqual(PLACEMENT_CEILING);
  });
});

describe("leaving a ranked match unfinished", () => {
  const pending = { id: "p1", at: SEPT, opponentRating: 800, botLevel: "ADVANCED", team: ["hydra", "shiro", "koschei"], foe: ["malachar", "behemoth", "zeiron"] };

  it("is remembered from the moment the match begins", () => {
    const begun = beginRankedMatch(placed(800), pending, SEPT);
    expect(begun.pending).toEqual(pending);
    expect(begun.rating).toBe(800); // nothing changes until it ends
  });

  it("counts as a loss (with a mark) the next time the ladder is opened, and clears the marker", () => {
    const begun = beginRankedMatch(placed(800), pending, SEPT);
    const settled = forfeitUnfinished(begun, SEPT + 60_000)!;
    expect(settled.ranked.pending).toBeNull();
    expect(settled.ranked.losses).toBe(1);
    expect(settled.ranked.streak).toBe(-1);
    expect(settled.change.delta).toBeLessThan(0);
    expect(settled.ranked.recent[0]).toMatchObject({ id: "p1", result: "loss", forfeit: true, turns: 0 });
    expect(forfeitUnfinished(settled.ranked, SEPT + 120_000)).toBeNull(); // only once
  });

  it("does nothing when no match was pending", () => {
    expect(forfeitUnfinished(placed(800), SEPT)).toBeNull();
  });

  it("finishing the match normally clears the marker without a second result", () => {
    const begun = beginRankedMatch(placed(800), pending, SEPT);
    const done = applyRankedMatch(begun, match("win", 800), SEPT).ranked;
    expect(done.pending).toBeNull();
    expect(done.wins).toBe(1);
    expect(done.losses).toBe(0);
  });

  it("survives being saved and loaded, and a hand-edited marker is checked", () => {
    const begun = beginRankedMatch(placed(800), pending, SEPT);
    expect(rankedSchema.parse(JSON.parse(JSON.stringify(begun))).pending).toEqual(pending);
    expect(rankedSchema.safeParse({ pending: { ...pending, opponentRating: -1 } }).success).toBe(false);
  });

  it("placement matches left unfinished count too, so they cannot be avoided", () => {
    const begun = beginRankedMatch(createRanked(), pending, SEPT);
    const settled = forfeitUnfinished(begun, SEPT)!;
    expect(settled.ranked.placements).toBe(1);
    expect(settled.ranked.losses).toBe(1);
  });
});

describe("the ladder is saved and moved with the profile", () => {
  it("a v2 profile migrates to v3 with an unranked, unplaced ladder", () => {
    const v2 = { ...createDefaultProfile(), version: 2, ranked: undefined };
    const parsed = parseProfile(v2);
    expect(parsed.ok).toBe(true);
    if (parsed.ok) {
      expect(parsed.migratedFrom).toBe(2);
      expect(parsed.profile.version).toBe(PROFILE_VERSION);
      expect(parsed.profile.ranked).toEqual(createRanked());
    }
    expect(MIGRATIONS[2]).toBeTypeOf("function");
  });

  it("rejects a hand-edited ladder that breaks its limits", () => {
    for (const bad of [{ rating: -5 }, { rating: 999999 }, { division: 99 }, { placements: -1 }, { season: "x".repeat(40) }]) {
      expect(rankedSchema.safeParse(bad).success).toBe(false);
    }
  });

  it("goes through a JSON backup unchanged", () => {
    const ranked = play({ ...createRanked(), season: "2026-09" }, ["win", "win", "loss", "win", "win", "win", "win"]);
    const profile = { ...createDefaultProfile(), ranked };
    const back = importBackup(exportBackup(profile));
    expect(back.ok && back.profile.ranked).toEqual(ranked);
  });

  it("the standing and personal bests survive a device transfer", () => {
    const ranked = play({ ...createRanked(), season: "2026-09" }, ["win", "win", "loss", "win", "win", "win", "win", "draw"]);
    const profile = { ...createDefaultProfile(), ranked };
    const decoded = decodeTransfer(encodeTransfer(profile, ID_TABLE), ID_TABLE);
    expect(decoded.ok).toBe(true);
    if (decoded.ok) {
      const got = decoded.profile.ranked;
      expect(got).toMatchObject({ season: "2026-09", rating: ranked.rating, placements: ranked.placements, division: ranked.division, wins: ranked.wins, losses: ranked.losses, draws: ranked.draws, streak: ranked.streak, bestStreak: ranked.bestStreak, peakRating: ranked.peakRating });
      expect(got.bests).toEqual(ranked.bests);
    }
  });

  it("a fresh profile transfers as a fresh ladder", () => {
    const decoded = decodeTransfer(encodeTransfer(createDefaultProfile(), ID_TABLE), ID_TABLE);
    expect(decoded.ok && decoded.profile.ranked).toEqual(createRanked());
  });
});
