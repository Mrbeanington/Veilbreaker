import { characterDefinitionSchema, type CharacterDefinition } from "../../schemas/character";
import type { Ability } from "../../schemas/ability";
import { ENEMY_ALL, ENEMY_SINGLE, SELF_ONLY, ability, buildArt } from "./helpers";

// spec/03 #96 THE ALBINO GORILLA (Animals / Weird) — a silverback of enormous, quiet strength. Nothing subtle: it beats its chest, pounds the ground and swings. docs/design/characters/the-albino-gorilla.md

export const SILVERBACK_SLAM = ability({
  id: "ability.the-albino-gorilla.silverback-slam",
  displayName: "Silverback Slam",
  description: "Both fists come down: 40 damage.",
  cost: { might: 2 },
  cooldown: 2,
  target: ENEMY_SINGLE,
  effects: [{ kind: "damage", amount: 40 }],
});
export const GROUND_POUND = ability({
  id: "ability.the-albino-gorilla.ground-pound",
  displayName: "Ground Pound",
  description: "The ground shakes: 20 damage to every enemy.",
  cost: { might: 2 },
  cooldown: 2,
  target: ENEMY_ALL,
  effects: [{ kind: "damage", amount: 20 }],
});
export const CHEST_BEAT = ability({
  id: "ability.the-albino-gorilla.chest-beat",
  displayName: "Chest Beat",
  description: "A thunderous chest-beat: every enemy is frightened for 2 turns.",
  cost: { spirit: 1 },
  cooldown: 3,
  target: ENEMY_ALL,
  effects: [{ kind: "applyStatus", statusId: "status.fear", durationTurns: 2 }],
});
export const BANANA_BREAK = ability({
  id: "ability.the-albino-gorilla.banana-break",
  displayName: "Banana Break",
  description: "Sits down for a snack: heals 20.",
  cost: { spirit: 1 },
  cooldown: 3,
  target: SELF_ONLY,
  effects: [{ kind: "heal", healingClass: "heal", amount: 20 }],
});

export const THE_ALBINO_GORILLA_ABILITIES: Ability[] = [SILVERBACK_SLAM, GROUND_POUND, CHEST_BEAT, BANANA_BREAK];

export const THE_ALBINO_GORILLA: CharacterDefinition = characterDefinitionSchema.parse({
  id: "the-albino-gorilla",
  version: 1,
  displayName: "The Albino Gorilla",
  rarity: "CORE",
  tags: ["FOLKLORE", "BEAST", "BRUISER"],
  baseHp: 170,
  abilityIds: THE_ALBINO_GORILLA_ABILITIES.map((a) => a.id),
  artSpecId: "the-albino-gorilla",
});

const built = buildArt({
  bible: {
    characterId: "the-albino-gorilla",
    species: "a huge albino silverback gorilla of jungle legend",
    ageRange: "a mature adult",
    face: "a broad, heavy-browed face of pale pink-white skin with deep, calm, pale eyes",
    bodyType: "immense, broad-shouldered and long-armed",
    clothingArmor: "none: thick off-white fur with a silver-grey saddle across the back",
    weaponsProps: "huge knuckled fists and a bunch of bananas",
    markings: "pale pink skin around the eyes and knuckles",
    silhouette: "an immense pale hunched figure with long arms dragging its knuckles in a jungle clearing",
    signatureProps: ["off-white fur", "huge knuckled fists", "a heavy brow"],
  },
  region: "Storybook-animal and tall-tale inspiration (worn fur, patched uniforms, bright props, painterly wilderness)",
  visualTheme: "quiet power that has nothing to prove",
  environment: "a misty jungle clearing at dawn",
  lighting: "soft dawn light through mist and leaves",
  paletteConcept: "ivory white, silver grey, jungle green, blush pink",
  avoid: ["any existing game's the albino gorilla design"],
  splashScene: "rising on its knuckles in a misty clearing with both fists about to come down",
  portraitScene: "a heavy-browed pale face with calm eyes",
  avatarScene: "close crop on the brow and eyes",
  iconScenes: ["two huge pale fists coming down, for Silverback Slam", "cracks spreading across the ground, for Ground Pound", "a pale hand drumming a broad chest, for Chest Beat", "a peeled banana on a rock, for Banana Break"],
});
export const THE_ALBINO_GORILLA_VISUAL_BIBLE = built.bible;
export const THE_ALBINO_GORILLA_ART = built.art;
