import { characterDefinitionSchema, defaultResourcesFor, type CharacterDefinition } from "../../schemas/character";
import { passiveDefinitionSchema, type PassiveDefinition } from "../../schemas/passive";
import { transformationSchema, type Transformation } from "../../schemas/transformation";
import type { Ability } from "../../schemas/ability";
import type { Resource } from "../../schemas/common";
import { ability, buildArt, ENEMY_ALL, ENEMY_SINGLE, SELF_ONLY } from "./helpers";

// spec/03 #26 THE NINE-TAILED TRICKSTER — tail accumulation -> Ascension.
// docs/design/characters/nine-tailed-trickster.md

export const TAILS_RESOURCE: Resource = {
  id: "resource.tails",
  displayName: "Tails",
  startingValue: 1,
  min: 1,
  max: 9,
  visibleToOpponent: true,
  displayHint: "pips",
  trackMode: true,
};

const TO_ASCENDED_ID = "transformation.nine-tailed-trickster.ascension";

// Every hit she lands grows a tail; the ninth ascends her (same passive-driven
// pattern as Patient Zero — OQ-34).
export const TAIL_BY_TAIL: PassiveDefinition = passiveDefinitionSchema.parse({
  id: "passive.nine-tailed-trickster.tail-by-tail",
  displayName: "Tail by Tail",
  description: "Every hit she lands grows another tail. At nine, she Ascends.",
  trigger: { event: "onDamageDealt", relation: "self", effectTarget: "self" },
  effects: [
    { kind: "modifyResource", resourceId: TAILS_RESOURCE.id, amount: 1 },
    {
      kind: "conditional",
      condition: { type: "resourceAtLeast", target: "self", resourceId: TAILS_RESOURCE.id, amount: 9 },
      ifTrue: [{ kind: "transformInto", transformationId: TO_ASCENDED_ID }],
    },
  ],
});

export const FOX_FIRE = ability({
  id: "ability.nine-tailed-trickster.fox-fire",
  displayName: "Fox Fire",
  description: "Pale flames that keep burning.",
  cost: { focus: 1, chaos: 1 },
  target: ENEMY_SINGLE,
  effects: [
    { kind: "damage", amount: 15 },
    { kind: "applyStatus", statusId: "status.burn", magnitude: 5, durationTurns: 3 },
  ],
});
export const TAIL_LASH = ability({
  id: "ability.nine-tailed-trickster.tail-lash",
  displayName: "Tail Lash",
  description: "A sweeping strike.",
  cost: { might: 1, focus: 1 },
  target: ENEMY_SINGLE,
  effects: [{ kind: "damage", amount: 25 }],
});
export const MIRROR_ILLUSION = ability({
  id: "ability.nine-tailed-trickster.mirror-illusion",
  displayName: "Mirror Illusion",
  description: "Slips out of sight for a turn.",
  cost: { spirit: 1, chaos: 1 },
  cooldown: 3,
  target: SELF_ONLY,
  effects: [{ kind: "applyStatus", statusId: "status.untargetable", durationTurns: 1 }],
});
export const CONFOUNDING_TRICK = ability({
  id: "ability.nine-tailed-trickster.confounding-trick",
  displayName: "Confounding Trick",
  description: "A gamble: the target is either stunned or merely weakened.",
  cost: { chaos: 2 },
  cooldown: 3,
  target: ENEMY_SINGLE,
  effects: [
    {
      kind: "randomOutcome",
      outcome: {
        rerollable: false,
        branches: [
          { weight: 2, effects: [{ kind: "applyStatus", statusId: "status.weakness", magnitude: 10, durationTurns: 2 }] },
          { weight: 1, effects: [{ kind: "applyStatus", statusId: "status.stun", durationTurns: 1 }] },
        ],
      },
    },
  ],
});
// Ascended-only replacement for Fox Fire.
export const NINE_FLAME_NOVA = ability({
  id: "ability.nine-tailed-trickster.nine-flame-nova",
  displayName: "Nine-Flame Nova",
  description: "All nine tails ignite, burning every enemy.",
  cost: { focus: 2, chaos: 1 },
  cooldown: 2,
  target: ENEMY_ALL,
  effects: [
    { kind: "damage", amount: 25 },
    { kind: "applyStatus", statusId: "status.burn", magnitude: 8, durationTurns: 3 },
  ],
});

