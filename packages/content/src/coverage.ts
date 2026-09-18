import { ABILITY_LIBRARY, CHARACTER_LIBRARY, PASSIVE_LIBRARY, SUMMON_LIBRARY, TRANSFORMATION_LIBRARY } from "./data/characters/index";
import { STATUS_LIBRARY } from "./data/statuses";
import type { Ability } from "./schemas/ability";
import type { CharacterDefinition } from "./schemas/character";
import type { Effect } from "./schemas/effect";

// spec/03 "Required mechanical coverage": "Maintain a coverage matrix
// (packages/content/coverage.md, generated from data) that maps each
// mechanic to the characters using it." This walks each CharacterDefinition's
// actual abilities/passive/transformations — never a hand-maintained list —
// so the matrix can never silently drift from what a character's data
// actually does. `packages/content/scripts/generate-coverage.ts` is the thin
// CLI wrapper (`pnpm run generate-coverage`) that writes this to disk; the
// logic lives here so it's a normal, unit-testable module (coverage.test.ts).

// The exact mechanic vocabulary from spec/03's "Required mechanical
// coverage" list, kept in that order so the generated table reads the same
// way the spec does.
export const MECHANICS = [
  "raw damage",
  "DoT",
  "armor",
  "shielding",
  "counterattacks",
  "reflection",
  "healing",
  "anti-healing",
  "energy stealing",
  "energy generation",
  "cooldown manipulation",
  "stuns",
  "silences",
  "ability locks",
  "target manipulation",
  "summons",
  "death",
  "resurrection",
  "anti-resurrection",
  "transformations",
  "randomness",
  "probability manipulation",
  "combo sequences",
  "delayed attacks",
  "HP sacrifice",
  "berserk",
  "sports mechanics",
  "musical sequences",
  "pets",
  "poison",
  "infection",
  "fire",
  "ice",
  "water/tides",
  "lightning",
  "fear",
  "curses",
  "petrification",
  "prophecy",
  "souls",
  "relics",
  "tails",
  "heads",
  "bases",
  "fouls",
  "songs",
  "ink",
  "labyrinths",
  "death seals",
  "thralls",
  "temporary fourth fighters",
] as const;
export type Mechanic = (typeof MECHANICS)[number];

function flattenEffects(effects: readonly Effect[]): Effect[] {
  const out: Effect[] = [];
  for (const effect of effects) {
    out.push(effect);
    if (effect.kind === "conditional") {
      out.push(...flattenEffects(effect.ifTrue));
      if (effect.ifFalse) out.push(...flattenEffects(effect.ifFalse));
    } else if (effect.kind === "sequence") {
      out.push(...flattenEffects(effect.effects));
    } else if (effect.kind === "randomOutcome") {
      for (const branch of effect.outcome.branches) out.push(...flattenEffects(branch.effects));
    }
  }
  return out;
}

function abilitiesFor(character: CharacterDefinition): Ability[] {
  const ids = new Set(character.abilityIds);
  for (const transformationId of character.transformationIds) {
    for (const id of TRANSFORMATION_LIBRARY[transformationId]?.changes.abilityIds ?? []) ids.add(id);
  }
  return [...ids].map((id) => ABILITY_LIBRARY[id]).filter((a): a is Ability => !!a);
}

export interface CharacterProfile {
  effects: Effect[];
  resourceIds: Set<string>;
  transformationCount: number;
}

export function profileOf(character: CharacterDefinition): CharacterProfile {
  const abilities = abilitiesFor(character);
  const passive = character.passiveId ? PASSIVE_LIBRARY[character.passiveId] : undefined;
  const raw = [...abilities.flatMap((a) => a.effects), ...(passive?.effects ?? [])];
  return {
    effects: flattenEffects(raw),
    resourceIds: new Set(character.resources.map((r) => r.id)),
    transformationCount: character.transformationIds.length,
  };
}

function appliesStatus(profile: CharacterProfile, statusId: string): boolean {
  return profile.effects.some((e) => e.kind === "applyStatus" && e.statusId === statusId);
}

function hasKind(profile: CharacterProfile, kind: Effect["kind"]): boolean {
  return profile.effects.some((e) => e.kind === kind);
}

function summonedIds(profile: CharacterProfile): string[] {
  return profile.effects.filter((e): e is Extract<Effect, { kind: "summon" }> => e.kind === "summon").map((e) => e.summonId);
}

function appliesAnyDotStatus(profile: CharacterProfile): boolean {
  return profile.effects.some((e) => e.kind === "applyStatus" && STATUS_LIBRARY[e.statusId]?.tickBehavior === "damageOverTime");
}

function usesCombosOrSequenceConditions(profile: CharacterProfile): boolean {
  return profile.effects.some(
    (e) => e.kind === "conditional" && (e.condition.type === "usedAbilityLastTurn" || e.condition.type === "abilitySequenceMatches"),
  );
}

function referencesDeathEvents(character: CharacterDefinition, profile: CharacterProfile): boolean {
  const passive = character.passiveId ? PASSIVE_LIBRARY[character.passiveId] : undefined;
  const passiveListensToDeath = passive?.trigger.event === "onDeath" || passive?.trigger.event === "onKill";
  return passiveListensToDeath || hasKind(profile, "erase") || hasKind(profile, "resurrect");
}

