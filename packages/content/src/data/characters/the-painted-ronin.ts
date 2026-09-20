import { characterDefinitionSchema, defaultResourcesFor, type CharacterDefinition } from "../../schemas/character";
import type { Ability } from "../../schemas/ability";
import type { Resource } from "../../schemas/common";
import { ability, buildArt, ENEMY_SINGLE, SELF_ONLY } from "./helpers";

// spec/03 #29 THE PAINTED RONIN [SECRET] (Japanese Folklore / Ink Realm) — a
// masterless swordsman who is a living brush painting. Every stroke he lands
// leaves Ink; a Final Stroke is worth what he has painted. The first character
// built on the Ink resource. docs/design/characters/the-painted-ronin.md

export const INK_RESOURCE: Resource = {
  id: "resource.ink",
  displayName: "Ink",
  startingValue: 0,
  min: 0,
  max: 5,
  visibleToOpponent: true,
  displayHint: "pips",
  trackMode: true,
};

export const BRUSH_STROKE = ability({
  id: "ability.the-painted-ronin.brush-stroke",
  displayName: "Brush Stroke",
  description: "A quick ink-slash: 10 damage and one Ink.",
  cost: { focus: 1 },
  target: ENEMY_SINGLE,
  effects: [
    { kind: "damage", amount: 10 },
    { kind: "modifyResource", resourceId: INK_RESOURCE.id, amount: 1, target: SELF_ONLY },
  ],
});
export const INK_WASH = ability({
  id: "ability.the-painted-ronin.ink-wash",
  displayName: "Ink Wash",
  description: "Dissolves into a wash of ink: he takes 20 less damage for a turn and gains two Ink.",
  cost: { spirit: 1 },
  cooldown: 2,
  target: SELF_ONLY,
  effects: [
    { kind: "applyStatus", statusId: "status.damage-reduction", magnitude: 20, durationTurns: 1 },
    { kind: "modifyResource", resourceId: INK_RESOURCE.id, amount: 2 },
  ],
});
export const PORTRAIT_OF_A_FOE = ability({
  id: "ability.the-painted-ronin.portrait-of-a-foe",
  displayName: "Portrait of a Foe",
  description: "Paints the enemy's weakness: its attacks are weakened by 10 for 2 turns; with two Ink spent, its cooldowns also slow.",
  cost: { focus: 1, spirit: 1 },
  cooldown: 3,
  target: ENEMY_SINGLE,
  effects: [
    { kind: "applyStatus", statusId: "status.weakness", magnitude: 10, durationTurns: 2 },
    {
      kind: "conditional",
      condition: { type: "resourceAtLeast", target: "self", resourceId: INK_RESOURCE.id, amount: 2 },
      ifTrue: [
        { kind: "applyStatus", statusId: "status.cooldown-increase", magnitude: 1, durationTurns: 2 },
        { kind: "modifyResource", resourceId: INK_RESOURCE.id, amount: -2, target: SELF_ONLY },
      ],
    },
  ],
});
export const FINAL_BRUSH_STROKE = ability({
  id: "ability.the-painted-ronin.final-stroke",
  displayName: "Final Stroke",
  description: "20 damage. With four Ink, the whole painting comes together: 70 damage, and the Ink is spent.",
  cost: { might: 2 },
  cooldown: 3,
  target: ENEMY_SINGLE,
  effects: [
    {
      kind: "conditional",
      condition: { type: "resourceAtLeast", target: "self", resourceId: INK_RESOURCE.id, amount: 4 },
      ifTrue: [
        { kind: "damage", amount: 70 },
        { kind: "modifyResource", resourceId: INK_RESOURCE.id, amount: -4, target: SELF_ONLY },
      ],
      ifFalse: [{ kind: "damage", amount: 20 }],
    },
  ],
});

export const THE_PAINTED_RONIN_ABILITIES: Ability[] = [BRUSH_STROKE, INK_WASH, PORTRAIT_OF_A_FOE, FINAL_BRUSH_STROKE];

export const THE_PAINTED_RONIN: CharacterDefinition = characterDefinitionSchema.parse({
  id: "the-painted-ronin",
  version: 1,
  displayName: "The Painted Ronin",
  rarity: "SECRET",
  tags: ["FOLKLORE", "WARRIOR", "ASSASSIN", "SECRET"],
  baseHp: 120,
  abilityIds: THE_PAINTED_RONIN_ABILITIES.map((a) => a.id),
  resources: [INK_RESOURCE],
  knowledgeLevel: "DISCOVERABLE",
  artSpecId: "the-painted-ronin",
});
export const THE_PAINTED_RONIN_INITIAL_RESOURCES = defaultResourcesFor(THE_PAINTED_RONIN);

const built = buildArt({
  bible: {
    characterId: "the-painted-ronin",
    species: "a masterless swordsman who is a living ink painting, from the Ink Realm",
    ageRange: "impossible to tell",
    face: "a calm face drawn in a few strong brush lines with no colour, eyes as two black dots",
    bodyType: "lean, painted in graduated ink washes so edges fade into the background",
    clothingArmor: "a wide-sleeved robe and a straw hat, all in black ink and grey wash",
    weaponsProps: "a sword whose blade is a single sharp brush stroke",
    markings: "one red seal-stamp shape (invented) at the shoulder",
    silhouette: "a lone figure in a straw hat whose edges dissolve into ink wash",
    signatureProps: ["a straw hat", "a brush-stroke blade", "a red seal stamp"],
  },
  region: "Japanese / Ink Realm inspiration (sumi-e brush language; cultural review required, OQ-12)",
  visualTheme: "a story still being painted, and one that can paint itself out of trouble",
  environment: "a blank paper world with mountain outlines washed in grey",
  lighting: "flat paper light with soft ink shadows",
  paletteConcept: "ink black, grey wash, paper white, one spot of seal red",
  avoid: ["any existing game's ink-warrior design", "real sacred text"],
  splashScene: "walking across a blank scroll, the landscape painting itself in around him with each step",
  portraitScene: "a brush-drawn face under the straw hat with a single red seal",
  avatarScene: "close crop on the hat brim and the eyes",
  iconScenes: [
    "a single black brush stroke, for Brush Stroke",
    "a figure dissolving into a wash of ink, for Ink Wash",
    "a portrait sketched in a few lines with a cross through it, for Portrait of a Foe",
    "a huge bold stroke across a whole page, for Final Stroke",
  ],
  secretSilhouetteScene: "a straw-hatted ink silhouette on a blank page, no other detail",
});
export const THE_PAINTED_RONIN_VISUAL_BIBLE = built.bible;
export const THE_PAINTED_RONIN_ART = built.art;
