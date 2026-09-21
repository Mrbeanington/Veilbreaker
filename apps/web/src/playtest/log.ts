import type { KeyValueStore } from "@veilbreak/persistence";

// ADR-049: the playtest kit. The game keeps a small event log on the device (never sent anywhere) so a
// tester can hand the developer a report code. Events are tiny facts (a screen opened, a match ended),
// capped in number, and every write swallows its own errors: logging must never break play.

export type EventType = "open" | "screen" | "tutorial-start" | "tutorial-skip" | "tutorial-done" | "match-start" | "match-end" | "level-up" | "error" | "feedback";
export type EventData = Record<string, string | number | boolean>;
export interface PlaytestEvent {
  t: number;
  type: EventType;
  data?: EventData;
}

export const LOG_KEY = "playtest.log";
export const MAX_EVENTS = 400;

const queues = new WeakMap<KeyValueStore, Promise<unknown>>();

function clip(data: EventData | undefined): EventData | undefined {
  if (!data) return undefined;
  const out: EventData = {};
  for (const [k, v] of Object.entries(data).slice(0, 12)) out[k.slice(0, 24)] = typeof v === "string" ? v.slice(0, 160) : v;
  return out;
}

/** Appends one event. Writes are chained per store, so two quick events never overwrite each other. */
export function recordEvent(store: KeyValueStore, type: EventType, data?: EventData, now = Date.now()): Promise<void> {
  const previous = queues.get(store) ?? Promise.resolve();
  const next = previous
    .then(async () => {
      const log = await readLog(store);
      log.push({ t: now, type, ...(data ? { data: clip(data) } : {}) });
      await store.set(LOG_KEY, log.slice(-MAX_EVENTS));
    })
    .catch(() => undefined);
  queues.set(store, next);
  return next;
}

export async function readLog(store: KeyValueStore): Promise<PlaytestEvent[]> {
  try {
    const raw = await store.get(LOG_KEY);
    return Array.isArray(raw) ? (raw.filter((e) => e && typeof e === "object" && typeof (e as PlaytestEvent).t === "number" && typeof (e as PlaytestEvent).type === "string") as PlaytestEvent[]) : [];
  } catch {
    return [];
  }
}

export async function clearLog(store: KeyValueStore): Promise<void> {
  try {
    await store.delete(LOG_KEY);
  } catch {
    /* nothing to clear */
  }
}
