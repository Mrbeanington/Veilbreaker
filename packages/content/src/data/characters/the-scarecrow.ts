import { characterDefinitionSchema, type CharacterDefinition } from "../../schemas/character";
import { passiveDefinitionSchema, type PassiveDefinition } from "../../schemas/passive";
import type { Ability } from "../../schemas/ability";
import { ENEMY_ALL, ENEMY_SINGLE, SELF_ONLY, ability, buildArt } from "./helpers";

// spec/03 #81 THE SCARECROW (Horror / Monsters / Dead) — a field guardian that has come to life. Straw does not bleed and slowly mends itself; the crows do its scaring. docs/design/characters/the-scarecrow.md

export const STRAW_STUFFING: PassiveDefinition = passiveDefinitionSchema.parse({
  id: "passive.the-scarecrow.straw-stuffing",
  displayName: "Straw Stuffing",
  description: "At the end of each of its turns it heals 10.",
  trigger: { event: "onTurnEnd", relation: "self", effectTarget: "self" },
  effects: [{ kind: "heal", healingClass: "heal", amount: 10 }],
});

export const PITCHFORK = ability({
  id: "ability.the-scarecrow.pitchfork",
  displayName: "Pitchfork",
  description: "A jab of the old pitchfork: 30 damage.",
  cost: { might: 2 },
  cooldown: 1,
  target: ENEMY_SINGLE,
  effects: [{ kind: "damage", amount: 30 }],
});
export const CROW_FLOCK = ability({
  id: "ability.the-scarecrow.crow-flock",
  displayName: "Crow Flock",
  description: "A flock of crows scatters over the enemy: 10 damage to every enemy.",
  cost: { spirit: 1 },
  cooldown: 2,
  target: ENEMY_ALL,
  effects: [{ kind: "damage", amount: 10 }],
});
export const FIELD_OF_FEAR = ability({
  id: "ability.the-scarecrow.field-of-fear",
  displayName: "Field of Fear",
  description: "A dread of the empty field: the enemy is frightened and weakened for 2 turns.",
  cost: { focus: 1 },
  cooldown: 3,
  target: ENEMY_SINGLE,
  effects: [{ kind: "applyStatus", statusId: "status.fear", durationTurns: 2 }, { kind: "applyStatus", statusId: "status.weakness", magnitude: 10, durationTurns: 2 }],
});
export const STAND_STIFF = ability({
  id: "ability.the-scarecrow.stand-stiff",
  displayName: "Stand Stiff",
  description: "Stands rigid on its post: takes 30 less damage for a turn.",
  cost: { spirit: 1 },
  cooldown: 4,
  target: SELF_ONLY,
  effects: [{ kind: "applyStatus", statusId: "status.damage-reduction", magnitude: 30, durationTurns: 1 }],
});

export const THE_SCARECROW_ABILITIES: Ability[] = [PITCHFORK, CROW_FLOCK, FIELD_OF_FEAR, STAND_STIFF];

export const THE_SCARECROW: CharacterDefinition = characterDefinitionSchema.parse({
  id: "the-scarecrow",
  version: 1,
  displayName: "The Scarecrow",
  rarity: "CORE",
  tags: ["FOLKLORE", "TANK", "BRUISER"],
  baseHp: 130,
  abilityIds: THE_SCARECROW_ABILITIES.map((a) => a.id),
  passiveId: STRAW_STUFFING.id,
  artSpecId: "the-scarecrow",
});

const built = buildArt({
  bible: {
    characterId: "the-scarecrow",
    species: "a living scarecrow of gothic harvest folk horror",
    ageRange: "long standing",
    face: "a burlap sack face with stitched mouth and two dull orange eyes",
    bodyType: "tall and stiff-limbed, propped on a wooden post",
    clothingArmor: "a torn patchwork coat, a ragged straw hat and straw poking from every seam",
    weaponsProps: "a rusted pitchfork and a few perched crows",
    markings: "dark stitching across the face and hands",
    silhouette: "a tall stiff figure on a post in a wheat field with crows on its shoulders",
    signatureProps: ["a straw hat", "a rusted pitchfork", "perched crows"],
  },
  region: "Gothic folk-horror inspiration (candle-lit gloom, moth-eaten velvet, cold fog, hand-stitched cloth and old bone)",
  visualTheme: "the thing in the field that is watching",
  environment: "a wheat field at dusk with a lone post",
  lighting: "low red harvest sun and long shadows",
  paletteConcept: "straw gold, burlap brown, crow black, dusk red",
  avoid: ["any existing game's the scarecrow design"],
  splashScene: "stepping off its post in a wheat field with crows rising from its shoulders",
  portraitScene: "a burlap face with two dull orange eyes",
  avatarScene: "close crop on the hat and eyes",
  iconScenes: ["a rusted pitchfork tine, for Pitchfork", "a flock of black crows wheeling, for Crow Flock", "two orange eyes in a dark field, for Field of Fear", "a stiff figure on a post in a gale, for Stand Stiff"],
});
export const THE_SCARECROW_VISUAL_BIBLE = built.bible;
export const THE_SCARECROW_ART = built.art;
