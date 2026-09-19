// spec/06 "Persistence and profile": the game keeps its save data in the
// browser's IndexedDB. Everything above this file talks to a tiny async
// key-value interface, so tests (and any browser without IndexedDB, such as a
// locked-down private window) use the in-memory store and the game still runs.
export interface KeyValueStore {
  get(key: string): Promise<unknown>;
  set(key: string, value: unknown): Promise<void>;
  /** Writes every entry or none of them (one IndexedDB transaction): what makes a save atomic. */
  setMany(entries: Record<string, unknown>): Promise<void>;
  delete(key: string): Promise<void>;
  keys(): Promise<string[]>;
}

function clone<T>(value: T): T {
  return value === undefined ? value : (JSON.parse(JSON.stringify(value)) as T);
}

export function createMemoryStore(initial: Record<string, unknown> = {}): KeyValueStore {
  const data = new Map<string, unknown>(Object.entries(initial));
  return {
    get: (key) => Promise.resolve(data.has(key) ? clone(data.get(key)) : undefined),
    set: (key, value) => {
      data.set(key, clone(value));
      return Promise.resolve();
    },
    setMany: (entries) => {
      const copies = Object.entries(entries).map(([k, v]) => [k, clone(v)] as const); // clone first: all or nothing
      for (const [k, v] of copies) data.set(k, v);
      return Promise.resolve();
    },
    delete: (key) => {
      data.delete(key);
      return Promise.resolve();
    },
    keys: () => Promise.resolve([...data.keys()]),
  };
}

const STORE_NAME = "kv";

function request<T>(req: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error ?? new Error("IndexedDB request failed"));
  });
}

export function createIndexedDbStore(databaseName = "veilbreak", factory: IDBFactory = indexedDB): KeyValueStore {
  let opened: Promise<IDBDatabase> | undefined;
  const open = (): Promise<IDBDatabase> => {
    opened ??= new Promise<IDBDatabase>((resolve, reject) => {
      const req = factory.open(databaseName, 1);
      req.onupgradeneeded = () => {
        req.result.createObjectStore(STORE_NAME);
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error ?? new Error("could not open the save database"));
    });
    return opened;
  };
  const store = async (mode: IDBTransactionMode) => (await open()).transaction(STORE_NAME, mode).objectStore(STORE_NAME);
  return {
    get: async (key) => request((await store("readonly")).get(key)),
    set: async (key, value) => {
      await request((await store("readwrite")).put(value, key));
    },
    setMany: async (entries) => {
      const db = await open();
      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, "readwrite");
        const objectStore = tx.objectStore(STORE_NAME);
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error ?? new Error("save failed"));
        tx.onabort = () => reject(tx.error ?? new Error("save aborted"));
        try {
          for (const [key, value] of Object.entries(entries)) objectStore.put(value, key);
        } catch (error) {
          // A value that cannot be stored must undo the entries already queued,
          // otherwise the transaction would still commit half a save.
          tx.abort();
          reject(error);
        }
      });
    },
    delete: async (key) => {
      await request((await store("readwrite")).delete(key));
    },
    keys: async () => (await request((await store("readonly")).getAllKeys())).map(String),
  };
}

/** IndexedDB when the browser offers it, otherwise memory (the profile then lasts only for this visit). */
export function createBestStore(databaseName = "veilbreak"): { store: KeyValueStore; persistent: boolean } {
  try {
    if (typeof indexedDB !== "undefined") return { store: createIndexedDbStore(databaseName), persistent: true };
  } catch {
    // fall through to memory
  }
  return { store: createMemoryStore(), persistent: false };
}
