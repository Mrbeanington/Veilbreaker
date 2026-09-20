import { characterDefinitionSchema, type CharacterDefinition } from "../../schemas/character";
import type { Ability } from "../../schemas/ability";
import { ENEMY_SINGLE, SELF_ONLY, ability, buildArt } from "./helpers";

// spec/03 #59 THE SPHINX (Egypt / Desert) — the riddler. Her riddle takes one kind of energy from you for a while, and she chooses which by chance. docs/design/characters/the-sphinx.md

export const LIONS_CLAW = ability({
  id: "ability.the-sphinx.lions-claw",
  displayName: "Lion's Claw",
  description: "A great paw falls: 30 damage.",
  cost: { might: 2 },
  cooldown: 1,
  target: ENEMY_SINGLE,
  effects: [{ kind: "damage", amount: 30 }],
});
export const RIDDLE_OF_THREE_AGES = ability({
  id: "ability.the-sphinx.riddle-of-three-ages",
  displayName: "Riddle of the Three Ages",
  description: "An unanswerable question: one energy of the enemy's, at random (Might, Focus or Spirit), is locked for 2 turns.",
  cost: { focus: 1 },
  cooldown: 3,
  target: ENEMY_SINGLE,
  effects: [
    {
      kind: "randomOutcome",
      outcome: {
        rerollable: false,
        branches: [
          { weight: 1, effects: [{ kind: "applyStatus", statusId: "status.energy-lock", param: "MIGHT", durationTurns: 2 }] },
          { weight: 1, effects: [{ kind: "applyStatus", statusId: "status.energy-lock", param: "FOCUS", durationTurns: 2 }] },
          { weight: 1, effects: [{ kind: "applyStatus", statusId: "status.energy-lock", param: "SPIRIT", durationTurns: 2 }] },
        ],
      },
    },
  ],
});
export const STONE_SILENCE = ability({
  id: "ability.the-sphinx.stone-silence",
  displayName: "Stone Silence",
  description: "A silence like a tomb: the enemy cannot use abilities for a turn.",
  cost: { focus: 1, spirit: 1 },
  cooldown: 4,
  target: ENEMY_SINGLE,
  effects: [{ kind: "applyStatus", statusId: "status.silence", durationTurns: 1 }],
});
export const PATIENT_STONE = ability({
  id: "ability.the-sphinx.patient-stone",
  displayName: "Patient Stone",
  description: "She waits out the sun: heals 20.",
  cost: { spirit: 1 },
  cooldown: 2,
  target: SELF_ONLY,
  effects: [{ kind: "heal", healingClass: "heal", amount: 20 }],
});

export const THE_SPHINX_ABILITIES: Ability[] = [LIONS_CLAW, RIDDLE_OF_THREE_AGES, STONE_SILENCE, PATIENT_STONE];

export const THE_SPHINX: CharacterDefinition = characterDefinitionSchema.parse({
  id: "the-sphinx",
  version: 1,
  displayName: "The Sphinx",
  rarity: "RARE",
  tags: ["MYTHOLOGY", "CONTROLLER", "BEAST"],
  baseHp: 140,
  abilityIds: THE_SPHINX_ABILITIES.map((a) => a.id),
  artSpecId: "the-sphinx",
});

const built = buildArt({
  bible: {
    characterId: "the-sphinx",
    species: "a winged, lion-bodied riddler of desert myth with a woman's face",
    ageRange: "ancient",
    face: "a calm, sculpted human face with kohl-dark eyes and a faint knowing smile",
    bodyType: "a great lion's body with folded eagle wings",
    clothingArmor: "a gold nemes-style headdress and a broad gold collar",
    weaponsProps: "long claws and a low stone plinth beneath her paws",
    markings: "sand-worn stone texture across the flanks",
    silhouette: "a huge lion-bodied winged figure seated like a monument",
    signatureProps: ["a gold headdress", "folded wings", "a stone plinth"],
  },
  region: "Egyptian / Desert inspiration (sandstone, gold leaf, hieroglyph-free geometric borders, endless dunes)",
  visualTheme: "the question that ends you",
  environment: "a moonlit desert plain with a stone plinth",
  lighting: "cold moonlight and warm ember-gold reflected off her collar",
  paletteConcept: "sandstone tan, lapis blue, gold, night black",
  avoid: ["any existing game's the sphinx design"],
  splashScene: "seated on the plinth with wings half-raised and her eyes fixed on the viewer",
  portraitScene: "a calm sculpted face with dark eyes",
  avatarScene: "close crop on the headdress and eyes",
  iconScenes: ["a great paw on a stone block, for Lion's Claw", "three faint glowing question-swirls, for Riddle of the Three Ages", "a sealed stone mouth, for Stone Silence", "a still stone lion in sunlight, for Patient Stone"],
});
export const THE_SPHINX_VISUAL_BIBLE = built.bible;
export const THE_SPHINX_ART = built.art;
