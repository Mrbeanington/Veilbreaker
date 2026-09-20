/* global console, setTimeout */
// MANUAL cross-browser check (OQ-106, ADR-040). Not part of `pnpm ci`: it needs browsers that are
// not project dependencies. Run `pnpm build && pnpm build:single`, then in a scratch folder
// `npm i playwright && npx playwright install chromium firefox webkit`, and run this file with node.
// For each engine it (A) loads the built app over http, waits for the service worker, STOPS the
// server, reloads and plays a tutorial turn against the bot, and (B) opens the single file from
// disk (file://), plays a turn (the inlined bot worker) and reloads to check the save.
import { createServer } from "node:http";
import { readFileSync, existsSync, statSync } from "node:fs";
import { join, extname } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { chromium, firefox, webkit } from "playwright";

const ROOT = fileURLToPath(new URL("../../apps/web", import.meta.url));
const DIST = join(ROOT, "dist");
const SINGLE = join(ROOT, "dist-single", "veilbreak.html");
const MIME = { ".html": "text/html; charset=utf-8", ".js": "text/javascript", ".css": "text/css", ".svg": "image/svg+xml", ".webmanifest": "application/manifest+json", ".woff2": "font/woff2", ".json": "application/json" };

const makeServer = () => createServer((req, res) => {
  const url = new URL(req.url, "http://x");
  let p = join(DIST, decodeURIComponent(url.pathname));
  if (existsSync(p) && statSync(p).isDirectory()) p = join(p, "index.html");
  if (!existsSync(p)) { res.statusCode = 404; return res.end("nope"); }
  res.setHeader("content-type", MIME[extname(p)] ?? "application/octet-stream");
  res.end(readFileSync(p));
});
let server;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// Plays the tutorial's first turn and returns what the page shows afterwards.
async function playFirstTurn(page) {
  await page.evaluate(async () => {
    const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
    const btn = (t) => [...document.querySelectorAll("button")].find((b) => b.textContent.includes(t));
    btn("Not now")?.click();
    await sleep(400);
    (btn("Start the tutorial") ?? btn("How to play")).click();
    await sleep(800);
  });
  return page.evaluate(async () => {
    const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
    const tip = () => document.querySelector(".coach strong")?.innerText;
    for (let n = 0; n < 14; n += 1) {
      if (tip() === "Choose a target") {
        for (const c of document.querySelectorAll(".team-column button, .team-column [role=button]")) {
          c.click();
          await sleep(120);
          if (tip() !== "Choose a target") break;
        }
        continue;
      }
      if (tip() === "Lock it in") break;
      const ab = [...document.querySelectorAll(".panel button")].find((b) => /Cost:/.test(b.textContent) && !b.disabled);
      if (ab) ab.click();
      else [...document.querySelectorAll("button")].find((b) => b.textContent.startsWith("Pass"))?.click();
      await sleep(250);
    }
    [...document.querySelectorAll("button")].find((b) => b.textContent.includes("Confirm"))?.click();
    await sleep(4000);
    return { heading: document.querySelector("h2.title")?.innerText, log: document.querySelector(".panel:last-of-type")?.innerText.slice(0, 100).replace(/\n/g, " | ") };
  });
}

const results = [];
for (const [name, type] of [["chromium", chromium], ["firefox", firefox], ["webkit", webkit]]) {
  const row = { browser: name };
  let browser;
  try {
    browser = await type.launch();
    server = makeServer(); await new Promise((r) => server.listen(4180, r));
    // ---- A: served over http, offline after first load
    const ctx = await browser.newContext();
    const page = await ctx.newPage();
    const errors = [];
    page.on("pageerror", (e) => errors.push(String(e).slice(0, 120)));
    await page.goto("http://localhost:4180/", { waitUntil: "load" });
    row.swSupported = await page.evaluate(() => "serviceWorker" in navigator);
    row.swActive = await page.evaluate(async () => {
      if (!("serviceWorker" in navigator)) return false;
      const reg = await Promise.race([navigator.serviceWorker.ready, new Promise((r) => setTimeout(() => r(null), 8000))]);
      return !!reg?.active;
    });
    await sleep(1500);
    await page.reload({ waitUntil: "load" });
    row.controlled = await page.evaluate(() => !!navigator.serviceWorker?.controller);
    row.cacheEntries = await page.evaluate(async () => { const ks = await caches.keys(); let n = 0; for (const k of ks) n += (await (await caches.open(k)).keys()).length; return n; });
    // Really offline: the server is stopped, so nothing can answer but the service worker.
    server.closeAllConnections(); await new Promise((r) => server.close(r));
    try {
      await page.reload({ waitUntil: "load", timeout: 15000 });
      await sleep(1000);
      row.offlineLoads = await page.evaluate(() => !!document.querySelector("#root")?.children.length);
      row.offlineTurn = await playFirstTurn(page);
    } catch (e) {
      row.offlineLoads = false;
      row.offlineError = String(e).slice(0, 140);
    }
    row.pageErrors = errors;
    await ctx.close();

    // ---- B: the single file opened from disk
    const ctx2 = await browser.newContext();
    const p2 = await ctx2.newPage();
    const errors2 = [];
    p2.on("pageerror", (e) => errors2.push(String(e).slice(0, 120)));
    p2.on("console", (m) => { if (m.type() === "error") errors2.push("console: " + m.text().slice(0, 140)); });
    await p2.goto(pathToFileURL(SINGLE).href, { waitUntil: "load" });
    await sleep(1200);
    row.fileLoads = await p2.evaluate(() => !!document.querySelector("#root")?.children.length);
    try { row.fileTurn = await playFirstTurn(p2); } catch (e) { row.fileTurnError = String(e).slice(0, 140); }
    // the save survives a reload of the same file
    await p2.reload({ waitUntil: "load" });
    await sleep(1200);
    row.fileSaveKept = await p2.evaluate(() => !document.body.innerText.includes("Keep your progress safe") || false);
    row.fileErrors = errors2;
    await ctx2.close();
  } catch (e) {
    row.fatal = String(e).slice(0, 200);
  } finally {
    await browser?.close();
  }
  results.push(row);
  console.log(JSON.stringify(row));
}
