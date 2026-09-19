import { applyBalanceDraft, baseLibraries, type BalanceDraft } from "@veilbreak/content";
import { defaultSimDeps, findings, playablePool, runBatch, type BotLevel, type Finding, type SimReport } from "@veilbreak/ai";

// Developer-only (phase-12): runs the headless simulator against a balance
// draft. Shared by the Worker and by the inline fallback used where Workers do
// not exist (tests). Produces recommendations only; it never edits a number.

export const DEV_MODE_MARKER = "veilbreak-dev-mode-marker";

export interface SimRequest {
  /** null simulates the shipped balance. */
  draft: BalanceDraft | null;
  matches: number;
  seed: number;
  bot: BotLevel;
}

export type SimResult = { ok: true; report: SimReport; findings: Finding[] } | { ok: false; errors: string[] };

export function simulateBalance(req: SimRequest, onProgress?: (done: number, total: number) => void): SimResult {
  const base = baseLibraries();
  let libs = base;
  if (req.draft) {
    const applied = applyBalanceDraft(base, req.draft);
    if (!applied.ok) return { ok: false, errors: applied.errors };
    libs = applied.libs;
  }
  const { report } = runBatch({
    matches: req.matches,
    seed: req.seed,
    botA: req.bot,
    botB: req.bot,
    deps: defaultSimDeps(libs),
    pool: playablePool(libs),
    onProgress,
  });
  return { ok: true, report, findings: findings(report) };
}

export type Flag = "high" | "low" | null;

// The same wide bands the simulation report uses (packages/ai/src/report.ts):
// a flag is a prompt to look, not a verdict, because situational characters
// need not sit at 50%.
export const OUTLIER_HIGH = 60;
export const OUTLIER_LOW = 40;
export const flagFor = (winRate: number): Flag => (winRate >= OUTLIER_HIGH ? "high" : winRate <= OUTLIER_LOW ? "low" : null);

export interface CompareRow {
  id: string;
  base: number;
  draft: number;
  delta: number;
  flag: Flag;
}

/** Character win rates side by side, biggest movers first. */
export function compareReports(base: SimReport, draft: SimReport): CompareRow[] {
  const baseRates = new Map(base.characters.map((c) => [c.id, c.winRate]));
  return draft.characters
    .map((c) => {
      const before = baseRates.get(c.id) ?? 0;
      return { id: c.id, base: before, draft: c.winRate, delta: Math.round((c.winRate - before) * 10) / 10, flag: flagFor(c.winRate) };
    })
    .sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta) || a.id.localeCompare(b.id));
}
