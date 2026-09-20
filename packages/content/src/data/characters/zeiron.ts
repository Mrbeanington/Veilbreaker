import { characterDefinitionSchema, type CharacterDefinition } from "../../schemas/character";
import { passiveDefinitionSchema, type PassiveDefinition } from "../../schemas/passive";
import type { Ability } from "../../schemas/ability";
import { ability, buildArt, ENEMY_ALL, ENEMY_SINGLE, SELF_ONLY } from "./helpers";

// spec/03 #1 Legend ZEIRON, THE GOD WHO REFUSED OLYMPUS — extremely expensive
// mass lightning damage. docs/design/characters/zeiron.md

// Special vulnerability (spec/03 Legend levers): the broken crown. Below half
// HP each hit he takes leaves him briefly more vulnerable.
export const BROKEN_CROWN: PassiveDefinition = passiveDefinitionSchema.parse({
  id: "passive.zeiron.broken-crown",
  displayName: "Broken Crown",
  description: "Below half health, every wound leaves him more exposed.",
  trigger: { event: "onDamaged", relation: "self" },
  condition: { type: "hpBelowPercent", target: "self", percent: 50 },
  effects: [{ kind: "applyStatus", statusId: "status.damage-amplification", magnitude: 5, durationTurns: 1 }],
});

export const THUNDERCLAP = ability({
  id: "ability.zeiron.thunderclap",
  displayName: "Thunderclap",
  description: "A single bolt.",
  cost: { might: 2 },
  target: ENEMY_SINGLE,
  effects: [{ kind: "damage", amount: 30 }],
});
export const STORM_MANTLE = ability({
  id: "ability.zeiron.storm-mantle",
  displayName: "Storm Mantle",
  description: "Wraps himself in lightning that strikes back at attackers.",
  cost: { might: 1, spirit: 1 },
  cooldown: 3,
  target: SELF_ONLY,
  effects: [{ kind: "applyStatus", statusId: "status.counter", magnitude: 20, durationTurns: 2 }],
});
export const CHAIN_LIGHTNING = ability({
  id: "ability.zeiron.chain-lightning",
  displayName: "Chain Lightning",
  description: "Arcs through every enemy.",
  cost: { might: 2, focus: 1 },
  cooldown: 2,
  target: ENEMY_ALL,
  effects: [{ kind: "damage", amount: 25 }],
});
export const WRATH_OF_THE_UNCHAINED_SKY = ability({
  id: "ability.zeiron.wrath-of-the-unchained-sky",
  displayName: "Wrath of the Unchained Sky",
  description: "The storm answers all at once. Extremely expensive.",
  cost: { might: 3, spirit: 2, chaos: 1 },
  cooldown: 5,
  target: ENEMY_ALL,
  effects: [{ kind: "damage", amount: 70 }],
});

export const ZEIRON_ABILITIES: Ability[] = [THUNDERCLAP, STORM_MANTLE, CHAIN_LIGHTNING, WRATH_OF_THE_UNCHAINED_SKY];

export const ZEIRON: CharacterDefinition = characterDefinitionSchema.parse({
  id: "zeiron",
  version: 1,
  displayName: "Zeiron, the God Who Refused Olympus",
  rarity: "LEGENDARY",
  tags: ["LEGENDARY", "MAGE", "MYTHOLOGY", "ATTACKER"],
  baseHp: 140,
  abilityIds: ZEIRON_ABILITIES.map((a) => a.id),
  passiveId: BROKEN_CROWN.id,
  artSpecId: "zeiron",
});

const built = buildArt({
  bible: {
    characterId: "zeiron",
    species: "a rebellious Greek-inspired god of storms",
    ageRange: "ageless, apparently in his prime",
    face: "a stern, scarred, bearded face with storm-grey eyes",
    bodyType: "towering and heavily muscled",
    clothingArmor: "storm-scarred bronze armor with a torn cloak",
    weaponsProps: "crackling lightning gathered in one fist",
    markings: "branching lightning-scar patterns across the arms",
    silhouette: "a colossal figure under a broken crown of golden points",
    signatureProps: ["the broken golden crown", "gathered lightning"],
  },
  region: "Ancient Mediterranean (weathered bronze, marble, geometric borders)",
  visualTheme: "a rebel god, defiant and diminished by his own choice",
  environment: "a shattered marble terrace beneath a churning storm",
  lighting: "violent lightning with dark storm cloud backdrop",
  paletteConcept: "storm grey, weathered bronze, lightning white-blue, tarnished gold",
  avoid: ["any existing commercial depiction of Zeus"],
  splashScene: "standing on a shattered terrace, lightning ripping across dark clouds behind him",
  portraitScene: "storm-lit stare, the broken crown dark against the sky",
  avatarScene: "close crop on the face and the broken crown",
  iconScenes: [
    "a single fork of lightning striking a stone, for Thunderclap",
    "lightning coiling around a cloaked figure, for Storm Mantle",
    "a bolt branching between silhouettes, for Chain Lightning",
    "the sky splitting into a wall of lightning, for Wrath of the Unchained Sky",
  ],
  legendRevealScene: "descending from the clouds with the broken crown blazing and the whole arena lit white",
});
export const ZEIRON_VISUAL_BIBLE = built.bible;
export const ZEIRON_ART = built.art;
