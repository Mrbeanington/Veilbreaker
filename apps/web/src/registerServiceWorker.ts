// phase-05-local-playable.md "a service worker that precaches the build so
// the game works offline and is installable. No install prompt UI yet
// (Phase 09)." `sw.js` is generated at build time (vite.config.ts's
// `veilbreak-pwa` plugin, ADR-012) — nothing to register in dev (`vite dev`
// serves no such file), so this is a no-op there rather than a 404.
export function registerServiceWorker(): void {
  if (!("serviceWorker" in navigator)) return;
  if (import.meta.env.DEV) return;
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./sw.js").catch(() => {
      // Offline support degrading gracefully to "online-only" is acceptable;
      // there is nothing actionable a player could do about a failed
      // registration, so this is deliberately silent rather than surfaced.
    });
  });
}
