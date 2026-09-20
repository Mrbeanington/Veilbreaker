import { characterDefinitionSchema, type CharacterDefinition } from "../../schemas/character";
import type { Ability } from "../../schemas/ability";
import { ALLY_SINGLE, ENEMY_SINGLE, ability, buildArt } from "./helpers";

// spec/03 #66 THE MOON RABBIT (World Folklore) — the patient healer pounding the elixir of life. Small, slow and generous; her healing is the strongest and costliest on the roster. docs/design/characters/the-moon-rabbit.md

export const MORTAR_POUND = ability({
  id: "ability.the-moon-rabbit.mortar-pound",
  displayName: "Mortar Pound",
  description: "A thump of the pestle: 20 damage.",
  cost: { might: 1 },
  target: ENEMY_SINGLE,
  effects: [{ kind: "damage", amount: 20 }],
});
export const ELIXIR_OF_LIFE = ability({
  id: "ability.the-moon-rabbit.elixir-of-life",
  displayName: "Elixir of Life",
  description: "A cup of the moon's own brew: heals an ally for 30.",
  cost: { spirit: 1 },
  cooldown: 1,
  target: ALLY_SINGLE,
  effects: [{ kind: "heal", healingClass: "heal", amount: 30 }],
});
export const MOON_GLOW = ability({
  id: "ability.the-moon-rabbit.moon-glow",
  displayName: "Moon Glow",
  description: "Silver light over the whole team: every ally heals 10 more from every heal for 3 turns.",
  cost: { spirit: 1 },
  cooldown: 3,
  target: { side: "ally", scope: "all", count: 1, includeSelf: true, filterTags: [] },
  effects: [{ kind: "applyStatus", statusId: "status.healing-amplification", magnitude: 10, durationTurns: 3 }],
});
export const LUCKY_FOOT = ability({
  id: "ability.the-moon-rabbit.lucky-foot",
  displayName: "Lucky Foot",
  description: "Presses a lucky paw to a friend: a shield of 20 for 2 turns.",
  cost: { focus: 1 },
  cooldown: 2,
  target: ALLY_SINGLE,
  effects: [{ kind: "applyStatus", statusId: "status.shield", magnitude: 20, durationTurns: 2 }],
});

export const THE_MOON_RABBIT_ABILITIES: Ability[] = [MORTAR_POUND, ELIXIR_OF_LIFE, MOON_GLOW, LUCKY_FOOT];

export const THE_MOON_RABBIT: CharacterDefinition = characterDefinitionSchema.parse({
  id: "the-moon-rabbit",
  version: 1,
  displayName: "The Moon Rabbit",
  rarity: "RARE",
  tags: ["FOLKLORE", "HEALER", "SUPPORT"],
  baseHp: 100,
  abilityIds: THE_MOON_RABBIT_ABILITIES.map((a) => a.id),
  artSpecId: "the-moon-rabbit",
});

const built = buildArt({
  bible: {
    characterId: "the-moon-rabbit",
    species: "a white rabbit of the moon from East Asian folk tales",
    ageRange: "ageless",
    face: "a soft round face with long ears and calm, large dark eyes",
    bodyType: "small and round, kneeling",
    clothingArmor: "a simple pale robe and a red sash",
    weaponsProps: "a big stone mortar and a heavy pestle",
    markings: "faint silver crescents on the ears",
    silhouette: "a small kneeling rabbit with a mortar under a huge full moon",
    signatureProps: ["a stone mortar", "a heavy pestle", "long ears"],
  },
  region: "World folk-tale inspiration (storybook borders, market-day colour, moonlit roads, hand-stitched cloth and lacquer)",
  visualTheme: "the healer who never hurries",
  environment: "a moonlit hill under a huge full moon",
  lighting: "soft silver moonlight",
  paletteConcept: "moon white, pale blue, sash red, soft grey",
  avoid: ["any existing game's the moon rabbit design"],
  splashScene: "kneeling at the mortar with the great moon behind her and silver dust rising",
  portraitScene: "a calm rabbit face under long ears in moonlight",
  avatarScene: "close crop on the face and ears",
  iconScenes: ["a pestle striking a mortar, for Mortar Pound", "a cup with a silver glow, for Elixir of Life", "a full moon spilling light over a crowd, for Moon Glow", "a small paw with a shimmer, for Lucky Foot"],
});
export const THE_MOON_RABBIT_VISUAL_BIBLE = built.bible;
export const THE_MOON_RABBIT_ART = built.art;
