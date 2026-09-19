import { characterDefinitionSchema, defaultResourcesFor, type CharacterDefinition } from "../../schemas/character";
import { passiveDefinitionSchema, type PassiveDefinition } from "../../schemas/passive";
import type { Ability } from "../../schemas/ability";
import type { Resource } from "../../schemas/common";
import { ability, ALLY_SINGLE, buildArt, ENEMY_SINGLE, SELF_ONLY } from "./helpers";

// spec/03 #3 CHARON (Ancient Mediterranean) — the ferryman. He earns an Obol
// for every death in the Arena, taxes energy, ferries allies to safety and
// makes sure the dead stay dead. docs/design/characters/charon.md

export const OBOLS_RESOURCE: Resource = {
  id: "resource.obols",
  displayName: "Obols",
  startingValue: 0,
  min: 0,
  max: 5,
  visibleToOpponent: true,
  displayHint: "pips",
  trackMode: true,
};

export const THE_TOLL: PassiveDefinition = passiveDefinitionSchema.parse({
  id: "passive.charon.the-toll",
  displayName: "The Toll",
  description: "Whenever anyone dies, he collects an Obol.",
  trigger: { event: "onDeath", relation: "any", effectTarget: "self" },
  effects: [{ kind: "modifyResource", resourceId: OBOLS_RESOURCE.id, amount: 1 }],
});

export const BOAT_POLE = ability({
  id: "ability.charon.boat-pole",
  displayName: "Boat Pole",
  description: "A hard shove with the pole.",
  cost: { might: 1 },
  target: ENEMY_SINGLE,
  effects: [{ kind: "damage", amount: 20 }],
});
export const TAKE_THE_TOLL = ability({
  id: "ability.charon.take-the-toll",
  displayName: "Take the Toll",
  description: "Takes 2 energy from an enemy for himself, and an Obol.",
  cost: { focus: 1 },
  cooldown: 3,
  target: ENEMY_SINGLE,
  effects: [
    { kind: "drainEnergy", family: "any", amount: 2, grantToSelf: true },
    { kind: "modifyResource", resourceId: OBOLS_RESOURCE.id, amount: 1, target: SELF_ONLY },
  ],
});
export const CROSS_THE_RIVER = ability({
  id: "ability.charon.cross-the-river",
  displayName: "Cross the River",
  description: "Ferries an ally out of reach for a turn and heals them 20.",
  cost: { spirit: 2 },
  cooldown: 4,
  target: ALLY_SINGLE,
  effects: [
    { kind: "applyStatus", statusId: "status.untargetable", durationTurns: 1 },
    { kind: "heal", healingClass: "heal", amount: 20 },
  ],
});
export const FINAL_FARE = ability({
  id: "ability.charon.final-fare",
  displayName: "Final Fare",
  description: "Locks an enemy out of resurrection for 2 turns. With three Obols to pay: 40 damage instead of 20, and the Obols are spent.",
  cost: { chaos: 1 },
  cooldown: 3,
  target: ENEMY_SINGLE,
  effects: [
    { kind: "applyStatus", statusId: "status.resurrection-lock", durationTurns: 2 },
    {
      kind: "conditional",
      condition: { type: "resourceAtLeast", target: "self", resourceId: OBOLS_RESOURCE.id, amount: 3 },
      ifTrue: [
        { kind: "damage", amount: 40 },
        { kind: "modifyResource", resourceId: OBOLS_RESOURCE.id, amount: -3, target: SELF_ONLY },
      ],
      ifFalse: [{ kind: "damage", amount: 20 }],
    },
  ],
});

export const CHARON_ABILITIES: Ability[] = [BOAT_POLE, TAKE_THE_TOLL, CROSS_THE_RIVER, FINAL_FARE];

export const CHARON: CharacterDefinition = characterDefinitionSchema.parse({
  id: "charon",
  version: 1,
  displayName: "Charon",
  rarity: "RARE",
  tags: ["MYTHOLOGY", "UNDEAD", "CONTROLLER"],
  baseHp: 130,
  abilityIds: CHARON_ABILITIES.map((a) => a.id),
  passiveId: THE_TOLL.id,
  resources: [OBOLS_RESOURCE],
  artSpecId: "charon",
});
export const CHARON_INITIAL_RESOURCES = defaultResourcesFor(CHARON);

const built = buildArt({
  bible: {
    characterId: "charon",
    species: "an ancient ferryman of the underworld, more spirit than man",
    ageRange: "impossibly old",
    face: "a gaunt hooded face, hollow cheeks and patient, tired eyes",
    bodyType: "tall and stooped, long-limbed",
    clothingArmor: "a sodden grey hooded cloak",
    weaponsProps: "a long black boat pole with a lantern hung from its tip",
    markings: "coins pressed into the skin of his palms",
    silhouette: "a stooped hooded figure leaning on a very long pole",
    signatureProps: ["a boat pole", "a hanging lantern", "two coins glinting"],
  },
  region: "Ancient Mediterranean (weathered bronze, marble, geometric borders)",
  visualTheme: "a patient worker for whom every death is a fare",
  environment: "a black river under a low stone arch",
  lighting: "one swinging lantern on dark water",
  paletteConcept: "river black, lantern amber, ash grey, tarnished coin gold",
  avoid: ["any existing game's grim ferryman design"],
  splashScene: "poling a narrow boat through mist with a figure sitting silent at the prow",
  portraitScene: "his hooded face lit from below by the lantern, a coin between two fingers",
  avatarScene: "close crop on the lantern and the hood",
  iconScenes: [
    "a pole striking water, for Boat Pole",
    "a coin dropped into an open palm, for Take the Toll",
    "a boat crossing a dark river with a lantern, for Cross the River",
    "a coin laid on a shut eye, for Final Fare",
  ],
});
export const CHARON_VISUAL_BIBLE = built.bible;
export const CHARON_ART = built.art;
