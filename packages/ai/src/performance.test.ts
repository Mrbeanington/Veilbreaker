import { describe, expect, it } from "vitest";
import { defaultSimDeps, runBatch } from "./index";

// phase-15 performance targets: "turn resolution under 10 ms in the browser on
// mid-range devices" and "a bot move within its time budget". A whole
// simulated turn (both bots planning AND the engine resolving) is measured
// here, which is an upper bound on resolution alone, so if it clears the
// target with a wide margin on the development machine, resolution has
// plenty of room on a slower device. The limits are generous on purpose so a
// loaded CI runner does not make the test flaky.

function millisecondsPerTurn(level: "INTERMEDIATE" | "ADVANCED" | "EXPERT", matches: number): number {
  const started = performance.now();
  const { report } = runBatch({ deps: defaultSimDeps(), botA: level, botB: level, matches, seed: 77 });
  const turns = report.length.average * matches;
  return (performance.now() - started) / turns;
}

describe("turn cost (bots planning and the engine resolving, per turn)", () => {
  it("INTERMEDIATE and ADVANCED stay far below the 10 ms resolution target", () => {
    expect(millisecondsPerTurn("INTERMEDIATE", 60)).toBeLessThan(5);
    expect(millisecondsPerTurn("ADVANCED", 30)).toBeLessThan(10);
  });
  it("EXPERT, the slowest bot, still plans and resolves a turn well inside a second", () => {
    expect(millisecondsPerTurn("EXPERT", 8)).toBeLessThan(250);
  });
});
