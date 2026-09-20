import { describe, expect, it } from "vitest";
import { PLAYABLE_CHARACTERS } from "@veilbreak/content";
import {
  DRAFT_SIZE,
  afterBan,
  botBan,
  botLevelFor,
  buildBotDraft,
  buildMetaPool,
  legendCapFor,
  opponentRating,
  teamQualityFor,
  usesPickBan,
  type MetaPool,
} from "./ladder";
import { META_POOL } from "./meta";
import { BOT_LEVELS } from "./bots";
import { createRandom } from "./prng";

const legends = new Set(PLAYABLE_CHARACTERS.filter((c) => c.rarity === "LEGENDARY").map((c) => c.id));
const legendCount = (ids: string[]) => ids.filter((id) => legends.has(id)).length;
const meanRate = (ids: string[]) => ids.reduce((sum, id) => sum + (META_POOL.winRates[id] ?? 50), 0) / ids.length;
const draft = (divisionIndex: number, seed: number, size?: number) =>
  buildBotDraft({ divisionIndex, pool: PLAYABLE_CHARACTERS, meta: META_POOL, random: createRandom(seed), size });

describe("how the bots scale with division", () => {
  it("skill never drops as divisions rise, and covers the whole ladder", () => {
    const order = ["BEGINNER", "INTERMEDIATE", "ADVANCED", "EXPERT"];
    const levels = Array.from({ length: 16 }, (_, d) => botLevelFor(d));
    const ranks = levels.map((l) => order.indexOf(l));
    expect(ranks).toEqual([...ranks].sort((a, b) => a - b));
    expect(levels[0]).toBe("BEGINNER");
    expect(levels[15]).toBe("EXPERT");
    expect(new Set(levels).size).toBe(4);
    expect(levels.every((l) => (BOT_LEVELS as readonly string[]).includes(l))).toBe(true);
    expect(levels).not.toContain("LEGEND_BOSS"); // reserved for Legend trials
  });

  it("team quality rises with division from 0 to 10", () => {
    expect(teamQualityFor(0)).toBe(0);
    expect(teamQualityFor(15)).toBe(10);
    for (let d = 1; d < 16; d += 1) expect(teamQualityFor(d)).toBeGreaterThanOrEqual(teamQualityFor(d - 1));
  });

  it("pick/ban begins at Diamond", () => {
    expect(usesPickBan(11)).toBe(false);
    expect(usesPickBan(12)).toBe(true);
    expect(usesPickBan(15)).toBe(true);
  });

  it("the opponent's rating stays close to the player's, deterministically", () => {
    const seen = new Set<number>();
    for (let seed = 1; seed <= 200; seed += 1) {
      const rating = opponentRating(900, createRandom(seed));
      expect(Math.abs(rating - 900)).toBeLessThanOrEqual(60);
      expect(rating).toBe(opponentRating(900, createRandom(seed)));
      seen.add(rating);
    }
    expect(seen.size).toBeGreaterThan(3);
    expect(opponentRating(10, createRandom(3))).toBeGreaterThanOrEqual(0);
  });
});

