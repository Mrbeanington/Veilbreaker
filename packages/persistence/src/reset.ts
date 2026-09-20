import { createDefaultProfile, type Profile } from "./profile";
import type { KeyValueStore } from "./store";

// ADR-037: two ways to start over. Both are pure functions of the profile, so
// they are tested without a screen. The caller saves the result with `replace`,
// which keeps the save it replaces as an automatic backup.

export type ResetKind = "progress" | "everything";

/**
 * "progress": account level, wins and losses, mastery, missions, achievements,
 * match history and the ranked ladder go back to the start. Everything you
 * have unlocked or discovered stays (Legends, the Nameless One's gate, won
 * trials, the fighters, abilities, passives and transformations in your Codex),
 * and so do your settings, favorites, team presets and install state.
 *
 * "everything": a brand-new profile, as on first launch. Only the install
 * state stays, so the install prompt is not shown again on a device that
 * already handled it.
 */
export function resetProfile(profile: Profile, kind: ResetKind): Profile {
  const fresh = createDefaultProfile();
  if (kind === "everything") return { ...fresh, install: profile.install };
  return {
    ...fresh,
    settings: profile.settings,
    favorites: profile.favorites,
    presets: profile.presets,
    install: profile.install,
    tutorial: profile.tutorial,
    discovered: profile.discovered,
    unlocks: profile.unlocks,
    trialsWon: profile.trialsWon,
  };
}

/** Deletes every saved replay: a reset match history would otherwise leave them orphaned. */
export async function clearReplays(store: KeyValueStore): Promise<number> {
  const keys = (await store.keys()).filter((k) => k.startsWith("replay."));
  for (const key of keys) await store.delete(key);
  return keys.length;
}