export const NINE_TAILED_TRICKSTER_ABILITIES: Ability[] = [FOX_FIRE, TAIL_LASH, MIRROR_ILLUSION, CONFOUNDING_TRICK, NINE_FLAME_NOVA];

export const ASCENSION: Transformation = transformationSchema.parse({
  id: TO_ASCENDED_ID,
  characterId: "nine-tailed-trickster",
  fromStageId: null,
  toStageId: "ascended",
  trigger: { type: "resourceAtLeast", target: "self", resourceId: TAILS_RESOURCE.id, amount: 9 },
  changes: {
    displayName: "The Nine-Tailed Trickster, Ascended",
    maxHp: 150,
    abilityIds: [NINE_FLAME_NOVA.id, TAIL_LASH.id, MIRROR_ILLUSION.id, CONFOUNDING_TRICK.id],
  },
});

export const NINE_TAILED_TRICKSTER: CharacterDefinition = characterDefinitionSchema.parse({
  id: "nine-tailed-trickster",
  version: 1,
  displayName: "The Nine-Tailed Trickster",
  rarity: "RARE",
  tags: ["FOLKLORE", "MAGE", "EVOLUTION", "CONTROLLER"],
  baseHp: 100,
  abilityIds: [FOX_FIRE.id, TAIL_LASH.id, MIRROR_ILLUSION.id, CONFOUNDING_TRICK.id],
  passiveId: TAIL_BY_TAIL.id,
  resources: [TAILS_RESOURCE],
  transformationIds: [ASCENSION.id],
  artSpecId: "nine-tailed-trickster",
});
export const NINE_TAILED_TRICKSTER_INITIAL_RESOURCES = defaultResourcesFor(NINE_TAILED_TRICKSTER);

const built = buildArt({
  bible: {
    characterId: "nine-tailed-trickster",
    species: "a fox spirit of East Asian folklore",
    ageRange: "centuries old, appearing youthful",
    face: "a sly narrow face with amber eyes and a knowing smile",
    bodyType: "slender and light-footed",
    clothingArmor: "layered silk robes in pale blue and white",
    weaponsProps: "floating pale fox-fire orbs",
    markings: "red markings along the eyes and cheeks in an original pattern",
    silhouette: "a graceful figure fanned by a spread of long tails",
    signatureProps: ["a fan of tails", "pale fox-fire orbs"],
  },
  region: "Japanese/East Asian folklore inspiration (woodblock composition; cultural review required, OQ-12)",
  visualTheme: "charm that costs more the more tails it has",
  environment: "a moonlit shrine path lined with stone lanterns",
  lighting: "moonlight with drifting pale fire",
  paletteConcept: "moon white, pale blue, fox-fire teal, ember red",
  avoid: ["any existing anime fox character or franchise iconography"],
  splashScene: "seated mid-laugh on a stone lantern with tails fanned behind her and fox-fire circling",
  portraitScene: "a sidelong glance over one shoulder, a tail curling into frame",
  avatarScene: "close crop on the eyes and a curl of tail",
  iconScenes: [
    "a pale flame shaped like a fox head, for Fox Fire",
    "a sweeping tail leaving arcs of light, for Tail Lash",
    "a mirror reflecting an empty room, for Mirror Illusion",
    "a swirling die of light, for Confounding Trick",
    "nine tails ablaze in a ring, for Nine-Flame Nova",
  ],
});
export const NINE_TAILED_TRICKSTER_VISUAL_BIBLE = built.bible;
export const NINE_TAILED_TRICKSTER_ART = {
  ...built.art,
  transformationPrompts: [
    built.art.splashPrompt.replace("full-body splash illustration", "full-body transformation reveal illustration, Ascended with nine blazing tails"),
  ],
};
