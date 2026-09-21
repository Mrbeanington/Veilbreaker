import { levelForXp, levelProgress, type Profile } from "@veilbreak/persistence";

// ADR-044: features that open with account level. Older saves (unlock model 1) keep everything open.

/** Ranked opens at this account level: a new player learns the game and builds a team first. */
export const RANKED_UNLOCK_LEVEL = 3;

export interface Gate {
  locked: boolean;
  level: number;
  needLevel: number;
  /** XP still needed to reach the level, for a progress line. */
  xpToGo: number;
}

/** Total XP at which `level` begins (level 1 at 0, each level needing 100 more than the last). */
export function xpForLevel(level: number): number {
  return (100 * level * (level - 1)) / 2;
}

export function rankedGate(profile: Profile): Gate {
  const level = levelForXp(profile.xp);
  const locked = profile.unlocks.model >= 2 && level < RANKED_UNLOCK_LEVEL;
  return { locked, level, needLevel: RANKED_UNLOCK_LEVEL, xpToGo: locked ? Math.max(0, xpForLevel(RANKED_UNLOCK_LEVEL) - profile.xp) : 0 };
}

export { levelProgress };
