import { characterDefinitionSchema, defaultResourcesFor, type CharacterDefinition } from "../../schemas/character";
import { passiveDefinitionSchema, type PassiveDefinition } from "../../schemas/passive";
import type { Ability } from "../../schemas/ability";
import type { Resource } from "../../schemas/common";
import { ability, buildArt, ENEMY_ALL, ENEMY_SINGLE, SELF_ONLY } from "./helpers";

// spec/03 #1 ASTERION (Ancient Mediterranean) — the labyrinth. He builds Maze
// by charging and hiding, spends it in one goring rush, and a wounded Asterion
// builds it faster (berserk). docs/design/characters/asterion.md

export const MAZE_RESOURCE: Resource = {
  id: "resource.maze",
  displayName: "Maze",
  startingValue: 0,
  min: 0,
  max: 3,
  visibleToOpponent: true,
  displayHint: "pips",
  trackMode: true,
};

// Berserk: below half health he keeps finding his way back to the centre.
export const RAGE_OF_THE_MAZE: PassiveDefinition = passiveDefinitionSchema.parse({
  id: "passive.asterion.rage-of-the-maze",
  displayName: "Rage of the Maze",
  description: "Below half health, he gains a Maze pip every turn.",
  trigger: { event: "onTurnStart", relation: "self" },
  condition: { type: "hpBelowPercent", target: "self", percent: 50 },
  effects: [{ kind: "modifyResource", resourceId: MAZE_RESOURCE.id, amount: 1 }],
});

export const HORN_CHARGE = ability({
  id: "ability.asterion.horn-charge",
  displayName: "Horn Charge",
  description: "Gores an enemy for 20 and gains a Maze pip.",
  cost: { might: 1 },
  target: ENEMY_SINGLE,
  effects: [
    { kind: "damage", amount: 20 },
    { kind: "modifyResource", resourceId: MAZE_RESOURCE.id, amount: 1, target: SELF_ONLY },
  ],
});
export const INTO_THE_MAZE = ability({
  id: "ability.asterion.into-the-maze",
  displayName: "Into the Maze",
  description: "Vanishes into the corridors for a turn and gains two Maze pips.",
  cost: { spirit: 1 },
  cooldown: 2,
  target: SELF_ONLY,
  effects: [
    { kind: "applyStatus", statusId: "status.untargetable", durationTurns: 1 },
    { kind: "modifyResource", resourceId: MAZE_RESOURCE.id, amount: 2 },
  ],
});
export const GORING_RUSH = ability({
  id: "ability.asterion.goring-rush",
  displayName: "Goring Rush",
  description: "Spends all the Maze he has: 30 damage, 40 with two pips, 60 with three.",
  cost: { might: 2 },
  cooldown: 2,
  target: ENEMY_SINGLE,
  effects: [
    {
      kind: "conditional",
      condition: { type: "resourceAtLeast", target: "self", resourceId: MAZE_RESOURCE.id, amount: 3 },
      ifTrue: [
        { kind: "damage", amount: 60 },
        { kind: "modifyResource", resourceId: MAZE_RESOURCE.id, amount: -3, target: SELF_ONLY },
      ],
      ifFalse: [
        {
          kind: "conditional",
          condition: { type: "resourceAtLeast", target: "self", resourceId: MAZE_RESOURCE.id, amount: 2 },
          ifTrue: [
            { kind: "damage", amount: 40 },
            { kind: "modifyResource", resourceId: MAZE_RESOURCE.id, amount: -2, target: SELF_ONLY },
          ],
          ifFalse: [{ kind: "damage", amount: 30 }],
        },
      ],
    },
  ],
});
export const BELLOW = ability({
  id: "ability.asterion.bellow",
  displayName: "Bellow",
  description: "A roar down every corridor weakens all enemies.",
  cost: { focus: 1 },
  cooldown: 3,
  target: ENEMY_ALL,
  effects: [{ kind: "applyStatus", statusId: "status.weakness", magnitude: 10, durationTurns: 2 }],
});

export const ASTERION_ABILITIES: Ability[] = [HORN_CHARGE, INTO_THE_MAZE, GORING_RUSH, BELLOW];

export const ASTERION: CharacterDefinition = characterDefinitionSchema.parse({
  id: "asterion",
  version: 1,
  displayName: "Asterion",
  rarity: "CORE",
  tags: ["BEAST", "MYTHOLOGY", "BRUISER"],
  baseHp: 160,
  abilityIds: ASTERION_ABILITIES.map((a) => a.id),
  passiveId: RAGE_OF_THE_MAZE.id,
  resources: [MAZE_RESOURCE],
  artSpecId: "asterion",
});
export const ASTERION_INITIAL_RESOURCES = defaultResourcesFor(ASTERION);

const built = buildArt({
  bible: {
    characterId: "asterion",
    species: "a bull-headed man-beast of Mediterranean myth",
    ageRange: "ageless",
    face: "a heavy bull's skull-face with deep-set human eyes",
    bodyType: "enormously broad, hunched under his own shoulders",
    clothingArmor: "a rough hide kilt and bronze wrist bands",
    weaponsProps: "sweeping curved horns and a length of frayed thread around one wrist",
    markings: "pale scars in the pattern of a labyrinth across his chest",
    silhouette: "a hulking figure with wide curved horns against a corridor wall",
    signatureProps: ["curved horns", "a frayed thread", "labyrinth scars"],
  },
  region: "Ancient Mediterranean (weathered bronze, marble, geometric borders)",
  visualTheme: "a prisoner who became the maze's hunter",
  environment: "a narrow stone corridor of geometric meander patterns",
  lighting: "a single shaft of torchlight down a long passage",
  paletteConcept: "sandstone, bronze, soot black, dried-blood red",
  avoid: ["any existing game's minotaur design"],
  splashScene: "charging out of a dark corridor with the meander wall cracking behind him",
  portraitScene: "the bull face in profile, breath steaming, one eye catching torchlight",
  avatarScene: "close crop on the horns and eyes",
  iconScenes: [
    "two horns lowered in a charge, for Horn Charge",
    "a corridor closing behind a dark shape, for Into the Maze",
    "a spiral of stone ending in a horn point, for Goring Rush",
    "sound rings passing down a corridor, for Bellow",
  ],
});
export const ASTERION_VISUAL_BIBLE = built.bible;
export const ASTERION_ART = built.art;
