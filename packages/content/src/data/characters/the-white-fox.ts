import { characterDefinitionSchema, type CharacterDefinition } from "../../schemas/character";
import type { Ability } from "../../schemas/ability";
import { ALLY_SINGLE, ENEMY_SINGLE, SELF_ONLY, ability, buildArt } from "./helpers";

// spec/03 #69 THE WHITE FOX (World Folklore) — a fox spirit who heals and bewitches rather than burns. Kind to friends, dangerous to those who meet her eye. docs/design/characters/the-white-fox.md

export const FOX_BITE = ability({
  id: "ability.the-white-fox.fox-bite",
  displayName: "Fox Bite",
  description: "A quick bite: 20 damage.",
  cost: { might: 1 },
  target: ENEMY_SINGLE,
  effects: [{ kind: "damage", amount: 20 }],
});
export const KITSUNE_GRACE = ability({
  id: "ability.the-white-fox.kitsune-grace",
  displayName: "Kitsune Grace",
  description: "Heals an ally for 20 and lifts every harmful effect from them.",
  cost: { spirit: 1 },
  cooldown: 2,
  target: ALLY_SINGLE,
  effects: [{ kind: "heal", healingClass: "heal", amount: 20 }, { kind: "removeStatus", dispelAll: true }],
});
export const BEWITCH = ability({
  id: "ability.the-white-fox.bewitch",
  displayName: "Bewitch",
  description: "A gaze that stops the heart: the enemy is stunned for a turn.",
  cost: { focus: 1, spirit: 1 },
  cooldown: 4,
  target: ENEMY_SINGLE,
  effects: [{ kind: "applyStatus", statusId: "status.stun", durationTurns: 1 }],
});
export const MIRROR_TRICK = ability({
  id: "ability.the-white-fox.mirror-trick",
  displayName: "Mirror Trick",
  description: "Leaves a mirror image to take the blow: damage against her is thrown back for a turn.",
  cost: { focus: 1 },
  cooldown: 3,
  target: SELF_ONLY,
  effects: [{ kind: "applyStatus", statusId: "status.reflect", durationTurns: 1 }],
});

export const THE_WHITE_FOX_ABILITIES: Ability[] = [FOX_BITE, KITSUNE_GRACE, BEWITCH, MIRROR_TRICK];

export const THE_WHITE_FOX: CharacterDefinition = characterDefinitionSchema.parse({
  id: "the-white-fox",
  version: 1,
  displayName: "The White Fox",
  rarity: "RARE",
  tags: ["FOLKLORE", "MAGE", "SUPPORT"],
  baseHp: 100,
  abilityIds: THE_WHITE_FOX_ABILITIES.map((a) => a.id),
  artSpecId: "the-white-fox",
});

const built = buildArt({
  bible: {
    characterId: "the-white-fox",
    species: "a white fox spirit of folk tales",
    ageRange: "ageless",
    face: "a narrow, gentle face with pale gold eyes and long white whiskers",
    bodyType: "lithe and light on her feet",
    clothingArmor: "a flowing white and pale-blue robe with long sleeves",
    weaponsProps: "a few small floating flames of pale light",
    markings: "soft grey paw-print patterns along the sleeves",
    silhouette: "a slim figure in a long-sleeved robe with a big white tail curling behind",
    signatureProps: ["a big white tail", "long sleeves", "small pale flames"],
  },
  region: "World folk-tale inspiration (storybook borders, market-day colour, moonlit roads, hand-stitched cloth and lacquer)",
  visualTheme: "kindness with teeth",
  environment: "a moonlit shrine path lined with lanterns",
  lighting: "pale blue fox-light in the dark",
  paletteConcept: "snow white, pale blue, lantern gold, night",
  avoid: ["any existing game's the white fox design"],
  splashScene: "walking a lantern path with the white tail curling behind and pale flames drifting round her",
  portraitScene: "a gentle fox face with pale gold eyes",
  avatarScene: "close crop on the eyes and whiskers",
  iconScenes: ["a fox's small pointed teeth, for Fox Bite", "a soft light wrapping a small hand, for Kitsune Grace", "two pale gold eyes in the dark, for Bewitch", "a faint fox shape left behind in a mirror, for Mirror Trick"],
});
export const THE_WHITE_FOX_VISUAL_BIBLE = built.bible;
export const THE_WHITE_FOX_ART = built.art;
