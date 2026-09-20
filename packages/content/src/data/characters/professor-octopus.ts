import { characterDefinitionSchema, type CharacterDefinition } from "../../schemas/character";
import type { Ability } from "../../schemas/ability";
import { LAST_USED_ABILITY } from "../../schemas/effect";
import { ENEMY_ALL, ENEMY_SINGLE, SELF_ONLY, ability, buildArt } from "./helpers";

// spec/03 #94 PROFESSOR OCTOPUS (Animals / Weird) — a lecturing octopus with eight arms and a good memory. He can repeat a lesson: his last ability is ready again at once. docs/design/characters/professor-octopus.md

export const EIGHT_ARMS = ability({
  id: "ability.professor-octopus.eight-arms",
  displayName: "Eight Arms",
  description: "Eight arms at once: 4 hits of 10 damage.",
  cost: { might: 2 },
  cooldown: 1,
  target: ENEMY_SINGLE,
  effects: [{ kind: "damage", amount: 10 }, { kind: "damage", amount: 10 }, { kind: "damage", amount: 10 }, { kind: "damage", amount: 10 }],
});
export const INK_CLOUD = ability({
  id: "ability.professor-octopus.ink-cloud",
  displayName: "Ink Cloud",
  description: "A cloud of ink: every enemy is weakened for 2 turns.",
  cost: { focus: 1 },
  cooldown: 3,
  target: ENEMY_ALL,
  effects: [{ kind: "applyStatus", statusId: "status.weakness", magnitude: 10, durationTurns: 2 }],
});
export const TENTACLE_GRAB = ability({
  id: "ability.professor-octopus.tentacle-grab",
  displayName: "Tentacle Grab",
  description: "Holds an enemy tight: it is stunned for a turn.",
  cost: { focus: 1, spirit: 1 },
  cooldown: 4,
  target: ENEMY_SINGLE,
  effects: [{ kind: "applyStatus", statusId: "status.stun", durationTurns: 1 }],
});
export const ENCORE = ability({
  id: "ability.professor-octopus.encore",
  displayName: "Encore",
  description: "Repeats the lesson: the ability he used last is ready again at once.",
  cost: { chaos: 1 },
  cooldown: 3,
  target: SELF_ONLY,
  effects: [{ kind: "modifyCooldown", abilityId: LAST_USED_ABILITY, mode: "set", amount: 0 }],
});

export const PROFESSOR_OCTOPUS_ABILITIES: Ability[] = [EIGHT_ARMS, INK_CLOUD, TENTACLE_GRAB, ENCORE];

export const PROFESSOR_OCTOPUS: CharacterDefinition = characterDefinitionSchema.parse({
  id: "professor-octopus",
  version: 1,
  displayName: "Professor Octopus",
  rarity: "RARE",
  tags: ["FOLKLORE", "MAGE", "CONTROLLER"],
  baseHp: 110,
  abilityIds: PROFESSOR_OCTOPUS_ABILITIES.map((a) => a.id),
  artSpecId: "professor-octopus",
});

const built = buildArt({
  bible: {
    characterId: "professor-octopus",
    species: "a scholarly giant octopus of whimsical sea tales",
    ageRange: "middle-aged",
    face: "a large domed head with heavy-lidded, intelligent eyes behind half-moon spectacles",
    bodyType: "a round head above eight long curling arms",
    clothingArmor: "a small tweed waistcoat and a tiny mortarboard, with a bow tie at the neck",
    weaponsProps: "a heavy book held in one arm, a piece of chalk in another and a cup of tea in a third",
    markings: "faint pale rings along every arm",
    silhouette: "a round-headed octopus in a mortarboard with several arms holding books and chalk",
    signatureProps: ["half-moon spectacles", "a tiny mortarboard", "a heavy book"],
  },
  region: "Storybook-animal and tall-tale inspiration (worn fur, patched uniforms, bright props, painterly wilderness)",
  visualTheme: "the lecture that grabs you by the ankles",
  environment: "a flooded lecture hall with a chalkboard and bubbling tanks",
  lighting: "green lamplight through water and warm chalk-dust glow",
  paletteConcept: "tweed brown, octopus violet, chalk white, sea green",
  avoid: ["any existing game's professor octopus design"],
  splashScene: "writing on a chalkboard with several arms at once while others hold up a book and a teacup",
  portraitScene: "a domed head with spectacles and heavy-lidded eyes",
  avatarScene: "close crop on the spectacles and mortarboard",
  iconScenes: ["eight arms fanned out like a star, for Eight Arms", "a dark ink cloud filling a room, for Ink Cloud", "a curling arm wrapped round a wrist, for Tentacle Grab", "a chalkboard with a circled repeat mark, for Encore"],
});
export const PROFESSOR_OCTOPUS_VISUAL_BIBLE = built.bible;
export const PROFESSOR_OCTOPUS_ART = built.art;
