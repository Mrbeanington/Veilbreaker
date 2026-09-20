import { characterDefinitionSchema, type CharacterDefinition } from "../../schemas/character";
import type { Ability } from "../../schemas/ability";
import type { Resource } from "../../schemas/common";
import { ALLY_SINGLE, ENEMY_SINGLE, SELF_ONLY, ability, buildArt } from "./helpers";

// spec/03 #72 THE WANDERING GENIE (World Folklore) — a genie with three wishes and no more. Every wish is strong, and once they are spent the lamp is only a lamp. docs/design/characters/the-wandering-genie.md

export const WISHES_RESOURCE: Resource = {
  id: "resource.wishes",
  displayName: "Wishes",
  startingValue: 3,
  min: 0,
  max: 3,
  visibleToOpponent: true,
  displayHint: "pips",
  trackMode: true,
};

export const WISH_FOR_WEALTH = ability({
  id: "ability.the-wandering-genie.wish-for-wealth",
  displayName: "Wish for Wealth",
  description: "Spends a Wish: 1 extra Might, Focus and Spirit for the team. With no Wishes left it does nothing.",
  cost: { focus: 1 },
  cooldown: 1,
  target: SELF_ONLY,
  effects: [
    {
      kind: "conditional",
      condition: { type: "resourceAtLeast", target: "self", resourceId: WISHES_RESOURCE.id, amount: 1 },
      ifTrue: [{ kind: "modifyEnergy", family: "MIGHT", amount: 1 }, { kind: "modifyEnergy", family: "FOCUS", amount: 1 }, { kind: "modifyEnergy", family: "SPIRIT", amount: 1 }, { kind: "modifyResource", resourceId: WISHES_RESOURCE.id, amount: -1, target: SELF_ONLY }],
    },
  ],
});
export const WISH_FOR_LIFE = ability({
  id: "ability.the-wandering-genie.wish-for-life",
  displayName: "Wish for Life",
  description: "Spends a Wish: heals an ally for 40. With no Wishes left it does nothing.",
  cost: { spirit: 1 },
  cooldown: 1,
  target: ALLY_SINGLE,
  effects: [
    {
      kind: "conditional",
      condition: { type: "resourceAtLeast", target: "self", resourceId: WISHES_RESOURCE.id, amount: 1 },
      ifTrue: [{ kind: "heal", healingClass: "heal", amount: 40 }, { kind: "modifyResource", resourceId: WISHES_RESOURCE.id, amount: -1, target: SELF_ONLY }],
    },
  ],
});
export const WISH_FOR_RUIN = ability({
  id: "ability.the-wandering-genie.wish-for-ruin",
  displayName: "Wish for Ruin",
  description: "Spends a Wish: 50 damage to an enemy. With no Wishes left it is only 10.",
  cost: { might: 1, chaos: 1 },
  cooldown: 1,
  target: ENEMY_SINGLE,
  effects: [
    {
      kind: "conditional",
      condition: { type: "resourceAtLeast", target: "self", resourceId: WISHES_RESOURCE.id, amount: 1 },
      ifTrue: [{ kind: "damage", amount: 50 }, { kind: "modifyResource", resourceId: WISHES_RESOURCE.id, amount: -1, target: SELF_ONLY }],
      ifFalse: [{ kind: "damage", amount: 10 }],
    },
  ],
});
export const LAMP_LIGHT = ability({
  id: "ability.the-wandering-genie.lamp-light",
  displayName: "Lamp Light",
  description: "A flicker from the old lamp: 20 damage.",
  cost: { might: 1 },
  target: ENEMY_SINGLE,
  effects: [{ kind: "damage", amount: 20 }],
});

export const THE_WANDERING_GENIE_ABILITIES: Ability[] = [WISH_FOR_WEALTH, WISH_FOR_LIFE, WISH_FOR_RUIN, LAMP_LIGHT];

export const THE_WANDERING_GENIE: CharacterDefinition = characterDefinitionSchema.parse({
  id: "the-wandering-genie",
  version: 1,
  displayName: "The Wandering Genie",
  rarity: "RARE",
  tags: ["FOLKLORE", "MAGE", "SUPPORT"],
  baseHp: 110,
  abilityIds: THE_WANDERING_GENIE_ABILITIES.map((a) => a.id),
  resources: [WISHES_RESOURCE],
  artSpecId: "the-wandering-genie",
});

const built = buildArt({
  bible: {
    characterId: "the-wandering-genie",
    species: "a lamp-bound genie of Arabian Nights tales",
    ageRange: "ageless",
    face: "a tired, kind face with a neat beard and glowing amber eyes",
    bodyType: "tall, slender and trailing into smoke below the waist",
    clothingArmor: "loose blue silks, gold cuffs and a small folded turban",
    weaponsProps: "a dented brass lamp and three small floating gold lights",
    markings: "a faint spiral of smoke-blue light around the wrists",
    silhouette: "a tall figure holding a brass lamp with three small lights floating above it",
    signatureProps: ["a brass lamp", "three gold lights", "gold cuffs"],
  },
  region: "World folk-tale inspiration (storybook borders, market-day colour, moonlit roads, hand-stitched cloth and lacquer)",
  visualTheme: "three wishes and then the road",
  environment: "a caravan road under a night sky of stars",
  lighting: "warm lamp-glow and starlight",
  paletteConcept: "lamp brass, smoke blue, star white, silk red",
  avoid: ["any existing game's the wandering genie design"],
  splashScene: "walking a desert road with the lamp held out and three lights hanging over it",
  portraitScene: "a tired kind face lit amber from below",
  avatarScene: "close crop on the face and lamp",
  iconScenes: ["a coin-shaped light turning in smoke, for Wish for Wealth", "a warm green light over a cupped hand, for Wish for Life", "a dark red light forming a fist, for Wish for Ruin", "a small flame in a dented lamp, for Lamp Light"],
});
export const THE_WANDERING_GENIE_VISUAL_BIBLE = built.bible;
export const THE_WANDERING_GENIE_ART = built.art;
