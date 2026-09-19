import { characterDefinitionSchema, type CharacterDefinition } from "../../schemas/character";
import { passiveDefinitionSchema, type PassiveDefinition } from "../../schemas/passive";
import type { Ability } from "../../schemas/ability";
import { ability, buildArt, ENEMY_ALL, ENEMY_SINGLE, SELF_ONLY } from "./helpers";

// spec/03 #4 THE BRONZE GIANT (Ancient Mediterranean) — an island's living
// guardian. Enormous, armoured, patient; the ichor in his single vein boils
// when he burns, and bronze goes soft in the heat. docs/design/characters/the-bronze-giant.md

export const ICHOR_VEIN: PassiveDefinition = passiveDefinitionSchema.parse({
  id: "passive.the-bronze-giant.ichor-vein",
  displayName: "Ichor Vein",
  description: "While he is burning his bronze softens: he takes 20 more damage that turn.",
  trigger: { event: "onTurnStart", relation: "self" },
  condition: { type: "hasStatus", target: "self", statusId: "status.burn" },
  effects: [{ kind: "applyStatus", statusId: "status.damage-amplification", magnitude: 20, durationTurns: 1 }],
  knowledgeLevel: "DISCOVERABLE",
});

export const HURL_BOULDER = ability({
  id: "ability.the-bronze-giant.hurl-boulder",
  displayName: "Hurl Boulder",
  description: "Throws a boulder for 40 damage.",
  cost: { might: 2 },
  target: ENEMY_SINGLE,
  effects: [{ kind: "damage", amount: 40 }],
});
export const BRONZE_PLATING = ability({
  id: "ability.the-bronze-giant.bronze-plating",
  displayName: "Bronze Plating",
  description: "Reduces the damage he takes by 20 for 2 turns.",
  cost: { spirit: 1 },
  cooldown: 3,
  target: SELF_ONLY,
  effects: [{ kind: "applyStatus", statusId: "status.damage-reduction", magnitude: 20, durationTurns: 2 }],
});
export const CIRCLE_THE_ISLAND = ability({
  id: "ability.the-bronze-giant.circle-the-island",
  displayName: "Circle the Island",
  description: "Patrols the shore: 20 damage to every enemy.",
  cost: { might: 1, focus: 1 },
  cooldown: 3,
  target: ENEMY_ALL,
  effects: [{ kind: "damage", amount: 20 }],
});
export const HEAVY_TREAD = ability({
  id: "ability.the-bronze-giant.heavy-tread",
  displayName: "Heavy Tread",
  description: "40 damage, and the enemy's attacks are weakened.",
  cost: { might: 3 },
  cooldown: 4,
  target: ENEMY_SINGLE,
  effects: [
    { kind: "damage", amount: 40 },
    { kind: "applyStatus", statusId: "status.weakness", magnitude: 10, durationTurns: 2 },
  ],
});

export const THE_BRONZE_GIANT_ABILITIES: Ability[] = [HURL_BOULDER, BRONZE_PLATING, CIRCLE_THE_ISLAND, HEAVY_TREAD];

export const THE_BRONZE_GIANT: CharacterDefinition = characterDefinitionSchema.parse({
  id: "the-bronze-giant",
  version: 1,
  displayName: "The Bronze Giant",
  rarity: "RARE",
  tags: ["MYTHOLOGY", "TANK", "ATTACKER"],
  baseHp: 160,
  abilityIds: THE_BRONZE_GIANT_ABILITIES.map((a) => a.id),
  passiveId: ICHOR_VEIN.id,
  artSpecId: "the-bronze-giant",
});

const built = buildArt({
  bible: {
    characterId: "the-bronze-giant",
    species: "a colossal automaton of bronze from Mediterranean myth",
    ageRange: "ancient",
    face: "an expressionless beaten-bronze face with hollow eyes",
    bodyType: "colossal, hulking, plated in overlapping bronze sheets",
    clothingArmor: "riveted bronze plates weathered green at the seams",
    weaponsProps: "his own huge fists and torn-up boulders",
    markings: "a single riveted seam at the ankle where a thin vein of gold shows",
    silhouette: "a vast plated figure standing on a shoreline",
    signatureProps: ["riveted bronze plates", "an ankle rivet", "a boulder in one fist"],
  },
  region: "Ancient Mediterranean (weathered bronze, marble, geometric borders)",
  visualTheme: "a guardian built to outlast every enemy but one small flaw",
  environment: "a rocky shoreline of a lonely island",
  lighting: "low sun glinting off green-brown bronze",
  paletteConcept: "weathered bronze, verdigris, sea grey, ember orange at the seams",
  avoid: ["any existing game's robot or golem design"],
  splashScene: "striding along the shore with a boulder raised and one foot in the surf",
  portraitScene: "the blank bronze face tilted down toward the viewer, rivets catching light",
  avatarScene: "close crop on the face and one shoulder plate",
  iconScenes: [
    "a boulder in flight, for Hurl Boulder",
    "overlapping bronze plates sliding closed, for Bronze Plating",
    "a great footprint circling an island, for Circle the Island",
    "a colossal foot lifted over a small figure, for Heavy Tread",
  ],
});
export const THE_BRONZE_GIANT_VISUAL_BIBLE = built.bible;
export const THE_BRONZE_GIANT_ART = built.art;
