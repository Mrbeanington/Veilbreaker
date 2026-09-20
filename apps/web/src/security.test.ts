import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { renderQrSvg } from "@veilbreak/persistence";

// phase-15 client-only security review, as tests.

const root = process.cwd();
const html = readFileSync(join(root, "apps", "web", "index.html"), "utf8");
const csp = /http-equiv="Content-Security-Policy"\s+content="([^"]+)"/.exec(html)?.[1] ?? "";
const directives = Object.fromEntries(csp.split(";").map((d) => d.trim()).filter(Boolean).map((d) => [d.split(/\s+/)[0]!, d.split(/\s+/).slice(1)]));

describe("content security policy", () => {
  it("exists and starts from default-src 'self'", () => {
    expect(csp.length).toBeGreaterThan(0);
    expect(directives["default-src"]).toEqual(["'self'"]);
  });
  it("allows scripts only from this origin: no eval, no inline script, no remote host", () => {
    expect(directives["script-src"]).toEqual(["'self'"]);
    expect(csp).not.toMatch(/unsafe-eval|unsafe-hashes|https?:|\*/);
    expect(directives["script-src"]).not.toContain("'unsafe-inline'");
  });
  it("locks down every other way of loading or embedding something", () => {
    for (const d of ["connect-src", "worker-src", "manifest-src", "font-src"]) expect(directives[d], d).toEqual(["'self'"]);
    for (const d of ["object-src", "frame-src"]) expect(directives[d], d).toEqual(["'none'"]);
    expect(directives["base-uri"]).toEqual(["'self'"]);
    expect(directives["form-action"]).toEqual(["'self'"]);
    expect(directives["img-src"]).toEqual(["'self'", "data:"]);
  });
});

describe("source has no injection or network sinks", () => {
  function sourceFiles(dir: string): string[] {
    return readdirSync(dir).flatMap((name) => {
      const p = join(dir, name);
      if (statSync(p).isDirectory()) return name === "node_modules" || name === "dist" ? [] : sourceFiles(p);
      return /\.(ts|tsx)$/.test(name) && !/\.test\./.test(name) ? [p] : [];
    });
  }
  const files = [...sourceFiles(join(root, "apps", "web", "src")), ...sourceFiles(join(root, "packages"))];
  const scan = (pattern: RegExp) => files.filter((f) => pattern.test(readFileSync(f, "utf8"))).map((f) => f.replace(root, ""));

  it("never uses eval, new Function or document.write", () => {
    expect(scan(/\beval\s*\(|new Function\s*\(|document\.write\s*\(/)).toEqual([]);
  });
  it("uses innerHTML-style sinks only for the QR picture built by our own code", () => {
    const sinks = scan(/dangerouslySetInnerHTML|\.innerHTML\s*=|insertAdjacentHTML|outerHTML\s*=/);
    expect(sinks.map((f) => f.replace(/\\/g, "/"))).toEqual(["/apps/web/src/screens/ProfileScreen.tsx"]);
  });
  it("makes no network call from game code (only the service worker fetches, same-origin)", () => {
    expect(scan(/\bfetch\s*\(|XMLHttpRequest|new WebSocket\s*\(|navigator\.sendBeacon|EventSource/)).toEqual([]);
  });
});

describe("the QR picture is safe to insert as markup", () => {
  it("contains only drawing elements, whatever text it encodes", () => {
    for (const text of ["VB1.abc", "<script>alert(1)</script>", '"><img src=x onerror=alert(1)>', "x".repeat(300)]) {
      const svg = renderQrSvg(text);
      expect(svg).toMatch(/^<svg[\s>]/);
      expect(svg).not.toMatch(/<script|onerror|onload|javascript:|<img|<iframe|<foreignObject/i);
      const tags = [...svg.matchAll(/<([a-zA-Z]+)/g)].map((m) => m[1]!.toLowerCase());
      expect(tags.every((t) => ["svg", "path", "rect", "g", "title", "desc"].includes(t)), tags.join(",")).toBe(true);
    }
  });
});
