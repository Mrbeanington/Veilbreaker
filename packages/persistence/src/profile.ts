import { z } from "zod";

// The local profile (spec/06): created automatically on first launch, no
// account. Versioned with forward migrations (`MIGRATIONS`), each tested.
//   v1 (Phase 08): settings, favorites, recents, presets, Codex discoveries.
//   v2 (Phase 09): adds xp, Legend unlocks, missions, achievements, match
//                  history, install state.
export const PROFILE_VERSION = 2;

const pairTable = z.record(z.string(), z.record(z.string(), z.number().int().min(0)));

export const settingsSchema = z.object({
  animationSpeed: z.enum(["instant", "normal", "slow"]).default("normal"),
  reducedMotion: z.enum(["system", "on", "off"]).default("system"),
  turnTimer: z.boolean().default(true),
  uiScale: z.enum(["small", "normal", "large", "xlarge"]).default("normal"),
  highContrast: z.boolean().default(false),
  soundEnabled: z.boolean().default(false),
  soundVolume: z.number().int().min(0).max(100).default(60),
  showAllCharacters: z.boolean().default(false),
  botLevel: z.enum(["BEGINNER", "INTERMEDIATE", "ADVANCED", "EXPERT"]).default("INTERMEDIATE"),
});
export type Settings = z.infer<typeof settingsSchema>;

export const teamPresetSchema = z.object({
  id: z.string().min(1).max(60),
  name: z.string().min(1).max(40),
  characterIds: z.array(z.string().min(1).max(80)).max(6),
});
export type TeamPreset = z.infer<typeof teamPresetSchema>;

export const discoverySchema = z.object({
  characters: z.array(z.string()).default([]),
  abilities: z.array(z.string()).default([]),
  passives: z.array(z.string()).default([]),
  transformations: z.array(z.string()).default([]),
});
export type Discovery = z.infer<typeof discoverySchema>;

export const historyEntrySchema = z.object({
  id: z.string().min(1).max(60),
  playedAt: z.number().int().min(0),
  mode: z.enum(["bot", "hotseat", "trial"]),
  teamAIds: z.array(z.string()).max(6),
  teamBIds: z.array(z.string()).max(6),
  winnerPlayerId: z.string().nullable(),
  turns: z.number().int().min(0),
  replayId: z.string().optional(),
  trialId: z.string().optional(),
});
export type HistoryEntry = z.infer<typeof historyEntrySchema>;

export const MAX_HISTORY = 50;

export const profileSchema = z.object({
  version: z.literal(PROFILE_VERSION),
  settings: settingsSchema.default({}),
  favorites: z.array(z.string()).default([]),
  recent: z.array(z.string()).max(12).default([]),
  played: z.record(z.string(), z.number().int().min(0)).default({}),
  presets: z.array(teamPresetSchema).max(24).default([]),
  discovered: discoverySchema.default({}),
  /** beat[a][b]: matches a's team won while b was on the other team. */
  beat: pairTable.default({}),
  /** wonWith[a][b]: matches won with a and b on the same team. */
  wonWith: pairTable.default({}),
  matchesPlayed: z.number().int().min(0).default(0),
  // ---- v2
  xp: z.number().int().min(0).default(0),
  unlocks: z
    .object({
      legends: z.array(z.string()).default([]),
      namelessBossDefeated: z.boolean().default(false),
    })
    .default({}),
  trialsWon: z.array(z.string()).default([]),
  missions: z
    .object({
      progress: z.record(z.string(), z.number().int().min(0)).default({}),
      completed: z.array(z.string()).default([]),
    })
    .default({}),
  achievements: z.array(z.string()).default([]),
  history: z.array(historyEntrySchema).max(MAX_HISTORY).default([]),
  install: z
    .object({
      firstLaunchHandled: z.boolean().default(false),
      installed: z.boolean().default(false),
      asks: z.number().int().min(0).default(0),
      lastAskAt: z.number().int().min(0).optional(),
    })
    .default({}),
  lastPlayedAt: z.number().int().min(0).optional(),
});
export type Profile = z.infer<typeof profileSchema>;

