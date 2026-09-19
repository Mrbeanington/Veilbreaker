#!/usr/bin/env node
// Enforces the hard platform constraint in CLAUDE.md: the shipped build must
// never reference an external origin or call a networking API, because there
// is no server and no external API dependency for core functionality.
//
// Scans every built app's dist/ output (skipping any dist/**/*.map files,
// which legitimately embed original TS source as a JSON string) for:
//   1. an absolute http:// or https:// URL literal
//   2. a call to fetch(, XMLHttpRequest, or `new WebSocket(`
//
// A match is allowed only when the source file path contains a segment from
// ALLOWLIST below.
//
// - "sw.js" (phase-05-local-playable.md's PWA foundation, ADR-012): a
//   hand-written, same-origin-only service worker (apps/web/sw-template.js)
//   necessarily calls `fetch(event.request)` to intercept/serve/cache the
//   app's own requests — that's what a service worker's fetch handler *is*,
//   not a call to a third party. Audited by hand once, the same way the
//   vendor chunk below is.
// - Friend-match code/link exchange (spec/06) uses no networking APIs at
//   all, and live WebRTC P2P (spec/06, "Live peer-to-peer (optional
//   stretch)") is not built yet. When phase 10 adds the optional WebRTC
//   module, add its directory here — WebRTC signaling itself is manual
//   copy/paste, so RTCPeerConnection alone should not need to appear on this
//   list; only add paths that must legitimately call fetch/XHR/WebSocket
//   (for example, an optional user-provided STUN/TURN client).
const ALLOWLIST = ["sw.js"];

// The "vendor" chunk (apps/web/vite.config.ts `build.rollupOptions.output
// .manualChunks`) holds only third-party library code (React/React-DOM),
// never anything this project wrote. It legitimately contains strings that
// would otherwise look like violations — the W3C XML/SVG/MathML namespace
// URIs DOM APIs require (e.g. "http://www.w3.org/2000/svg", never fetched,
// just an xmlns identifier) and a "https://reactjs.org/docs/error-decoder
// .html" link React embeds in its own minified error messages for a human
// to open manually, never something React fetches. Rather than pattern-match
// around a specific vendor's internals (fragile across version bumps), the
// vendor chunk is excluded from this scan entirely; audit it once by hand
// whenever a new production dependency is added to `manualChunks.vendor`.
const VENDOR_CHUNK_PATTERN = /[\\/]vendor-[^\\/]*\.[cm]?js$/;

import { readdir, readFile } from "node:fs/promises";
import { join, relative, extname } from "node:path";

const APPS_DIR = "apps";
const SCAN_EXTENSIONS = new Set([".js", ".mjs", ".cjs", ".html", ".css"]);
const URL_PATTERN = /https?:\/\/[^\s"'`)]+/g;
const NETWORK_API_PATTERN = /\bfetch\s*\(|\bXMLHttpRequest\b|\bnew\s+WebSocket\s*\(/g;

async function findDistDirs(root) {
  const found = [];
  let appNames;
  try {
    appNames = await readdir(root, { withFileTypes: true });
  } catch {
    return found;
  }
  for (const entry of appNames) {
    if (!entry.isDirectory()) continue;
    const distPath = join(root, entry.name, "dist");
    try {
      await readdir(distPath);
      found.push(distPath);
    } catch {
      // no dist/ for this app (not built, or not a buildable app) — skip
    }
  }
  return found;
}

async function walk(dir, onFile) {
  const entries = await readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      await walk(full, onFile);
    } else if (entry.isFile()) {
      await onFile(full);
    }
  }
}

function isAllowlisted(filePath) {
  const normalized = filePath.replace(/\\/g, "/");
  return ALLOWLIST.some((segment) => normalized.includes(segment));
}

async function main() {
  const distDirs = await findDistDirs(APPS_DIR);
  if (distDirs.length === 0) {
    console.error(
      "verify-client-only: no apps/*/dist directories found. Run `pnpm build` first.",
    );
    process.exit(1);
  }

  const violations = [];

  for (const distDir of distDirs) {
    await walk(distDir, async (filePath) => {
      if (extname(filePath) === ".map") return;
      if (!SCAN_EXTENSIONS.has(extname(filePath))) return;
      if (isAllowlisted(filePath)) return;
      if (VENDOR_CHUNK_PATTERN.test(filePath.replace(/\\/g, "/"))) return;

      const contents = await readFile(filePath, "utf8");
      const relPath = relative(process.cwd(), filePath);

      const urlMatches = contents.match(URL_PATTERN) ?? [];
      for (const match of urlMatches) {
        violations.push(`${relPath}: external URL literal "${match}"`);
      }

      const apiMatches = contents.match(NETWORK_API_PATTERN) ?? [];
      for (const match of apiMatches) {
        violations.push(`${relPath}: disallowed networking API "${match.trim()}"`);
      }
    });
  }

  if (violations.length > 0) {
    console.error("verify-client-only: the build violates the client-only platform constraint:\n");
    for (const v of violations) console.error(`  - ${v}`);
    console.error(
      "\nSee CLAUDE.md 'HARD PLATFORM CONSTRAINT: client-only'. If this is the optional P2P module " +
        "from spec/06, add its dist path segment to ALLOWLIST in scripts/verify-client-only.mjs.",
    );
    process.exit(1);
  }

  console.log(`verify-client-only: OK (scanned ${distDirs.length} app build(s), no violations).`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
