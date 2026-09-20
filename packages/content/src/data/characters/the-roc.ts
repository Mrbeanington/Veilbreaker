import { characterDefinitionSchema, type CharacterDefinition } from "../../schemas/character";
import type { Ability } from "../../schemas/ability";
import { ENEMY_ALL, ENEMY_SINGLE, SELF_ONLY, ability, buildArt } from "./helpers";

// spec/03 #70 THE ROC (World Folklore) — the giant bird that carries off elephants. Heavy blows from the air, a lifting grab that feeds it, and a wingbeat that scatters a team. docs/design/characters/the-roc.md

export const TALON_STRIKE = ability({
  id: "ability.the-roc.talon-strike",
  displayName: "Talon Strike",
  description: "Great talons: 30 damage.",
  cost: { might: 2 },
  cooldown: 1,
  target: ENEMY_SINGLE,
  effects: [{ kind: "damage", amount: 30 }],
});
export const WINGBEAT = ability({
  id: "ability.the-roc.wingbeat",
  displayName: "Wingbeat",
  description: "A gale from one wingbeat: 10 damage to every enemy.",
  cost: { might: 1, spirit: 1 },
  cooldown: 2,
  target: ENEMY_ALL,
  effects: [{ kind: "damage", amount: 10 }],
});
export const CARRY_OFF = ability({
  id: "ability.the-roc.carry-off",
  displayName: "Carry Off",
  description: "Snatches an enemy up: 30 damage, and the Roc heals 20.",
  cost: { might: 1, focus: 1 },
  cooldown: 3,
  target: ENEMY_SINGLE,
  effects: [{ kind: "damage", amount: 30 }, { kind: "heal", healingClass: "lifeTransfer", amount: 20, target: SELF_ONLY }],
});
export const ROOST = ability({
  id: "ability.the-roc.roost",
  displayName: "Roost",
  description: "Settles to rest: heals 20.",
  cost: { spirit: 1 },
  cooldown: 3,
  target: SELF_ONLY,
  effects: [{ kind: "heal", healingClass: "heal", amount: 20 }],
});

export const THE_ROC_ABILITIES: Ability[] = [TALON_STRIKE, WINGBEAT, CARRY_OFF, ROOST];

export const THE_ROC: CharacterDefinition = characterDefinitionSchema.parse({
  id: "the-roc",
  version: 1,
  displayName: "The Roc",
  rarity: "RARE",
  tags: ["FOLKLORE", "BEAST", "BRUISER"],
  baseHp: 160,
  abilityIds: THE_ROC_ABILITIES.map((a) => a.id),
  artSpecId: "the-roc",
});

const built = buildArt({
  bible: {
    characterId: "the-roc",
    species: "a colossal bird of prey from Arabian tales",
    ageRange: "ancient",
    face: "a fierce hooked beak and small gold eyes",
    bodyType: "enormous, broad-winged and feathered",
    clothingArmor: "layered brown and gold feathers with a crest of long plumes",
    weaponsProps: "huge dark talons",
    markings: "gold-tipped primary feathers",
    silhouette: "a vast winged bird casting a shadow over a tiny cliff and a village",
    signatureProps: ["gold-tipped wings", "a crest of plumes", "huge talons"],
  },
  region: "World folk-tale inspiration (storybook borders, market-day colour, moonlit roads, hand-stitched cloth and lacquer)",
  visualTheme: "the shadow that crosses the sun",
  environment: "a rocky cliff above a windy desert coast",
  lighting: "low sun behind huge wings",
  paletteConcept: "feather brown, gold, sky blue, shadow",
  avoid: ["any existing game's the roc design"],
  splashScene: "spreading its wings across a cliff-top with the sun behind and small figures below",
  portraitScene: "a hooked beak and one gold eye",
  avatarScene: "close crop on the head and crest",
  iconScenes: ["a huge talon closing, for Talon Strike", "swirling gusts around a great wing, for Wingbeat", "a small figure lifted in a claw, for Carry Off", "a great bird settling in a nest, for Roost"],
});
export const THE_ROC_VISUAL_BIBLE = built.bible;
export const THE_ROC_ART = built.art;
