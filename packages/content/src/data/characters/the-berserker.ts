import { characterDefinitionSchema, defaultResourcesFor, type CharacterDefinition } from "../../schemas/character";
import { passiveDefinitionSchema, type PassiveDefinition } from "../../schemas/passive";
import type { Ability } from "../../schemas/ability";
import type { Resource } from "../../schemas/common";
import { ability, buildArt, ENEMY_ALL, ENEMY_SINGLE, SELF_ONLY } from "./helpers";

// spec/03 #45 THE BERSERKER (Northern / Celtic) — pain into fury. Every wound he
// takes feeds his Rage, and Rage becomes either damage or healing; his best hit
// costs his own blood. docs/design/characters/the-berserker.md

export const RAGE_RESOURCE: Resource = {
  id: "resource.rage",
  displayName: "Rage",
  startingValue: 0,
  min: 0,
  max: 4,
  visibleToOpponent: true,
  displayHint: "pips",
  trackMode: true,
};

export const PAIN_IS_FUEL: PassiveDefinition = passiveDefinitionSchema.parse({
  id: "passive.the-berserker.pain-is-fuel",
  displayName: "Pain Is Fuel",
  description: "Every time he is wounded he gains a Rage.",
  trigger: { event: "onDamaged", relation: "self", effectTarget: "self" },
  effects: [{ kind: "modifyResource", resourceId: RAGE_RESOURCE.id, amount: 1 }],
});

export const AXE_FLURRY = ability({
  id: "ability.the-berserker.axe-flurry",
  displayName: "Axe Flurry",
  description: "Two wild chops: 2 hits of 10 damage.",
  cost: { might: 1 },
  target: ENEMY_SINGLE,
  effects: [
    { kind: "damage", amount: 10 },
    { kind: "damage", amount: 10 },
  ],
});
export const RECKLESS_SWING = ability({
  id: "ability.the-berserker.reckless-swing",
  displayName: "Reckless Swing",
  description: "50 damage, and it costs him 20 of his own health.",
  cost: { might: 2 },
  cooldown: 2,
  target: ENEMY_SINGLE,
  effects: [
    { kind: "damage", amount: 50 },
    { kind: "damage", amount: 20, damageType: "affliction", target: SELF_ONLY },
  ],
});
export const BLOOD_RAGE = ability({
  id: "ability.the-berserker.blood-rage",
  displayName: "Blood Rage",
  description: "Turns Rage into blood: with three Rage he heals 40 and spends it. With less he heals 10.",
  cost: { spirit: 1 },
  cooldown: 3,
  target: SELF_ONLY,
  effects: [
    {
      kind: "conditional",
      condition: { type: "resourceAtLeast", target: "self", resourceId: RAGE_RESOURCE.id, amount: 3 },
      ifTrue: [
        { kind: "heal", healingClass: "heal", amount: 40 },
        { kind: "modifyResource", resourceId: RAGE_RESOURCE.id, amount: -3 },
      ],
      ifFalse: [{ kind: "heal", healingClass: "heal", amount: 10 }],
    },
  ],
});
export const WAR_HOWL = ability({
  id: "ability.the-berserker.war-howl",
  displayName: "War Howl",
  description: "With two Rage, every enemy is frightened and weakened for 2 turns (spends 2 Rage). Otherwise 10 damage to all.",
  cost: { chaos: 1 },
  cooldown: 3,
  target: ENEMY_ALL,
  effects: [
    {
      kind: "conditional",
      condition: { type: "resourceAtLeast", target: "self", resourceId: RAGE_RESOURCE.id, amount: 2 },
      ifTrue: [
        { kind: "applyStatus", statusId: "status.fear", durationTurns: 1 },
        { kind: "applyStatus", statusId: "status.weakness", magnitude: 10, durationTurns: 2 },
        { kind: "modifyResource", resourceId: RAGE_RESOURCE.id, amount: -2, target: SELF_ONLY },
      ],
      ifFalse: [{ kind: "damage", amount: 10 }],
    },
  ],
});

export const THE_BERSERKER_ABILITIES: Ability[] = [AXE_FLURRY, RECKLESS_SWING, BLOOD_RAGE, WAR_HOWL];

export const THE_BERSERKER: CharacterDefinition = characterDefinitionSchema.parse({
  id: "the-berserker",
  version: 1,
  displayName: "The Berserker",
  rarity: "CORE",
  tags: ["MYTHOLOGY", "WARRIOR", "BRUISER"],
  baseHp: 140,
  abilityIds: THE_BERSERKER_ABILITIES.map((a) => a.id),
  passiveId: PAIN_IS_FUEL.id,
  resources: [RAGE_RESOURCE],
  artSpecId: "the-berserker",
});
export const THE_BERSERKER_INITIAL_RESOURCES = defaultResourcesFor(THE_BERSERKER);

const built = buildArt({
  bible: {
    characterId: "the-berserker",
    species: "a frenzied warrior of Norse saga",
    ageRange: "a man in his prime",
    face: "a wild, scarred face with wide pale eyes and a matted beard",
    bodyType: "heavily muscled, hunched and coiled",
    clothingArmor: "a pelt of grey wolf-skin worn over bare shoulders and a leather kilt",
    weaponsProps: "two hand axes and teeth-marked wolf-bone charms",
    markings: "blue war-paint knotwork over the chest",
    silhouette: "a hunched wolf-skinned figure with an axe in each hand, mid-roar",
    signatureProps: ["a wolf pelt", "two hand axes", "war-paint knotwork"],
  },
  region: "Norse / Celtic inspiration (carved knotwork, weathered stone, stormy northern landscapes)",
  visualTheme: "a man who has stopped feeling pain and started to enjoy it",
  environment: "a burning village at the edge of a fjord",
  lighting: "flickering red firelight with cold sea shadow",
  paletteConcept: "blood red, wolf grey, war-paint blue, soot",
  avoid: ["any existing game's berserker design"],
  splashScene: "charging out of the smoke with both axes raised and mouth wide",
  portraitScene: "a wild face lit by fire, eyes very wide",
  avatarScene: "close crop on the eyes and beard",
  iconScenes: [
    "two axes in crossed swings, for Axe Flurry",
    "a single huge axe swing with a drop of blood, for Reckless Swing",
    "a heart wreathed in red flame, for Blood Rage",
    "a howling wolf skull, for War Howl",
  ],
});
export const THE_BERSERKER_VISUAL_BIBLE = built.bible;
export const THE_BERSERKER_ART = built.art;
