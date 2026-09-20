#!/usr/bin/env node
// ADR-040: the single-file build must really be one self-contained page.
/* global Buffer */
import { readFileSync, existsSync } from "node:fs";

const file = "apps/web/dist-single/veilbreak.html";
if (!existsSync(file)) {
  console.error(`verify-single-file: ${file} is missing. Run \`pnpm build:single\` first.`);
  process.exit(1);
}
const html = readFileSync(file, "utf8");
const problems = [];

const tags = [...html.matchAll(/<(script|link|img|iframe|source|video|audio|object|embed)\b[^>]*>/gi)].map((m) => m[0]);
for (const tag of tags) {
  if (/<script\b[^>]*\ssrc=/i.test(tag)) problems.push(`external script: ${tag.slice(0, 80)}`);
  if (/<link\b[^>]*rel="(stylesheet|manifest|modulepreload|preload)"/i.test(tag)) problems.push(`external link: ${tag.slice(0, 80)}`);
  const ref = /\s(?:src|href)="([^"]*)"/i.exec(tag)?.[1];
  if (ref && !ref.startsWith("data:") && !ref.startsWith("#")) problems.push(`external reference: ${tag.slice(0, 80)}`);
}
const csp = /http-equiv="Content-Security-Policy"\s+content="([^"]+)"/.exec(html)?.[1] ?? "";
if (!csp) problems.push("no Content-Security-Policy");
if (/https?:|\*|unsafe-eval/.test(csp)) problems.push(`the policy allows the network or eval: ${csp}`);
if (!/script-src 'sha256-/.test(csp)) problems.push("scripts are not pinned by hash");
if (/script-src[^;]*'unsafe-inline'/.test(csp)) problems.push("script-src allows any inline script");
if (!/connect-src 'none'/.test(csp)) problems.push("connect-src is not 'none'");
if (!html.includes('id="root"')) problems.push("no #root element");
if (!/<script type="module">/.test(html)) problems.push("no inline module script");
if (/serviceWorker\.register\(["']\.\/sw\.js/.test(html)) problems.push("the single file registers a service worker");

if (problems.length > 0) {
  console.error(`verify-single-file: FAILED\n - ${problems.join("\n - ")}`);
  process.exit(1);
}
console.log(`verify-single-file: OK (${(Buffer.byteLength(html) / 1024).toFixed(0)} KB, one file, no external references)`);
