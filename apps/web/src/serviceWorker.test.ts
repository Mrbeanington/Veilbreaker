import { readFileSync } from "node:fs";
import { join } from "node:path";
import { URL } from "node:url";
import { runInNewContext } from "node:vm";
import { describe, expect, it, vi } from "vitest";

// phase-15 offline/PWA audit: the hand-written service worker is run inside a
// fake ServiceWorkerGlobalScope so its rules are tested without a browser.

const template = readFileSync(join(process.cwd(), "apps", "web", "sw-template.js"), "utf8");

type Listener = (event: never) => void;

function loadWorker(precache: string[], existingCaches: string[] = []) {
  const listeners: Record<string, Listener> = {};
  const store = new Map<string, Map<string, string>>(existingCaches.map((name) => [name, new Map()]));
  const skipWaiting = vi.fn();
  const seenOptions: { ignoreSearch?: boolean; ignoreVary?: boolean }[] = [];
  const claim = vi.fn(() => Promise.resolve());
  const matchIn = (entries: Map<string, string>) => (request: { url: string } | string, options?: { ignoreSearch?: boolean; ignoreVary?: boolean }) => {
    const wanted = typeof request === "string" ? request : request.url;
    const path = (u: string) => u.replace("https://game.test/", "./");
    const strip = (u: string) => (options?.ignoreSearch ? u.split("?")[0]! : u);
    seenOptions.push(options ?? {});
    for (const [key, value] of entries) if (strip(path(wanted)) === strip(key) || strip(wanted) === strip(key)) return Promise.resolve(value);
    return Promise.resolve(undefined);
  };
  const caches = {
    open: (name: string) => {
      const entries = store.get(name) ?? new Map<string, string>();
      store.set(name, entries);
      return Promise.resolve({ addAll: (urls: string[]) => (urls.forEach((u) => entries.set(u, `cached:${u}`)), Promise.resolve()), match: matchIn(entries) });
    },
    keys: () => Promise.resolve([...store.keys()]),
    delete: (name: string) => Promise.resolve(store.delete(name)),
  };
  const fetchSpy = vi.fn((r: { url: string }) => Promise.resolve(`network:${r.url}`));
  const source = template.replace("__CACHE_VERSION__", "test").replace('"__PRECACHE_URLS__"', JSON.stringify(precache));
  runInNewContext(source, {
    self: { addEventListener: (type: string, fn: Listener) => (listeners[type] = fn), skipWaiting, clients: { claim }, location: { origin: "https://game.test" } },
    caches,
    fetch: fetchSpy,
    URL,
  });
  const fire = async (type: string, event: Record<string, unknown>) => {
    const waits: Promise<unknown>[] = [];
    let response: Promise<unknown> | undefined;
    listeners[type]!({ ...event, waitUntil: (p: Promise<unknown>) => waits.push(p), respondWith: (p: Promise<unknown>) => (response = p) } as never);
    await Promise.all(waits);
    return response ? await response : undefined;
  };
  return { fire, store, skipWaiting, claim, fetchSpy, listeners, seenOptions };
}

const request = (url: string, extra: Record<string, unknown> = {}) => ({ url, method: "GET", mode: "cors", ...extra });

describe("service worker", () => {
  it("precaches every listed file on install, and does NOT take over before old tabs close", async () => {
    const w = loadWorker(["./", "./index.html", "./assets/a.js"]);
    await w.fire("install", {});
    expect([...w.store.get("veilbreak-test")!.keys()]).toEqual(["./", "./index.html", "./assets/a.js"]);
    expect(w.skipWaiting).not.toHaveBeenCalled();
  });

  it("takes over only when the page asks", async () => {
    const w = loadWorker([]);
    await w.fire("message", { data: { type: "SOMETHING_ELSE" } });
    expect(w.skipWaiting).not.toHaveBeenCalled();
    await w.fire("message", { data: { type: "SKIP_WAITING" } });
    expect(w.skipWaiting).toHaveBeenCalledOnce();
  });

  it("on activate prunes every other build's cache and claims clients", async () => {
    const w = loadWorker(["./index.html"], ["veilbreak-old-1", "veilbreak-old-2", "veilbreak-test"]);
    await w.fire("activate", {});
    expect([...w.store.keys()]).toEqual(["veilbreak-test"]);
    expect(w.claim).toHaveBeenCalledOnce();
  });

  it("serves a precached asset from the cache, with no network", async () => {
    const w = loadWorker(["./assets/a.js"]);
    await w.fire("install", {});
    expect(await w.fire("fetch", { request: request("https://game.test/assets/a.js") })).toBe("cached:./assets/a.js");
    expect(w.fetchSpy).not.toHaveBeenCalled();
  });

  it("opens a navigation with a query string offline, and falls back to the cached shell", async () => {
    const w = loadWorker(["./", "./index.html"]);
    await w.fire("install", {});
    expect(await w.fire("fetch", { request: request("https://game.test/?dev=1", { mode: "navigate" }) })).toBe("cached:./");
    expect(await w.fire("fetch", { request: request("https://game.test/some/other/path", { mode: "navigate" }) })).toBe("cached:./index.html");
    expect(w.fetchSpy).not.toHaveBeenCalled();
  });

  it("ignores a previous build's cache, so a stale index.html can never meet new scripts", async () => {
    const w = loadWorker(["./index.html"], ["veilbreak-old"]);
    w.store.get("veilbreak-old")!.set("./index.html", "STALE");
    await w.fire("install", {});
    expect(await w.fire("fetch", { request: request("https://game.test/", { mode: "navigate" }) })).toBe("cached:./index.html");
  });

  it("matches with ignoreVary, so a host that sends Vary: Origin cannot make precached scripts miss", async () => {
    const w = loadWorker(["./assets/a.js", "./index.html"]);
    await w.fire("install", {});
    await w.fire("fetch", { request: request("https://game.test/assets/a.js") });
    await w.fire("fetch", { request: request("https://game.test/", { mode: "navigate" }) });
    expect(w.seenOptions.length).toBeGreaterThan(0);
    expect(w.seenOptions.every((o) => o.ignoreVary === true)).toBe(true);
  });

  it("never answers another origin's request or a non-GET request", async () => {
    const w = loadWorker(["./assets/a.js"]);
    await w.fire("install", {});
    let responded = false;
    w.listeners.fetch!({ request: request("https://elsewhere.test/lib.js"), respondWith: () => (responded = true) } as never);
    w.listeners.fetch!({ request: request("https://game.test/assets/a.js", { method: "POST" }), respondWith: () => (responded = true) } as never);
    expect(responded).toBe(false);
  });
});

describe("web app manifest", () => {
  const manifest = JSON.parse(readFileSync(join(process.cwd(), "apps", "web", "public", "manifest.webmanifest"), "utf8")) as Record<string, unknown>;
  it("has what a browser needs to offer installation", () => {
    for (const key of ["name", "short_name", "start_url", "scope", "display", "icons", "id", "lang"]) expect(manifest[key], key).toBeTruthy();
    expect(manifest.display).toBe("standalone");
    const sizes = (manifest.icons as { sizes: string }[]).map((i) => i.sizes);
    expect(sizes).toEqual(expect.arrayContaining(["192x192", "512x512"]));
  });
  it("uses only relative URLs, so it works from any host or subpath", () => {
    expect(String(manifest.start_url).startsWith(".")).toBe(true);
    expect(String(manifest.scope).startsWith(".")).toBe(true);
    for (const icon of manifest.icons as { src: string }[]) expect(icon.src.startsWith("./")).toBe(true);
  });
});
