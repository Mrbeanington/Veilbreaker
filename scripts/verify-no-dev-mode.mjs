#!/usr/bin/env node
// phase-12 acceptance: "A production build contains no dev-mode code."
//
// 1. The normal production build (apps/web/dist) must not contain the dev
//    tools: the marker string, the workbench's text, or the dev worker file.
// 2. Self-test, so the check cannot pass by accident: a build made on purpose
//    with VITE_DEV_MODE=1 into a temporary folder MUST contain them.
//
// Run after `pnpm build`.
import { execSync } from "node:child_process";
import { mkdtempSync, rmSync } from "node:fs";
import { readdir, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

const MARKERS = ["veilbreak-dev-mode-marker", "Balance workbench", "Developer mode. Drafts stay in this browser"];
const FILE_PATTERN = /(^|[\\/])sim\.worker-|DevMode/;
const SCAN = new Set([".js", ".mjs", ".html", ".css", ".map"]);

async function walk(dir) {
  const out = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...(await walk(path)));
    else out.push(path);
  }
  return out;
}

async function findDevCode(dir) {
  const hits = [];
  for (const file of await walk(dir)) {
    if (FILE_PATTERN.test(file)) hits.push(`file name: ${file}`);
    const ext = file.slice(file.lastIndexOf("."));
    if (!SCAN.has(ext)) continue;
    const text = await readFile(file, "utf8");
    for (const marker of MARKERS) if (text.includes(marker)) hits.push(`"${marker}" in ${file}`);
  }
  return hits;
}

const prodDir = join("apps", "web", "dist");
const prodHits = await findDevCode(prodDir).catch(() => {
  console.error(`verify-no-dev-mode: ${prodDir} not found. Run "pnpm build" first.`);
  process.exit(2);
});
if (prodHits.length > 0) {
  console.error("verify-no-dev-mode: FAILED. The production build contains dev-mode code:");
  for (const hit of prodHits) console.error(`  - ${hit}`);
  process.exit(1);
}

// Self-test: the same build with the dev flag on must contain the markers.
const temp = mkdtempSync(join(tmpdir(), "veilbreak-devcheck-"));
try {
  execSync(`pnpm exec vite build --outDir "${temp}" --emptyOutDir`, {
    cwd: join("apps", "web"),
    stdio: "ignore",
    env: { ...process.env, VITE_DEV_MODE: "1" },
  });
  const devHits = await findDevCode(temp);
  if (devHits.length === 0) {
    console.error("verify-no-dev-mode: FAILED self-test. A build with VITE_DEV_MODE=1 shows no dev-mode code, so this check cannot be trusted.");
    process.exit(1);
  }
} finally {
  rmSync(temp, { recursive: true, force: true });
}

console.log("verify-no-dev-mode: OK (production build has no dev-mode code; a VITE_DEV_MODE=1 build does).");
