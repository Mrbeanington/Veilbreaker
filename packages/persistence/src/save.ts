import { checksumOf } from "./bytes";
import { createDefaultProfile, parseProfile, type Profile } from "./profile";
import type { KeyValueStore } from "./store";

// spec/06 "Automatic saving": every save is one atomic write, with a rolling
// on-device backup of the last 3 snapshots so a corrupted write can be
// recovered from. A save is an envelope with a checksum, so damage is detected
// rather than trusted.
export const SAVE_KEY = "save";
export const BACKUP_KEYS = ["backup.1", "backup.2", "backup.3"] as const;
/** Phase 08 stored the bare profile here; still read so nobody loses progress. */
const LEGACY_KEY = "profile";

/** Backups rotate on a milestone (a match, an unlock, an import) or when the previous snapshot is this old. */
const SNAPSHOT_INTERVAL_MS = 30_000;

interface Envelope {
  format: "veilbreak-save";
  version: number;
  savedAt: number;
  checksum: string;
  data: unknown;
}

function envelopeFor(profile: Profile, savedAt: number): Envelope {
  return { format: "veilbreak-save", version: profile.version, savedAt, checksum: checksumOf(JSON.stringify(profile)), data: profile };
}

function readEnvelope(raw: unknown): { profile: Profile; savedAt: number; migratedFrom?: number } | { error: string } {
  if (!raw || typeof raw !== "object") return { error: "missing" };
  const env = raw as Partial<Envelope>;
  if (env.format !== "veilbreak-save" || typeof env.savedAt !== "number") return { error: "not a save" };
  if (typeof env.checksum !== "string" || checksumOf(JSON.stringify(env.data)) !== env.checksum) return { error: "checksum mismatch" };
  const parsed = parseProfile(env.data);
  if (!parsed.ok) return { error: parsed.reason };
  return { profile: parsed.profile, savedAt: env.savedAt, migratedFrom: parsed.migratedFrom };
}

export interface SaveOptions {
  /** Force a backup rotation (after a match, unlock, import or transfer). */
  snapshot?: boolean;
  now?: number;
}

export async function saveProfile(store: KeyValueStore, profile: Profile, options: SaveOptions = {}): Promise<void> {
  const now = options.now ?? Date.now();
  const entries: Record<string, unknown> = { [SAVE_KEY]: envelopeFor(profile, now) };

  const previous = await store.get(SAVE_KEY);
  const previousValid = readEnvelope(previous);
  const rotate = "profile" in previousValid && (options.snapshot === true || now - previousValid.savedAt >= SNAPSHOT_INTERVAL_MS);
  if (rotate) {
    const [b1, b2] = await Promise.all([store.get(BACKUP_KEYS[0]), store.get(BACKUP_KEYS[1])]);
    entries[BACKUP_KEYS[0]] = previous;
    if (b1 !== undefined) entries[BACKUP_KEYS[1]] = b1;
    if (b2 !== undefined) entries[BACKUP_KEYS[2]] = b2;
  }
  // One transaction: the new save and the rotated backups land together or not at all.
  await store.setMany(entries);
}

export type LoadSource = "current" | "backup" | "legacy" | "fresh";

export interface LoadResult {
  profile: Profile;
  source: LoadSource;
  /** 1-3 when recovered from a backup. */
  backupIndex?: number;
  /** Non-fatal things worth telling the player about. */
  problems: string[];
  migratedFrom?: number;
}

/** Loads the newest intact save: current, then backups, then the Phase 08 legacy key, else a fresh profile. Never throws. */
export async function loadProfile(store: KeyValueStore): Promise<LoadResult> {
  const problems: string[] = [];
  const attempt = async (key: string) => {
    try {
      return readEnvelope(await store.get(key));
    } catch {
      return { error: "unreadable" } as const;
    }
  };

  const current = await attempt(SAVE_KEY);
  if ("profile" in current) return { profile: current.profile, source: "current", problems, migratedFrom: current.migratedFrom };
  if (current.error !== "missing") problems.push(`current save unusable (${current.error})`);

  for (const [i, key] of BACKUP_KEYS.entries()) {
    const backup = await attempt(key);
    if ("profile" in backup) {
      problems.push("restored from an automatic backup");
      return { profile: backup.profile, source: "backup", backupIndex: i + 1, problems, migratedFrom: backup.migratedFrom };
    }
  }

  try {
    const legacy = await store.get(LEGACY_KEY);
    if (legacy !== undefined) {
      const parsed = parseProfile(legacy);
      if (parsed.ok) return { profile: parsed.profile, source: "legacy", problems, migratedFrom: parsed.migratedFrom };
      problems.push(`older save unusable (${parsed.reason})`);
    }
  } catch {
    problems.push("older save unreadable");
  }
  return { profile: createDefaultProfile(), source: "fresh", problems };
}
