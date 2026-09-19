import { describe, expect, it } from "vitest";
import { PLAYABLE_CHARACTERS, defaultMatchFormat } from "@veilbreak/content";
import { createBattle, resolveTurn } from "@veilbreak/engine";
import { BOT_LEVELS, decideActions, type BotContext, type LegendBossHooks } from "./bots";
import { createRandom } from "./prng";
import { defaultSimDeps, runBatch, teamInput } from "./simulate";

const deps = defaultSimDeps();
const teamA = PLAYABLE_CHARACTERS.slice(0, 3);
const teamB = PLAYABLE_CHARACTERS.slice(3, 6);

function freshState(seed = 3) {
  return createBattle([teamInput("playerA", teamA), teamInput("playerB", teamB)], seed, {
    balanceVersionId: "test",
    matchFormat: defaultMatchFormat,
    energyRules: deps.energyRules,
  });
}
const ctx = (seed = 1, extra: Partial<BotContext> = {}): BotContext => ({ deps, random: createRandom(seed), ...extra });

describe("bot ladder", () => {
  it.each(BOT_LEVELS)("%s always returns a plan the engine accepts", (level) => {
    const state = freshState();
    const actions = decideActions(level, state, "playerA", ctx());
    const result = resolveTurn(state, actions, decideActions("BEGINNER", state, "playerB", ctx(2)), deps);
    expect(result.ok).toBe(true);
  });

  it("never spends more energy than the team has", () => {
    for (let seed = 1; seed <= 20; seed += 1) {
      const state = freshState(seed);
      for (const level of BOT_LEVELS) {
        const plan = decideActions(level, state, "playerA", ctx(seed));
        expect(resolveTurn(state, plan, [], deps).ok).toBe(true);
      }
    }
  });

  it("is deterministic for a fixed seed when no time budget is set", () => {
    const state = freshState();
    expect(decideActions("EXPERT", state, "playerA", ctx(9))).toEqual(decideActions("EXPERT", state, "playerA", ctx(9)));
  });

  it("stops searching when the time budget is spent but still returns a legal plan", () => {
    const state = freshState();
    let clock = 0;
    const plan = decideActions("EXPERT", state, "playerA", ctx(1, { budgetMs: 0, now: () => (clock += 10) }));
    expect(resolveTurn(state, plan, [], deps).ok).toBe(true);
  });

  it("INTERMEDIATE beats BEGINNER over mirrored seats", () => {
    const run = (botA: "INTERMEDIATE" | "BEGINNER", botB: "INTERMEDIATE" | "BEGINNER") =>
      runBatch({ matches: 150, seed: 11, botA, botB, deps }).report.sides;
    const first = run("INTERMEDIATE", "BEGINNER");
    const second = run("BEGINNER", "INTERMEDIATE");
    const smart = first.playerAWins + second.playerBWins;
    const random = first.playerBWins + second.playerAWins;
    expect(smart).toBeGreaterThan(random * 1.15);
  });

  it("ADVANCED beats BEGINNER over mirrored seats", () => {
    const first = runBatch({ matches: 60, seed: 5, botA: "ADVANCED", botB: "BEGINNER", deps }).report.sides;
    const second = runBatch({ matches: 60, seed: 5, botA: "BEGINNER", botB: "ADVANCED", deps }).report.sides;
    expect(first.playerAWins + second.playerBWins).toBeGreaterThan(first.playerBWins + second.playerAWins);
  });

  it("LEGEND_BOSS calls its PvE hooks and the result still validates", () => {
    const calls: string[] = [];
    const boss: LegendBossHooks = {
      prepareState: (s) => {
        calls.push("prepare");
        return s;
      },
      adjustActions: (_s, _p, a) => {
        calls.push("adjust");
        return a;
      },
    };
    const state = freshState();
    const plan = decideActions("LEGEND_BOSS", state, "playerA", ctx(1, { boss }));
    expect(calls).toEqual(["prepare", "adjust"]);
    expect(resolveTurn(state, plan, [], deps).ok).toBe(true);
  });
});
