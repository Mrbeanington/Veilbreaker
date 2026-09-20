import { characterDefinitionSchema, type CharacterDefinition } from "../../schemas/character";
import type { Ability } from "../../schemas/ability";
import { ALLY_SINGLE, ENEMY_SINGLE, ability, buildArt } from "./helpers";

// spec/03 #63 ANUBIAN JUDGE [SECRET] (Egypt / Desert) — a jackal-masked judge of the dead. Those who have done the most harm are weighed heaviest. docs/design/characters/anubian-judge.md

export const FEATHER_STRIKE = ability({
  id: "ability.anubian-judge.feather-strike",
  displayName: "Feather Strike",
  description: "A light, exact blow: 20 damage.",
  cost: { might: 1 },
  target: ENEMY_SINGLE,
  effects: [{ kind: "damage", amount: 20 }],
});
export const WEIGH_THE_HEART = ability({
  id: "ability.anubian-judge.weigh-the-heart",
  displayName: "Weigh the Heart",
  description: "20 damage, or 40 against an enemy that has dealt 60 or more damage this battle.",
  cost: { focus: 1, spirit: 1 },
  cooldown: 2,
  target: ENEMY_SINGLE,
  effects: [
    {
      kind: "conditional",
      condition: { type: "damageDealtAtLeast", target: "target", amount: 60 },
      ifTrue: [{ kind: "damage", amount: 40 }],
      ifFalse: [{ kind: "damage", amount: 20 }],
    },
  ],
});
export const VERDICT_OF_MAAT = ability({
  id: "ability.anubian-judge.verdict-of-maat",
  displayName: "Verdict of Ma'at",
  description: "Passes sentence: the enemy is weakened and takes 10 more damage for 2 turns.",
  cost: { spirit: 2 },
  cooldown: 3,
  target: ENEMY_SINGLE,
  effects: [{ kind: "applyStatus", statusId: "status.weakness", magnitude: 10, durationTurns: 2 }, { kind: "applyStatus", statusId: "status.damage-amplification", magnitude: 10, durationTurns: 2 }],
});
export const BALANCE_THE_SCALES = ability({
  id: "ability.anubian-judge.balance-the-scales",
  displayName: "Balance the Scales",
  description: "Sets right a wrong: heals an ally for 30.",
  cost: { spirit: 1 },
  cooldown: 2,
  target: ALLY_SINGLE,
  effects: [{ kind: "heal", healingClass: "heal", amount: 30 }],
});

export const ANUBIAN_JUDGE_ABILITIES: Ability[] = [FEATHER_STRIKE, WEIGH_THE_HEART, VERDICT_OF_MAAT, BALANCE_THE_SCALES];

export const ANUBIAN_JUDGE: CharacterDefinition = characterDefinitionSchema.parse({
  id: "anubian-judge",
  version: 1,
  displayName: "Anubian Judge",
  rarity: "SECRET",
  tags: ["MYTHOLOGY", "CONTROLLER", "ATTACKER", "SECRET"],
  baseHp: 140,
  abilityIds: ANUBIAN_JUDGE_ABILITIES.map((a) => a.id),
  knowledgeLevel: "DISCOVERABLE",
  artSpecId: "anubian-judge",
});

const built = buildArt({
  bible: {
    characterId: "anubian-judge",
    species: "a jackal-masked judge of the dead from desert myth",
    ageRange: "ageless",
    face: "a black jackal mask with narrow gold eye-slits",
    bodyType: "tall, still and composed",
    clothingArmor: "a white pleated robe, a heavy gold collar and black leather sandals",
    weaponsProps: "a pair of brass scales and a single white feather",
    markings: "black kohl lines running down from the eye slits",
    silhouette: "a tall jackal-masked figure holding brass scales at arm's length",
    signatureProps: ["brass scales", "a white feather", "a jackal mask"],
  },
  region: "Egyptian / Desert inspiration (sandstone, gold leaf, hieroglyph-free geometric borders, endless dunes)",
  visualTheme: "the weight of what you have done",
  environment: "a great pillared hall of judgement with a still lake",
  lighting: "cool lamplight reflected off the water",
  paletteConcept: "black, white, gold, deep teal",
  avoid: ["any existing game's anubian judge design"],
  splashScene: "standing at the edge of a still lake with the scales held out and the feather on the other pan",
  portraitScene: "a black jackal mask with two gold slits",
  avatarScene: "close crop on the mask",
  iconScenes: ["a white feather in a raised hand, for Feather Strike", "brass scales tipping under a heart-shaped weight, for Weigh the Heart", "a raised gavel-shaped staff, for Verdict of Ma'at", "level scales in a soft glow, for Balance the Scales"],
  secretSilhouetteScene: "a tall jackal-headed figure with scales against a pillared hall, no other detail",
});
export const ANUBIAN_JUDGE_VISUAL_BIBLE = built.bible;
export const ANUBIAN_JUDGE_ART = built.art;
