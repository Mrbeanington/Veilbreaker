import { characterDefinitionSchema, defaultResourcesFor, type CharacterDefinition } from "../../schemas/character";
import { passiveDefinitionSchema, type PassiveDefinition } from "../../schemas/passive";
import { transformationSchema, type Transformation } from "../../schemas/transformation";
import type { Ability } from "../../schemas/ability";
import type { Resource } from "../../schemas/common";
import { ability, buildArt, ENEMY_ALL, ENEMY_SINGLE, SELF_ONLY } from "./helpers";

// spec/03 #14 THE FORGOTTEN TITAN [SECRET] (Ancient Mediterranean) — a sleeper
// under the Arena. While it sleeps it is nearly unhurtable and barely acts;
// every turn it Stirs, and at five Stirring it wakes into something enormous.
// Waking is a clock the enemy can race or the Titan itself can slow.
// docs/design/characters/the-forgotten-titan.md

export const STIRRING_RESOURCE: Resource = {
  id: "resource.stirring",
  displayName: "Stirring",
  startingValue: 0,
  min: 0,
  max: 5,
  visibleToOpponent: true,
  displayHint: "pips",
  trackMode: true,
};

export const TO_AWAKENED_ID = "transformation.the-forgotten-titan.awakened";

// One Stirring per turn. Asleep (under 4), it shrugs off 10 damage; at five it wakes.
export const HEAVY_SLEEPER: PassiveDefinition = passiveDefinitionSchema.parse({
  id: "passive.the-forgotten-titan.heavy-sleeper",
  displayName: "Heavy Sleeper",
  description: "Stirs a little more each turn. While still asleep (under four Stirring) it takes 10 less damage; at five Stirring it wakes.",
  trigger: { event: "onTurnStart", relation: "self" },
  effects: [
    { kind: "modifyResource", resourceId: STIRRING_RESOURCE.id, amount: 1 },
    {
      kind: "conditional",
      condition: { type: "resourceAtLeast", target: "self", resourceId: STIRRING_RESOURCE.id, amount: 5 },
      ifTrue: [{ kind: "transformInto", transformationId: TO_AWAKENED_ID }],
      ifFalse: [
        {
          kind: "conditional",
          condition: { type: "not", condition: { type: "resourceAtLeast", target: "self", resourceId: STIRRING_RESOURCE.id, amount: 4 } },
          ifTrue: [{ kind: "applyStatus", statusId: "status.damage-reduction", magnitude: 10, durationTurns: 1 }],
        },
      ],
    },
  ],
  knowledgeLevel: "DISCOVERABLE",
});

export const SLEEPERS_ROLL = ability({
  id: "ability.the-forgotten-titan.sleepers-roll",
  displayName: "Sleeper's Roll",
  description: "Rolls over: 20 damage.",
  cost: { might: 1 },
  target: ENEMY_SINGLE,
  effects: [{ kind: "damage", amount: 20 }],
});
export const DREAMING_WEIGHT = ability({
  id: "ability.the-forgotten-titan.dreaming-weight",
  displayName: "Dreaming Weight",
  description: "Sinks deeper into sleep: takes 20 less damage for 2 turns, and loses a Stirring.",
  cost: { spirit: 1 },
  cooldown: 3,
  target: SELF_ONLY,
  effects: [
    { kind: "applyStatus", statusId: "status.damage-reduction", magnitude: 20, durationTurns: 2 },
    { kind: "modifyResource", resourceId: STIRRING_RESOURCE.id, amount: -1 },
  ],
});
export const RESTLESS_TURN = ability({
  id: "ability.the-forgotten-titan.restless-turn",
  displayName: "Restless Turn",
  description: "Shakes the arena floor: 10 damage to every enemy and two Stirring.",
  cost: { chaos: 1 },
  cooldown: 2,
  target: ENEMY_ALL,
  effects: [
    { kind: "damage", amount: 10 },
    { kind: "modifyResource", resourceId: STIRRING_RESOURCE.id, amount: 2, target: SELF_ONLY },
  ],
});
export const TITANS_WRATH = ability({
  id: "ability.the-forgotten-titan.titans-wrath",
  displayName: "Titan's Wrath",
  description: "The waking blow: 60 damage.",
  cost: { might: 3 },
  cooldown: 2,
  target: ENEMY_SINGLE,
  effects: [{ kind: "damage", amount: 60 }],
});
export const UNBOUND_ROAR = ability({
  id: "ability.the-forgotten-titan.unbound-roar",
  displayName: "Unbound Roar",
  description: "30 damage to every enemy.",
  cost: { might: 2, spirit: 2 },
  cooldown: 4,
  target: ENEMY_ALL,
  effects: [{ kind: "damage", amount: 30 }],
});

