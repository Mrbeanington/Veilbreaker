import { z } from "zod";
import type { KeyValueStore } from "./store";

// The local profile (spec/06): created automatically on first launch, no
// account. Versioned from day one so later phases can migrate it. Phase 08
// stores what the UI needs: settings, favorites, team presets, mastery
// counters, and the Codex discovery state. Phase 09 adds progression.
export const PROFILE_VERSION = 1;
const PROFILE_KEY = "profile";

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
  id: z.string().min(1),
  name: z.string().min(1).max(40),
  characterIds: z.array(z.string().min(1)).max(6),
});
export type TeamPreset = z.infer<typeof teamPresetSchema>;

export const discoverySchema = z.object({
  characters: z.array(z.string()).default([]),
  abilities: z.array(z.string()).default([]),
  passives: z.array(z.string()).default([]),
  transformations: z.array(z.string()).default([]),
});
export type Discovery = z.infer<typeof discoverySchema>;

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
});
export type Profile = z.infer<typeof profileSchema>;

export function createDefaultProfile(): Profile {
  return profileSchema.parse({ version: PROFILE_VERSION });
}

/** Turns whatever was stored into a valid current-version profile. Unknown, damaged or future data falls back to defaults rather than crashing the game. */
export function migrateProfile(raw: unknown): Profile {
  if (raw && typeof raw === "object") {
    const parsed = profileSchema.safeParse(raw);
    if (parsed.success) return parsed.data;
    // Keep what still parses: one bad block must not wipe the whole profile.
    const record = raw as Record<string, unknown>;
    const salvage = profileSchema.safeParse({ ...record, version: PROFILE_VERSION, settings: undefined });
    if (salvage.success && record.version === PROFILE_VERSION) return salvage.data;
  }
  return createDefaultProfile();
}

export async function loadProfile(store: KeyValueStore): Promise<Profile> {
  try {
    return migrateProfile(await store.get(PROFILE_KEY));
  } catch {
    return createDefaultProfile();
  }
}

export async function saveProfile(store: KeyValueStore, profile: Profile): Promise<void> {
  await store.set(PROFILE_KEY, profile);
}
