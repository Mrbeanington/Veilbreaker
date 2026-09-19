import { characterDefinitionSchema, defaultResourcesFor, type CharacterDefinition } from "../../schemas/character";
import { passiveDefinitionSchema, type PassiveDefinition } from "../../schemas/passive";
import type { Ability } from "../../schemas/ability";
import type { Resource } from "../../schemas/common";
import { ability, buildArt, ENEMY_ALL, ENEMY_SINGLE, SELF_ONLY } from "./helpers";

// spec/03 #13 ICARION [SECRET] (Ancient Mediterranean) — hubris. He climbs on
// wax wings: the higher he flies the harder he hits, until the sun starts
// melting him. Big payoffs cost his own health. docs/design/characters/icarion.md

export const ALTITUDE_RESOURCE: Resource = {
  id: "resource.altitude",
  displayName: "Altitude",
  startingValue: 0,
  min: 0,
  max: 5,
  visibleToOpponent: true,
  displayHint: "pips",
  trackMode: true,
};

export const MELTING_WAX: PassiveDefinition = passiveDefinitionSchema.parse({
  id: "passive.icarion.melting-wax",
  displayName: "Melting Wax",
  description: "At four Altitude or more, the sun sets him burning at the start of each turn.",
  trigger: { event: "onTurnStart", relation: "self" },
  condition: { type: "resourceAtLeast", target: "self", resourceId: ALTITUDE_RESOURCE.id, amount: 4 },
  effects: [{ kind: "applyStatus", statusId: "status.burn", magnitude: 10, durationTurns: 2 }],
  knowledgeLevel: "DISCOVERABLE",
});

export const FEATHER_VOLLEY = ability({
  id: "ability.icarion.feather-volley",
  displayName: "Feather Volley",
  description: "20 damage and a little more height.",
  cost: { focus: 1 },
  cooldown: 1,
  target: ENEMY_SINGLE,
  effects: [
    { kind: "damage", amount: 20 },
    { kind: "modifyResource", resourceId: ALTITUDE_RESOURCE.id, amount: 1, target: SELF_ONLY },
  ],
});
export const SOAR = ability({
  id: "ability.icarion.soar",
  displayName: "Soar",
  description: "Two Altitude, and he takes 10 less damage for a turn.",
  cost: { spirit: 1 },
  target: SELF_ONLY,
  effects: [
    { kind: "modifyResource", resourceId: ALTITUDE_RESOURCE.id, amount: 2 },
    { kind: "applyStatus", statusId: "status.damage-reduction", magnitude: 10, durationTurns: 1 },
  ],
});
export const WAX_WING_DIVE = ability({
  id: "ability.icarion.wax-wing-dive",
  displayName: "Wax Wing Dive",
  description: "20 damage; 50 with two Altitude; 90 with four, at a cost of 30 of his own health. Spends the Altitude.",
  cost: { might: 1 },
  cooldown: 2,
  target: ENEMY_SINGLE,
  effects: [
    {
      kind: "conditional",
      condition: { type: "resourceAtLeast", target: "self", resourceId: ALTITUDE_RESOURCE.id, amount: 4 },
      ifTrue: [
        { kind: "damage", amount: 90 },
        { kind: "damage", amount: 30, damageType: "affliction", target: SELF_ONLY },
        { kind: "modifyResource", resourceId: ALTITUDE_RESOURCE.id, amount: -4, target: SELF_ONLY },
      ],
      ifFalse: [
        {
          kind: "conditional",
          condition: { type: "resourceAtLeast", target: "self", resourceId: ALTITUDE_RESOURCE.id, amount: 2 },
          ifTrue: [
            { kind: "damage", amount: 50 },
            { kind: "modifyResource", resourceId: ALTITUDE_RESOURCE.id, amount: -2, target: SELF_ONLY },
          ],
          ifFalse: [{ kind: "damage", amount: 20 }],
        },
      ],
    },
  ],
});
export const PLUMMET = ability({
  id: "ability.icarion.plummet",
  displayName: "Plummet",
  description: "Falls out of the sky: 20 damage to every enemy (40 from three Altitude), and 10 to himself. Altitude drops to zero.",
  cost: { chaos: 1 },
  cooldown: 3,
  target: ENEMY_ALL,
  effects: [
    {
      kind: "conditional",
      condition: { type: "resourceAtLeast", target: "self", resourceId: ALTITUDE_RESOURCE.id, amount: 3 },
      ifTrue: [{ kind: "damage", amount: 40 }],
      ifFalse: [{ kind: "damage", amount: 20 }],
    },
    { kind: "damage", amount: 10, damageType: "affliction", target: SELF_ONLY },
    { kind: "modifyResource", resourceId: ALTITUDE_RESOURCE.id, amount: -5, target: SELF_ONLY },
  ],
});

export const ICARION_ABILITIES: Ability[] = [FEATHER_VOLLEY, SOAR, WAX_WING_DIVE, PLUMMET];

export const ICARION: CharacterDefinition = characterDefinitionSchema.parse({
  id: "icarion",
  version: 1,
  displayName: "Icarion",
  rarity: "SECRET",
  tags: ["MYTHOLOGY", "ATTACKER", "SECRET"],
  baseHp: 90,
  abilityIds: ICARION_ABILITIES.map((a) => a.id),
  passiveId: MELTING_WAX.id,
  resources: [ALTITUDE_RESOURCE],
  knowledgeLevel: "DISCOVERABLE",
  artSpecId: "icarion",
});
export const ICARION_INITIAL_RESOURCES = defaultResourcesFor(ICARION);

const built = buildArt({
  bible: {
    characterId: "icarion",
    species: "a young flier of Mediterranean myth",
    ageRange: "a teenager",
    face: "an eager, sun-flushed young face with wide bright eyes",
    bodyType: "slight and wiry, arms spread as if always mid-leap",
    clothingArmor: "a plain tunic scorched at the hem",
    weaponsProps: "two huge wings of feathers held with wax, dripping and cracked",
    markings: "sun-freckled skin and a single golden feather tucked behind one ear",
    silhouette: "a slight figure with wide feathered wings caught against a bright disc",
    signatureProps: ["wax-and-feather wings", "dripping wax", "a golden feather"],
  },
  region: "Ancient Mediterranean (weathered bronze, marble, geometric borders)",
  visualTheme: "brilliant ambition on borrowed wings",
  environment: "a high sky over a bright sea with a sun that is too large",
  lighting: "blinding white-gold sun from above",
  paletteConcept: "sun white, feather cream, sea blue, burnt orange",
  avoid: ["any existing game's winged youth or Icarus adaptation"],
  splashScene: "soaring toward an enormous sun with his wings beginning to drip and smoke",
  portraitScene: "his grin caught in blinding light, a single feather drifting past",
  avatarScene: "close crop on the grin and the top of one wing",
  iconScenes: [
    "a feather shaped like a dart, for Feather Volley",
    "two wings spreading upward, for Soar",
    "a diving figure with wings on fire, for Wax Wing Dive",
    "a falling shower of burning feathers, for Plummet",
  ],
  secretSilhouetteScene: "a slight figure against a large bright disc, wings spread, no other detail",
});
export const ICARION_VISUAL_BIBLE = built.bible;
export const ICARION_ART = built.art;
