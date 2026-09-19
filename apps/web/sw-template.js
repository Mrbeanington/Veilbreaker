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

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting()),
  );
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
// above, so a cache hit serves instantly offline; anything uncached (there
// shouldn't be anything, for this single-page app) falls through to a
// same-origin network fetch, never a third-party one (CLAUDE.md "client-
// only" — this file only ever intercepts requests the browser itself made
// for this app's own origin).
self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  event.respondWith(
    caches.match(event.request).then((cached) => cached ?? fetch(event.request)),
  );
});
