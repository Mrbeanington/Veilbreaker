import { characterDefinitionSchema, defaultResourcesFor, type CharacterDefinition } from "../../schemas/character";
import { passiveDefinitionSchema, type PassiveDefinition } from "../../schemas/passive";
import type { Ability } from "../../schemas/ability";
import type { Resource } from "../../schemas/common";
import { ability, buildArt, ENEMY_SINGLE, SELF_ONLY } from "./helpers";

// spec/03 #18 KAPPA KIRO (Japanese Folklore) — a river imp with a dish of water
// on his head. While the dish is full he is strong; every wound spills some,
// and a dry Kiro is weak. docs/design/characters/kappa-kiro.md

export const DISH_RESOURCE: Resource = {
  id: "resource.dish",
  displayName: "Water in the Dish",
  startingValue: 3,
  min: 0,
  max: 3,
  visibleToOpponent: true,
  displayHint: "pips",
  trackMode: true,
};

export const DISH_SPILLS: PassiveDefinition = passiveDefinitionSchema.parse({
  id: "passive.kappa-kiro.dish-spills",
  displayName: "The Dish Spills",
  description: "Every wound spills a little water. With the dish empty, he takes 10 more damage for 2 turns.",
  trigger: { event: "onDamaged", relation: "self", effectTarget: "self" },
  effects: [
    { kind: "modifyResource", resourceId: DISH_RESOURCE.id, amount: -1 },
    {
      kind: "conditional",
      condition: { type: "not", condition: { type: "resourceAtLeast", target: "self", resourceId: DISH_RESOURCE.id, amount: 1 } },
      ifTrue: [{ kind: "applyStatus", statusId: "status.damage-amplification", magnitude: 10, durationTurns: 2 }],
    },
  ],
});

export const RIVERBANK_GRAB = ability({
  id: "ability.kappa-kiro.riverbank-grab",
  displayName: "Riverbank Grab",
  description: "10 damage; 30 while the dish holds at least two Water.",
  cost: { focus: 1 },
  target: ENEMY_SINGLE,
  effects: [
    {
      kind: "conditional",
      condition: { type: "resourceAtLeast", target: "self", resourceId: DISH_RESOURCE.id, amount: 2 },
      ifTrue: [{ kind: "damage", amount: 30 }],
      ifFalse: [{ kind: "damage", amount: 10 }],
    },
  ],
});
export const REFILL_THE_DISH = ability({
  id: "ability.kappa-kiro.refill-the-dish",
  displayName: "Refill the Dish",
  description: "Dips his head in the river: the dish is full again and he heals 10.",
  cost: { spirit: 1 },
  cooldown: 2,
  target: SELF_ONLY,
  effects: [
    { kind: "modifyResource", resourceId: DISH_RESOURCE.id, amount: 3 },
    { kind: "heal", healingClass: "heal", amount: 10 },
  ],
});
export const SUMO_THROW = ability({
  id: "ability.kappa-kiro.sumo-throw",
  displayName: "Sumo Throw",
  description: "A heave that spills his own water: 40 damage and one Water lost.",
  cost: { might: 2 },
  cooldown: 3,
  target: ENEMY_SINGLE,
  effects: [
    { kind: "damage", amount: 40 },
    { kind: "modifyResource", resourceId: DISH_RESOURCE.id, amount: -1, target: SELF_ONLY },
  ],
});
export const DRAG_UNDER = ability({
  id: "ability.kappa-kiro.drag-under",
  displayName: "Drag Under",
  description: "Pulls an enemy beneath the current: with a full dish, stuns it for a turn (spending two Water); otherwise it only weakens it.",
  cost: { spirit: 1, chaos: 1 },
  cooldown: 4,
  target: ENEMY_SINGLE,
  effects: [
    {
      kind: "conditional",
      condition: { type: "resourceAtLeast", target: "self", resourceId: DISH_RESOURCE.id, amount: 3 },
      ifTrue: [
        { kind: "applyStatus", statusId: "status.stun", durationTurns: 1 },
        { kind: "modifyResource", resourceId: DISH_RESOURCE.id, amount: -2, target: SELF_ONLY },
      ],
      ifFalse: [{ kind: "applyStatus", statusId: "status.weakness", magnitude: 10, durationTurns: 2 }],
    },
  ],
});

export const KAPPA_KIRO_ABILITIES: Ability[] = [RIVERBANK_GRAB, REFILL_THE_DISH, SUMO_THROW, DRAG_UNDER];

export const KAPPA_KIRO: CharacterDefinition = characterDefinitionSchema.parse({
  id: "kappa-kiro",
  version: 1,
  displayName: "Kappa Kiro",
  rarity: "RARE",
  tags: ["FOLKLORE", "CONTROLLER", "BEAST"],
  baseHp: 120,
  abilityIds: KAPPA_KIRO_ABILITIES.map((a) => a.id),
  passiveId: DISH_SPILLS.id,
  resources: [DISH_RESOURCE],
  artSpecId: "kappa-kiro",
});
export const KAPPA_KIRO_INITIAL_RESOURCES = defaultResourcesFor(KAPPA_KIRO);

const built = buildArt({
  bible: {
    characterId: "kappa-kiro",
    species: "a river imp of Japanese folklore",
    ageRange: "ageless, boyish",
    face: "a beaked, whiskered face with wide bright eyes and a mischievous grin",
    bodyType: "small, wiry and green-skinned with a turtle-like shell on his back",
    clothingArmor: "none — a scaled shell and webbed hands",
    weaponsProps: "a shallow dish of water on top of his head and a cucumber tucked in his belt",
    markings: "pale belly, olive-green skin with dark speckles",
    silhouette: "a small hunched figure with a round dish-topped head and a shell",
    signatureProps: ["a water dish on the head", "a cucumber", "a shell"],
  },
  region: "Japanese folklore inspiration (woodblock composition; cultural review required, OQ-12)",
  visualTheme: "polite mischief that lives and dies by one bowl of water",
  environment: "a misty river bank with reeds and stepping stones",
  lighting: "soft dawn mist with silver water reflections",
  paletteConcept: "river green, wet stone grey, dish white, cucumber green",
  avoid: ["any existing anime or game kappa design"],
  splashScene: "crouched on a river stone balancing the full dish on his head, one webbed hand outstretched",
  portraitScene: "a cheeky beaked grin under the shining dish",
  avatarScene: "close crop on the face and dish",
  iconScenes: [
    "a webbed hand grabbing from the water, for Riverbank Grab",
    "a dish filling with water from a stream, for Refill the Dish",
    "two small hands lifting a much larger figure, for Sumo Throw",
    "a swirl of river current pulling downward, for Drag Under",
  ],
});
export const KAPPA_KIRO_VISUAL_BIBLE = built.bible;
export const KAPPA_KIRO_ART = built.art;
