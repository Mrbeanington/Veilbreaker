import { characterDefinitionSchema, type CharacterDefinition } from "../../schemas/character";
import { passiveDefinitionSchema, type PassiveDefinition } from "../../schemas/passive";
import type { Ability } from "../../schemas/ability";
import { ENEMY_ALL, ENEMY_SINGLE, SELF_ONLY, ability, buildArt } from "./helpers";

// spec/03 #71 THE GHOUL (World Folklore) — the desert graveyard-eater. It fattens on every death and poisons the wells of healing for the whole enemy team. docs/design/characters/the-ghoul.md

export const FEAST_ON_THE_FALLEN: PassiveDefinition = passiveDefinitionSchema.parse({
  id: "passive.the-ghoul.feast-on-the-fallen",
  displayName: "Feast on the Fallen",
  description: "Whenever anyone falls, the Ghoul heals 10.",
  trigger: { event: "onDeath", relation: "any", effectTarget: "self" },
  effects: [{ kind: "heal", healingClass: "heal", amount: 10 }],
});

export const GNAW = ability({
  id: "ability.the-ghoul.gnaw",
  displayName: "Gnaw",
  description: "Gnashing teeth: 20 damage and Poison for 3 turns.",
  cost: { might: 1 },
  target: ENEMY_SINGLE,
  effects: [{ kind: "damage", amount: 20 }, { kind: "applyStatus", statusId: "status.poison", magnitude: 5, durationTurns: 3 }],
});
export const CARRION_STENCH = ability({
  id: "ability.the-ghoul.carrion-stench",
  displayName: "Carrion Stench",
  description: "A rot that follows every wound: every enemy cannot be healed for a turn.",
  cost: { spirit: 1 },
  cooldown: 3,
  target: ENEMY_ALL,
  effects: [{ kind: "applyStatus", statusId: "status.anti-heal", durationTurns: 1 }],
});
export const GRAVE_WHISPER = ability({
  id: "ability.the-ghoul.grave-whisper",
  displayName: "Grave Whisper",
  description: "A whisper from the crypt: the enemy is silenced for a turn.",
  cost: { focus: 1, chaos: 1 },
  cooldown: 4,
  target: ENEMY_SINGLE,
  effects: [{ kind: "applyStatus", statusId: "status.silence", durationTurns: 1 }],
});
export const SHROUD_OF_DIRT = ability({
  id: "ability.the-ghoul.shroud-of-dirt",
  displayName: "Shroud of Dirt",
  description: "Pulls a shroud of grave-dirt round itself: a shield of 30 for 3 turns.",
  cost: { spirit: 1 },
  cooldown: 3,
  target: SELF_ONLY,
  effects: [{ kind: "applyStatus", statusId: "status.shield", magnitude: 30, durationTurns: 3 }],
});

export const THE_GHOUL_ABILITIES: Ability[] = [GNAW, CARRION_STENCH, GRAVE_WHISPER, SHROUD_OF_DIRT];

export const THE_GHOUL: CharacterDefinition = characterDefinitionSchema.parse({
  id: "the-ghoul",
  version: 1,
  displayName: "The Ghoul",
  rarity: "RARE",
  tags: ["FOLKLORE", "UNDEAD", "ANTI-HEALER"],
  baseHp: 120,
  abilityIds: THE_GHOUL_ABILITIES.map((a) => a.id),
  passiveId: FEAST_ON_THE_FALLEN.id,
  artSpecId: "the-ghoul",
});

const built = buildArt({
  bible: {
    characterId: "the-ghoul",
    species: "a graveyard-haunting desert ghoul of Arabian tales",
    ageRange: "ancient",
    face: "a gaunt, hollow-cheeked face with a wide jaw and pale eyes",
    bodyType: "stooped, long-armed and thin",
    clothingArmor: "tattered burial shrouds and a ragged cloak dusted with sand",
    weaponsProps: "long grey claws",
    markings: "grave dirt caked along the arms",
    silhouette: "a hunched, long-armed figure among broken headstones under a thin moon",
    signatureProps: ["ragged shrouds", "long claws", "broken headstones"],
  },
  region: "World folk-tale inspiration (storybook borders, market-day colour, moonlit roads, hand-stitched cloth and lacquer)",
  visualTheme: "the one who eats what is left",
  environment: "a desert graveyard with broken headstones",
  lighting: "thin moonlight and low mist",
  paletteConcept: "bone grey, dirt brown, shroud white, moon blue",
  avoid: ["any existing game's the ghoul design"],
  splashScene: "crouching on a headstone with claws splayed and mist curling round the graves",
  portraitScene: "a gaunt face with pale eyes and a wide jaw",
  avatarScene: "close crop on the face",
  iconScenes: ["a set of teeth around a bone, for Gnaw", "a green haze rising from a grave, for Carrion Stench", "a mouth whispering into a dark crack, for Grave Whisper", "a heap of dirt closing round a shape, for Shroud of Dirt"],
});
export const THE_GHOUL_VISUAL_BIBLE = built.bible;
export const THE_GHOUL_ART = built.art;