export function createDefaultProfile(): Profile {
  return profileSchema.parse({ version: PROFILE_VERSION });
}

// ---------------------------------------------------------------- levels

const XP_PER_LEVEL_BASE = 100;

/** Account level from total xp: level 1 at 0 xp, each level needs 100 more than the last (100, 200, 300...). */
export function levelForXp(xp: number): number {
  let level = 1;
  let needed = XP_PER_LEVEL_BASE;
  let remaining = Math.max(0, Math.floor(xp));
  while (remaining >= needed) {
    remaining -= needed;
    level += 1;
    needed += XP_PER_LEVEL_BASE;
  }
  return level;
}

/** Progress inside the current level: `{ into, needed }`. */
export function levelProgress(xp: number): { level: number; into: number; needed: number } {
  let level = 1;
  let needed = XP_PER_LEVEL_BASE;
  let remaining = Math.max(0, Math.floor(xp));
  while (remaining >= needed) {
    remaining -= needed;
    level += 1;
    needed += XP_PER_LEVEL_BASE;
  }
  return { level, into: remaining, needed };
}

// ---------------------------------------------------------------- migrations

type Raw = Record<string, unknown>;

/** MIGRATIONS[n] upgrades a version-n profile to version n+1. Every entry has a test. */
export const MIGRATIONS: Record<number, (data: Raw) => Raw> = {
  // v1 -> v2: the new blocks all have defaults; only the version changes.
  1: (data) => ({ ...data, version: 2 }),
};

export type ParseResult = { ok: true; profile: Profile; migratedFrom?: number } | { ok: false; reason: string };

/** Strict: migrates a stored profile forward and validates it. Never guesses. */
export function parseProfile(raw: unknown): ParseResult {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return { ok: false, reason: "not a profile" };
  const data = raw as Raw;
  const version = data.version;
  if (typeof version !== "number" || !Number.isInteger(version) || version < 1) return { ok: false, reason: "missing or invalid version" };
  if (version > PROFILE_VERSION) return { ok: false, reason: `saved by a newer version of the game (v${version})` };

  let current: Raw = data;
  for (let v = version; v < PROFILE_VERSION; v += 1) {
    const step = MIGRATIONS[v];
    if (!step) return { ok: false, reason: `no migration from version ${v}` };
    current = step(current);
  }
  const parsed = profileSchema.safeParse(current);
  if (!parsed.success) return { ok: false, reason: parsed.error.issues[0]?.message ?? "invalid profile" };
  return { ok: true, profile: parsed.data, migratedFrom: version < PROFILE_VERSION ? version : undefined };
}

/** Lenient: like `parseProfile`, but a damaged settings block is dropped (not the whole profile), and anything else unusable becomes a fresh profile. */
export function migrateProfile(raw: unknown): Profile {
  const strict = parseProfile(raw);
  if (strict.ok) return strict.profile;
  if (raw && typeof raw === "object" && !Array.isArray(raw) && (raw as Raw).version === PROFILE_VERSION) {
    const salvage = parseProfile({ ...(raw as Raw), settings: undefined });
    if (salvage.ok) return salvage.profile;
  }
  return createDefaultProfile();
}

// ---------------------------------------------------------------- summaries

export interface ProfileSummary {
  level: number;
  legends: number;
  matches: number;
  lastPlayedAt?: number;
}

/** What the overwrite-confirmation shows: "Level 23 · 7 Legends · last played Sept 12". */
export function summarizeProfile(profile: Profile): ProfileSummary {
  return {
    level: levelForXp(profile.xp),
    legends: profile.unlocks.legends.length,
    matches: profile.matchesPlayed,
    lastPlayedAt: profile.lastPlayedAt,
  };
}
