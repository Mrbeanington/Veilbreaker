import { characterDefinitionSchema, type CharacterDefinition } from "../../schemas/character";
import type { Ability } from "../../schemas/ability";
import { ability, buildArt, ENEMY_SINGLE } from "./helpers";

// spec/03 #47 THE DULLAHAN (Northern / Celtic) — the headless rider who calls a
// name, and the one who bears that name dies. An executioner: Death's Summons
// marks a victim, and Headless Charge finishes a wounded one.
// docs/design/characters/the-dullahan.md

export const WHIP_OF_BONE = ability({
  id: "ability.the-dullahan.whip-of-bone",
  displayName: "Whip of Bone",
  description: "A lash of a spine-whip: 20 damage and Bleed.",
  cost: { might: 1 },
  target: ENEMY_SINGLE,
  effects: [
    { kind: "damage", amount: 20 },
    { kind: "applyStatus", statusId: "status.bleed", magnitude: 5, durationTurns: 3 },
  ],
});
export const DEATHS_SUMMONS = ability({
  id: "ability.the-dullahan.deaths-summons",
  displayName: "Death's Summons",
  description: "Calls a name aloud: the enemy is cursed for 3 turns and frightened for a turn.",
  cost: { chaos: 1 },
  cooldown: 2,
  target: ENEMY_SINGLE,
  effects: [
    { kind: "applyStatus", statusId: "status.curse", durationTurns: 3 },
    { kind: "applyStatus", statusId: "status.fear", durationTurns: 1 },
  ],
});
export const HEADLESS_CHARGE = ability({
  id: "ability.the-dullahan.headless-charge",
  displayName: "Headless Charge",
  description: "40 damage. An enemy already below 30% health is struck down for 100.",
  cost: { might: 2, chaos: 1 },
  cooldown: 3,
  target: ENEMY_SINGLE,
  effects: [
    {
      kind: "conditional",
      condition: { type: "hpBelowPercent", target: "target", percent: 30 },
      ifTrue: [{ kind: "damage", amount: 100 }],
      ifFalse: [{ kind: "damage", amount: 40 }],
    },
  ],
});
export const DEAD_MANS_ROAD = ability({
  id: "ability.the-dullahan.dead-mans-road",
  displayName: "Dead Man's Road",
  description: "Rides where no living thing can follow: untargetable for a turn.",
  cost: { spirit: 1, focus: 1 },
  cooldown: 4,
  target: { side: "self", scope: "single", count: 1, includeSelf: true, filterTags: [] },
  effects: [{ kind: "applyStatus", statusId: "status.untargetable", durationTurns: 1 }],
});

export const THE_DULLAHAN_ABILITIES: Ability[] = [WHIP_OF_BONE, DEATHS_SUMMONS, HEADLESS_CHARGE, DEAD_MANS_ROAD];

export const THE_DULLAHAN: CharacterDefinition = characterDefinitionSchema.parse({
  id: "the-dullahan",
  version: 1,
  displayName: "The Dullahan",
  rarity: "RARE",
  tags: ["MYTHOLOGY", "UNDEAD", "ATTACKER", "ASSASSIN"],
  baseHp: 140,
  abilityIds: THE_DULLAHAN_ABILITIES.map((a) => a.id),
  artSpecId: "the-dullahan",
});

const built = buildArt({
  bible: {
    characterId: "the-dullahan",
    species: "a headless horseman of Irish folklore",
    ageRange: "long dead",
    face: "no head on the shoulders; a pale head with a wide grin is carried under one arm",
    bodyType: "tall and lean in the saddle",
    clothingArmor: "a long black cloak and dark riding leathers",
    weaponsProps: "a whip made of a human spine and a black horse with ember-red eyes",
    markings: "a faint glow from the carried head's eyes",
    silhouette: "a black-cloaked rider on a black horse with a head held at the hip",
    signatureProps: ["a carried head", "a spine whip", "a black horse"],
  },
  region: "Norse / Celtic inspiration (carved knotwork, weathered stone, stormy northern landscapes)",
  visualTheme: "an errand that ends in a name",
  environment: "a lonely moor road at midnight",
  lighting: "cold blue moonlight with a red glint from the horse",
  paletteConcept: "night black, moon blue, bone white, ember red",
  avoid: ["any existing game's headless-horseman design"],
  splashScene: "reining in on a moor road with the pale head held up under the moon",
  portraitScene: "the carried head grinning in profile against the black cloak",
  avatarScene: "close crop on the carried head",
  iconScenes: [
    "a spine-whip cracking in a curve, for Whip of Bone",
    "a mouth calling a name with a black ring around it, for Death's Summons",
    "a hooved charge with a blade-glint, for Headless Charge",
    "a road fading into fog behind a rider, for Dead Man's Road",
  ],
});
export const THE_DULLAHAN_VISUAL_BIBLE = built.bible;
export const THE_DULLAHAN_ART = built.art;
