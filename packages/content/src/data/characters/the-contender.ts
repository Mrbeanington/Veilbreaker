import { characterDefinitionSchema, type CharacterDefinition } from "../../schemas/character";
import type { Ability } from "../../schemas/ability";
import { ENEMY_SINGLE, SELF_ONLY, ability, buildArt } from "./helpers";

// spec/03 #103 THE CONTENDER (Sports / Fighters) — a boxer who is at his most dangerous when he is losing. Take him low and the haymaker lands like a truck. docs/design/characters/the-contender.md

export const JAB = ability({
  id: "ability.the-contender.jab",
  displayName: "Jab",
  description: "A sharp jab: 20 damage.",
  cost: { might: 1 },
  target: ENEMY_SINGLE,
  effects: [{ kind: "damage", amount: 20 }],
});
export const HAYMAKER = ability({
  id: "ability.the-contender.haymaker",
  displayName: "Haymaker",
  description: "30 damage, or 80 when he is below 40% health.",
  cost: { might: 2 },
  cooldown: 2,
  target: ENEMY_SINGLE,
  effects: [
    {
      kind: "conditional",
      condition: { type: "hpBelowPercent", target: "self", percent: 40 },
      ifTrue: [{ kind: "damage", amount: 80 }],
      ifFalse: [{ kind: "damage", amount: 30 }],
    },
  ],
});
export const ROPE_A_DOPE = ability({
  id: "ability.the-contender.rope-a-dope",
  displayName: "Rope-a-Dope",
  description: "Covers up on the ropes: strikes back for 20 whenever hit, for 2 turns.",
  cost: { spirit: 1 },
  cooldown: 3,
  target: SELF_ONLY,
  effects: [{ kind: "applyStatus", statusId: "status.counter", magnitude: 20, durationTurns: 2 }],
});
export const CUT_MAN = ability({
  id: "ability.the-contender.cut-man",
  displayName: "Cut Man",
  description: "Between rounds: heals 20 and lifts every harmful effect from himself.",
  cost: { spirit: 1 },
  cooldown: 4,
  target: SELF_ONLY,
  effects: [{ kind: "heal", healingClass: "heal", amount: 20 }, { kind: "removeStatus", dispelAll: true, target: SELF_ONLY }],
});

export const THE_CONTENDER_ABILITIES: Ability[] = [JAB, HAYMAKER, ROPE_A_DOPE, CUT_MAN];

export const THE_CONTENDER: CharacterDefinition = characterDefinitionSchema.parse({
  id: "the-contender",
  version: 1,
  displayName: "The Contender",
  rarity: "CORE",
  tags: ["ATHLETE", "BRUISER", "WARRIOR"],
  baseHp: 140,
  abilityIds: THE_CONTENDER_ABILITIES.map((a) => a.id),
  artSpecId: "the-contender",
});

const built = buildArt({
  bible: {
    characterId: "the-contender",
    species: "a determined heavyweight boxer of ring tall tales",
    ageRange: "a man in his thirties",
    face: "a swollen-browed, stubborn face with a taped cut over one eye and a steady stare",
    bodyType: "broad, thick-armed and slightly hunched",
    clothingArmor: "scuffed red gloves, faded grey trunks with a white waistband, bandaged wrists and worn boots",
    weaponsProps: "a pair of scuffed red boxing gloves and a dented water bottle",
    markings: "a taped cut above the left eye",
    silhouette: "a hunched figure in gloves held high in a guard with a towel over one shoulder",
    signatureProps: ["red boxing gloves", "a taped cut brow", "a towel over the shoulder"],
  },
  region: "Stadium and ring inspiration (floodlights, worn leather, chalk dust, hand-painted banners, no real teams, leagues or people)",
  visualTheme: "the man who is never out of it",
  environment: "a smoky small-hall boxing ring",
  lighting: "a single hard overhead lamp and haze",
  paletteConcept: "glove red, canvas grey, lamp yellow, shadow",
  avoid: ["any existing game's the contender design"],
  splashScene: "standing in a smoky ring with the gloves raised and blood on the brow under a hard overhead lamp",
  portraitScene: "a taped cut brow over a steady stare",
  avatarScene: "close crop on the brow and stare",
  iconScenes: ["a red glove snapping out, for Jab", "a huge overhand swing with motion blur, for Haymaker", "two gloves covering a face against ropes, for Rope-a-Dope", "a thumb pressing a taped brow, for Cut Man"],
});
export const THE_CONTENDER_VISUAL_BIBLE = built.bible;
export const THE_CONTENDER_ART = built.art;
