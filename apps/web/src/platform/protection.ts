// spec/06 "Install as an app": `navigator.storage.persist()` asks the browser
// not to evict the game's data. The result is shown as "Progress protection:
// Strong / Standard".
export type Protection = "strong" | "standard" | "unknown";

interface StorageLike {
  persist?: () => Promise<boolean>;
  persisted?: () => Promise<boolean>;
}

/** Asks for persistent storage (idempotent; call at startup and again after install). Never throws. */
export async function requestPersistence(storage: StorageLike | undefined = typeof navigator !== "undefined" ? navigator.storage : undefined): Promise<Protection> {
  if (!storage?.persist) return "unknown";
  try {
    if (storage.persisted && (await storage.persisted())) return "strong";
    return (await storage.persist()) ? "strong" : "standard";
  } catch {
    return "unknown";
  }
}

export function protectionLabel(protection: Protection): string {
  switch (protection) {
    case "strong":
      return "Strong: your browser has promised to keep this save.";
    case "standard":
      return "Standard: your browser may clear this save if space runs low. Install the app or make a backup.";
    default:
      return "Unknown: this browser does not say. Make a backup to be safe.";
  }
}
