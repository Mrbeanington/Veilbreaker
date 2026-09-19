import { characterDefinitionSchema, type CharacterDefinition } from "../../schemas/character";
import type { Ability } from "../../schemas/ability";
import { ability, buildArt, ENEMY_ALL, ENEMY_SINGLE, SELF_ONLY } from "./helpers";

// spec/03 #2 MEDUSA (Ancient Mediterranean) — petrification. A gazed-at enemy is
// turned to stone: it cannot act, but stone is hard to hurt. Her big gaze costs
// her own blood, and she is fragile. docs/design/characters/medusa.md

export const SNAKE_BITE = ability({
  id: "ability.medusa.snake-bite",
  displayName: "Snake Bite",
  description: "Her hair strikes: 10 damage and poison.",
  cost: { focus: 1 },
  target: ENEMY_SINGLE,
  effects: [
    { kind: "damage", amount: 10 },
    { kind: "applyStatus", statusId: "status.poison", magnitude: 5, durationTurns: 2 },
  ],
});
export const PETRIFYING_GAZE = ability({
  id: "ability.medusa.petrifying-gaze",
  displayName: "Petrifying Gaze",
  description: "Turns an enemy to stone for a turn: it cannot act, and takes 20 less damage while stone.",
  cost: { spirit: 2 },
  cooldown: 4,
  target: ENEMY_SINGLE,
  effects: [
    { kind: "applyStatus", statusId: "status.petrification", durationTurns: 1 },
    { kind: "applyStatus", statusId: "status.stun", durationTurns: 1 },
    { kind: "applyStatus", statusId: "status.damage-reduction", magnitude: 20, durationTurns: 2 },
  ],
});
export const CONSTRICTING_COILS = ability({
  id: "ability.medusa.constricting-coils",
  displayName: "Constricting Coils",
  description: "10 damage and the enemy's attacks are weakened.",
  cost: { chaos: 1 },
  cooldown: 2,
  target: ENEMY_SINGLE,
  effects: [
    { kind: "damage", amount: 10 },
    { kind: "applyStatus", statusId: "status.weakness", magnitude: 10, durationTurns: 2 },
  ],
});
// Looking at the whole team means not looking away: it costs her blood.
export const GORGONS_GLARE = ability({
  id: "ability.medusa.gorgons-glare",
  displayName: "Gorgon's Glare",
  description: "Turns every enemy to stone for a turn, and costs her 30 health.",
  cost: { spirit: 2, chaos: 1 },
  cooldown: 6,
  target: ENEMY_ALL,
  effects: [
    { kind: "applyStatus", statusId: "status.petrification", durationTurns: 1 },
    { kind: "applyStatus", statusId: "status.stun", durationTurns: 1 },
    { kind: "damage", amount: 30, damageType: "affliction", target: SELF_ONLY },
  ],
});

export const MEDUSA_ABILITIES: Ability[] = [SNAKE_BITE, PETRIFYING_GAZE, CONSTRICTING_COILS, GORGONS_GLARE];

export const MEDUSA: CharacterDefinition = characterDefinitionSchema.parse({
  id: "medusa",
  version: 1,
  displayName: "Medusa",
  rarity: "RARE",
  tags: ["MYTHOLOGY", "CONTROLLER", "MAGE"],
  baseHp: 110,
  abilityIds: MEDUSA_ABILITIES.map((a) => a.id),
  artSpecId: "medusa",
});

const built = buildArt({
  bible: {
    characterId: "medusa",
    species: "a gorgon of Mediterranean myth",
    ageRange: "ageless",
    face: "a stern, sorrowful woman's face with unreadable pale eyes",
    bodyType: "tall and still, coiled serpent lower body",
    clothingArmor: "a tattered bronze-green mantle",
    weaponsProps: "a mass of living snakes for hair, and a cracked bronze mirror shard at her belt",
    markings: "green-gold scale patterns along her arms",
    silhouette: "a tall still figure crowned by writhing snakes",
    signatureProps: ["hair of snakes", "stone-grey statues at her feet", "a cracked bronze mirror"],
  },
  region: "Ancient Mediterranean (weathered bronze, marble, geometric borders)",
  visualTheme: "a monster no one dares look at, and a woman who dares not look back",
  environment: "a ruined temple hall full of weathered statues",
  lighting: "cold grey light with green reflected from bronze",
  paletteConcept: "stone grey, verdigris green, dull gold, black",
  avoid: ["any existing game's gorgon design"],
  splashScene: "standing among frozen warriors with her eyes downcast and the snakes rearing",
  portraitScene: "her face half turned away, one pale eye visible, snakes in the frame's corners",
  avatarScene: "close crop on the snakes and one eye",
  iconScenes: [
    "a snake head striking, for Snake Bite",
    "a single pale eye with cracks spreading outward, for Petrifying Gaze",
    "coils tightening around a stone column, for Constricting Coils",
    "a wide ring of grey cracking stone spreading from an eye, for Gorgon's Glare",
  ],
});
export const MEDUSA_VISUAL_BIBLE = built.bible;
export const MEDUSA_ART = built.art;
