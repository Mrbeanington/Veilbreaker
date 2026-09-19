// packages/ai: bots and headless simulation (spec/06 "AI", spec/07 "Balance
// simulation"). Runs in a Web Worker in the browser and as a Node dev CLI
// (packages/ai/scripts/sim.ts). No Node or DOM APIs live in src/.
export { BOT_LEVELS, decideActions, planHeuristic, planRandom, type BotContext, type BotLevel, type LegendBossHooks } from "./bots";
export { decideSimpleBotActions } from "./simple-bot";
export { evaluateState } from "./evaluate";
export { createRandom, type Random } from "./prng";
export {
  DETECTORS,
  defaultSimDeps,
  parseBotLevel,
  runBatch,
  runMatch,
  summarize,
  teamInput,
  type BatchConfig,
  type DetectorId,
  type MatchRecord,
  type SimReport,
} from "./simulate";
export { findings, renderMarkdown, type Finding } from "./report";
