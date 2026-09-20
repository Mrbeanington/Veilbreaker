#!/usr/bin/env node
// ADR-040: folds `vite build --mode single` (apps/web/dist-single) into ONE html file that
// works when opened straight from disk. The script and stylesheet move into the page, the icon
// becomes a data URI, the manifest link is dropped (nothing installs from a file), and the
// Content-Security-Policy is rewritten to allow exactly that inline script by hash and a blob
// worker, and nothing from the network.
/* global console, Buffer */
import { createHash } from "node:crypto";
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const dir = join(dirname(fileURLToPath(import.meta.url)), "..", "dist-single");
const indexPath = join(dir, "index.html");
let html = readFileSync(indexPath, "utf8");

const scriptTag = /<script type="module"[^>]*\ssrc="([^"]+)"[^>]*><\/script>/;
const styleTag = /<link rel="stylesheet"[^>]*\shref="([^"]+)"[^>]*>/;

const script = scriptTag.exec(html);
if (!script) throw new Error("No module script found in dist-single/index.html. Run `vite build --mode single` first.");
// Inside an inline <script>, "</script" and "<!--" would end or confuse the element.
const js = readFileSync(join(dir, script[1]), "utf8").replaceAll("</script", "<\\/script").replaceAll("<!--", "<\\!--");
html = html.replace(scriptTag, () => "");

const style = styleTag.exec(html);
if (style) {
  const css = readFileSync(join(dir, style[1]), "utf8").replaceAll("</style", "<\\/style");
  html = html.replace(styleTag, () => `<style>${css}</style>`);
}

// The icon travels inside the page; the manifest and the touch icon are for installing from a server.
const iconPath = join(dir, "icons", "icon-192.svg");
const icon = existsSync(iconPath) ? `data:image/svg+xml;base64,${readFileSync(iconPath).toString("base64")}` : "";
html = html
  .replace(/<link rel="manifest"[^>]*>\s*/, "")
  .replace(/<link rel="apple-touch-icon"[^>]*>\s*/, "")
  .replace(/<link rel="icon"[^>]*>/, () => (icon ? `<link rel="icon" href="${icon}" type="image/svg+xml" />` : ""));

const hash = createHash("sha256").update(js).digest("base64");
const csp = [
  "default-src 'none'",
  `script-src 'sha256-${hash}'`,
  "style-src 'unsafe-inline'",
  "img-src data:",
  "font-src data:",
  "worker-src blob: data:",
  "connect-src 'none'",
  "frame-src 'none'",
  "object-src 'none'",
  "base-uri 'none'",
  "form-action 'none'",
].join("; ");
html = html.replace(/<meta\s+http-equiv="Content-Security-Policy"[\s\S]*?\/>/, () => `<meta http-equiv="Content-Security-Policy" content="${csp};" />`);

// The bundle goes last in the body so the root element exists when it runs.
html = html.replace("</body>", () => `<script type="module">${js}</script>\n  </body>`);

const out = join(dir, "veilbreak.html");
writeFileSync(out, html);
console.log(`Wrote ${out} (${(Buffer.byteLength(html) / 1024).toFixed(0)} KB)`);
