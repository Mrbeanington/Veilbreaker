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
const BUDGETS = { initialGzip: 340 * KB, workerGzip: 190 * KB, imagesTotal: 10240 * KB };

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
// ADR-042/047: portrait and splash pictures are precached for offline play, so their total size is capped too.
const images = (await readdir(DIST)).filter((n) => /.(webp|png|jpe?g)$/i.test(n));
let imageBytes = 0;
for (const n of images) imageBytes += (await readFile(join(DIST, n))).length;
console.log(`images: ${images.length} file(s), ${(imageBytes / KB).toFixed(0)} KB (budget ${BUDGETS.imagesTotal / KB} KB)`);
const failures = [];
if (imageBytes > BUDGETS.imagesTotal) failures.push("portrait and splash images are over budget");
if (initial > BUDGETS.initialGzip) failures.push("initial bundle is over budget");
if (worker > BUDGETS.workerGzip) failures.push("bot worker is over budget");
if (failures.length > 0) {
  console.error(`verify-bundle-budget: FAILED: ${failures.join("; ")}`);
  process.exit(1);
}
console.log("verify-bundle-budget: OK");
