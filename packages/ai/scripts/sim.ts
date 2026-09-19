import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { defaultSimDeps, parseBotLevel, renderMarkdown, runBatch } from "../src/index";

// Dev CLI: pnpm sim --matches 10000 --bots expert --seed 1
//   --bots <level>            both seats use the same level
//   --bots <levelA>:<levelB>  different levels per seat
//   --out <dir>               where to write report files (default docs/balance)
//   --label <text>            suffix for the file name, e.g. "beginner"
// Reproducible: the same seed, bots and content always give the same report.

function arg(name: string, fallback: string): string {
  const i = process.argv.indexOf(`--${name}`);
  const value = i >= 0 ? process.argv[i + 1] : undefined;
  return value ?? fallback;
}

const matches = Number(arg("matches", "1000"));
const seed = Number(arg("seed", "1"));
const [rawA = "intermediate", rawB = rawA] = arg("bots", "intermediate").split(":");
const botA = parseBotLevel(rawA);
const botB = parseBotLevel(rawB);
const outDir = arg("out", join(process.cwd(), "..", "..", "docs", "balance"));
const label = arg("label", "");

const started = Date.now();
let lastPrint = 0;
const { report } = runBatch({
  matches,
  seed,
  botA,
  botB,
  deps: defaultSimDeps(),
  onProgress: (done, total) => {
    if (Date.now() - lastPrint > 2000 || done === total) {
      lastPrint = Date.now();
      process.stdout.write(`\r${done}/${total} matches`);
    }
  },
});
process.stdout.write("\n");

const date = new Date().toISOString().slice(0, 10);
const base = `report-${date}${label ? `-${label}` : ""}`;
mkdirSync(outDir, { recursive: true });
writeFileSync(join(outDir, `${base}.json`), JSON.stringify(report, null, 2));
writeFileSync(join(outDir, `${base}.md`), renderMarkdown(report, date));

const seconds = ((Date.now() - started) / 1000).toFixed(1);
console.log(`Wrote ${join(outDir, base)}.{md,json} in ${seconds}s (${report.errors.length} engine errors)`);
if (report.errors.length > 0) process.exitCode = 1;
