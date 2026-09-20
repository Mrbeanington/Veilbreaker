import { characterDefinitionSchema, type CharacterDefinition } from "../../schemas/character";
import type { Ability } from "../../schemas/ability";
import { ability, buildArt, ENEMY_SINGLE, SELF_ONLY } from "./helpers";

// spec/03 #48 PÚCA (Northern / Celtic) — the shape-shifting trickster. Every
// turn he could be a horse, a hare or a goat: Shift Shape is a random new
// shape with a different trick, and Lead Astray sends an enemy's attack
// elsewhere. docs/design/characters/puca.md

export const HOOF_AND_HORN = ability({
  id: "ability.puca.hoof-and-horn",
  displayName: "Hoof and Horn",
  description: "A kick and a butt: 2 hits of 10 damage.",
  cost: { might: 1 },
  target: ENEMY_SINGLE,
  effects: [
    { kind: "damage", amount: 10 },
    { kind: "damage", amount: 10 },
  ],
});
export const SHIFT_SHAPE = ability({
  id: "ability.puca.shift-shape",
  displayName: "Shift Shape",
  description: "Becomes something else, at random: a horse (Damage Reduction 20), a hare (untargetable) or a goat (heals 20).",
  cost: { chaos: 1 },
  cooldown: 2,
  target: SELF_ONLY,
  effects: [
    {
      kind: "randomOutcome",
      outcome: {
        rerollable: false,
        branches: [
          { weight: 1, effects: [{ kind: "applyStatus", statusId: "status.damage-reduction", magnitude: 20, durationTurns: 2 }] },
          { weight: 1, effects: [{ kind: "applyStatus", statusId: "status.untargetable", durationTurns: 1 }] },
          { weight: 1, effects: [{ kind: "heal", healingClass: "heal", amount: 20 }] },
        ],
      },
    },
  ],
});
export const LEAD_ASTRAY = ability({
  id: "ability.puca.lead-astray",
  displayName: "Lead Astray",
  description: "A false light in the dark: an enemy's chosen attack is sent to a different target.",
  cost: { focus: 1, chaos: 1 },
  cooldown: 4,
  resolutionTierId: "priority-abilities",
  target: ENEMY_SINGLE,
  effects: [{ kind: "retargetQueuedAction" }],
});
export const WILD_RIDE = ability({
  id: "ability.puca.wild-ride",
  displayName: "Wild Ride",
  description: "Carries an enemy off on a mad gallop: 30 damage and it is weakened for 2 turns.",
  cost: { might: 2 },
  cooldown: 3,
  target: ENEMY_SINGLE,
  effects: [
    { kind: "damage", amount: 30 },
    { kind: "applyStatus", statusId: "status.weakness", magnitude: 10, durationTurns: 2 },
  ],
});

export const PUCA_ABILITIES: Ability[] = [HOOF_AND_HORN, SHIFT_SHAPE, LEAD_ASTRAY, WILD_RIDE];

export const PUCA: CharacterDefinition = characterDefinitionSchema.parse({
  id: "puca",
  version: 1,
  displayName: "Púca",
  rarity: "RARE",
  tags: ["MYTHOLOGY", "BEAST", "CONTROLLER", "RANDOM"],
  baseHp: 100,
  abilityIds: PUCA_ABILITIES.map((a) => a.id),
  artSpecId: "puca",
});

const built = buildArt({
  bible: {
    characterId: "puca",
    species: "a shape-shifting spirit of Irish folklore",
    ageRange: "ageless",
    face: "a sleek black horse's head with glowing golden eyes and a knowing grin",
    bodyType: "a lean black horse with a long mane, always half-changing into something else",
    clothingArmor: "none — glossy black coat with flecks of grey",
    weaponsProps: "iron-shod hooves and a curling goat's horn on one side of the head",
    markings: "a white star on the forehead",
    silhouette: "a black horse with one horn, mane blowing as if in a wind that is not there",
    signatureProps: ["golden eyes", "one curled horn", "a long black mane"],
  },
  region: "Norse / Celtic inspiration (carved knotwork, weathered stone, stormy northern landscapes)",
  visualTheme: "a prank that may or may not get you killed",
  environment: "a moonlit bog with will-o'-the-wisp lights",
  lighting: "cold moonlight with green marsh-glow",
  paletteConcept: "coat black, eye gold, bog green, mist grey",
  avoid: ["any existing game's shapeshifter or nightmare-horse design"],
  splashScene: "rearing in the mist with its outline shifting from horse to hare to goat",
  portraitScene: "a horse's head with gold eyes and a wide grin",
  avatarScene: "close crop on the eyes",
  iconScenes: [
    "a horse and a goat sharing one silhouette, for Hoof and Horn",
    "a shape halfway between three animals, for Shift Shape",
    "a false light leading a traveller off a path, for Lead Astray",
    "a hoofprint in mud with steam rising, for Wild Ride",
  ],
});
export const PUCA_VISUAL_BIBLE = built.bible;
export const PUCA_ART = built.art;
