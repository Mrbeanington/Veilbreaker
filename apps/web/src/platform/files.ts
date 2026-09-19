// File handling for backups (spec/06 "Share-sheet backup", "Auto-save to a
// chosen file"). Everything is feature-detected; nothing here is required.

export function backupFileName(now = new Date()): string {
  return `veilbreak-backup-${now.toISOString().slice(0, 10)}.json`;
}

/** Saves a text file: the share sheet (with the file attached) where the browser supports it, else a normal download. */
export async function shareOrDownload(text: string, fileName: string, mime = "application/json"): Promise<"shared" | "downloaded" | "cancelled"> {
  const file = new File([text], fileName, { type: mime });
  const nav = navigator as Navigator & { canShare?: (data: ShareData) => boolean };
  if (typeof nav.share === "function" && typeof nav.canShare === "function" && nav.canShare({ files: [file] })) {
    try {
      await nav.share({ files: [file], title: "Veilbreak backup" });
      return "shared";
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return "cancelled";
      // fall through to a normal download
    }
  }
  downloadText(text, fileName, mime);
  return "downloaded";
}

export function downloadText(text: string, fileName: string, mime = "application/json"): void {
  const url = URL.createObjectURL(new Blob([text], { type: mime }));
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function readFileText(file: File, maxBytes = 25 * 1024 * 1024): Promise<string> {
  if (file.size > maxBytes) return Promise.reject(new Error("That file is too large to be a save."));
  return file.text();
}

// ------------------------------------------------------------- auto-save to a chosen file

interface WritableHandle {
  createWritable: () => Promise<{ write: (data: string) => Promise<void>; close: () => Promise<void> }>;
  queryPermission?: (options: { mode: "readwrite" }) => Promise<PermissionState>;
  requestPermission?: (options: { mode: "readwrite" }) => Promise<PermissionState>;
}

interface KeyValue {
  get(key: string): Promise<unknown>;
  set(key: string, value: unknown): Promise<void>;
  delete(key: string): Promise<void>;
}

const HANDLE_KEY = "autosave-handle";

/** Chrome/Edge desktop only. Hidden everywhere else (spec/06). */
export function supportsAutosave(scope: object = typeof window !== "undefined" ? window : {}): boolean {
  return typeof (scope as { showSaveFilePicker?: unknown }).showSaveFilePicker === "function";
}

export async function chooseAutosaveFile(store: KeyValue, scope: object = window): Promise<boolean> {
  const picker = (scope as { showSaveFilePicker?: (options: unknown) => Promise<WritableHandle> }).showSaveFilePicker;
  if (!picker) return false;
  try {
    const handle = await picker({ suggestedName: backupFileName(), types: [{ description: "Veilbreak backup", accept: { "application/json": [".json"] } }] });
    await store.set(HANDLE_KEY, handle);
    return true;
  } catch {
    return false; // the player cancelled
  }
}

export async function hasAutosaveFile(store: KeyValue): Promise<boolean> {
  try {
    return (await store.get(HANDLE_KEY)) !== undefined;
  } catch {
    return false;
  }
}

export async function stopAutosave(store: KeyValue): Promise<void> {
  await store.delete(HANDLE_KEY);
}

/**
 * Rewrites the chosen file. After a relaunch the browser may want one click to
 * re-grant permission: this never prompts by itself, it reports "needs-permission"
 * so the UI can offer a button.
 */
export async function writeAutosave(store: KeyValue, text: string, allowPrompt = false): Promise<"written" | "none" | "needs-permission" | "failed"> {
  try {
    const handle = (await store.get(HANDLE_KEY)) as WritableHandle | undefined;
    if (!handle || typeof handle.createWritable !== "function") return "none";
    let permission = (await handle.queryPermission?.({ mode: "readwrite" })) ?? "granted";
    if (permission !== "granted" && allowPrompt) permission = (await handle.requestPermission?.({ mode: "readwrite" })) ?? "denied";
    if (permission !== "granted") return "needs-permission";
    const writable = await handle.createWritable();
    await writable.write(text);
    await writable.close();
    return "written";
  } catch {
    return "failed";
  }
}
