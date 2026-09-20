import { useEffect, useState } from "react";
import type { UpdateWatcher } from "../registerServiceWorker";

/** "A new version is ready." Shown only when a newer build is installed and waiting; saves are in IndexedDB and survive the reload. */
export function UpdateBanner({ watcher }: { watcher: UpdateWatcher | null }) {
  const [ready, setReady] = useState(watcher?.ready ?? false);
  useEffect(() => {
    if (!watcher) return;
    setReady(watcher.ready);
    return watcher.subscribe(setReady);
  }, [watcher]);
  if (!ready || !watcher) return null;
  return (
    <div className="banner" role="status" aria-label="Update available">
      <span>A new version is ready. Your progress is saved and will still be here.</span>
      <button type="button" className="btn primary" onClick={() => watcher.apply()}>
        Reload to update
      </button>
    </div>
  );
}
