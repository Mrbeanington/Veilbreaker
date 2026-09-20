#!/usr/bin/env node
// phase-15 performance target: "a reasonable initial bundle". Measures the
// gzip size of every built script in apps/web/dist/assets and fails when the
// initial download (everything except the bot worker, which loads only when a
// match starts) or the worker grows past its budget. Budgets are deliberately a
// little above today's sizes, so a large accidental addition fails the build
// while normal growth does not. Raise a budget only with a note in DECISIONS.md.
import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import { gzipSync } from "node:zlib";

const DIST = join("apps", "web", "dist", "assets");
const KB = 1024;
const BUDGETS = { initialGzip: 340 * KB, workerGzip: 190 * KB };

let names;
try {
  names = (await readdir(DIST)).filter((n) => n.endsWith(".js"));
} catch {
  console.error("verify-bundle-budget: apps/web/dist/assets not found. Run `pnpm build` first.");
  process.exit(1);
}

let initial = 0;
let worker = 0;
const rows = [];
for (const name of names) {
  const gz = gzipSync(await readFile(join(DIST, name)), { level: 9 }).length;
  rows.push(`  ${name}: ${(gz / KB).toFixed(1)} KB gzip`);
  if (/^bot\.worker|\.worker-/.test(name)) worker += gz;
  else initial += gz;
}
console.log(rows.join("\n"));
console.log(`initial: ${(initial / KB).toFixed(1)} KB gzip (budget ${BUDGETS.initialGzip / KB} KB); worker: ${(worker / KB).toFixed(1)} KB gzip (budget ${BUDGETS.workerGzip / KB} KB)`);
const failures = [];
if (initial > BUDGETS.initialGzip) failures.push("initial bundle is over budget");
if (worker > BUDGETS.workerGzip) failures.push("bot worker is over budget");
if (failures.length > 0) {
  console.error(`verify-bundle-budget: FAILED: ${failures.join("; ")}`);
  process.exit(1);
}
console.log("verify-bundle-budget: OK");