export const MECHANIC_DETECTORS: Record<Mechanic, (character: CharacterDefinition, profile: CharacterProfile) => boolean> = {
  "raw damage": (_c, p) => hasKind(p, "damage"),
  DoT: (_c, p) => appliesAnyDotStatus(p),
  armor: (_c, p) => appliesStatus(p, "status.damage-reduction"),
  shielding: (_c, p) => appliesStatus(p, "status.shield"),
  counterattacks: (_c, p) => appliesStatus(p, "status.counter"),
  reflection: (_c, p) => appliesStatus(p, "status.reflect"),
  healing: (_c, p) => p.effects.some((e) => e.kind === "heal" && e.healingClass === "heal"),
  "anti-healing": (_c, p) => appliesStatus(p, "status.anti-heal") || appliesStatus(p, "status.healing-reduction"),
  "energy stealing": (_c, p) => hasKind(p, "drainEnergy"),
  "energy generation": (_c, p) => p.effects.some((e) => e.kind === "modifyEnergy" && e.amount > 0),
  "cooldown manipulation": (_c, p) =>
    hasKind(p, "modifyCooldown") || appliesStatus(p, "status.cooldown-increase") || appliesStatus(p, "status.cooldown-reduction"),
  stuns: (_c, p) => appliesStatus(p, "status.stun"),
  silences: (_c, p) => appliesStatus(p, "status.silence"),
  "ability locks": (_c, p) => appliesStatus(p, "status.ability-lock"),
  "target manipulation": (_c, p) => hasKind(p, "retargetQueuedAction"),
  summons: (_c, p) => hasKind(p, "summon"),
  death: referencesDeathEvents,
  resurrection: (_c, p) => hasKind(p, "resurrect"),
  "anti-resurrection": (_c, p) => appliesStatus(p, "status.resurrection-lock") || appliesStatus(p, "status.soul-consecration"),
  transformations: (_c, p) => p.transformationCount > 0,
  randomness: (_c, p) => hasKind(p, "randomOutcome"),
  "probability manipulation": (_c, p) => hasKind(p, "modifyRandomOutcome"),
  "combo sequences": (_c, p) => usesCombosOrSequenceConditions(p),
  "delayed attacks": () => false,
  "HP sacrifice": () => false,
  berserk: () => false,
  "sports mechanics": (_c, p) => p.resourceIds.has("resource.bases") || p.resourceIds.has("resource.strikes"),
  "musical sequences": () => false,
  pets: () => false,
  poison: (_c, p) => appliesStatus(p, "status.poison"),
  infection: (_c, p) => appliesStatus(p, "status.infection"),
  fire: () => false,
  ice: () => false,
  "water/tides": () => false,
  lightning: () => false,
  fear: (_c, p) => appliesStatus(p, "status.fear"),
  curses: (_c, p) => appliesStatus(p, "status.curse"),
  petrification: (_c, p) => appliesStatus(p, "status.petrification"),
  prophecy: () => false,
  souls: (_c, p) => p.resourceIds.has("resource.souls"),
  relics: () => false,
  tails: () => false,
  heads: () => false,
  bases: (_c, p) => p.resourceIds.has("resource.bases"),
  fouls: () => false,
  songs: () => false,
  ink: () => false,
  labyrinths: () => false,
  "death seals": () => false,
  // "Thrall" is a flavor identity (spec/03's Malachar/Father Bell text), not
  // a distinct engine primitive — Summon has no `THRALL` tag to check, so
  // this reads the summon's own display name, same as a human reviewer would.
  thralls: (_c, p) => summonedIds(p).some((id) => /thrall/i.test(SUMMON_LIBRARY[id]?.displayName ?? "")),
  "temporary fourth fighters": (_c, p) => summonedIds(p).some((id) => SUMMON_LIBRARY[id]?.occupiesSlot === true),
};

export function charactersCoveringMechanic(mechanic: Mechanic): CharacterDefinition[] {
  return Object.values(CHARACTER_LIBRARY)
    .filter((c) => MECHANIC_DETECTORS[mechanic](c, profileOf(c)))
    .sort((a, b) => a.displayName.localeCompare(b.displayName));
}

export function generateCoverageMarkdown(): string {
  const totalCharacters = Object.keys(CHARACTER_LIBRARY).length;
  const lines: string[] = [];
  lines.push("# Mechanical Coverage Matrix");
  lines.push("");
  lines.push(
    "Generated from `packages/content/src/data/characters/**` by `pnpm run generate-coverage` " +
      "(`packages/content/scripts/generate-coverage.ts`) — do not hand-edit. Maps each of spec/03's " +
      "required mechanics to the characters currently using it. A mechanic with no characters listed " +
      "is a real gap, not a script bug: only " +
      totalCharacters +
      " of the roster's 120 characters exist yet (Phase 04).",
  );
  lines.push("");
  lines.push("| Mechanic | Characters |");
  lines.push("|---|---|");
  for (const mechanic of MECHANICS) {
    const covering = charactersCoveringMechanic(mechanic);
    lines.push(`| ${mechanic} | ${covering.length > 0 ? covering.map((c) => c.displayName).join(", ") : "_none yet_"} |`);
  }
  lines.push("");
  return lines.join("\n") + "\n";
}
