import { characterDefinitionSchema, defaultResourcesFor, type CharacterDefinition } from "../../schemas/character";
import { passiveDefinitionSchema, type PassiveDefinition } from "../../schemas/passive";
import type { Ability } from "../../schemas/ability";
import type { Resource } from "../../schemas/common";
import { ability, buildArt, ENEMY_SINGLE, SELF_ONLY } from "./helpers";

// spec/03 #11 NEMESIS (Ancient Mediterranean) — retribution. She keeps a Grudge
// for every blow that lands on her side, then balances the scales in one
// reckoning, and throws hubris back at whoever reaches for her. docs/design/characters/nemesis.md

export const GRUDGE_RESOURCE: Resource = {
  id: "resource.grudge",
  displayName: "Grudge",
  startingValue: 0,
  min: 0,
  max: 5,
  visibleToOpponent: true,
  displayHint: "pips",
  trackMode: true,
};

export const SCALES_MUST_BALANCE: PassiveDefinition = passiveDefinitionSchema.parse({
  id: "passive.nemesis.scales-must-balance",
  displayName: "Scales Must Balance",
  description: "Whenever an ally is damaged, she gains a Grudge.",
  trigger: { event: "onDamaged", relation: "ally", effectTarget: "self" },
  effects: [{ kind: "modifyResource", resourceId: GRUDGE_RESOURCE.id, amount: 1 }],
});

export const JUST_DESERTS = ability({
  id: "ability.nemesis.just-deserts",
  displayName: "Just Deserts",
  description: "20 damage; 30 with three or more Grudge.",
  cost: { might: 1 },
  target: ENEMY_SINGLE,
  effects: [
    {
      kind: "conditional",
      condition: { type: "resourceAtLeast", target: "self", resourceId: GRUDGE_RESOURCE.id, amount: 3 },
      ifTrue: [{ kind: "damage", amount: 30 }],
      ifFalse: [{ kind: "damage", amount: 20 }],
    },
  ],
});
export const MIRROR_OF_HUBRIS = ability({
  id: "ability.nemesis.mirror-of-hubris",
  displayName: "Mirror of Hubris",
  description: "For a turn, damage aimed at her is thrown back at whoever dealt it.",
  cost: { spirit: 2 },
  cooldown: 4,
  target: SELF_ONLY,
  effects: [{ kind: "applyStatus", statusId: "status.reflect", durationTurns: 1 }],
});
export const CURSE_OF_HUBRIS = ability({
  id: "ability.nemesis.curse-of-hubris",
  displayName: "Curse of Hubris",
  description: "Curses an enemy for 3 turns and weakens its attacks by 10 for 2.",
  cost: { chaos: 1 },
  cooldown: 2,
  target: ENEMY_SINGLE,
  effects: [
    { kind: "applyStatus", statusId: "status.curse", durationTurns: 3 },
    { kind: "applyStatus", statusId: "status.weakness", magnitude: 10, durationTurns: 2 },
  ],
});
export const RECKONING = ability({
  id: "ability.nemesis.reckoning",
  displayName: "Reckoning",
  description: "30 damage. With three Grudge, 60 damage, and the Grudge is spent.",
  cost: { might: 2, spirit: 1 },
  cooldown: 4,
  target: ENEMY_SINGLE,
  effects: [
    {
      kind: "conditional",
      condition: { type: "resourceAtLeast", target: "self", resourceId: GRUDGE_RESOURCE.id, amount: 3 },
      ifTrue: [
        { kind: "damage", amount: 60 },
        { kind: "modifyResource", resourceId: GRUDGE_RESOURCE.id, amount: -3, target: SELF_ONLY },
      ],
      ifFalse: [{ kind: "damage", amount: 30 }],
    },
  ],
});

export const NEMESIS_ABILITIES: Ability[] = [JUST_DESERTS, MIRROR_OF_HUBRIS, CURSE_OF_HUBRIS, RECKONING];

export const NEMESIS: CharacterDefinition = characterDefinitionSchema.parse({
  id: "nemesis",
  version: 1,
  displayName: "Nemesis",
  rarity: "RARE",
  tags: ["MYTHOLOGY", "CONTROLLER", "CURSE"],
  baseHp: 130,
  abilityIds: NEMESIS_ABILITIES.map((a) => a.id),
  passiveId: SCALES_MUST_BALANCE.id,
  resources: [GRUDGE_RESOURCE],
  artSpecId: "nemesis",
});
export const NEMESIS_INITIAL_RESOURCES = defaultResourcesFor(NEMESIS);

const built = buildArt({
  bible: {
    characterId: "nemesis",
    species: "a winged goddess of retribution from Mediterranean myth",
    ageRange: "ageless",
    face: "a severe, even-featured face with steady dark eyes",
    bodyType: "tall and balanced, with folded dark wings",
    clothingArmor: "a plain white chiton and a bronze breastplate",
    weaponsProps: "a set of bronze scales in one hand and a wheel-shaped whip in the other",
    markings: "a balanced-scale pattern in gold across the breastplate",
    silhouette: "a winged figure holding a pair of scales level",
    signatureProps: ["bronze scales", "dark wings", "a whip"],
  },
  region: "Ancient Mediterranean (weathered bronze, marble, geometric borders)",
  visualTheme: "the patient reckoning that answers arrogance",
  environment: "a marble courtyard before a great empty balance",
  lighting: "flat, unforgiving white light",
  paletteConcept: "marble white, bronze, midnight wing black, cold gold",
  avoid: ["any existing game's avenger or justice-goddess design"],
  splashScene: "holding a scale perfectly level while a shadow presses down on one pan",
  portraitScene: "a level stare over the raised scales",
  avatarScene: "close crop on the face and the scale beam",
  iconScenes: [
    "a scale tipping under a heavy weight, for Just Deserts",
    "a bronze mirror throwing a bolt back, for Mirror of Hubris",
    "a cracked laurel wreath under a black sun, for Curse of Hubris",
    "a scale slamming down on one pan, for Reckoning",
  ],
});
export const NEMESIS_VISUAL_BIBLE = built.bible;
export const NEMESIS_ART = built.art;
