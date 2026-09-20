import { characterDefinitionSchema, type CharacterDefinition } from "../../schemas/character";
import type { Ability } from "../../schemas/ability";
import { ALLY_SINGLE, ENEMY_SINGLE, ability, buildArt } from "./helpers";

// spec/03 #73 THE STORYTELLER (World Folklore) — a tale in three beats. Each ability builds on the last used: the opening, the rising action, the twist. docs/design/characters/the-storyteller.md

export const ONCE_UPON_A_TIME = ability({
  id: "ability.the-storyteller.once-upon-a-time",
  displayName: "Once Upon a Time",
  description: "Sets the scene: an ally is shielded for 20 for 2 turns.",
  cost: { focus: 1 },
  target: ALLY_SINGLE,
  effects: [{ kind: "applyStatus", statusId: "status.shield", magnitude: 20, durationTurns: 2 }],
});
export const RISING_ACTION = ability({
  id: "ability.the-storyteller.rising-action",
  displayName: "Rising Action",
  description: "20 damage, or 30 right after Once Upon a Time.",
  cost: { focus: 1 },
  target: ENEMY_SINGLE,
  effects: [
    {
      kind: "conditional",
      condition: { type: "usedAbilityLastTurn", target: "self", abilityId: "ability.the-storyteller.once-upon-a-time" },
      ifTrue: [{ kind: "damage", amount: 30 }],
      ifFalse: [{ kind: "damage", amount: 20 }],
    },
  ],
});
export const THE_TWIST = ability({
  id: "ability.the-storyteller.the-twist",
  displayName: "The Twist",
  description: "30 damage, or 40 right after Rising Action.",
  cost: { might: 1, chaos: 1 },
  cooldown: 1,
  target: ENEMY_SINGLE,
  effects: [
    {
      kind: "conditional",
      condition: { type: "usedAbilityLastTurn", target: "self", abilityId: "ability.the-storyteller.rising-action" },
      ifTrue: [{ kind: "damage", amount: 40 }],
      ifFalse: [{ kind: "damage", amount: 30 }],
    },
  ],
});
export const HAPPILY_EVER_AFTER = ability({
  id: "ability.the-storyteller.happily-ever-after",
  displayName: "Happily Ever After",
  description: "A gentle ending: every ally takes 20 less damage for 2 turns.",
  cost: { spirit: 2 },
  cooldown: 4,
  target: { side: "ally", scope: "all", count: 1, includeSelf: true, filterTags: [] },
  effects: [{ kind: "applyStatus", statusId: "status.damage-reduction", magnitude: 20, durationTurns: 2 }],
});

export const THE_STORYTELLER_ABILITIES: Ability[] = [ONCE_UPON_A_TIME, RISING_ACTION, THE_TWIST, HAPPILY_EVER_AFTER];

export const THE_STORYTELLER: CharacterDefinition = characterDefinitionSchema.parse({
  id: "the-storyteller",
  version: 1,
  displayName: "The Storyteller",
  rarity: "RARE",
  tags: ["FOLKLORE", "SUPPORT", "CONTROLLER"],
  baseHp: 90,
  abilityIds: THE_STORYTELLER_ABILITIES.map((a) => a.id),
  artSpecId: "the-storyteller",
});

const built = buildArt({
  bible: {
    characterId: "the-storyteller",
    species: "a travelling teller of tales from many lands",
    ageRange: "an old man with young eyes",
    face: "a warm, lined face with a white moustache and bright eyes",
    bodyType: "stooped, comfortable and round-shouldered",
    clothingArmor: "a patched travelling cloak, a scarf of many colours and worn boots",
    weaponsProps: "a big storybook with pressed flowers between the pages and a walking stick",
    markings: "ink stains on the fingertips",
    silhouette: "a stooped figure with a big open book and a walking stick beside a small fire",
    signatureProps: ["a big storybook", "a walking stick", "a colourful scarf"],
  },
  region: "World folk-tale inspiration (storybook borders, market-day colour, moonlit roads, hand-stitched cloth and lacquer)",
  visualTheme: "the tale that tells itself",
  environment: "a campfire in a clearing with faces in the dark",
  lighting: "warm firelight with story-shadows on the trees",
  paletteConcept: "fire orange, scarf multicolour, night blue, parchment",
  avoid: ["any existing game's the storyteller design"],
  splashScene: "seated by a campfire with the book open and small story shapes drifting up from the pages",
  portraitScene: "a warm lined face lit by fire",
  avatarScene: "close crop on the face and scarf",
  iconScenes: ["an open book with a small glow, for Once Upon a Time", "a rising staircase of pages, for Rising Action", "a page folding over into a new shape, for The Twist", "a closed book beside a warm fire, for Happily Ever After"],
});
export const THE_STORYTELLER_VISUAL_BIBLE = built.bible;
export const THE_STORYTELLER_ART = built.art;
