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

/**
 * A character's identity (name, portrait, kit) is hidden — a silhouette, "Unknown fighter" —
 * until it is either owned (`isUnlocked`) or personally met in a match (`isDiscovered`),
 * regardless of rarity (ADR-058). This used to only apply to Secrets and Legends, so a
 * quest-locked Core or Rare fighter showed its full name and portrait next to a "Reach
 * level N" hint — no mystery at all for most of the roster.
 */
export function characterVisibility(character: CharacterDefinition, profile: Profile): Visibility {
  if (profile.settings.showAllCharacters || isDiscovered(profile, character.id)) return "full";
  if (character.knowledgeLevel === "TRUE_SECRET") return "hidden";
  if (isUnlocked(character, profile)) return "full";
  return "silhouette";
}

/**
 * The roster a new account starts with (ADR-038; recurated ADR-058): a small, deliberately
 * chosen set — not "every Core fighter" — so a new player still has real things to unlock.
 * Covers every core team role except Assassin (reserved for Mister Whiskers' own quest — he's
 * a special transforming character and meant to be worked for) and a spread of origins, so a
 * starting team never feels one-note. `tortuga-rex`, `hydra` and `the-moon-rabbit` are also
 * `TUTORIAL_TEAM` (game/tutorial.ts) and must stay here for the tutorial to have a legal team.
 */
export const STARTER_CHARACTER_IDS: readonly string[] = [
  "blue-oni",
  "cyclops-brontes",
  "domovoi",
  "hydra",
  "jackal-guardian",
  "moonshot-maddox",
  "shieldmaiden-yrsa",
  "plague-doctor",
  "the-honey-badger",
  "the-moon-rabbit",
  "the-scarecrow",
  "tortuga-rex",
];
export function isStarter(character: CharacterDefinition): boolean {
  return STARTER_CHARACTER_IDS.includes(character.id);
}

/**
 * Meeting a fighter only reveals it. Owning it is earned (ADR-038): the starters are open, a Legend needs its
 * trial, and every other fighter needs its quest. Saves from before quests (unlock model 1) keep Core, Rare
 * and Secret fighters open, as they always were.
 */
export function isUnlocked(character: CharacterDefinition, profile: Profile): boolean {
  if (profile.settings.showAllCharacters) return true;
  if (character.rarity === "LEGENDARY") return profile.unlocks.legends.includes(character.id);
  if (profile.unlocks.model < 2 || isStarter(character)) return true;
  return profile.unlocks.fighters.includes(character.id);
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
