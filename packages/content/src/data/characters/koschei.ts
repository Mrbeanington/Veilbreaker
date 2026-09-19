import { characterDefinitionSchema, defaultResourcesFor, type CharacterDefinition } from "../../schemas/character";
import { passiveDefinitionSchema, type PassiveDefinition } from "../../schemas/passive";
import type { Ability } from "../../schemas/ability";
import type { Resource } from "../../schemas/common";
import { ability, buildArt, ENEMY_SINGLE, SELF_ONLY } from "./helpers";

// spec/03 #41 KOSCHEI THE DEATHLESS [SECRET] — Death Seals / Relics.
// docs/design/characters/koschei.md

export const DEATH_SEALS_RESOURCE: Resource = {
  id: "resource.death-seals",
  displayName: "Death Seals",
  startingValue: 1,
  min: 0,
  max: 3,
  visibleToOpponent: true,
  displayHint: "pips",
  trackMode: true,
};

// Same pre-charge pattern as Nine Lives (a passive can't react to its own
// holder's death): each turn start, a spare Seal is converted into Death
// Prevention if he isn't already protected.
export const DEATH_HIDDEN_AWAY: PassiveDefinition = passiveDefinitionSchema.parse({
  id: "passive.koschei.death-hidden-away",
  displayName: "Death Hidden Away",
  description: "While he holds a Seal, the next killing blow leaves him at 1 HP instead.",
  trigger: { event: "onTurnStart", relation: "self" },
  condition: {
    type: "and",
    conditions: [
      { type: "resourceAtLeast", target: "self", resourceId: DEATH_SEALS_RESOURCE.id, amount: 1 },
      { type: "not", condition: { type: "hasStatus", target: "self", statusId: "status.death-prevention" } },
    ],
  },
  effects: [
    { kind: "applyStatus", statusId: "status.death-prevention" },
    { kind: "modifyResource", resourceId: DEATH_SEALS_RESOURCE.id, amount: -1 },
  ],
  knowledgeLevel: "DISCOVERABLE",
});

export const WINTER_TOUCH = ability({
  id: "ability.koschei.winter-touch",
  displayName: "Winter Touch",
  description: "A freezing grasp.",
  cost: { might: 1, focus: 1 },
  target: ENEMY_SINGLE,
  effects: [{ kind: "damage", amount: 20 }],
});
export const IRON_GRIP = ability({
  id: "ability.koschei.iron-grip",
  displayName: "Iron Grip",
  description: "Locks an enemy in place for a turn.",
  cost: { might: 2, spirit: 1 },
  cooldown: 4,
  target: ENEMY_SINGLE,
  effects: [{ kind: "applyStatus", statusId: "status.stun", durationTurns: 1 }],
});
export const HIDE_THE_NEEDLE = ability({
  id: "ability.koschei.hide-the-needle",
  displayName: "Hide the Needle",
  description: "Hides another fragment of his death away, gaining a Seal.",
  cost: { spirit: 2 },
  cooldown: 2,
  target: SELF_ONLY,
  effects: [{ kind: "modifyResource", resourceId: DEATH_SEALS_RESOURCE.id, amount: 1 }],
});
export const DEATHLESS_FURY = ability({
  id: "ability.koschei.deathless-fury",
  displayName: "Deathless Fury",
  description: "Hits much harder while holding two or more Seals.",
  cost: { might: 2, chaos: 1 },
  cooldown: 2,
  target: ENEMY_SINGLE,
  effects: [
    {
      kind: "conditional",
      condition: { type: "resourceAtLeast", target: "self", resourceId: DEATH_SEALS_RESOURCE.id, amount: 2 },
      ifTrue: [{ kind: "damage", amount: 45 }],
      ifFalse: [{ kind: "damage", amount: 20 }],
    },
  ],
});

export const KOSCHEI_ABILITIES: Ability[] = [WINTER_TOUCH, IRON_GRIP, HIDE_THE_NEEDLE, DEATHLESS_FURY];

export const KOSCHEI: CharacterDefinition = characterDefinitionSchema.parse({
  id: "koschei",
  version: 1,
  displayName: "Koschei the Deathless",
  rarity: "SECRET",
  tags: ["SECRET", "UNDEAD", "FOLKLORE", "CONTROLLER"],
  baseHp: 120,
  abilityIds: KOSCHEI_ABILITIES.map((a) => a.id),
  passiveId: DEATH_HIDDEN_AWAY.id,
  resources: [DEATH_SEALS_RESOURCE],
  knowledgeLevel: "DISCOVERABLE",
  artSpecId: "koschei",
});
export const KOSCHEI_INITIAL_RESOURCES = defaultResourcesFor(KOSCHEI);

const built = buildArt({
  bible: {
    characterId: "koschei",
    species: "a gaunt sorcerer of Slavic folklore who cannot die",
    ageRange: "centuries old",
    face: "a bone-pale narrow face with pale, patient eyes",
    bodyType: "tall, skeletal and unnaturally still",
    clothingArmor: "a heavy fur-trimmed coat over iron-studded leather",
    weaponsProps: "a long staff hung with small locked reliquaries",
    markings: "frost creeping across the knuckles",
    silhouette: "a tall thin figure with a hanging cluster of small chests",
    signatureProps: ["small locked reliquaries", "frost-rimed staff"],
  },
  region: "Slavic (folk ornament geometry, wood carving, winter landscapes; cultural review required, OQ-12)",
  visualTheme: "a death carefully hidden inside nested things",
  environment: "a snow-buried oak with a locked iron chest at its roots",
  lighting: "cold blue winter dusk with a single warm point in the chest",
  paletteConcept: "frost white, iron black, deep crimson lining",
  avoid: ["any existing game's Koschei design"],
  splashScene: "standing before a frozen oak, one reliquary open and glowing faintly at his belt",
  portraitScene: "pale eyes level, frost gathering on the collar",
  avatarScene: "close crop on the face and one locked reliquary",
  iconScenes: [
    "a frost-covered hand closing, for Winter Touch",
    "an iron fist around a wrist, for Iron Grip",
    "a needle sealed inside a tiny chest, for Hide the Needle",
    "a locked chest cracking with red light, for Deathless Fury",
  ],
  secretSilhouetteScene: "a tall thin figure with a small cluster of chests hanging from his belt",
});
export const KOSCHEI_VISUAL_BIBLE = built.bible;
export const KOSCHEI_ART = built.art;
