// phase-05-local-playable.md "a service worker that precaches the build so
// the game works offline and is installable." `sw.js` is generated at build
// time (vite.config.ts's `veilbreak-pwa` plugin, ADR-012) — nothing to register
// in dev (`vite dev` serves no such file), so this is a no-op there.
//
// Release polish (ADR-035): a new build's worker waits (see sw-template.js),
// and this module tells the page so it can offer "Update ready, reload".

type Listener = (ready: boolean) => void;

export interface UpdateWatcher {
  /** True once a newer build has finished installing and is waiting. */
  readonly ready: boolean;
  subscribe(listener: Listener): () => void;
  /** Ask the waiting worker to take over; the page reloads when it does. */
  apply(): void;
}

interface WorkerLike {
  state: string;
  addEventListener(type: "statechange", fn: () => void): void;
  postMessage(message: unknown): void;
}
interface RegistrationLike {
  waiting: WorkerLike | null;
  installing: WorkerLike | null;
  addEventListener(type: "updatefound", fn: () => void): void;
}
interface ContainerLike {
  controller: unknown;
  addEventListener(type: "controllerchange", fn: () => void): void;
}

type TrackingWatcher = UpdateWatcher & { track(reg: RegistrationLike): void };

/** The update state machine, kept free of `navigator` so it can be tested. */
export function createUpdateWatcher(container: ContainerLike, reload: () => void): TrackingWatcher {
  let ready = false;
  let waiting: WorkerLike | null = null;
  let applying = false;
  const listeners = new Set<Listener>();
  const markReady = (worker: WorkerLike) => {
    // First install has no controller: nothing is being replaced, so no banner.
    if (!container.controller) return;
    waiting = worker;
    ready = true;
    listeners.forEach((l) => l(true));
  };
  container.addEventListener("controllerchange", () => {
    if (applying) reload();
  });
  return {
    get ready() {
      return ready;
    },
    subscribe(listener) {
      listeners.add(listener);
      return () => void listeners.delete(listener);
    },
    apply() {
      if (!waiting) return;
      applying = true;
      waiting.postMessage({ type: "SKIP_WAITING" });
    },
    track(reg) {
      if (reg.waiting) markReady(reg.waiting);
      reg.addEventListener("updatefound", () => {
        const worker = reg.installing;
        if (!worker) return;
        worker.addEventListener("statechange", () => {
          if (worker.state === "installed") markReady(worker);
        });
      });
    },
  };
}

let watcher: TrackingWatcher | null = null;

/** The page-wide update watcher, or null where there is no service worker (dev, old browsers). */
export function getUpdateWatcher(): UpdateWatcher | null {
  return watcher;
}

export function registerServiceWorker(): void {
  if (!("serviceWorker" in navigator)) return;
  if (import.meta.env.DEV || __SINGLE_FILE__) return;
  const w = createUpdateWatcher(navigator.serviceWorker, () => window.location.reload());
  watcher = w;
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("./sw.js")
      .then((registration) => {
        w.track(registration);
        // Look for a newer build when the player comes back to the tab and every 15 minutes, so the
        // "Reload to update" banner appears without waiting for a full page load (the browser otherwise
        // checks only on navigation).
        const check = () => void registration.update().catch(() => undefined);
        document.addEventListener("visibilitychange", () => {
          if (document.visibilityState === "visible") check();
        });
        window.setInterval(check, 15 * 60 * 1000);
      })
      .catch(() => {
        // Offline support degrading gracefully to "online-only" is acceptable;
        // there is nothing actionable a player could do about a failed
        // registration, so this is deliberately silent rather than surfaced.
      });
  });
}
