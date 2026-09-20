import { characterDefinitionSchema, type CharacterDefinition } from "../../schemas/character";
import type { Ability } from "../../schemas/ability";
import { ability, buildArt, ENEMY_SINGLE, SELF_ONLY } from "./helpers";

// spec/03 #40 MARYA THE WARRIOR (Slavic / Russian Night) — a bogatyr heroine of
// folk tales: a plain, hard fighter. She rallies, then charges: the charge is
// twice as good right after a Rally. docs/design/characters/marya-the-warrior.md

export const SABRE_CUT = ability({
  id: "ability.marya-the-warrior.sabre-cut",
  displayName: "Sabre Cut",
  description: "A clean cut: 20 damage.",
  cost: { might: 1 },
  target: ENEMY_SINGLE,
  effects: [{ kind: "damage", amount: 20 }],
});
export const RALLY = ability({
  id: "ability.marya-the-warrior.rally",
  displayName: "Rally",
  description: "Steels herself: heals 10 and her abilities recover a turn faster for 2 turns.",
  cost: { focus: 1 },
  cooldown: 2,
  target: SELF_ONLY,
  effects: [
    { kind: "heal", healingClass: "heal", amount: 10 },
    { kind: "applyStatus", statusId: "status.cooldown-reduction", magnitude: 1, durationTurns: 2 },
  ],
});
export const HORSE_CHARGE = ability({
  id: "ability.marya-the-warrior.horse-charge",
  displayName: "Horse Charge",
  description: "Rides an enemy down: 30 damage, or 50 right after Rally.",
  cost: { might: 2 },
  cooldown: 2,
  target: ENEMY_SINGLE,
  effects: [
    {
      kind: "conditional",
      condition: { type: "usedAbilityLastTurn", target: "self", abilityId: RALLY.id },
      ifTrue: [{ kind: "damage", amount: 50 }],
      ifFalse: [{ kind: "damage", amount: 30 }],
    },
  ],
});
export const HOLD_THE_LINE = ability({
  id: "ability.marya-the-warrior.hold-the-line",
  displayName: "Hold the Line",
  description: "Draws single-target attacks for a turn, and whoever hits her takes 20 damage back.",
  cost: { spirit: 1 },
  cooldown: 3,
  target: SELF_ONLY,
  effects: [
    { kind: "applyStatus", statusId: "status.taunt", durationTurns: 1 },
    { kind: "applyStatus", statusId: "status.counter", magnitude: 20, durationTurns: 1 },
  ],
});

export const MARYA_THE_WARRIOR_ABILITIES: Ability[] = [SABRE_CUT, RALLY, HORSE_CHARGE, HOLD_THE_LINE];

export const MARYA_THE_WARRIOR: CharacterDefinition = characterDefinitionSchema.parse({
  id: "marya-the-warrior",
  version: 1,
  displayName: "Marya the Warrior",
  rarity: "RARE",
  tags: ["FOLKLORE", "WARRIOR", "ATTACKER"],
  baseHp: 130,
  abilityIds: MARYA_THE_WARRIOR_ABILITIES.map((a) => a.id),
  artSpecId: "marya-the-warrior",
});

const built = buildArt({
  bible: {
    characterId: "marya-the-warrior",
    species: "a folk-tale heroine and warrior of the Slavic steppe and forest",
    ageRange: "a woman in her prime",
    face: "a strong, sun-browned face with a firm jaw, grey eyes and a long fair braid",
    bodyType: "broad-shouldered and athletic",
    clothingArmor: "a chain-mail shirt over a red embroidered tunic and a plain steel cap",
    weaponsProps: "a curved sabre and a round painted shield",
    markings: "a faded scar over one eyebrow",
    silhouette: "a braided warrior beside a big horse with a sabre raised",
    signatureProps: ["a curved sabre", "a round shield", "a long braid"],
  },
  region: "Slavic folklore inspiration (folk ornament geometry, storybook atmosphere)",
  visualTheme: "plain courage with a heavy sword arm",
  environment: "a wind-blown steppe edge beside an old pine forest",
  lighting: "low golden sun with long shadows",
  paletteConcept: "steel grey, folk red, wheat gold, pine green",
  avoid: ["any existing game's warrior-princess design"],
  splashScene: "standing beside her horse with the sabre pointed forward and the wind in her braid",
  portraitScene: "a firm face under a steel cap, braid over one shoulder",
  avatarScene: "close crop on the face and cap",
  iconScenes: [
    "a curved blade cutting in an arc, for Sabre Cut",
    "a raised fist in a mail glove, for Rally",
    "a horse's hooves in a cloud of dust, for Horse Charge",
    "a round shield planted in the ground, for Hold the Line",
  ],
});
export const MARYA_THE_WARRIOR_VISUAL_BIBLE = built.bible;
export const MARYA_THE_WARRIOR_ART = built.art;
