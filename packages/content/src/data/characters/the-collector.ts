import { characterDefinitionSchema, type CharacterDefinition } from "../../schemas/character";
import type { Ability } from "../../schemas/ability";
import { ENEMY_SINGLE, ability, buildArt } from "./helpers";

// spec/03 #84 THE COLLECTOR (Horror / Monsters / Dead) — a connoisseur who wants what is already damaged. He steals a little energy, boxes an enemy up, and pays most for the ones others have already broken. docs/design/characters/the-collector.md

export const CANE_STRIKE = ability({
  id: "ability.the-collector.cane-strike",
  displayName: "Cane Strike",
  description: "A rap with a silver-topped cane: 20 damage.",
  cost: { might: 1 },
  target: ENEMY_SINGLE,
  effects: [{ kind: "damage", amount: 20 }],
});
export const APPRAISE = ability({
  id: "ability.the-collector.appraise",
  displayName: "Appraise",
  description: "20 damage, or 50 to an enemy that has already taken 60 or more damage this battle.",
  cost: { focus: 1 },
  cooldown: 1,
  target: ENEMY_SINGLE,
  effects: [
    {
      kind: "conditional",
      condition: { type: "damageReceivedAtLeast", target: "target", amount: 60 },
      ifTrue: [{ kind: "damage", amount: 50 }],
      ifFalse: [{ kind: "damage", amount: 20 }],
    },
  ],
});
export const PICKPOCKET = ability({
  id: "ability.the-collector.pickpocket",
  displayName: "Pickpocket",
  description: "Lifts 2 Spirit from the enemy team for himself.",
  cost: { chaos: 1 },
  cooldown: 3,
  target: ENEMY_SINGLE,
  effects: [{ kind: "drainEnergy", family: "SPIRIT", amount: 2, grantToSelf: true }],
});
export const GLASS_CASE = ability({
  id: "ability.the-collector.glass-case",
  displayName: "Glass Case",
  description: "Boxes an enemy under glass: stunned for a turn.",
  cost: { focus: 1, spirit: 1 },
  cooldown: 4,
  target: ENEMY_SINGLE,
  effects: [{ kind: "applyStatus", statusId: "status.stun", durationTurns: 1 }],
});

export const THE_COLLECTOR_ABILITIES: Ability[] = [CANE_STRIKE, APPRAISE, PICKPOCKET, GLASS_CASE];

export const THE_COLLECTOR: CharacterDefinition = characterDefinitionSchema.parse({
  id: "the-collector",
  version: 1,
  displayName: "The Collector",
  rarity: "RARE",
  tags: ["FOLKLORE", "CONTROLLER", "ASSASSIN"],
  baseHp: 120,
  abilityIds: THE_COLLECTOR_ABILITIES.map((a) => a.id),
  artSpecId: "the-collector",
});

const built = buildArt({
  bible: {
    characterId: "the-collector",
    species: "a well-dressed collector of curiosities from gothic folk horror",
    ageRange: "a gaunt man of middle age",
    face: "a long, pleasant face with round spectacles and a thin smile",
    bodyType: "tall, narrow and precise",
    clothingArmor: "a plum velvet coat, a high collar and white gloves",
    weaponsProps: "a silver-topped cane and a small glass display case",
    markings: "a monocle chain looped at the lapel",
    silhouette: "a tall narrow figure with a cane and a glass case tucked under one arm",
    signatureProps: ["a silver-topped cane", "a glass display case", "round spectacles"],
  },
  region: "Gothic folk-horror inspiration (candle-lit gloom, moth-eaten velvet, cold fog, hand-stitched cloth and old bone)",
  visualTheme: "he only takes what is already broken",
  environment: "a cluttered cabinet-of-curiosities room with glass cases",
  lighting: "lamplight glancing off glass",
  paletteConcept: "plum velvet, brass, glass green, dust",
  avoid: ["any existing game's the collector design"],
  splashScene: "standing among rows of glass cases with one hand resting on a cane and a case held open",
  portraitScene: "a long pleasant face with round spectacles",
  avatarScene: "close crop on the spectacles and smile",
  iconScenes: ["a silver cane tapping a floor, for Cane Strike", "a magnifying glass over a chipped figurine, for Appraise", "a gloved hand lifting a glowing wisp, for Pickpocket", "a glass case closing over a small figure, for Glass Case"],
});
export const THE_COLLECTOR_VISUAL_BIBLE = built.bible;
export const THE_COLLECTOR_ART = built.art;
