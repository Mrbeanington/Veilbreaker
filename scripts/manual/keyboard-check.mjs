/* global console, process, document, getComputedStyle */
// MANUAL keyboard-only check (ADR-043): plays a tutorial turn using only Tab and Enter and reports where focus lands. Needs playwright (see cross-browser-check.mjs).
import { createServer } from "node:http";
import { readFileSync, existsSync, statSync } from "node:fs";
import { join, extname } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";
const DIST = fileURLToPath(new URL("../../apps/web/dist", import.meta.url));
const MIME = { ".html": "text/html; charset=utf-8", ".js": "text/javascript", ".css": "text/css", ".svg": "image/svg+xml", ".webmanifest": "application/manifest+json", ".woff2": "font/woff2" };
const server = createServer((req, res) => { let p = join(DIST, decodeURIComponent(new URL(req.url, "http://x").pathname)); if (existsSync(p) && statSync(p).isDirectory()) p = join(p, "index.html"); if (!existsSync(p)) { res.statusCode = 404; return res.end(); } res.setHeader("content-type", MIME[extname(p)] ?? "application/octet-stream"); res.end(readFileSync(p)); }).listen(4190);
const b = await chromium.launch();
const ctx = await b.newContext({ viewport: { width: 1100, height: 900 } });
const page = await ctx.newPage();
await page.goto("http://localhost:4190/");
await page.waitForTimeout(1200);
await page.evaluate(() => [...document.querySelectorAll("button")].find((x) => x.textContent.includes("Not now"))?.click());
await page.waitForTimeout(300);

const tip = () => page.evaluate(() => document.querySelector(".coach strong")?.innerText);
const active = () => page.evaluate(() => { const e = document.activeElement; return { text: (e?.textContent || "").trim().slice(0, 30), inEnemy: !!e?.closest(".team-column:nth-of-type(2)"), inTeam: !!e?.closest(".team-column"), tag: e?.tagName, cost: /Cost:/.test(e?.textContent || ""), confirm: /Confirm/.test(e?.textContent || ""), pass: /^Pass/.test(e?.textContent || "") }; });
async function tabUntil(pred, max = 80) { for (let i = 0; i < max; i++) { await page.keyboard.press("Tab"); const a = await active(); if (pred(a)) return a; } return null; }
await page.evaluate(() => [...document.querySelectorAll("nav button")].find((x) => x.textContent.trim() === "Play")?.click());
await page.waitForTimeout(400);
await page.evaluate(() => [...document.querySelectorAll("button")].find((x) => x.textContent.includes("Start the tutorial") || x.textContent.includes("How to play"))?.click());
await page.waitForTimeout(700);
const log = [];
for (let n = 0; n < 8; n++) {
  const t = await tip(); log.push(t);
  if (t === "Lock it in") break;
  if (t === "Choose a target") { const e = await tabUntil((a) => a.inTeam && a.tag === "BUTTON"); log.push("target focus: " + JSON.stringify(e)); if (!e) break; await page.keyboard.press("Enter"); await page.waitForTimeout(300); continue; }
  const ab = await tabUntil((a) => a.cost && a.tag === "BUTTON");
  if (!ab) { const p = await tabUntil((a) => a.pass); if (!p) break; await page.keyboard.press("Enter"); await page.waitForTimeout(250); continue; }
  await page.keyboard.press("Enter"); await page.waitForTimeout(300);
}
const c = await tabUntil((a) => a.confirm);
log.push("confirm reachable: " + !!c);
if (c) { await page.keyboard.press("Enter"); await page.waitForTimeout(3500); }
log.push("after: " + await page.evaluate(() => document.querySelector("h2.title")?.innerText));
console.log(JSON.stringify(log, null, 1));
const focusAfter = await page.evaluate(() => { const e = document.activeElement; return e ? e.tagName + ":" + (e.textContent || "").slice(0, 20) : "none"; });
console.log("focus after turn:", focusAfter);
await b.close(); server.close();