export const THE_FORGOTTEN_TITAN_ABILITIES: Ability[] = [SLEEPERS_ROLL, DREAMING_WEIGHT, RESTLESS_TURN, TITANS_WRATH, UNBOUND_ROAR];

export const AWAKENED: Transformation = transformationSchema.parse({
  id: TO_AWAKENED_ID,
  characterId: "the-forgotten-titan",
  fromStageId: null,
  toStageId: "awakened",
  trigger: { type: "resourceAtLeast", target: "self", resourceId: STIRRING_RESOURCE.id, amount: 5 },
  changes: {
    displayName: "The Forgotten Titan, Awake",
    abilityIds: [TITANS_WRATH.id, UNBOUND_ROAR.id, SLEEPERS_ROLL.id, DREAMING_WEIGHT.id],
  },
});

export const THE_FORGOTTEN_TITAN: CharacterDefinition = characterDefinitionSchema.parse({
  id: "the-forgotten-titan",
  version: 1,
  displayName: "The Forgotten Titan",
  rarity: "SECRET",
  tags: ["MYTHOLOGY", "TANK", "EVOLUTION", "SECRET"],
  baseHp: 150,
  abilityIds: [SLEEPERS_ROLL.id, DREAMING_WEIGHT.id, RESTLESS_TURN.id],
  passiveId: HEAVY_SLEEPER.id,
  resources: [STIRRING_RESOURCE],
  transformationIds: [AWAKENED.id],
  knowledgeLevel: "DISCOVERABLE",
  artSpecId: "the-forgotten-titan",
});
export const THE_FORGOTTEN_TITAN_INITIAL_RESOURCES = defaultResourcesFor(THE_FORGOTTEN_TITAN);

const built = buildArt({
  bible: {
    characterId: "the-forgotten-titan",
    species: "a primordial giant of Mediterranean myth, half buried in stone",
    ageRange: "older than the mountains",
    face: "a vast worn stone face, eyes closed, moss in the creases",
    bodyType: "enormous and half-sunk into rock, shoulders like cliffs",
    clothingArmor: "none — skin like grey stone with veins of dull gold",
    weaponsProps: "broken chains of bronze still wrapped around wrists the size of columns",
    markings: "cracks of faint gold light running through the stone of his chest",
    silhouette: "a mountain with the shape of a sleeping giant's shoulders and head",
    signatureProps: ["broken bronze chains", "gold light in cracks", "moss and roots on stone"],
  },
  region: "Ancient Mediterranean (weathered bronze, marble, geometric borders)",
  visualTheme: "the thing under the floor, still dreaming",
  environment: "a cavern of collapsed columns around a colossal buried form",
  lighting: "dim grey with a slow gold pulse in the cracks",
  paletteConcept: "stone grey, moss green, dull gold, deep shadow",
  avoid: ["any existing game's titan or golem design"],
  splashScene: "rising from the rock with cracks of gold light spreading across his chest and chains snapping",
  portraitScene: "the great closed-eyed face with one crack of gold running down it",
  avatarScene: "close crop on the face and one chain-wrapped wrist",
  iconScenes: [
    "a huge hand shifting under rubble, for Sleeper's Roll",
    "a face sinking into stone, for Dreaming Weight",
    "cracks racing across a cavern floor, for Restless Turn",
    "a giant fist rising through broken chains, for Titan's Wrath",
  ],
  secretSilhouetteScene: "a mountain ridge shaped like a sleeping giant, no other detail",
  transformationScenes: ["the Titan awake: the mountain-like body rising to its full height, moss and stone sliding away, eyes open for the first time and the ground splitting beneath it"],
});
export const THE_FORGOTTEN_TITAN_VISUAL_BIBLE = built.bible;
export const THE_FORGOTTEN_TITAN_ART = built.art;
