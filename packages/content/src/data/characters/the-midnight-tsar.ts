import { characterDefinitionSchema, defaultResourcesFor, type CharacterDefinition } from "../../schemas/character";
import { passiveDefinitionSchema, type PassiveDefinition } from "../../schemas/passive";
import type { Ability } from "../../schemas/ability";
import type { Resource } from "../../schemas/common";
import { ability, buildArt, ENEMY_ALL, ENEMY_SINGLE, SELF_ONLY } from "./helpers";

// spec/03 #42 THE MIDNIGHT TSAR [SECRET] (Slavic / Russian Night) — a dead
// ruler who collects his regalia. Every blow he lands adds a Relic (a crown, a
// scepter, an orb), and each Relic can be spent on a decree. The roster's first
// relic user. docs/design/characters/the-midnight-tsar.md

export const RELICS_RESOURCE: Resource = {
  id: "resource.relics",
  displayName: "Relics",
  startingValue: 0,
  min: 0,
  max: 3,
  visibleToOpponent: true,
  displayHint: "pips",
  trackMode: true,
};

export const COLLECTED_REGALIA: PassiveDefinition = passiveDefinitionSchema.parse({
  id: "passive.the-midnight-tsar.collected-regalia",
  displayName: "Collected Regalia",
  description: "Every blow he lands recovers a Relic: a crown, a scepter, an orb.",
  trigger: { event: "onDamageDealt", relation: "self", effectTarget: "self" },
  effects: [{ kind: "modifyResource", resourceId: RELICS_RESOURCE.id, amount: 1 }],
  knowledgeLevel: "DISCOVERABLE",
});

export const HEAVY_HAND = ability({
  id: "ability.the-midnight-tsar.heavy-hand",
  displayName: "Heavy Hand",
  description: "A ruler's backhand: 20 damage (and a Relic).",
  cost: { might: 1 },
  target: ENEMY_SINGLE,
  effects: [{ kind: "damage", amount: 20 }],
});
export const CROWNS_COMMAND = ability({
  id: "ability.the-midnight-tsar.crowns-command",
  displayName: "Crown's Command",
  description: "Spends a Relic (the crown) to order an enemy to stand still: stunned for a turn. Does nothing without a Relic.",
  cost: { spirit: 1 },
  cooldown: 3,
  target: ENEMY_SINGLE,
  effects: [
    {
      kind: "conditional",
      condition: { type: "resourceAtLeast", target: "self", resourceId: RELICS_RESOURCE.id, amount: 1 },
      ifTrue: [
        { kind: "applyStatus", statusId: "status.stun", durationTurns: 1 },
        { kind: "modifyResource", resourceId: RELICS_RESOURCE.id, amount: -1, target: SELF_ONLY },
      ],
    },
  ],
});
export const SCEPTER_STRIKE = ability({
  id: "ability.the-midnight-tsar.scepter-strike",
  displayName: "Scepter Strike",
  description: "Spends two Relics for a royal blow: 60 damage. With fewer, only 20.",
  cost: { might: 2 },
  cooldown: 2,
  target: ENEMY_SINGLE,
  effects: [
    {
      kind: "conditional",
      condition: { type: "resourceAtLeast", target: "self", resourceId: RELICS_RESOURCE.id, amount: 2 },
      ifTrue: [
        { kind: "damage", amount: 60 },
        { kind: "modifyResource", resourceId: RELICS_RESOURCE.id, amount: -2, target: SELF_ONLY },
      ],
      ifFalse: [{ kind: "damage", amount: 20 }],
    },
  ],
});
export const ORB_OF_MIDNIGHT = ability({
  id: "ability.the-midnight-tsar.orb-of-midnight",
  displayName: "Orb of Midnight",
  description: "Spends all three Relics: every enemy takes 30 damage and is cursed for 3 turns. Does nothing without all three.",
  cost: { spirit: 2, chaos: 1 },
  cooldown: 4,
  target: ENEMY_ALL,
  effects: [
    {
      kind: "conditional",
      condition: { type: "resourceAtLeast", target: "self", resourceId: RELICS_RESOURCE.id, amount: 3 },
      ifTrue: [
        { kind: "damage", amount: 30 },
        { kind: "applyStatus", statusId: "status.curse", durationTurns: 3 },
        { kind: "modifyResource", resourceId: RELICS_RESOURCE.id, amount: -3, target: SELF_ONLY },
      ],
    },
  ],
});

export const THE_MIDNIGHT_TSAR_ABILITIES: Ability[] = [HEAVY_HAND, CROWNS_COMMAND, SCEPTER_STRIKE, ORB_OF_MIDNIGHT];

export const THE_MIDNIGHT_TSAR: CharacterDefinition = characterDefinitionSchema.parse({
  id: "the-midnight-tsar",
  version: 1,
  displayName: "The Midnight Tsar",
  rarity: "SECRET",
  tags: ["FOLKLORE", "CONTROLLER", "UNDEAD", "SECRET"],
  baseHp: 150,
  abilityIds: THE_MIDNIGHT_TSAR_ABILITIES.map((a) => a.id),
  passiveId: COLLECTED_REGALIA.id,
  resources: [RELICS_RESOURCE],
  knowledgeLevel: "DISCOVERABLE",
  artSpecId: "the-midnight-tsar",
});
export const THE_MIDNIGHT_TSAR_INITIAL_RESOURCES = defaultResourcesFor(THE_MIDNIGHT_TSAR);

const built = buildArt({
  bible: {
    characterId: "the-midnight-tsar",
    species: "a dead ruler of a Slavic folk tale, still sitting his throne",
    ageRange: "long dead",
    face: "a gaunt grey face under a heavy crown, eyes like two small cold lamps",
    bodyType: "tall, stiff and upright, hands folded on the arms of a throne",
    clothingArmor: "a heavy embroidered robe of midnight blue and dull gold with a high fur collar",
    weaponsProps: "a jewelled scepter and a gold orb",
    markings: "frost gathered in the folds of the robe",
    silhouette: "a crowned figure seated on a tall throne against a starless sky",
    signatureProps: ["a heavy crown", "a scepter", "a gold orb"],
  },
  region: "Slavic folklore inspiration (folk ornament geometry, storybook atmosphere)",
  visualTheme: "a court that goes on after everyone in it has died",
  environment: "a ruined great hall with an empty throne and a frozen banquet",
  lighting: "cold blue moonlight through broken windows",
  paletteConcept: "midnight blue, tarnished gold, frost white, black",
  avoid: ["any existing game's undead king design", "any real historic ruler's likeness"],
  splashScene: "rising from the throne with the scepter lifted and frost spreading across the hall floor",
  portraitScene: "a crowned face in cold light with two pale eyes",
  avatarScene: "close crop on the crown and eyes",
  iconScenes: [
    "a hand striking a hard blow, for Heavy Hand",
    "a heavy crown glowing cold, for Crown's Command",
    "a scepter crashing down, for Scepter Strike",
    "a black orb ringed with stars, for Orb of Midnight",
  ],
  secretSilhouetteScene: "a crowned silhouette on a tall throne, no other detail",
});
export const THE_MIDNIGHT_TSAR_VISUAL_BIBLE = built.bible;
export const THE_MIDNIGHT_TSAR_ART = built.art;