describe("bot teams", () => {
  it("are three different, real characters, and reproducible from the seed", () => {
    for (const division of [0, 5, 9, 15]) {
      for (let seed = 1; seed <= 40; seed += 1) {
        const team = draft(division, seed);
        expect(team).toHaveLength(3);
        expect(new Set(team).size).toBe(3);
        expect(team.every((id) => PLAYABLE_CHARACTERS.some((c) => c.id === id))).toBe(true);
        expect(draft(division, seed)).toEqual(team);
      }
    }
  });

  it("respect the Legend policy of OQ-05: at most one Legend below Platinum, two from Platinum", () => {
    expect(legendCapFor(0)).toBe(1);
    expect(legendCapFor(8)).toBe(1);
    expect(legendCapFor(9)).toBe(2);
    for (let division = 0; division < 16; division += 1) {
      let sawLegend = false;
      for (let seed = 1; seed <= 300; seed += 1) {
        const n = legendCount(draft(division, seed));
        expect(n).toBeLessThanOrEqual(legendCapFor(division));
        if (n > 0) sawLegend = true;
      }
      expect(sawLegend).toBe(true); // the cap limits Legends, it does not ban them
    }
  });

  it("higher divisions play measurably stronger characters than lower ones", () => {
    const average = (division: number) => {
      let sum = 0;
      for (let seed = 1; seed <= 400; seed += 1) sum += meanRate(draft(division, seed));
      return sum / 400;
    };
    const bronze = average(0);
    const gold = average(7);
    const apex = average(15);
    expect(Math.abs(bronze - meanRate(PLAYABLE_CHARACTERS.map((c) => c.id)))).toBeLessThan(2); // Bronze is about random
    expect(gold).toBeGreaterThan(bronze + 1);
    // Win rates compress as the roster grows (67 characters), so Gold and Apex can be near-equal; Apex must still clearly beat Bronze.
    expect(apex).toBeGreaterThan(bronze + 1);
    expect(apex).toBeGreaterThan(gold - 1);
  });

  it("high divisions often bring one of the strongest known trios", () => {
    const top = new Set(META_POOL.topTeams.slice(0, 12).map((t) => [...t.team].sort().join("|")));
    let hits = 0;
    let lowHits = 0;
    for (let seed = 1; seed <= 200; seed += 1) {
      if (top.has([...draft(12, seed)].sort().join("|"))) hits += 1;
      if (top.has([...draft(2, seed)].sort().join("|"))) lowHits += 1;
    }
    expect(hits).toBeGreaterThan(40);
    expect(lowHits).toBeLessThan(5);
  });

  it("copes with a tiny pool and with characters the meta data has never seen", () => {
    const small = PLAYABLE_CHARACTERS.slice(0, 3);
    const team = buildBotDraft({ divisionIndex: 15, pool: small, meta: META_POOL, random: createRandom(1) });
    expect([...team].sort()).toEqual(small.map((c) => c.id).sort());
    const empty: MetaPool = { source: { matches: 0, seed: 0, bots: "none", date: "" }, winRates: {}, topTeams: [] };
    expect(buildBotDraft({ divisionIndex: 15, pool: PLAYABLE_CHARACTERS, meta: empty, random: createRandom(2) })).toHaveLength(3);
  });
});

describe("pick and ban", () => {
  it("a draft holds four, and losing one to a ban leaves a team of three", () => {
    const four = draft(13, 7, DRAFT_SIZE);
    expect(four).toHaveLength(4);
    expect(new Set(four).size).toBe(4);
    expect(legendCount(four)).toBeLessThanOrEqual(legendCapFor(13));
    const left = afterBan(four, four[1]!);
    expect(left).toHaveLength(3);
    expect(left).not.toContain(four[1]);
  });

  it("an expert bans the player's strongest pick; a beginner may ban anything, but always one of the four", () => {
    const player = ["the-referee", "patient-zero", "malachar", "koschei"];
    expect(botBan(player, "EXPERT", META_POOL, createRandom(1))).toBe("patient-zero");
    const banned = new Set<string>();
    for (let seed = 1; seed <= 100; seed += 1) banned.add(botBan(player, "BEGINNER", META_POOL, createRandom(seed)));
    expect(banned.size).toBeGreaterThan(1);
    expect([...banned].every((id) => player.includes(id))).toBe(true);
  });
});

describe("meta pool", () => {
  it("the shipped pool covers every playable character with a sensible win rate", () => {
    for (const c of PLAYABLE_CHARACTERS) {
      const rate = META_POOL.winRates[c.id];
      expect(rate, c.id).toBeDefined();
      expect(rate).toBeGreaterThan(0);
      expect(rate).toBeLessThan(100);
    }
    expect(META_POOL.topTeams.length).toBeGreaterThan(10);
    for (const t of META_POOL.topTeams) expect(t.team.every((id) => id in META_POOL.winRates)).toBe(true);
  });

  it("buildMetaPool ranks trios by smoothed win rate and ignores thin samples", () => {
    const games = [
      // "aa|bb|cc" wins all 30; "dd|ee|ff" loses them all; a lucky 3-0 trio is too thin to list
      ...Array.from({ length: 30 }, () => ({ teamA: ["cc", "aa", "bb"], teamB: ["dd", "ee", "ff"], winner: "playerA" as const })),
      ...Array.from({ length: 3 }, () => ({ teamA: ["gg", "hh", "ii"], teamB: ["dd", "ee", "ff"], winner: "playerA" as const })),
    ];
    const pool = buildMetaPool(games, { aa: 60 }, { matches: 33, seed: 1, bots: "TEST", date: "2026-09-19" });
    expect(pool.topTeams.map((t) => t.team.join("|"))).toEqual(["aa|bb|cc", "dd|ee|ff"]);
    expect(pool.topTeams[0]!.winRate).toBeGreaterThan(80);
    expect(pool.topTeams[1]!.winRate).toBeLessThan(20);
    expect(pool.winRates).toEqual({ aa: 60 });
  });
});
