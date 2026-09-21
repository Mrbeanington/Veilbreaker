import { levelForXp, type Profile } from "@veilbreak/persistence";
import { MAX_MASTERY, masteryLevel } from "./knowledge";

// ADR-046: what levels and mastery give. Purely cosmetic, never a power, never for sale:
// account level unlocks titles and portrait frames; a fighter's mastery adds a ring to its portrait.

export interface Reward {
  id: string;
  name: string;
  level: number;
}
export interface FrameReward extends Reward {
  /** CSS colour of the ring drawn around the player's portraits on their profile. */
  color: string;
}

export const TITLES: readonly Reward[] = [
  { id: "newcomer", name: "Newcomer", level: 1 },
  { id: "apprentice", name: "Apprentice", level: 3 },
  { id: "skirmisher", name: "Skirmisher", level: 5 },
  { id: "veteran", name: "Veteran", level: 8 },
  { id: "champion", name: "Champion", level: 12 },
  { id: "legend-seeker", name: "Legend-seeker", level: 16 },
  { id: "veilbreaker", name: "Veilbreaker", level: 20 },
];

export const FRAMES: readonly FrameReward[] = [
  { id: "plain", name: "Plain", level: 1, color: "#6d6584" },
  { id: "bronze", name: "Bronze", level: 3, color: "#b07a3f" },
  { id: "silver", name: "Silver", level: 6, color: "#b9c2d0" },
  { id: "gold", name: "Gold", level: 10, color: "#e0b34d" },
  { id: "ember", name: "Ember", level: 14, color: "#e07a3b" },
  { id: "veil", name: "Veil", level: 18, color: "#a58cf0" },
];

const unlocked = <T extends Reward>(list: readonly T[], level: number): T[] => list.filter((r) => r.level <= level);

export function accountLevel(profile: Profile): number {
  return levelForXp(profile.xp);
}

/** The title shown for a profile: the chosen one if the level allows it, else the highest earned. */
export function activeTitle(profile: Profile): Reward {
  const earned = unlocked(TITLES, accountLevel(profile));
  return earned.find((t) => t.id === profile.cosmetics.title) ?? earned[earned.length - 1]!;
}

export function activeFrame(profile: Profile): FrameReward {
  const earned = unlocked(FRAMES, accountLevel(profile));
  return earned.find((f) => f.id === profile.cosmetics.frame) ?? earned[earned.length - 1]!;
}

/** Titles and frames that a rise from `before` to `after` unlocked, for the result screen. */
export function newRewards(before: number, after: number): { titles: Reward[]; frames: FrameReward[] } {
  return { titles: TITLES.filter((t) => t.level > before && t.level <= after), frames: FRAMES.filter((f) => f.level > before && f.level <= after) };
}

/** The next reward still ahead, so the profile can say what to work towards. */
export function nextReward(level: number): { name: string; level: number; kind: "title" | "frame" } | undefined {
  const ahead = [...TITLES.map((r) => ({ ...r, kind: "title" as const })), ...FRAMES.map((r) => ({ id: r.id, name: r.name, level: r.level, kind: "frame" as const }))].filter((r) => r.level > level);
  ahead.sort((a, b) => a.level - b.level);
  const first = ahead[0];
  return first ? { name: first.name, level: first.level, kind: first.kind } : undefined;
}

/** The ring a fighter's portrait wears for its mastery (0 to 5): none, bronze, silver or gold. */
export function masteryRing(mastery: number): "none" | "bronze" | "silver" | "gold" {
  if (mastery >= MAX_MASTERY) return "gold";
  if (mastery >= 3) return "silver";
  if (mastery >= 1) return "bronze";
  return "none";
}

export function ringFor(profile: Profile, characterId: string): "none" | "bronze" | "silver" | "gold" {
  return masteryRing(masteryLevel(profile, characterId));
}
