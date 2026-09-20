import { characterDefinitionSchema, type CharacterDefinition } from "../../schemas/character";
import { summonSchema, type Summon } from "../../schemas/summon";
import type { Ability } from "../../schemas/ability";
import { ENEMY_SINGLE, SELF_ONLY, ability, buildArt } from "./helpers";

// spec/03 #80 THE MARIONETTIST (Horror / Monsters / Dead) — a puppeteer who plays a whole show with strings. Puppets for a front line, strings that slow an enemy's every ability, and a dance that stops one cold. docs/design/characters/the-marionettist.md

export const PUPPET_SUMMON: Summon = summonSchema.parse({
  id: "summon.the-marionettist.puppet",
  displayName: "Puppet",
  occupiesSlot: false,
  hp: 40,
  duration: { turns: 3, permanent: false },
});

export const WOODEN_FIST = ability({
  id: "ability.the-marionettist.wooden-fist",
  displayName: "Wooden Fist",
  description: "A blow from a wooden hand on a string: 20 damage.",
  cost: { might: 1 },
  target: ENEMY_SINGLE,
  effects: [{ kind: "damage", amount: 20 }],
});
export const RAISE_A_PUPPET = ability({
  id: "ability.the-marionettist.raise-a-puppet",
  displayName: "Raise a Puppet",
  description: "Sets a puppet on the stage with 40 health for 3 turns.",
  cost: { focus: 1 },
  cooldown: 3,
  target: SELF_ONLY,
  effects: [{ kind: "summon", summonId: PUPPET_SUMMON.id }],
});
export const STRINGS_TAUT = ability({
  id: "ability.the-marionettist.strings-taut",
  displayName: "Strings Taut",
  description: "Tightens the strings: the enemy's abilities recover more slowly for 2 turns.",
  cost: { focus: 1 },
  cooldown: 3,
  target: ENEMY_SINGLE,
  effects: [{ kind: "applyStatus", statusId: "status.cooldown-increase", durationTurns: 2 }],
});
export const MARIONETTE_DANCE = ability({
  id: "ability.the-marionettist.marionette-dance",
  displayName: "Marionette Dance",
  description: "Makes an enemy dance on strings: it is stunned for a turn.",
  cost: { spirit: 1 },
  cooldown: 3,
  target: ENEMY_SINGLE,
  effects: [{ kind: "applyStatus", statusId: "status.stun", durationTurns: 1 }],
});

export const THE_MARIONETTIST_ABILITIES: Ability[] = [WOODEN_FIST, RAISE_A_PUPPET, STRINGS_TAUT, MARIONETTE_DANCE];

export const THE_MARIONETTIST: CharacterDefinition = characterDefinitionSchema.parse({
  id: "the-marionettist",
  version: 1,
  displayName: "The Marionettist",
  rarity: "RARE",
  tags: ["FOLKLORE", "CONTROLLER", "SUMMONER"],
  baseHp: 100,
  abilityIds: THE_MARIONETTIST_ABILITIES.map((a) => a.id),
  artSpecId: "the-marionettist",
});

const built = buildArt({
  bible: {
    characterId: "the-marionettist",
    species: "a shadowy puppeteer of gothic folk horror",
    ageRange: "a thin, ageless man",
    face: "a pale, thin face with a fixed smile and painted circles on the cheeks",
    bodyType: "tall, thin and stooped over his own hands",
    clothingArmor: "a tattered tailcoat, fingerless gloves and a battered top hat",
    weaponsProps: "a wooden control-bar with long fine strings running up into the dark",
    markings: "faint string-marks across the wrists",
    silhouette: "a tall stooped figure holding a wooden bar with strings rising into the dark",
    signatureProps: ["a wooden control-bar", "fine strings", "a battered top hat"],
  },
  region: "Gothic folk-horror inspiration (candle-lit gloom, moth-eaten velvet, cold fog, hand-stitched cloth and old bone)",
  visualTheme: "the show that will not end",
  environment: "a candle-lit puppet theatre with a moth-eaten curtain",
  lighting: "footlights from below and deep shadow above",
  paletteConcept: "curtain red, footlight gold, wood brown, string silver",
  avoid: ["any existing game's the marionettist design"],
  splashScene: "standing before a torn stage curtain with a dozen strings rising from his hands into the dark",
  portraitScene: "a pale painted-cheek face lit from below",
  avatarScene: "close crop on the top hat and smile",
  iconScenes: ["a wooden fist on a string, for Wooden Fist", "a small wooden figure standing up on a stage, for Raise a Puppet", "silver strings pulled tight, for Strings Taut", "a marionette in a stiff twisted dance pose, for Marionette Dance"],
});
export const THE_MARIONETTIST_VISUAL_BIBLE = built.bible;
export const THE_MARIONETTIST_ART = built.art;
