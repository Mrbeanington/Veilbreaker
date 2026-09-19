import {
  ABILITY_LIBRARY,
  CHARACTER_ART_LIBRARY,
  PASSIVE_LIBRARY,
  type Ability,
  type CharacterDefinition,
  type KnowledgeLevel,
  type PassiveDefinition,
} from "@veilbreak/content";
import type { Profile } from "@veilbreak/persistence";

// spec/05 "Codex" and "Character selection": entries respect knowledge levels.
// Secrets create mystery (silhouettes, or nothing at all) until the player
// personally meets them in a match (phase-08: "Codex entries unlock from the
// player's own match event history").

export type Visibility = "full" | "silhouette" | "hidden";

export function isDiscovered(profile: Profile, characterId: string): boolean {
  return profile.discovered.characters.includes(characterId);
}

export function characterVisibility(character: CharacterDefinition, profile: Profile): Visibility {
  if (profile.settings.showAllCharacters || isDiscovered(profile, character.id)) return "full";
  if (character.knowledgeLevel === "TRUE_SECRET") return "hidden";
  if (character.rarity === "SECRET" || character.rarity === "LEGENDARY" || character.knowledgeLevel === "DISCOVERABLE") return "silhouette";
  return "full";
}

/** Legends are accomplishments (spec/06): meeting one reveals it, but only winning its trial unlocks it for your team. */
export function isUnlocked(character: CharacterDefinition, profile: Profile): boolean {
  if (character.rarity !== "LEGENDARY") return true;
  return profile.settings.showAllCharacters || profile.unlocks.legends.includes(character.id);
}

/** Only revealed, unlocked characters may be picked for a team. */
export function isPickable(character: CharacterDefinition, profile: Profile): boolean {
  return characterVisibility(character, profile) === "full" && isUnlocked(character, profile);
}

const REVEALED_BY_DEFAULT: KnowledgeLevel = "PUBLIC";

export function abilityRevealed(ability: Ability, profile: Profile): boolean {
  return (
    profile.settings.showAllCharacters ||
    (ability.knowledgeLevel ?? REVEALED_BY_DEFAULT) === "PUBLIC" ||
    profile.discovered.abilities.includes(ability.id)
  );
}

export function passiveOf(character: CharacterDefinition): PassiveDefinition | undefined {
  return character.passiveId ? PASSIVE_LIBRARY[character.passiveId] : undefined;
}

export function passiveRevealed(passive: PassiveDefinition, profile: Profile): boolean {
  return (
    profile.settings.showAllCharacters || passive.knowledgeLevel === "PUBLIC" || profile.discovered.passives.includes(passive.id)
  );
}

export function abilitiesOf(character: CharacterDefinition): Ability[] {
  return character.abilityIds.map((id) => ABILITY_LIBRARY[id]).filter((a): a is Ability => a !== undefined);
}

/** "Ancient Mediterranean (weathered bronze...)" becomes "Ancient Mediterranean". */
export function originOf(characterId: string): string {
  const region = CHARACTER_ART_LIBRARY[characterId]?.region;
  if (!region) return "Unknown";
  return region.split("(")[0]?.trim() || "Unknown";
}

export const MAX_MASTERY = 5;
const MATCHES_PER_MASTERY_LEVEL = 3;

export function masteryLevel(profile: Profile, characterId: string): number {
  return Math.min(MAX_MASTERY, Math.floor((profile.played[characterId] ?? 0) / MATCHES_PER_MASTERY_LEVEL));
}

const ROLE_TAGS = new Set([
  "ATTACKER",
  "TANK",
  "DEFENDER",
  "HEALER",
  "SUPPORT",
  "CONTROLLER",
  "ANTI-HEALER",
  "SUMMONER",
  "NECROMANCER",
  "ASSASSIN",
  "BRUISER",
  "MAGE",
  "WARRIOR",
]);

export function rolesOf(character: CharacterDefinition): string[] {
  return character.tags.filter((t) => ROLE_TAGS.has(t));
}

export function unlockHint(character: CharacterDefinition): string {
  switch (character.rarity) {
    case "LEGENDARY":
      return "A Legend. Meet one in battle to learn its name, then win its trial to unlock it.";
    case "SECRET":
      return "A secret fighter. Face it in a match to uncover it.";
    default:
      return "Available from the start.";
  }
}

/** Foes who have beaten `characterId` at least twice in the player's own matches. */
export function knownCounters(profile: Profile, characterId: string): string[] {
  return Object.entries(profile.beat)
    .filter(([foe]) => foe !== characterId)
    .filter(([, row]) => (row[characterId] ?? 0) >= 2)
    .map(([foe]) => foe);
}

/** Teammates the character has won at least twice alongside. */
export function knownSynergies(profile: Profile, characterId: string): string[] {
  return Object.entries(profile.wonWith[characterId] ?? {})
    .filter(([, wins]) => wins >= 2)
    .map(([mate]) => mate);
}
