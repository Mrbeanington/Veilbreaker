import type { CharacterDefinition } from "@veilbreak/content";
import type { Profile } from "@veilbreak/persistence";
import { characterVisibility, masteryLevel, originOf, rolesOf } from "./knowledge";

// spec/05 "Character selection": search, role, origin, rarity, favorites,
// mastery, recently played, locked/unlocked. Pure so the picker, the
// Characters screen and the tests all share one implementation.
export interface CharacterFilters {
  search: string;
  role: string; // "" = any
  origin: string;
  rarity: string;
  favoritesOnly: boolean;
  minMastery: number;
  recentOnly: boolean;
  lock: "all" | "unlocked" | "locked";
}

export const NO_FILTERS: CharacterFilters = {
  search: "",
  role: "",
  origin: "",
  rarity: "",
  favoritesOnly: false,
  minMastery: 0,
  recentOnly: false,
  lock: "all",
};

export function filterCharacters(list: readonly CharacterDefinition[], filters: CharacterFilters, profile: Profile): CharacterDefinition[] {
  const needle = filters.search.trim().toLowerCase();
  return list.filter((c) => {
    const visibility = characterVisibility(c, profile);
    if (visibility === "hidden") return false; // absent entirely until met
    const unlocked = visibility === "full";
    if (filters.lock === "unlocked" && !unlocked) return false;
    if (filters.lock === "locked" && unlocked) return false;
    // A silhouette must not leak its name, role or origin through the filters.
    if (!unlocked) return needle === "" && !filters.role && !filters.origin && !filters.favoritesOnly && filters.minMastery === 0 && !filters.recentOnly && (!filters.rarity || filters.rarity === c.rarity);
    if (needle && !c.displayName.toLowerCase().includes(needle)) return false;
    if (filters.role && !rolesOf(c).includes(filters.role)) return false;
    if (filters.origin && originOf(c.id) !== filters.origin) return false;
    if (filters.rarity && c.rarity !== filters.rarity) return false;
    if (filters.favoritesOnly && !profile.favorites.includes(c.id)) return false;
    if (filters.minMastery > 0 && masteryLevel(profile, c.id) < filters.minMastery) return false;
    if (filters.recentOnly && !profile.recent.includes(c.id)) return false;
    return true;
  });
}

/** The filter options actually present in the visible roster (never reveals a hidden character's origin or role). */
export function filterOptions(list: readonly CharacterDefinition[], profile: Profile): { roles: string[]; origins: string[]; rarities: string[] } {
  const roles = new Set<string>();
  const origins = new Set<string>();
  const rarities = new Set<string>();
  for (const c of list) {
    if (characterVisibility(c, profile) !== "full") continue;
    rolesOf(c).forEach((r) => roles.add(r));
    origins.add(originOf(c.id));
    rarities.add(c.rarity);
  }
  return { roles: [...roles].sort(), origins: [...origins].sort(), rarities: [...rarities].sort() };
}
