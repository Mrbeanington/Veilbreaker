import { characterDefinitionSchema, defaultResourcesFor, type CharacterDefinition } from "../../schemas/character";
import type { Ability } from "../../schemas/ability";
import type { Resource } from "../../schemas/common";
import { ability, buildArt, EFFECT_TARGETS_SELF, ENEMY_SINGLE, SELF_ONLY } from "./helpers";

// spec/03 #112 THE GAMBLER [SECRET] — probability interactions.
// docs/design/characters/the-gambler.md

export const CHIPS_RESOURCE: Resource = {
  id: "resource.chips",
  displayName: "Chips",
  startingValue: 0,
  min: 0,
  max: 6,
  visibleToOpponent: true,
  displayHint: "tally",
  trackMode: true,
};

// A losing roll still pays: the house edge is banked as Chips.
export const HIGH_STAKES = ability({
  id: "ability.the-gambler.high-stakes",
  displayName: "High Stakes",
  description: "Usually a small hit that banks a Chip; occasionally a jackpot.",
  cost: { chaos: 1, focus: 1 },
  target: ENEMY_SINGLE,
  effects: [
    {
      kind: "randomOutcome",
      outcome: {
        rerollable: false,
        branches: [
          {
            weight: 3,
            effects: [
              { kind: "damage", amount: 10 },
              { kind: "modifyResource", resourceId: CHIPS_RESOURCE.id, amount: 1, target: EFFECT_TARGETS_SELF },
            ],
          },
          { weight: 1, effects: [{ kind: "damage", amount: 60 }] },
        ],
      },
    },
  ],
});
export const CASH_OUT = ability({
  id: "ability.the-gambler.cash-out",
  displayName: "Cash Out",
  description: "Spends 3 Chips for a big hit; a weak one otherwise.",
  cost: { chaos: 1, might: 1 },
  cooldown: 1,
  target: ENEMY_SINGLE,
  effects: [
    {
      kind: "conditional",
      condition: { type: "resourceAtLeast", target: "self", resourceId: CHIPS_RESOURCE.id, amount: 3 },
      ifTrue: [
        { kind: "damage", amount: 50 },
        { kind: "modifyResource", resourceId: CHIPS_RESOURCE.id, amount: -3, target: EFFECT_TARGETS_SELF },
      ],
      ifFalse: [{ kind: "damage", amount: 10 }],
    },
  ],
});
// The Cheater rule-break: forces his own next roll.
export const LOADED_DICE = ability({
  id: "ability.the-gambler.loaded-dice",
  displayName: "Loaded Dice",
  description: "His next gamble is guaranteed to land on its best outcome.",
  cost: { chaos: 2 },
  cooldown: 3,
  target: SELF_ONLY,
  effects: [{ kind: "modifyRandomOutcome", mode: "guaranteeMax" }],
});
export const COLD_DECK = ability({
  id: "ability.the-gambler.cold-deck",
  displayName: "Cold Deck",
  description: "Weakens an enemy; the deck is stacked against them.",
  cost: { focus: 1 },
  cooldown: 2,
  target: ENEMY_SINGLE,
  effects: [{ kind: "applyStatus", statusId: "status.weakness", magnitude: 10, durationTurns: 2 }],
});

export const THE_GAMBLER_ABILITIES: Ability[] = [HIGH_STAKES, CASH_OUT, LOADED_DICE, COLD_DECK];

export const THE_GAMBLER: CharacterDefinition = characterDefinitionSchema.parse({
  id: "the-gambler",
  version: 1,
  displayName: "The Gambler",
  rarity: "SECRET",
  tags: ["SECRET", "CHEATER", "RANDOM"],
  baseHp: 100,
  abilityIds: THE_GAMBLER_ABILITIES.map((a) => a.id),
  resources: [CHIPS_RESOURCE],
  isCheater: true,
  cheaterRuleBreak: "Loaded Dice forces his next random outcome to its best branch.",
  counterplay:
    "It costs 2 Chaos with a 3-turn cooldown, is logged when queued, is consumed by his very next roll, and does nothing for his non-random abilities.",
  knowledgeLevel: "DISCOVERABLE",
  artSpecId: "the-gambler",
});
export const THE_GAMBLER_INITIAL_RESOURCES = defaultResourcesFor(THE_GAMBLER);

const built = buildArt({
  bible: {
    characterId: "the-gambler",
    species: "a human card sharp of uncertain origin",
    ageRange: "middle-aged",
    face: "a relaxed half-smile and hooded, calculating eyes",
    bodyType: "lean and languid",
    clothingArmor: "a rumpled long coat over a patterned waistcoat",
    weaponsProps: "a fanned hand of blank-faced cards and a pair of bone dice",
    markings: "a gold tooth and ink-stained fingertips",
    silhouette: "a lounging figure fanning cards under a low hat brim",
    signatureProps: ["fanned blank cards", "bone dice"],
  },
  region: "Original / no single-culture inspiration",
  visualTheme: "the house always wins, and he is the house",
  environment: "a smoky felt-topped table in a lightless hall",
  lighting: "a single low lamp over the table",
  paletteConcept: "felt green, brass, smoke grey, blood red",
  avoid: ["real playing-card brand marks", "real casino logos"],
  splashScene: "seated at the table, a fan of blank cards in one hand and dice mid-tumble in the other",
  portraitScene: "a half-smile under the hat brim, lamp catching the gold tooth",
  avatarScene: "close crop on the eyes and the hat brim",
  iconScenes: [
    "two dice mid-air, one glowing, for High Stakes",
    "a stack of chips sliding across felt, for Cash Out",
    "a die with a hidden weight showing, for Loaded Dice",
    "a card with an ace of nothing, for Cold Deck",
  ],
  secretSilhouetteScene: "a lounging figure under a low hat brim fanning a hand of cards",
});
export const THE_GAMBLER_VISUAL_BIBLE = built.bible;
export const THE_GAMBLER_ART = built.art;
