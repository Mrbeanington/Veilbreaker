import { characterDefinitionSchema, type CharacterDefinition } from "../../schemas/character";
import { passiveDefinitionSchema, type PassiveDefinition } from "../../schemas/passive";
import type { Ability } from "../../schemas/ability";
import { ENEMY_ALL, ENEMY_SINGLE, SELF_ONLY, ability, buildArt } from "./helpers";

// spec/03 #7 Legend THE MINOTAUR KING — an extreme tank who runs a Labyrinth. He draws blows onto himself, sends an enemy's attack the wrong way, and on his one great turn closes the maze on the whole enemy team. docs/design/characters/minotaur-king.md

// Legend lever (spec/03): a special vulnerability. When the crown cracks
// (below half health) every wound leaves him briefly more exposed.
export const CRACKED_CROWN: PassiveDefinition = passiveDefinitionSchema.parse({
  id: "passive.minotaur-king.cracked-crown",
  displayName: "Cracked Crown",
  description: "Below half health, every wound leaves him more exposed for a turn.",
  trigger: { event: "onDamaged", relation: "self", effectTarget: "self" },
  condition: { type: "hpBelowPercent", target: "self", percent: 50 },
  effects: [{ kind: "applyStatus", statusId: "status.damage-amplification", magnitude: 10, durationTurns: 1 }],
});

export const BRONZE_AXE = ability({
  id: "ability.minotaur-king.bronze-axe",
  displayName: "Bronze Axe",
  description: "The great ceremonial axe: 30 damage.",
  cost: { might: 2 },
  cooldown: 1,
  target: ENEMY_SINGLE,
  effects: [{ kind: "damage", amount: 30 }],
});
export const LABYRINTH_WALL = ability({
  id: "ability.minotaur-king.labyrinth-wall",
  displayName: "Labyrinth Wall",
  description: "Walls close round him: single-target attacks are drawn to him for a turn and he takes 20 less damage for 2 turns.",
  cost: { spirit: 1 },
  cooldown: 4,
  target: SELF_ONLY,
  effects: [{ kind: "applyStatus", statusId: "status.taunt", durationTurns: 1 }, { kind: "applyStatus", statusId: "status.damage-reduction", magnitude: 20, durationTurns: 2 }],
});
export const LOST_IN_THE_MAZE = ability({
  id: "ability.minotaur-king.lost-in-the-maze",
  displayName: "Lost in the Maze",
  description: "An enemy's chosen attack takes a wrong turn and lands on him instead.",
  cost: { focus: 1, chaos: 1 },
  resolutionTierId: "priority-abilities",
  cooldown: 5,
  target: ENEMY_SINGLE,
  effects: [{ kind: "retargetQueuedAction" }],
});
export const THE_LABYRINTH_CLOSES = ability({
  id: "ability.minotaur-king.the-labyrinth-closes",
  displayName: "The Labyrinth Closes",
  description: "The maze seals round the whole enemy team: every enemy is stunned for a turn. Extremely expensive.",
  cost: { spirit: 3, chaos: 3 },
  cooldown: 7,
  target: ENEMY_ALL,
  effects: [{ kind: "applyStatus", statusId: "status.stun", durationTurns: 1 }],
});

export const MINOTAUR_KING_ABILITIES: Ability[] = [BRONZE_AXE, LABYRINTH_WALL, LOST_IN_THE_MAZE, THE_LABYRINTH_CLOSES];

export const MINOTAUR_KING: CharacterDefinition = characterDefinitionSchema.parse({
  id: "minotaur-king",
  version: 1,
  displayName: "The Minotaur King",
  rarity: "LEGENDARY",
  tags: ["LEGENDARY", "FOLKLORE", "MYTHOLOGY", "TANK", "CONTROLLER"],
  baseHp: 130,
  abilityIds: MINOTAUR_KING_ABILITIES.map((a) => a.id),
  passiveId: CRACKED_CROWN.id,
  artSpecId: "minotaur-king",
});

const built = buildArt({
  bible: {
    characterId: "minotaur-king",
    species: "a colossal crowned bull-headed monarch of the labyrinth",
    ageRange: "ancient",
    face: "a huge horned bull's head under a dented bronze crown with small, weary, furious eyes",
    bodyType: "vast, broad and towering",
    clothingArmor: "battered bronze plate armour engraved with labyrinth patterns over a dark hide",
    weaponsProps: "an enormous ceremonial axe with a maze engraved on the blade",
    markings: "concentric maze engravings worn into the armour, entirely original",
    silhouette: "a colossal horned crowned figure with a huge axe standing in a narrow stone corridor",
    signatureProps: ["a dented bronze crown", "labyrinth-engraved armour", "an enormous axe"],
  },
  region: "Storybook-animal and tall-tale inspiration (worn fur, patched uniforms, bright props, painterly wilderness)",
  visualTheme: "the king who became the maze",
  environment: "a labyrinth throne-room of bronze-inlaid stone",
  lighting: "torchlight down long stone corridors",
  paletteConcept: "bronze, dark hide brown, torch amber, labyrinth stone",
  avoid: ["any existing game's the minotaur king design"],
  splashScene: "standing in the mouth of a labyrinth corridor with the axe planted and the walls closing behind him",
  portraitScene: "a horned bull's head under a dented crown",
  avatarScene: "close crop on the crown and horns",
  iconScenes: ["a huge bronze axe blade, for Bronze Axe", "stone walls sliding shut round a figure, for Labyrinth Wall", "a maze corridor with a twisting arrow, for Lost in the Maze", "a full maze of bronze lines closing over a crowd, for The Labyrinth Closes"],
  legendRevealScene: "rising in the centre of a vast labyrinth as its bronze walls slam shut round the viewer, the crown lit by torchlight",
});
export const MINOTAUR_KING_VISUAL_BIBLE = built.bible;
export const MINOTAUR_KING_ART = built.art;
