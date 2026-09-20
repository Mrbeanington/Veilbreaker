import { characterDefinitionSchema, type CharacterDefinition } from "../../schemas/character";
import { passiveDefinitionSchema, type PassiveDefinition } from "../../schemas/passive";
import type { Ability } from "../../schemas/ability";
import { ALLY_SINGLE, ENEMY_ALL, ENEMY_SINGLE, ability, buildArt } from "./helpers";

// spec/03 #5 Legend MADAME FORTUNA — a probability Cheater. She cannot change what a roll offers, only which branch it lands on: her friends' next gamble is forced to its best, her enemies' to its worst. docs/design/characters/madame-fortuna.md

// Legend lever (spec/03): a special vulnerability. When her luck turns, it
// turns against her: below half health her own next roll is forced to its worst.
export const FORTUNE_TURNS: PassiveDefinition = passiveDefinitionSchema.parse({
  id: "passive.madame-fortuna.fortune-turns",
  displayName: "Fortune Turns",
  description: "Below half health, every wound forces her own next gamble to its worst outcome.",
  trigger: { event: "onDamaged", relation: "self", effectTarget: "self" },
  condition: { type: "hpBelowPercent", target: "self", percent: 50 },
  effects: [{ kind: "modifyRandomOutcome", mode: "guaranteeMin" }],
});

export const FORTUNES_FAVOUR = ability({
  id: "ability.madame-fortuna.fortunes-favour",
  displayName: "Fortune's Favour",
  description: "An ally's next random outcome lands on its best branch.",
  cost: { focus: 1, chaos: 1 },
  cooldown: 2,
  target: ALLY_SINGLE,
  effects: [{ kind: "modifyRandomOutcome", mode: "guaranteeMax" }],
});
export const FORTUNA_ILL_OMEN = ability({
  id: "ability.madame-fortuna.ill-omen",
  displayName: "Ill Omen",
  description: "An enemy's next random outcome lands on its worst branch.",
  cost: { focus: 1, chaos: 1 },
  cooldown: 2,
  target: ENEMY_SINGLE,
  effects: [{ kind: "modifyRandomOutcome", mode: "guaranteeMin" }],
});
export const TURN_THE_CARD = ability({
  id: "ability.madame-fortuna.turn-the-card",
  displayName: "Turn the Card",
  description: "Draws for an enemy: 60 damage (1 in 5), 30 (2 in 5) or 10 (2 in 5).",
  cost: { focus: 1 },
  target: ENEMY_SINGLE,
  effects: [
    {
      kind: "randomOutcome",
      outcome: {
        rerollable: false,
        branches: [
          { weight: 2, effects: [{ kind: "damage", amount: 10 }] },
          { weight: 2, effects: [{ kind: "damage", amount: 30 }] },
          { weight: 1, effects: [{ kind: "damage", amount: 60 }] },
        ],
      },
    },
  ],
});
export const WHEEL_OF_FORTUNE = ability({
  id: "ability.madame-fortuna.wheel-of-fortune",
  displayName: "Wheel of Fortune",
  description: "The great wheel spins for every enemy: 70 damage, 40 damage and weakened, or stunned for a turn. Extremely expensive.",
  cost: { chaos: 3, spirit: 2, focus: 1 },
  cooldown: 5,
  target: ENEMY_ALL,
  effects: [
    {
      kind: "randomOutcome",
      outcome: {
        rerollable: false,
        branches: [
          { weight: 1, effects: [{ kind: "applyStatus", statusId: "status.stun", durationTurns: 1 }] },
          { weight: 1, effects: [{ kind: "damage", amount: 40 }, { kind: "applyStatus", statusId: "status.weakness", magnitude: 10, durationTurns: 2 }] },
          { weight: 1, effects: [{ kind: "damage", amount: 70 }] },
        ],
      },
    },
  ],
});

export const MADAME_FORTUNA_ABILITIES: Ability[] = [FORTUNES_FAVOUR, FORTUNA_ILL_OMEN, TURN_THE_CARD, WHEEL_OF_FORTUNE];

export const MADAME_FORTUNA: CharacterDefinition = characterDefinitionSchema.parse({
  id: "madame-fortuna",
  version: 1,
  displayName: "Madame Fortuna",
  rarity: "LEGENDARY",
  tags: ["LEGENDARY", "FOLKLORE", "CHEATER", "RANDOM"],
  baseHp: 110,
  abilityIds: MADAME_FORTUNA_ABILITIES.map((a) => a.id),
  passiveId: FORTUNE_TURNS.id,
  isCheater: true,
  cheaterRuleBreak: "Fortune's Favour forces an ally's next random outcome to its best branch, and Ill Omen forces an enemy's next random outcome to its worst.",
  counterplay: "Each costs Focus and Chaos on a 2-turn cooldown, is logged when queued, is spent by the target's very next roll and does nothing to a character with no random abilities. Silence stops her casting, and below half health her own next roll is forced to its worst outcome.",
  artSpecId: "madame-fortuna",
});

const built = buildArt({
  bible: {
    characterId: "madame-fortuna",
    species: "a supernatural fortune master of travelling-fair legend",
    ageRange: "ageless",
    face: "a poised, elegant face with a knowing smile and eyes that seem to show a card in each pupil",
    bodyType: "tall, graceful and theatrical",
    clothingArmor: "an elegant dark-violet theatre gown with gold trim and a tall feathered headdress",
    weaponsProps: "a floating fan of playing cards and a pair of gold dice",
    markings: "broken circular probability symbols drawn in gold on the sleeves, entirely original",
    silhouette: "a tall theatrical figure with a fan of cards and dice floating round her",
    signatureProps: ["floating cards", "gold dice", "a feathered headdress"],
  },
  region: "World folk-tale inspiration (storybook borders, market-day colour, moonlit roads, hand-stitched cloth and lacquer)",
  visualTheme: "the house that always seems to win",
  environment: "a candle-lit fairground fortune tent with a spinning wheel",
  lighting: "warm candles and gold sparks from the dice",
  paletteConcept: "theatre violet, gold, card red, midnight",
  avoid: ["any existing game's madame fortuna design"],
  splashScene: "standing before a huge spinning wheel with cards fanned in one hand and dice spinning in the air",
  portraitScene: "a poised face with a knowing smile and gold-flecked eyes",
  avatarScene: "close crop on the face and feathers",
  iconScenes: ["a gold-edged card turned face-up towards a friend, for Fortune's Favour", "a black card with a crack running through it, for Ill Omen", "a single card spinning through the air, for Turn the Card", "a huge spinning wheel of cards and dice, for Wheel of Fortune"],
  legendRevealScene: "stepping out of a wall of spinning cards with the wheel of fortune blazing behind her and gold dice hanging in the air",
});
export const MADAME_FORTUNA_VISUAL_BIBLE = built.bible;
export const MADAME_FORTUNA_ART = built.art;
