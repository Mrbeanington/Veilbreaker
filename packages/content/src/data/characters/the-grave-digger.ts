import { characterDefinitionSchema, type CharacterDefinition } from "../../schemas/character";
import type { Ability } from "../../schemas/ability";
import { ALLY_SINGLE, ENEMY_SINGLE, ability, buildArt } from "./helpers";

// spec/03 #82 THE GRAVE DIGGER (Horror / Monsters / Dead) — the man who knows where everyone is buried. He can dig a fallen friend back up, at a great price. docs/design/characters/the-grave-digger.md

export const SPADE_SWING = ability({
  id: "ability.the-grave-digger.spade-swing",
  displayName: "Spade Swing",
  description: "A swing of the shovel: 20 damage.",
  cost: { might: 1 },
  target: ENEMY_SINGLE,
  effects: [{ kind: "damage", amount: 20 }],
});
export const GRAVEDIGGERS_GRIP = ability({
  id: "ability.the-grave-digger.gravediggers-grip",
  displayName: "Gravedigger's Grip",
  description: "Heaves the enemy off its feet: 30 damage.",
  cost: { might: 2 },
  cooldown: 1,
  target: ENEMY_SINGLE,
  effects: [{ kind: "damage", amount: 30 }],
});
export const FRESH_EARTH = ability({
  id: "ability.the-grave-digger.fresh-earth",
  displayName: "Fresh Earth",
  description: "Heaps earth round a friend: a shield of 30 for 3 turns.",
  cost: { focus: 1 },
  cooldown: 2,
  target: ALLY_SINGLE,
  effects: [{ kind: "applyStatus", statusId: "status.shield", magnitude: 30, durationTurns: 3 }],
});
export const EXHUME = ability({
  id: "ability.the-grave-digger.exhume",
  displayName: "Exhume",
  description: "Digs a fallen ally back up at 30% health. Extremely expensive.",
  cost: { spirit: 3, focus: 1 },
  cooldown: 6,
  target: { side: "ally", scope: "single", count: 1, includeSelf: false, includeDead: true, filterTags: [] },
  effects: [{ kind: "resurrect", healthPercent: 30 }],
});

export const THE_GRAVE_DIGGER_ABILITIES: Ability[] = [SPADE_SWING, GRAVEDIGGERS_GRIP, FRESH_EARTH, EXHUME];

export const THE_GRAVE_DIGGER: CharacterDefinition = characterDefinitionSchema.parse({
  id: "the-grave-digger",
  version: 1,
  displayName: "The Grave Digger",
  rarity: "RARE",
  tags: ["FOLKLORE", "SUPPORT", "CONTROLLER"],
  baseHp: 130,
  abilityIds: THE_GRAVE_DIGGER_ABILITIES.map((a) => a.id),
  artSpecId: "the-grave-digger",
});

const built = buildArt({
  bible: {
    characterId: "the-grave-digger",
    species: "a weathered gravedigger of gothic folk horror",
    ageRange: "an old man, tireless",
    face: "a lined, patient face with a grey stubble and tired eyes",
    bodyType: "broad-shouldered and stooped, with earth on every seam",
    clothingArmor: "a long dark coat, a flat cap and heavy muddy boots",
    weaponsProps: "a long-handled shovel and a hooded oil lantern",
    markings: "grave-dirt ground into the knuckles",
    silhouette: "a stooped figure with a shovel over one shoulder and a lantern in the other hand",
    signatureProps: ["a long shovel", "a hooded lantern", "a flat cap"],
  },
  region: "Gothic folk-horror inspiration (candle-lit gloom, moth-eaten velvet, cold fog, hand-stitched cloth and old bone)",
  visualTheme: "everyone ends up under his spade",
  environment: "a churchyard at night with fresh earth",
  lighting: "a single lantern and moonlight through fog",
  paletteConcept: "earth brown, lantern amber, fog grey, coat black",
  avoid: ["any existing game's the grave digger design"],
  splashScene: "standing in an open grave with the shovel planted and the lantern lifted over the headstones",
  portraitScene: "a lined patient face lit by a lantern",
  avatarScene: "close crop on the cap and face",
  iconScenes: ["a shovel blade cutting into earth, for Spade Swing", "a strong hand hauling a figure up, for Gravedigger's Grip", "a mound of fresh earth round a small figure, for Fresh Earth", "a hand pushing up out of a grave, for Exhume"],
});
export const THE_GRAVE_DIGGER_VISUAL_BIBLE = built.bible;
export const THE_GRAVE_DIGGER_ART = built.art;
