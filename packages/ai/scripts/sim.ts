import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { CURRENT_BALANCE_VERSION_ID, applyBalanceDraft, baseLibraries, librariesForVersion } from "@veilbreak/content";
import { defaultSimDeps, parseBotLevel, playablePool, renderMarkdown, runBatch } from "../src/index";

// Dev CLI: pnpm sim --matches 10000 --bots expert --seed 1
//   --bots <level>            both seats use the same level
//   --bots <levelA>:<levelB>  different levels per seat
//   --out <dir>               where to write report files (default docs/balance)
//   --balance <file>          simulate a balance draft exported from dev mode, applied to the release-1 base (validated first)
// Without --balance the simulation uses the newest published balance version.
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

const balanceFile = arg("balance", "");
let libs = librariesForVersion(CURRENT_BALANCE_VERSION_ID) ?? baseLibraries();
if (balanceFile) {
  const applied = applyBalanceDraft(baseLibraries(), JSON.parse(readFileSync(balanceFile, "utf8")));
  if (!applied.ok) {
    console.error(["Balance file rejected:", ...applied.errors.map((e) => `  - ${e}`)].join("\n"));
    process.exit(2);
  }
  libs = applied.libs;
  console.log(`Simulating balance draft ${balanceFile}: ${applied.diff.length} change(s).`);
}

const started = Date.now();
let lastPrint = 0;
const { report } = runBatch({
  matches,
  seed,
  botA,
  botB,
  deps: defaultSimDeps(libs),
  pool: playablePool(libs),
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
