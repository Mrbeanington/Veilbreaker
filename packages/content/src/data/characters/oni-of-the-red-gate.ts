import { characterDefinitionSchema, defaultResourcesFor, type CharacterDefinition } from "../../schemas/character";
import { passiveDefinitionSchema, type PassiveDefinition } from "../../schemas/passive";
import type { Ability } from "../../schemas/ability";
import type { Resource } from "../../schemas/common";
import { ability, buildArt, ENEMY_SINGLE, SELF_ONLY } from "./helpers";

// spec/03 #28 ONI OF THE RED GATE [SECRET] (Japanese Folklore) — a guardian
// whose gate is closing. He starts at his fiercest and grows weaker every turn
// as the Gate shuts; he can pay in blood to hold it open. A burst character
// with a clock, the opposite of a slow build. docs/design/characters/oni-of-the-red-gate.md

export const GATE_RESOURCE: Resource = {
  id: "resource.red-gate",
  displayName: "Red Gate",
  startingValue: 3,
  min: 0,
  max: 3,
  visibleToOpponent: true,
  displayHint: "pips",
  trackMode: true,
};

export const THE_GATE_CLOSES: PassiveDefinition = passiveDefinitionSchema.parse({
  id: "passive.oni-of-the-red-gate.the-gate-closes",
  displayName: "The Gate Closes",
  description: "Loses a Red Gate pip at the start of every turn.",
  trigger: { event: "onTurnStart", relation: "self" },
  effects: [{ kind: "modifyResource", resourceId: GATE_RESOURCE.id, amount: -1 }],
  knowledgeLevel: "DISCOVERABLE",
});

const gateAtLeast = (amount: number) => ({ type: "resourceAtLeast", target: "self", resourceId: GATE_RESOURCE.id, amount }) as const;

export const CRIMSON_CLEAVE = ability({
  id: "ability.oni-of-the-red-gate.crimson-cleave",
  displayName: "Crimson Cleave",
  description: "70 damage with three Red Gate pips, 50 with two, 30 with one, 10 with none.",
  cost: { might: 2 },
  target: ENEMY_SINGLE,
  effects: [
    {
      kind: "conditional",
      condition: gateAtLeast(3),
      ifTrue: [{ kind: "damage", amount: 70 }],
      ifFalse: [
        {
          kind: "conditional",
          condition: gateAtLeast(2),
          ifTrue: [{ kind: "damage", amount: 50 }],
          ifFalse: [
            {
              kind: "conditional",
              condition: gateAtLeast(1),
              ifTrue: [{ kind: "damage", amount: 30 }],
              ifFalse: [{ kind: "damage", amount: 10 }],
            },
          ],
        },
      ],
    },
  ],
});
export const HOLD_THE_THRESHOLD = ability({
  id: "ability.oni-of-the-red-gate.hold-the-threshold",
  displayName: "Hold the Threshold",
  description: "Takes 20 less damage for 2 turns.",
  cost: { spirit: 1 },
  cooldown: 3,
  target: SELF_ONLY,
  effects: [{ kind: "applyStatus", statusId: "status.damage-reduction", magnitude: 20, durationTurns: 2 }],
});
export const OPEN_THE_GATE = ability({
  id: "ability.oni-of-the-red-gate.open-the-gate",
  displayName: "Open the Gate",
  description: "Pays 20 of his own health to swing the gate wide: two Red Gate pips.",
  cost: { spirit: 2 },
  cooldown: 4,
  target: SELF_ONLY,
  effects: [
    { kind: "damage", amount: 20, damageType: "affliction", target: SELF_ONLY },
    { kind: "modifyResource", resourceId: GATE_RESOURCE.id, amount: 2 },
  ],
});
export const EMBER_CURSE = ability({
  id: "ability.oni-of-the-red-gate.ember-curse",
  displayName: "Ember Curse",
  description: "Curses an enemy for 3 turns and weakens its attacks by 10 for 2.",
  cost: { chaos: 1 },
  cooldown: 2,
  target: ENEMY_SINGLE,
  effects: [
    { kind: "applyStatus", statusId: "status.curse", durationTurns: 3 },
    { kind: "applyStatus", statusId: "status.weakness", magnitude: 10, durationTurns: 2 },
  ],
});

export const ONI_OF_THE_RED_GATE_ABILITIES: Ability[] = [CRIMSON_CLEAVE, HOLD_THE_THRESHOLD, OPEN_THE_GATE, EMBER_CURSE];

export const ONI_OF_THE_RED_GATE: CharacterDefinition = characterDefinitionSchema.parse({
  id: "oni-of-the-red-gate",
  version: 1,
  displayName: "Oni of the Red Gate",
  rarity: "SECRET",
  tags: ["FOLKLORE", "BRUISER", "SECRET"],
  baseHp: 160,
  abilityIds: ONI_OF_THE_RED_GATE_ABILITIES.map((a) => a.id),
  passiveId: THE_GATE_CLOSES.id,
  resources: [GATE_RESOURCE],
  knowledgeLevel: "DISCOVERABLE",
  artSpecId: "oni-of-the-red-gate",
});
export const ONI_OF_THE_RED_GATE_INITIAL_RESOURCES = defaultResourcesFor(ONI_OF_THE_RED_GATE);

const built = buildArt({
  bible: {
    characterId: "oni-of-the-red-gate",
    species: "a gate-guardian demon of Japanese folklore",
    ageRange: "ageless",
    face: "a stern dark-red face with a single long horn and glowing amber eyes",
    bodyType: "tall and armoured, standing very square",
    clothingArmor: "dark lacquered armour with a red sash and a tattered banner",
    weaponsProps: "a long two-handed blade with a red-tasselled hilt",
    markings: "a gate-shaped scar in ember light across the chest plate",
    silhouette: "a tall horned figure framed by a huge red gate with its doors half closed",
    signatureProps: ["a red gate", "a long blade", "a torn banner"],
  },
  region: "Japanese folklore inspiration (woodblock composition; cultural review required, OQ-12)",
  visualTheme: "a guard at a door that is about to shut for good",
  environment: "a vast red torii-like gate in a burnt field at dusk",
  lighting: "low red sun through the gate posts",
  paletteConcept: "gate red, lacquer black, ember amber, ash grey",
  avoid: ["any existing game's oni or guardian design"],
  splashScene: "standing in the mouth of the great red gate with the doors closing behind him and the blade drawn",
  portraitScene: "a stern horned face lit amber by the low sun",
  avatarScene: "close crop on the horn and eyes",
  iconScenes: [
    "a huge red cleave through the gate, for Crimson Cleave",
    "a figure planted firmly between two gate posts, for Hold the Threshold",
    "a gate swinging wide with light pouring out, for Open the Gate",
    "ember-red smoke curling from a horn, for Ember Curse",
  ],
  secretSilhouetteScene: "a tall horned silhouette framed by a huge gate, no other detail",
});
export const ONI_OF_THE_RED_GATE_VISUAL_BIBLE = built.bible;
export const ONI_OF_THE_RED_GATE_ART = built.art;
