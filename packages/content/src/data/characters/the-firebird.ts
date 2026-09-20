import { characterDefinitionSchema, defaultResourcesFor, type CharacterDefinition } from "../../schemas/character";
import { passiveDefinitionSchema, type PassiveDefinition } from "../../schemas/passive";
import type { Ability } from "../../schemas/ability";
import type { Resource } from "../../schemas/common";
import { ability, ALLY_SINGLE, buildArt, ENEMY_ALL, ENEMY_SINGLE } from "./helpers";

// spec/03 #38 THE FIREBIRD (Slavic / Russian Night) — a bird of fire and
// renewal. Once a battle it rises from its own ashes when it would fall, and its
// feathers heal and cleanse allies. docs/design/characters/the-firebird.md

export const REBIRTH_RESOURCE: Resource = {
  id: "resource.rebirth",
  displayName: "Rebirth",
  startingValue: 1,
  min: 0,
  max: 1,
  visibleToOpponent: true,
  displayHint: "pips",
  trackMode: true,
};

// Fires in the death-check tier before she is marked dead (ADR-015): setting her
// health above zero means she never dies.
export const RISE_FROM_ASHES: PassiveDefinition = passiveDefinitionSchema.parse({
  id: "passive.the-firebird.rise-from-ashes",
  displayName: "Rise from Ashes",
  description: "Once per battle, when she would fall, she is reborn at 40 health.",
  trigger: { event: "onWouldDie", relation: "self" },
  condition: { type: "resourceAtLeast", target: "self", resourceId: REBIRTH_RESOURCE.id, amount: 1 },
  effects: [
    { kind: "modifyResource", resourceId: REBIRTH_RESOURCE.id, amount: -1 },
    { kind: "heal", healingClass: "setHp", amount: 40 },
  ],
});

export const EMBER_LASH = ability({
  id: "ability.the-firebird.ember-lash",
  displayName: "Ember Lash",
  description: "A trailing feather of flame: 10 damage and Burn.",
  cost: { focus: 1 },
  target: ENEMY_SINGLE,
  effects: [
    { kind: "damage", amount: 10 },
    { kind: "applyStatus", statusId: "status.burn", magnitude: 10, durationTurns: 2 },
  ],
});
export const GLOWING_FEATHER = ability({
  id: "ability.the-firebird.glowing-feather",
  displayName: "Glowing Feather",
  description: "Gives an ally a glowing feather: they heal 20, and healing on them is stronger for 3 turns.",
  cost: { spirit: 1 },
  cooldown: 2,
  target: ALLY_SINGLE,
  effects: [
    { kind: "heal", healingClass: "heal", amount: 20 },
    { kind: "applyStatus", statusId: "status.healing-amplification", magnitude: 10, durationTurns: 3 },
  ],
});
export const DAWN_LIGHT = ability({
  id: "ability.the-firebird.dawn-light",
  displayName: "Dawn Light",
  description: "Burns away every harmful effect on an ally, and heals them 10.",
  cost: { spirit: 1, focus: 1 },
  cooldown: 3,
  target: ALLY_SINGLE,
  effects: [
    { kind: "removeStatus", dispelAll: true },
    { kind: "heal", healingClass: "heal", amount: 10 },
  ],
});
export const CINDER_STORM = ability({
  id: "ability.the-firebird.cinder-storm",
  displayName: "Cinder Storm",
  description: "A storm of cinders: 10 damage to every enemy.",
  cost: { chaos: 2, spirit: 1 },
  cooldown: 4,
  target: ENEMY_ALL,
  effects: [{ kind: "damage", amount: 10 }],
});

export const THE_FIREBIRD_ABILITIES: Ability[] = [EMBER_LASH, GLOWING_FEATHER, DAWN_LIGHT, CINDER_STORM];

export const THE_FIREBIRD: CharacterDefinition = characterDefinitionSchema.parse({
  id: "the-firebird",
  version: 1,
  displayName: "The Firebird",
  rarity: "RARE",
  tags: ["FOLKLORE", "SUPPORT", "MAGE", "HEALER"],
  baseHp: 70,
  abilityIds: THE_FIREBIRD_ABILITIES.map((a) => a.id),
  passiveId: RISE_FROM_ASHES.id,
  resources: [REBIRTH_RESOURCE],
  artSpecId: "the-firebird",
});
export const THE_FIREBIRD_INITIAL_RESOURCES = defaultResourcesFor(THE_FIREBIRD);

const built = buildArt({
  bible: {
    characterId: "the-firebird",
    species: "a fire-feathered bird of Slavic folklore",
    ageRange: "ageless",
    face: "a proud bird's head with a golden crest and glowing amber eyes",
    bodyType: "a long-tailed bird the size of a horse, wings wide",
    clothingArmor: "none — feathers of red, gold and orange that glow like coals",
    weaponsProps: "trailing tail feathers that burn without being consumed",
    markings: "ornamental gold scrollwork patterns along the wings in an original folk style",
    silhouette: "a bird with a huge fanned tail of long feathers, lit from within",
    signatureProps: ["glowing tail feathers", "a golden crest", "cinders in the air"],
  },
  region: "Slavic folklore inspiration (folk ornament geometry, storybook atmosphere)",
  visualTheme: "a warm light in a cold forest that can be caught only once",
  environment: "a snowy forest clearing at night lit by the bird's glow",
  lighting: "warm orange glow with cold blue shadows",
  paletteConcept: "fire orange, gold, ember red, midnight blue",
  avoid: ["any existing game's phoenix design"],
  splashScene: "perched on a bare branch with its tail feathers spilling light down over the snow",
  portraitScene: "the bird's head turned, amber eye bright, sparks drifting off the crest",
  avatarScene: "close crop on the head and crest",
  iconScenes: [
    "a burning feather streaking through the air, for Ember Lash",
    "a single glowing feather held out in an open hand, for Glowing Feather",
    "a sunrise breaking over a dark ridge, for Dawn Light",
    "a whirl of glowing cinders, for Cinder Storm",
  ],
});
export const THE_FIREBIRD_VISUAL_BIBLE = built.bible;
export const THE_FIREBIRD_ART = built.art;
