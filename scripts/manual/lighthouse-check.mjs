/* global console, process, setTimeout, clearTimeout */
// MANUAL Lighthouse run (OQ-106). Needs `npm i playwright lighthouse` and `npx playwright install chromium` in a scratch folder.
// Serves apps/web/dist (run `pnpm build` first) and audits it in Playwright's Chromium. Not part of `pnpm ci`.
import { createServer } from "node:http";
import { readFileSync, existsSync, statSync, writeFileSync } from "node:fs";
import { join, extname } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";
import lighthouse from "lighthouse";
const DIST = fileURLToPath(new URL("../../apps/web/dist", import.meta.url));
const MIME = { ".html": "text/html; charset=utf-8", ".js": "text/javascript", ".css": "text/css", ".svg": "image/svg+xml", ".webmanifest": "application/manifest+json", ".woff2": "font/woff2" };
const server = createServer((req, res) => { let p = join(DIST, decodeURIComponent(new URL(req.url, "http://x").pathname)); if (existsSync(p) && statSync(p).isDirectory()) p = join(p, "index.html"); if (!existsSync(p)) { res.statusCode = 404; return res.end(); } res.setHeader("content-type", MIME[extname(p)] ?? "application/octet-stream"); res.end(readFileSync(p)); }).listen(4191);
const b = await chromium.launch({ args: ["--remote-debugging-port=9444"] });
const timer = setTimeout(() => { console.log("TIMEOUT"); process.exit(2); }, 240000);
try {
  const r = await lighthouse("http://localhost:4191/", { port: 9444, output: "json", logLevel: "error", onlyCategories: ["performance", "accessibility", "best-practices"], throttlingMethod: "provided", maxWaitForLoad: 20000 });
  const lhr = r.lhr;
  for (const [k, v] of Object.entries(lhr.categories)) console.log(k, Math.round(v.score * 100));
  for (const k of ["first-contentful-paint", "largest-contentful-paint", "total-blocking-time", "cumulative-layout-shift", "interactive"]) console.log(k, lhr.audits[k]?.displayValue);
  console.log("failed:", Object.values(lhr.audits).filter((a) => a.score === 0).map((a) => a.id).join(", "));
  console.log("partial:", Object.values(lhr.audits).filter((a) => a.score !== null && a.score > 0 && a.score < 0.9 && a.scoreDisplayMode === "numeric").map((a) => `${a.id}=${a.score}`).join(", "));
  writeFileSync("lh.json", JSON.stringify(lhr));
} catch (e) { console.log("ERR", String(e).slice(0, 300)); }
clearTimeout(timer); await b.close(); server.close();
