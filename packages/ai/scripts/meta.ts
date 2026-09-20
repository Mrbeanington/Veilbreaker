import { writeFileSync } from "node:fs";
import { join } from "node:path";
import { CURRENT_BALANCE_VERSION_ID, baseLibraries, librariesForVersion } from "@veilbreak/content";
import { defaultSimDeps, runBatch } from "../src/simulate";
import { buildMetaPool } from "../src/ladder";

// Dev CLI: pnpm meta --matches 60000 --seed 11
// Simulates random teams (INTERMEDIATE bots on both sides), then writes the
// ladder's meta pool: character win rates and the strongest trios. Re-run it
// whenever the balance changes; the ladder reads packages/ai/src/meta-pool.json.

function arg(name: string, fallback: string): string {
  const i = process.argv.indexOf(`--${name}`);
  return (i >= 0 ? process.argv[i + 1] : undefined) ?? fallback;
}

const matches = Number(arg("matches", "60000"));
const seed = Number(arg("seed", "11"));
const out = join(process.cwd(), "src", "meta-pool.json");

const started = Date.now();
let lastPrint = 0;
const { report, records } = runBatch({
  matches,
  seed,
  botA: "INTERMEDIATE",
  botB: "INTERMEDIATE",
  // The ladder meta follows the newest published balance, not whatever the source files hold.
  deps: defaultSimDeps(librariesForVersion(CURRENT_BALANCE_VERSION_ID) ?? baseLibraries()),
  onProgress: (done, total) => {
    if (Date.now() - lastPrint > 2000 || done === total) {
      lastPrint = Date.now();
      process.stdout.write(`\r${done}/${total} matches`);
    }
  },
});
process.stdout.write("\n");

const winRates = Object.fromEntries(report.characters.map((c) => [c.id, c.winRate]));
// With n characters there are n(n-1)(n-2)/6 trios; ask for about 60% of the average games per trio.
const n = report.characters.length;
const trios = (n * (n - 1) * (n - 2)) / 6;
const minGames = Math.max(3, Math.round(((matches * 2) / trios) * 0.6));
const pool = buildMetaPool(records, winRates, { matches, seed, bots: "INTERMEDIATE", date: new Date().toISOString().slice(0, 10) }, minGames);
writeFileSync(out, `${JSON.stringify(pool, null, 2)}\n`);
console.log(`Wrote ${out}: ${Object.keys(winRates).length} characters, ${pool.topTeams.length} top teams, ${((Date.now() - started) / 1000).toFixed(1)}s, ${report.errors.length} engine errors`);
if (report.errors.length > 0) process.exitCode = 1;
