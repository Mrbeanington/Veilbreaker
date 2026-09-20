import { characterDefinitionSchema, type CharacterDefinition } from "../../schemas/character";
import type { Ability } from "../../schemas/ability";
import { ENEMY_SINGLE, SELF_ONLY, ability, buildArt } from "./helpers";

// spec/03 #109 THE MIME (Music / Entertainment / Chaos) — an imitator of kinds, not of people. He copies what an enemy is wearing: a shield for a shield, armour for armour, and he hits hardest what is protected. docs/design/characters/the-mime.md

export const SILENT_SLAP = ability({
  id: "ability.the-mime.silent-slap",
  displayName: "Silent Slap",
  description: "A slap with no sound: 30 damage.",
  cost: { might: 1 },
  target: ENEMY_SINGLE,
  effects: [{ kind: "damage", amount: 30 }],
});
export const MIMIC_GUARD = ability({
  id: "ability.the-mime.mimic-guard",
  displayName: "Mimic Guard",
  description: "Copies an enemy's defence as a trick: if it has a shield he throws damage back for a turn (Reflect), if it has Damage Reduction he strikes back for 20 for 2 turns.",
  cost: { spirit: 1 },
  cooldown: 2,
  target: ENEMY_SINGLE,
  effects: [
    {
      kind: "conditional",
      condition: { type: "hasStatus", target: "target", statusId: "status.shield" },
      ifTrue: [{ kind: "applyStatus", statusId: "status.reflect", durationTurns: 1, target: SELF_ONLY }],
      ifFalse: [
        {
          kind: "conditional",
          condition: { type: "hasStatus", target: "target", statusId: "status.damage-reduction" },
          ifTrue: [{ kind: "applyStatus", statusId: "status.counter", magnitude: 20, durationTurns: 2, target: SELF_ONLY }],
        },
      ],
    },
  ],
});
export const MIMIC_STRIKE = ability({
  id: "ability.the-mime.mimic-strike",
  displayName: "Mimic Strike",
  description: "20 damage, or 60 against an enemy that has a shield or Damage Reduction.",
  cost: { might: 2 },
  cooldown: 2,
  target: ENEMY_SINGLE,
  effects: [
    {
      kind: "conditional",
      condition: { type: "or", conditions: [{ type: "hasStatus", target: "target", statusId: "status.shield" }, { type: "hasStatus", target: "target", statusId: "status.damage-reduction" }] },
      ifTrue: [{ kind: "damage", amount: 60 }],
      ifFalse: [{ kind: "damage", amount: 20 }],
    },
  ],
});
export const INVISIBLE_BOX = ability({
  id: "ability.the-mime.invisible-box",
  displayName: "Invisible Box",
  description: "Traps an enemy in an invisible box: it is silenced for a turn.",
  cost: { focus: 1, spirit: 1 },
  cooldown: 3,
  target: ENEMY_SINGLE,
  effects: [{ kind: "applyStatus", statusId: "status.silence", durationTurns: 1 }],
});

export const THE_MIME_ABILITIES: Ability[] = [SILENT_SLAP, MIMIC_GUARD, MIMIC_STRIKE, INVISIBLE_BOX];

export const THE_MIME: CharacterDefinition = characterDefinitionSchema.parse({
  id: "the-mime",
  version: 1,
  displayName: "The Mime",
  rarity: "RARE",
  tags: ["MUSIC", "CONTROLLER", "ASSASSIN"],
  baseHp: 120,
  abilityIds: THE_MIME_ABILITIES.map((a) => a.id),
  artSpecId: "the-mime",
});

const built = buildArt({
  bible: {
    characterId: "the-mime",
    species: "a white-faced street mime of theatre legend",
    ageRange: "ageless",
    face: "a chalk-white painted face with a thin black-lined smile, exaggerated arched brows and a single painted tear",
    bodyType: "slim and precise in every gesture",
    clothingArmor: "a black-and-white striped shirt, black braces, a small bowler hat and white gloves",
    weaponsProps: "an invisible box outlined by faint pale lines in the air",
    markings: "a single black painted tear under one eye",
    silhouette: "a slim figure in a bowler hat with both palms pressed against an invisible wall",
    signatureProps: ["a bowler hat", "white gloves", "faint outlines of an invisible box"],
  },
  region: "Stage, studio and street-theatre inspiration (spotlights, patched amps, greasepaint, checkered kitchens, neon and cardboard sets)",
  visualTheme: "he copies the shape of what protects you",
  environment: "a bare stage with one lamp and a faint painted box on the floor",
  lighting: "one hard spotlight and deep black around it",
  paletteConcept: "chalk white, stage black, spotlight gold, faint red",
  avoid: ["any existing game's the mime design"],
  splashScene: "pressing both palms against an invisible wall on a bare stage under a single spotlight",
  portraitScene: "a chalk-white face with a painted tear",
  avatarScene: "close crop on the bowler hat and face",
  iconScenes: ["a white glove mid-slap, for Silent Slap", "two mirrored shields facing each other, for Mimic Guard", "a fist breaking a faint outlined shield, for Mimic Strike", "faint pale lines forming a box round a figure, for Invisible Box"],
});
export const THE_MIME_VISUAL_BIBLE = built.bible;
export const THE_MIME_ART = built.art;
