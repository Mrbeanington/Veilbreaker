import { characterDefinitionSchema, type CharacterDefinition } from "../../schemas/character";
import { passiveDefinitionSchema, type PassiveDefinition } from "../../schemas/passive";
import type { Ability } from "../../schemas/ability";
import { ENEMY_ALL, ENEMY_SINGLE, SELF_ONLY, ability, buildArt } from "./helpers";

// spec/03 #56 THE MUMMY PRINCE (Egypt / Desert) — a bound royal heir. He binds and curses, and when he falls the curse follows the living. docs/design/characters/the-mummy-prince.md

export const THE_CURSE_FOLLOWS: PassiveDefinition = passiveDefinitionSchema.parse({
  id: "passive.the-mummy-prince.the-curse-follows",
  displayName: "The Curse Follows",
  description: "When he falls, every enemy is cursed and weakened for 2 turns.",
  trigger: { event: "onDeath", relation: "self", effectTarget: "self" },
  effects: [
    { kind: "applyStatus", statusId: "status.curse", durationTurns: 2, target: ENEMY_ALL },
    { kind: "applyStatus", statusId: "status.weakness", magnitude: 10, durationTurns: 2, target: ENEMY_ALL },
  ],
});

export const WRAPPED_FIST = ability({
  id: "ability.the-mummy-prince.wrapped-fist",
  displayName: "Wrapped Fist",
  description: "A bandaged blow: 20 damage.",
  cost: { might: 1 },
  target: ENEMY_SINGLE,
  effects: [{ kind: "damage", amount: 20 }],
});
export const BIND_IN_LINEN = ability({
  id: "ability.the-mummy-prince.bind-in-linen",
  displayName: "Bind in Linen",
  description: "Wraps an enemy tight: it is stunned for a turn.",
  cost: { spirit: 1, focus: 1 },
  cooldown: 4,
  target: ENEMY_SINGLE,
  effects: [{ kind: "applyStatus", statusId: "status.stun", durationTurns: 1 }],
});
export const ROYAL_CURSE = ability({
  id: "ability.the-mummy-prince.royal-curse",
  displayName: "Royal Curse",
  description: "A curse of the blood: the enemy is cursed and takes 10 more damage for 3 turns.",
  cost: { spirit: 1 },
  cooldown: 2,
  target: ENEMY_SINGLE,
  effects: [{ kind: "applyStatus", statusId: "status.curse", durationTurns: 3 }, { kind: "applyStatus", statusId: "status.damage-amplification", magnitude: 10, durationTurns: 3 }],
});
export const PRESERVED_BY_SALT = ability({
  id: "ability.the-mummy-prince.preserved-by-salt",
  displayName: "Preserved by Salt",
  description: "Dry, salted flesh: takes 30 less damage for a turn.",
  cost: { spirit: 1 },
  cooldown: 3,
  target: SELF_ONLY,
  effects: [{ kind: "applyStatus", statusId: "status.damage-reduction", magnitude: 30, durationTurns: 1 }],
});

export const THE_MUMMY_PRINCE_ABILITIES: Ability[] = [WRAPPED_FIST, BIND_IN_LINEN, ROYAL_CURSE, PRESERVED_BY_SALT];

export const THE_MUMMY_PRINCE: CharacterDefinition = characterDefinitionSchema.parse({
  id: "the-mummy-prince",
  version: 1,
  displayName: "The Mummy Prince",
  rarity: "RARE",
  tags: ["MYTHOLOGY", "UNDEAD", "CURSE"],
  baseHp: 130,
  abilityIds: THE_MUMMY_PRINCE_ABILITIES.map((a) => a.id),
  passiveId: THE_CURSE_FOLLOWS.id,
  artSpecId: "the-mummy-prince",
});

const built = buildArt({
  bible: {
    characterId: "the-mummy-prince",
    species: "a mummified young prince of a lost desert dynasty",
    ageRange: "a youth, long dead",
    face: "a wrapped face with two pale, unblinking eyes and a cracked gold death-mask on one side",
    bodyType: "slim and stiff, wrapped head to foot",
    clothingArmor: "fine linen wrappings, a gold pectoral and a broken princely circlet",
    weaponsProps: "a slender scepter and trailing loose bandages",
    markings: "faded ochre patterns painted on the linen",
    silhouette: "a slim wrapped figure with trailing bandages and a cracked circlet",
    signatureProps: ["a cracked circlet", "trailing bandages", "a gold pectoral"],
  },
  region: "Egyptian / Desert inspiration (sandstone, gold leaf, hieroglyph-free geometric borders, endless dunes)",
  visualTheme: "an heir who was never allowed to rest",
  environment: "a painted burial chamber with cracked walls",
  lighting: "cold lamplight and drifting dust",
  paletteConcept: "linen cream, faded ochre, tarnished gold, shadow blue",
  avoid: ["any existing game's the mummy prince design"],
  splashScene: "stepping out of an open sarcophagus with bandages trailing and the scepter raised",
  portraitScene: "a wrapped face with two pale eyes and half a gold mask",
  avatarScene: "close crop on the mask and eyes",
  iconScenes: ["a bandaged fist in torchlight, for Wrapped Fist", "linen strips winding tight round a wrist, for Bind in Linen", "a cracked circlet with a dark glow, for Royal Curse", "a small heap of pale salt crystals, for Preserved by Salt"],
});
export const THE_MUMMY_PRINCE_VISUAL_BIBLE = built.bible;
export const THE_MUMMY_PRINCE_ART = built.art;
