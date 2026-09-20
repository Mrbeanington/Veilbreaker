import { characterDefinitionSchema, type CharacterDefinition } from "../../schemas/character";
import type { Ability } from "../../schemas/ability";
import { ability, buildArt, ENEMY_ALL, ENEMY_SINGLE, SELF_ONLY } from "./helpers";

// spec/03 #49 FROST JÖTUNN (Northern / Celtic) — a giant of the cold. He is slow
// and huge, and his Winter's Lock freezes one whole energy family solid for the
// enemy. docs/design/characters/frost-jotunn.md

export const ICE_CLUB = ability({
  id: "ability.frost-jotunn.ice-club",
  displayName: "Ice Club",
  description: "A club of glacier-ice: 30 damage.",
  cost: { might: 2 },
  target: ENEMY_SINGLE,
  effects: [{ kind: "damage", amount: 30 }],
});
export const HOARFROST_SKIN = ability({
  id: "ability.frost-jotunn.hoarfrost-skin",
  displayName: "Hoarfrost Skin",
  description: "A rime of ice over his body: he takes 20 less damage for 2 turns.",
  cost: { spirit: 1 },
  cooldown: 3,
  target: SELF_ONLY,
  effects: [{ kind: "applyStatus", statusId: "status.damage-reduction", magnitude: 20, durationTurns: 2 }],
});
export const WINTERS_LOCK = ability({
  id: "ability.frost-jotunn.winters-lock",
  displayName: "Winter's Lock",
  description: "Freezes an enemy's Might solid: it cannot use any ability that needs Might for 2 turns.",
  cost: { spirit: 1, focus: 1 },
  cooldown: 4,
  target: ENEMY_SINGLE,
  effects: [{ kind: "applyStatus", statusId: "status.energy-lock", param: "MIGHT", durationTurns: 2 }],
});
export const GLACIER_SLAM = ability({
  id: "ability.frost-jotunn.glacier-slam",
  displayName: "Glacier Slam",
  description: "Brings a glacier down: 20 damage to every enemy.",
  cost: { might: 2, spirit: 1 },
  cooldown: 3,
  target: ENEMY_ALL,
  effects: [{ kind: "damage", amount: 20 }],
});

export const FROST_JOTUNN_ABILITIES: Ability[] = [ICE_CLUB, HOARFROST_SKIN, WINTERS_LOCK, GLACIER_SLAM];

export const FROST_JOTUNN: CharacterDefinition = characterDefinitionSchema.parse({
  id: "frost-jotunn",
  version: 1,
  displayName: "Frost Jötunn",
  rarity: "RARE",
  tags: ["MYTHOLOGY", "TANK", "BRUISER"],
  baseHp: 190,
  abilityIds: FROST_JOTUNN_ABILITIES.map((a) => a.id),
  artSpecId: "frost-jotunn",
});

const built = buildArt({
  bible: {
    characterId: "frost-jotunn",
    species: "a frost giant of Norse myth",
    ageRange: "primeval",
    face: "a slab-jawed pale-blue face with a beard of icicles and white-rimmed eyes",
    bodyType: "colossal, thick-limbed, like a walking glacier",
    clothingArmor: "a kilt of frozen hide and shoulder plates of blue ice",
    weaponsProps: "a club that is a single spike of glacier ice",
    markings: "cracks of pale light running through his skin like ice fissures",
    silhouette: "a huge broad figure with an ice club against a white sky",
    signatureProps: ["an ice club", "a beard of icicles", "blue ice shoulder plates"],
  },
  region: "Norse / Celtic inspiration (carved knotwork, weathered stone, stormy northern landscapes)",
  visualTheme: "the cold that came before the gods",
  environment: "a glacier field under a low white sun",
  lighting: "flat white light with blue shadows in the ice",
  paletteConcept: "ice blue, glacier white, deep navy, pale gold",
  avoid: ["any existing game's frost giant design"],
  splashScene: "wading through a glacier crack with the club raised and snow blowing off the shoulders",
  portraitScene: "a huge pale face with icicle beard and pale eyes",
  avatarScene: "close crop on the face",
  iconScenes: [
    "a club of blue ice striking, for Ice Club",
    "overlapping plates of white frost, for Hoarfrost Skin",
    "a frozen padlock made of ice, for Winter's Lock",
    "a glacier wall collapsing, for Glacier Slam",
  ],
});
export const FROST_JOTUNN_VISUAL_BIBLE = built.bible;
export const FROST_JOTUNN_ART = built.art;
