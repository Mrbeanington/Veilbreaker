/* global URL */
// phase-05-local-playable.md "PWA foundation: ... a service worker that
// precaches the build so the game works offline and is installable."
// Hand-written on purpose (docs/DECISIONS.md ADR-012): a workbox-generated
// service worker is much harder to audit by hand for
// scripts/verify-client-only.mjs's purposes, and this game's whole asset
// list is small enough that a plain install/activate/fetch handler covers
// everything Workbox would otherwise be doing here.
//
// `__PRECACHE_URLS__` is replaced with a real JSON array of every build
// output file's relative URL by the `veilbreak-pwa` Vite plugin
// (apps/web/vite.config.ts) at build time — it can't be known until the
// build has actually hashed every filename.
// Changes on every build (the build plugin substitutes a real value), so
// `activate` below actually prunes the previous build's cache instead of
// accumulating stale, renamed-hash asset entries in it forever.
const CACHE_NAME = "veilbreak-__CACHE_VERSION__";
// The quoted placeholder (rather than a bare identifier) keeps this file
// itself valid, lintable JS — the build replaces the whole string literal
// with a real JSON array.
const PRECACHE_URLS = "__PRECACHE_URLS__";

// phase-15 (offline/PWA audit): a new build's worker now WAITS instead of
// taking over at once. Taking over immediately deleted the previous build's
// cache while a tab was still running the previous build's scripts, so its
// next lazy request (the bot worker starts only when a match begins) could miss
// both the cache and the server. Saves live in IndexedDB and are untouched
// either way. The new build takes over when the last old tab closes, or when
// the page asks with {type: "SKIP_WAITING"}.
self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_URLS)));
});

self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))))
      .then(() => self.clients.claim()),
  );
});

// Same-origin cache-first: every asset this game needs is already precached
// above, so a cache hit serves instantly offline. Only this app's own
// requests are ever answered (CLAUDE.md "client-only"): anything from another
// origin is left to the browser, so this file can never proxy a third party.
// A page navigation ignores the query string (a link such as `?dev=1` must
// still open offline) and falls back to the cached shell.
self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;
  if (new URL(request.url).origin !== self.location.origin) return;
  // `ignoreVary`: a static host that sends `Vary: Origin` would otherwise make
  // every module-script request (which carries an Origin header) miss the
  // precached copy (found in the real-browser offline test, phase 15).
  // Look only in THIS build's cache. `caches.match` searches every cache, oldest
  // first, so while a previous build's cache still exists it could answer with
  // the previous build's index.html against this build's scripts.
  const own = () => caches.open(CACHE_NAME);
  if (request.mode === "navigate") {
    event.respondWith(
      own()
        .then((cache) => cache.match(request, { ignoreSearch: true, ignoreVary: true }).then((cached) => cached ?? cache.match("./index.html", { ignoreVary: true })))
        .then((cached) => cached ?? fetch(request)),
    );
    return;
  }
  event.respondWith(own().then((cache) => cache.match(request, { ignoreVary: true })).then((cached) => cached ?? fetch(request)));
});
