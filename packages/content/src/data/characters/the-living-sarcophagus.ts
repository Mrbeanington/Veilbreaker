import { characterDefinitionSchema, type CharacterDefinition } from "../../schemas/character";
import type { Ability } from "../../schemas/ability";
import { ENEMY_ALL, ENEMY_SINGLE, SELF_ONLY, ability, buildArt } from "./helpers";

// spec/03 #62 THE LIVING SARCOPHAGUS (Egypt / Desert) — a stone coffin that walks. It slams, seals a foe inside for a turn, and throws a lid up that hurts whoever strikes it. docs/design/characters/the-living-sarcophagus.md

export const LID_SLAM = ability({
  id: "ability.the-living-sarcophagus.lid-slam",
  displayName: "Lid Slam",
  description: "The heavy lid falls: 30 damage.",
  cost: { might: 2 },
  cooldown: 1,
  target: ENEMY_SINGLE,
  effects: [{ kind: "damage", amount: 30 }],
});
export const ENTOMB = ability({
  id: "ability.the-living-sarcophagus.entomb",
  displayName: "Entomb",
  description: "Seals an enemy inside for a turn: stunned and untargetable.",
  cost: { spirit: 2 },
  cooldown: 4,
  target: ENEMY_SINGLE,
  effects: [{ kind: "applyStatus", statusId: "status.stun", durationTurns: 1 }, { kind: "applyStatus", statusId: "status.untargetable", durationTurns: 1 }],
});
export const LID_CLOSED = ability({
  id: "ability.the-living-sarcophagus.lid-closed",
  displayName: "Lid Closed",
  description: "Snaps shut: reflects damage taken for a turn.",
  cost: { spirit: 1, focus: 1 },
  cooldown: 4,
  target: SELF_ONLY,
  effects: [{ kind: "applyStatus", statusId: "status.reflect", durationTurns: 1 }],
});
export const GRAVE_DUST = ability({
  id: "ability.the-living-sarcophagus.grave-dust",
  displayName: "Grave Dust",
  description: "Chokes the room with ancient dust: every enemy is weakened for 2 turns.",
  cost: { focus: 1, spirit: 1 },
  cooldown: 4,
  target: ENEMY_ALL,
  effects: [{ kind: "applyStatus", statusId: "status.weakness", magnitude: 10, durationTurns: 2 }],
});

export const THE_LIVING_SARCOPHAGUS_ABILITIES: Ability[] = [LID_SLAM, ENTOMB, LID_CLOSED, GRAVE_DUST];

export const THE_LIVING_SARCOPHAGUS: CharacterDefinition = characterDefinitionSchema.parse({
  id: "the-living-sarcophagus",
  version: 1,
  displayName: "The Living Sarcophagus",
  rarity: "RARE",
  tags: ["MYTHOLOGY", "TANK", "CONTROLLER"],
  baseHp: 180,
  abilityIds: THE_LIVING_SARCOPHAGUS_ABILITIES.map((a) => a.id),
  artSpecId: "the-living-sarcophagus",
});

const built = buildArt({
  bible: {
    characterId: "the-living-sarcophagus",
    species: "an animated stone sarcophagus of desert myth",
    ageRange: "ancient",
    face: "a carved stone face in the lid with hollow eye slots and a faint glow inside",
    bodyType: "a huge upright stone coffin on thick stone limbs",
    clothingArmor: "weathered painted stone, gold leaf flaking off in patches",
    weaponsProps: "a heavy stone lid held as a shield",
    markings: "chipped geometric borders and faded painted patterns",
    silhouette: "a huge upright coffin-shaped figure on thick stone legs",
    signatureProps: ["a stone lid", "gold leaf flaking", "a glowing eye slit"],
  },
  region: "Egyptian / Desert inspiration (sandstone, gold leaf, hieroglyph-free geometric borders, endless dunes)",
  visualTheme: "the coffin that decided to walk",
  environment: "a collapsed burial hall with fallen columns",
  lighting: "dim torchlight with a pale glow leaking from inside the coffin",
  paletteConcept: "sandstone, faded gold, lapis blue, shadow black",
  avoid: ["any existing game's the living sarcophagus design"],
  splashScene: "stepping through a broken wall with the lid raised and light leaking from within",
  portraitScene: "a carved stone face with two glowing eye slits",
  avatarScene: "close crop on the stone face",
  iconScenes: ["a heavy stone lid dropping, for Lid Slam", "a hand pulled inside a dark coffin, for Entomb", "a stone lid snapping shut with a flash, for Lid Closed", "a cloud of pale dust filling a chamber, for Grave Dust"],
});
export const THE_LIVING_SARCOPHAGUS_VISUAL_BIBLE = built.bible;
export const THE_LIVING_SARCOPHAGUS_ART = built.art;
