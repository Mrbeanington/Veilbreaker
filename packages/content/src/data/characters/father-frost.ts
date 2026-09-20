import { characterDefinitionSchema, type CharacterDefinition } from "../../schemas/character";
import type { Ability } from "../../schemas/ability";
import { ability, ALLY_SINGLE, buildArt, ENEMY_ALL, ENEMY_SINGLE } from "./helpers";

// spec/03 #34 FATHER FROST (Slavic / Russian Night) — the winter lord: generous
// to those who please him, deadly to those who do not. A tank that gifts his
// allies warmth and makes every enemy's actions cost more in the cold.
// docs/design/characters/father-frost.md

export const STAFF_RAP = ability({
  id: "ability.father-frost.staff-rap",
  displayName: "Staff Rap",
  description: "A rap of the frozen staff: 30 damage.",
  cost: { might: 2 },
  target: ENEMY_SINGLE,
  effects: [{ kind: "damage", amount: 30 }],
});
export const FROZEN_GIFT = ability({
  id: "ability.father-frost.frozen-gift",
  displayName: "Frozen Gift",
  description: "A gift for an ally: a shield of 30 for 3 turns, and healing on them is stronger for 3 turns.",
  cost: { spirit: 1 },
  cooldown: 2,
  target: ALLY_SINGLE,
  effects: [
    { kind: "applyStatus", statusId: "status.shield", magnitude: 30, durationTurns: 3 },
    { kind: "applyStatus", statusId: "status.healing-amplification", magnitude: 10, durationTurns: 3 },
  ],
});
export const BITTER_COLD = ability({
  id: "ability.father-frost.bitter-cold",
  displayName: "Bitter Cold",
  description: "Every enemy's abilities cost 1 more for 2 turns.",
  cost: { focus: 1, spirit: 1 },
  cooldown: 3,
  target: ENEMY_ALL,
  effects: [{ kind: "applyStatus", statusId: "status.energy-cost-increase", magnitude: 1, durationTurns: 2 }],
});
export const WINTERS_JUDGEMENT = ability({
  id: "ability.father-frost.winters-judgement",
  displayName: "Winter's Judgement",
  description: "Judges an enemy: 30 damage and a stun for a turn if it is weakened; otherwise 20 and it is weakened.",
  cost: { might: 1, spirit: 1 },
  cooldown: 3,
  target: ENEMY_SINGLE,
  effects: [
    {
      kind: "conditional",
      condition: { type: "hasStatus", target: "target", statusId: "status.weakness" },
      ifTrue: [
        { kind: "damage", amount: 30 },
        { kind: "applyStatus", statusId: "status.stun", durationTurns: 1 },
      ],
      ifFalse: [
        { kind: "damage", amount: 20 },
        { kind: "applyStatus", statusId: "status.weakness", magnitude: 10, durationTurns: 2 },
      ],
    },
  ],
});

export const FATHER_FROST_ABILITIES: Ability[] = [STAFF_RAP, FROZEN_GIFT, BITTER_COLD, WINTERS_JUDGEMENT];

export const FATHER_FROST: CharacterDefinition = characterDefinitionSchema.parse({
  id: "father-frost",
  version: 1,
  displayName: "Father Frost",
  rarity: "RARE",
  tags: ["FOLKLORE", "TANK", "CONTROLLER"],
  baseHp: 170,
  abilityIds: FATHER_FROST_ABILITIES.map((a) => a.id),
  artSpecId: "father-frost",
});

const built = buildArt({
  bible: {
    characterId: "father-frost",
    species: "a winter lord of Slavic folklore",
    ageRange: "an old man in appearance",
    face: "a stern white-bearded face with pale blue eyes and a red nose from the cold",
    bodyType: "tall and broad, heavy with layered furs",
    clothingArmor: "a long embroidered blue coat trimmed with white fur and a tall fur hat",
    weaponsProps: "a tall staff topped with a crystal of ice",
    markings: "frost patterns creeping across the coat",
    silhouette: "a tall bearded figure with a fur hat and a staff on a snowy road",
    signatureProps: ["an ice-crystal staff", "an embroidered blue coat", "a sack of gifts"],
  },
  region: "Slavic folklore inspiration (winter landscapes, folk ornament geometry, storybook atmosphere)",
  visualTheme: "a generous host who is also the winter itself",
  environment: "a snowbound birch forest road at night",
  lighting: "cold moonlight on snow with warm lantern glints",
  paletteConcept: "deep blue, snow white, vermilion trim, silver",
  avoid: ["any existing game's winter-lord design", "any commercial Santa likeness"],
  splashScene: "striding along a snowy road with the staff planted and frost blooming behind him",
  portraitScene: "a white-bearded face rimed with frost, pale blue eyes",
  avatarScene: "close crop on the beard and eyes",
  iconScenes: [
    "a staff tip striking a spark of ice, for Staff Rap",
    "a wrapped gift dusted with snow, for Frozen Gift",
    "a swirl of freezing air across a village, for Bitter Cold",
    "a scale of icicles tipped to one side, for Winter's Judgement",
  ],
});
export const FATHER_FROST_VISUAL_BIBLE = built.bible;
export const FATHER_FROST_ART = built.art;
