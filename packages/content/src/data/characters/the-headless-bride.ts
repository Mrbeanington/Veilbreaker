import { characterDefinitionSchema, type CharacterDefinition } from "../../schemas/character";
import { passiveDefinitionSchema, type PassiveDefinition } from "../../schemas/passive";
import type { Ability } from "../../schemas/ability";
import type { Resource } from "../../schemas/common";
import { ALLY_SINGLE, ENEMY_SINGLE, SELF_ONLY, ability, buildArt } from "./helpers";

// spec/03 #79 THE HEADLESS BRIDE (Horror / Monsters / Dead) — a widowed spirit whose grief becomes a weapon. Every ally who falls feeds her Grief, and her wail spends it. docs/design/characters/the-headless-bride.md

export const GRIEF_RESOURCE: Resource = {
  id: "resource.grief",
  displayName: "Grief",
  startingValue: 0,
  min: 0,
  max: 3,
  visibleToOpponent: true,
  displayHint: "pips",
  trackMode: true,
};

export const WIDOWS_GRIEF: PassiveDefinition = passiveDefinitionSchema.parse({
  id: "passive.the-headless-bride.widows-grief",
  displayName: "Widow's Grief",
  description: "Whenever an ally falls, she gains a Grief (max 3).",
  trigger: { event: "onDeath", relation: "ally", effectTarget: "self" },
  effects: [{ kind: "modifyResource", resourceId: GRIEF_RESOURCE.id, amount: 1 }],
});

export const VEIL_LASH = ability({
  id: "ability.the-headless-bride.veil-lash",
  displayName: "Veil Lash",
  description: "A whip of torn lace: 20 damage.",
  cost: { might: 1 },
  target: ENEMY_SINGLE,
  effects: [{ kind: "damage", amount: 20 }],
});
export const BOUQUET_TOSS = ability({
  id: "ability.the-headless-bride.bouquet-toss",
  displayName: "Bouquet Toss",
  description: "Tosses her bouquet to a friend: a shield of 30 for 3 turns.",
  cost: { spirit: 1 },
  cooldown: 2,
  target: ALLY_SINGLE,
  effects: [{ kind: "applyStatus", statusId: "status.shield", magnitude: 30, durationTurns: 3 }],
});
export const JILTED_VOW = ability({
  id: "ability.the-headless-bride.jilted-vow",
  displayName: "Jilted Vow",
  description: "Names a faithless enemy: it is Marked for 3 turns and weakened for 2.",
  cost: { focus: 1 },
  cooldown: 2,
  target: ENEMY_SINGLE,
  effects: [{ kind: "applyStatus", statusId: "status.mark", durationTurns: 3 }, { kind: "applyStatus", statusId: "status.weakness", magnitude: 10, durationTurns: 2 }],
});
export const VENGEFUL_WAIL = ability({
  id: "ability.the-headless-bride.vengeful-wail",
  displayName: "Vengeful Wail",
  description: "30 damage, or 60 if she has any Grief (which it spends).",
  cost: { might: 2, chaos: 1 },
  cooldown: 2,
  target: ENEMY_SINGLE,
  effects: [
    {
      kind: "conditional",
      condition: { type: "resourceAtLeast", target: "self", resourceId: GRIEF_RESOURCE.id, amount: 1 },
      ifTrue: [{ kind: "damage", amount: 60 }, { kind: "modifyResource", resourceId: GRIEF_RESOURCE.id, amount: -1, target: SELF_ONLY }],
      ifFalse: [{ kind: "damage", amount: 30 }],
    },
  ],
});

export const THE_HEADLESS_BRIDE_ABILITIES: Ability[] = [VEIL_LASH, BOUQUET_TOSS, JILTED_VOW, VENGEFUL_WAIL];

export const THE_HEADLESS_BRIDE: CharacterDefinition = characterDefinitionSchema.parse({
  id: "the-headless-bride",
  version: 1,
  displayName: "The Headless Bride",
  rarity: "RARE",
  tags: ["FOLKLORE", "UNDEAD", "CURSE"],
  baseHp: 110,
  abilityIds: THE_HEADLESS_BRIDE_ABILITIES.map((a) => a.id),
  passiveId: WIDOWS_GRIEF.id,
  resources: [GRIEF_RESOURCE],
  artSpecId: "the-headless-bride",
});

const built = buildArt({
  bible: {
    characterId: "the-headless-bride",
    species: "a headless bride ghost of European folk horror",
    ageRange: "a young woman, long dead",
    face: "no head: a high lace collar and a torn veil hanging over empty air",
    bodyType: "slim and upright, in a moth-eaten wedding gown",
    clothingArmor: "a yellowed lace wedding dress, a torn veil and a rusted ring on a chain",
    weaponsProps: "a wilted bouquet in one hand and a long strip of veil in the other",
    markings: "faded grave-dirt stains at the hem",
    silhouette: "a slim gowned figure with a veil hanging over nothing where the head should be",
    signatureProps: ["a torn veil", "a wilted bouquet", "a yellowed lace gown"],
  },
  region: "Gothic folk-horror inspiration (candle-lit gloom, moth-eaten velvet, cold fog, hand-stitched cloth and old bone)",
  visualTheme: "a vow that outlived her",
  environment: "a ruined chapel aisle with candles guttering",
  lighting: "cold candlelight and blue moonlight through a broken window",
  paletteConcept: "lace ivory, grave grey, candle amber, dried-blood red",
  avoid: ["any existing game's the headless bride design"],
  splashScene: "walking down a ruined chapel aisle with the bouquet held out and the veil trailing",
  portraitScene: "a high lace collar and a veil hanging over empty air",
  avatarScene: "close crop on the collar and veil",
  iconScenes: ["a strip of torn lace snapping like a whip, for Veil Lash", "a bouquet falling through candlelight, for Bouquet Toss", "a rusted ring on a chain, for Jilted Vow", "a torn veil streaming in a howling wind, for Vengeful Wail"],
});
export const THE_HEADLESS_BRIDE_VISUAL_BIBLE = built.bible;
export const THE_HEADLESS_BRIDE_ART = built.art;
