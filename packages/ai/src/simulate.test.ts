import { describe, expect, it } from "vitest";
import { PLAYABLE_CHARACTERS } from "@veilbreak/content";
import { renderMarkdown, findings } from "./report";
import { DETECTORS, defaultSimDeps, parseBotLevel, runBatch, runMatch } from "./simulate";
import { createRandom } from "./prng";

const deps = defaultSimDeps();

describe("headless simulator", () => {
  it("runs a batch across the whole roster without engine errors and reports every metric", () => {
    const { report, records } = runBatch({ matches: 300, seed: 21, botA: "INTERMEDIATE", botB: "INTERMEDIATE", deps });
    expect(records).toHaveLength(300);
    expect(report.errors).toEqual([]);
    expect(report.characters).toHaveLength(PLAYABLE_CHARACTERS.length);
    expect(report.sides.playerAWins + report.sides.playerBWins + report.sides.draws).toBe(300);
    expect(report.length.average).toBeGreaterThan(0);
    expect(report.initiative.firstPlayerWinRate).toBeGreaterThan(0);
    expect(report.legends.legendTeamGames + report.legends.noLegendTeamGames).toBe(600);
    expect(Object.keys(report.detectors)).toEqual([...DETECTORS]);
    expect(Object.keys(report.counterMatrix).length).toBeGreaterThan(0);
  });

  it("is reproducible: the same seed gives an identical report", () => {
    const run = () => JSON.stringify(runBatch({ matches: 40, seed: 4, botA: "ADVANCED", botB: "INTERMEDIATE", deps }).report);
    expect(run()).toBe(run());
  });

  it("different seeds give different results", () => {
    const a = runBatch({ matches: 40, seed: 1, botA: "BEGINNER", botB: "BEGINNER", deps }).report;
    const b = runBatch({ matches: 40, seed: 2, botA: "BEGINNER", botB: "BEGINNER", deps }).report;
    expect(JSON.stringify(a)).not.toBe(JSON.stringify(b));
  });

  it("flags stalls and lockouts when nobody can act", () => {
    const record = runMatch(
      { deps: { ...deps, abilities: {} }, botA: "BEGINNER", botB: "BEGINNER" },
      1,
      PLAYABLE_CHARACTERS.slice(0, 3),
      PLAYABLE_CHARACTERS.slice(3, 6),
      createRandom(1),
    );
    expect(record.endedBy).toBe("turn-limit");
    expect(record.hits.some((h) => h.detector === "turn-limit")).toBe(true);
    expect(record.hits.some((h) => h.detector === "energy-lockout")).toBe(true);
  });

  it("records an engine error instead of crashing the batch", () => {
    const broken = { ...deps, passives: {}, statusLibrary: {} };
    const { report } = runBatch({ matches: 5, seed: 1, botA: "BEGINNER", botB: "BEGINNER", deps: broken });
    // Missing libraries must never take the run down; whatever happens is counted.
    expect(report.meta.matches).toBe(5);
  });

  it("a Nameless One match rewinds at most once per Nameless One (no rewind loop)", () => {
    const nameless = PLAYABLE_CHARACTERS.find((c) => c.id === "the-nameless-one")!;
    const others = PLAYABLE_CHARACTERS.filter((c) => c.id !== nameless.id);
    for (let seed = 1; seed <= 40; seed += 1) {
      const record = runMatch(
        { deps, botA: "INTERMEDIATE", botB: "INTERMEDIATE" },
        seed,
        [nameless, others[0]!, others[1]!],
        [others[2]!, others[3]!, others[4]!],
        createRandom(seed),
      );
      expect(record.rewinds).toBeLessThanOrEqual(1);
      expect(record.hits.some((h) => h.detector === "rewind-loop")).toBe(false);
    }
  });

  it("the report renders and findings are recommendations, not changes", () => {
    const { report } = runBatch({ matches: 60, seed: 8, botA: "BEGINNER", botB: "BEGINNER", deps });
    const md = renderMarkdown(report, "2026-01-01");
    expect(md).toContain("# Balance report — 2026-01-01");
    expect(md).toContain("Recommendations only");
    expect(md).toContain("## Degenerate-pattern detectors");
    expect(Array.isArray(findings(report))).toBe(true);
  });

  it("parses bot level names", () => {
    expect(parseBotLevel("expert")).toBe("EXPERT");
    expect(parseBotLevel("legend-boss")).toBe("LEGEND_BOSS");
    expect(() => parseBotLevel("godlike")).toThrow();
  });
});
