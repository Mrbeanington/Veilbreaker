// packages/ai: bots and headless simulation (spec/06 "AI"). Runs in a Web
// Worker in the browser and as a Node dev CLI for simulation runs
// (CLAUDE.md tech stack). Phase 00 is scaffolding only; bot behavior lands
// in Phase 07.
export const BOT_LEVELS = ["BEGINNER", "INTERMEDIATE", "ADVANCED", "EXPERT", "LEGEND_BOSS"] as const;
export type BotLevel = (typeof BOT_LEVELS)[number];
