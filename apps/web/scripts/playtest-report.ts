import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, resolve } from "node:path";
import { decodeReport, type Report } from "../src/playtest/report";

// Usage: pnpm playtest:report <file or folder> [...]
// Reads report codes (VBP1.…) from text files, or from a folder of them, one code per line or per file,
// and prints a summary per tester plus totals: where they stopped, how matches went, what they said.
const inputs = process.argv.slice(2).map((p) => resolve(process.env.INIT_CWD ?? process.cwd(), p));
if (inputs.length === 0) {
  console.error("usage: pnpm playtest:report <file or folder> [...]");
  process.exit(1);
}

const files: string[] = [];
for (const path of inputs) {
  if (statSync(path).isDirectory()) files.push(...readdirSync(path).map((f) => join(path, f)).filter((f) => statSync(f).isFile()));
  else files.push(path);
}
const codes = files.flatMap((f) => readFileSync(f, "utf8").match(/VBP1\.[A-Za-z0-9_-]+/g) ?? []);
const reports = codes.map((c) => decodeReport(c)).filter((r): r is Report => r !== null);
console.log(`${reports.length} report(s) read from ${codes.length} code(s) in ${files.length} file(s).\n`);

const pct = (n: number, d: number) => (d === 0 ? "n/a" : `${Math.round((100 * n) / d)}%`);
const median = (xs: number[]) => (xs.length === 0 ? null : [...xs].sort((a, b) => a - b)[Math.floor(xs.length / 2)]);
const avg = (xs: number[]) => (xs.length === 0 ? null : Math.round((10 * xs.reduce((a, b) => a + b, 0)) / xs.length) / 10);

reports.forEach((r, i) => {
  const f = r.feedback;
  console.log(`Tester ${i + 1}: level ${r.progress.level}, ${r.progress.matches} match(es), tutorial ${r.progress.tutorial}${r.funnel.tutorialFinished ? " (finished)" : ""}`);
  console.log(`  ${r.build.width}x${r.build.height}${r.build.touch ? " touch" : ""}, balance ${r.build.balance}, ${r.funnel.sessions} session(s), ${r.funnel.matchesFinished} finished of ${r.funnel.matchesStarted} started`);
  if (r.errors.length) console.log(`  ERRORS: ${r.errors.join(" | ")}`);
  if (f) console.log(`  fun ${f.fun}/5, clear ${f.clear}/5, tutorial ${f.tutorial}, again ${f.again}${f.comment ? `, said: "${f.comment}"` : ""}`);
});

const all = reports.flatMap((r) => r.matches).filter((m) => !m.tutorial && m.mode !== "hotseat");
const fb = reports.map((r) => r.feedback).filter((x): x is NonNullable<Report["feedback"]> => x !== undefined);
console.log("\nTotals");
console.log(`  tutorial: started ${pct(reports.filter((r) => r.funnel.tutorialStarted).length, reports.length)}, finished ${pct(reports.filter((r) => r.funnel.tutorialFinished).length, reports.length)}, skipped ${pct(reports.filter((r) => r.funnel.tutorialSkipped).length, reports.length)}`);
console.log(`  seconds to first match (median): ${median(reports.map((r) => r.funnel.secondsToFirstMatch).filter((x): x is number => x !== null))}`);
console.log(`  finished matches per tester (avg): ${avg(reports.map((r) => r.funnel.matchesFinished))}`);
console.log(`  win rate vs bots: ${pct(all.filter((m) => m.result === "win").length, all.length)} of ${all.length} match(es); median length ${median(all.map((m) => m.turns))} turns, ${median(all.map((m) => m.seconds))} seconds`);
console.log(`  fun ${avg(fb.map((x) => x.fun))}/5, clear ${avg(fb.map((x) => x.clear))}/5; would play again: yes ${fb.filter((x) => x.again === "yes").length}, maybe ${fb.filter((x) => x.again === "maybe").length}, no ${fb.filter((x) => x.again === "no").length}`);
const screens: Record<string, number> = {};
for (const r of reports) for (const [k, v] of Object.entries(r.screens)) screens[k] = (screens[k] ?? 0) + v;
console.log(`  screens opened: ${Object.entries(screens).sort((a, b) => b[1] - a[1]).map(([k, v]) => `${k} ${v}`).join(", ") || "none"}`);
const errors = reports.flatMap((r) => r.errors);
console.log(`  errors: ${errors.length === 0 ? "none" : [...new Set(errors)].join(" | ")}`);
