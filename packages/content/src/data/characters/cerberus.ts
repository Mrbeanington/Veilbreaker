import { characterDefinitionSchema, type CharacterDefinition } from "../../schemas/character";
import { passiveDefinitionSchema, type PassiveDefinition } from "../../schemas/passive";
import type { Ability } from "../../schemas/ability";
import { ability, buildArt, ENEMY_SINGLE, SELF_ONLY } from "./helpers";

// spec/03 #8 CERBERUS (Ancient Mediterranean) — the gate's hound. Three heads
// bite three separate times, so flat armour is his prey; he draws attention
// and bites back. docs/design/characters/cerberus.md

export const GATE_GUARD: PassiveDefinition = passiveDefinitionSchema.parse({
  id: "passive.cerberus.gate-guard",
  displayName: "Gate Guard",
  description: "When an ally falls, he hardens: he takes 10 less damage for 2 turns.",
  trigger: { event: "onDeath", relation: "ally", effectTarget: "self" },
  effects: [{ kind: "applyStatus", statusId: "status.damage-reduction", magnitude: 10, durationTurns: 2 }],
});

export const THREE_BITES = ability({
  id: "ability.cerberus.three-bites",
  displayName: "Three Bites",
  description: "Each head bites: three hits of 10 damage.",
  cost: { might: 2 },
  cooldown: 1,
  target: ENEMY_SINGLE,
  effects: [
    { kind: "damage", amount: 10 },
    { kind: "damage", amount: 10 },
    { kind: "damage", amount: 10 },
  ],
});
export const GUARD_THE_GATE = ability({
  id: "ability.cerberus.guard-the-gate",
  displayName: "Guard the Gate",
  description: "Draws every single-target attack for a turn, and takes 10 less damage for 2 turns.",
  cost: { spirit: 1 },
  cooldown: 3,
  target: SELF_ONLY,
  effects: [
    { kind: "applyStatus", statusId: "status.taunt", durationTurns: 1 },
    { kind: "applyStatus", statusId: "status.damage-reduction", magnitude: 10, durationTurns: 2 },
  ],
});
export const SNARL = ability({
  id: "ability.cerberus.snarl",
  displayName: "Snarl",
  description: "Whoever hits him next also takes 10 damage back, for 2 turns.",
  cost: { focus: 1 },
  cooldown: 2,
  target: SELF_ONLY,
  effects: [{ kind: "applyStatus", statusId: "status.counter", magnitude: 10, durationTurns: 2 }],
});
export const HOWL_OF_HADES = ability({
  id: "ability.cerberus.howl-of-hades",
  displayName: "Howl of Hades",
  description: "A howl from the underworld: the enemy cowers, dealing 10 less damage for 2 turns.",
  cost: { chaos: 1 },
  cooldown: 3,
  target: ENEMY_SINGLE,
  effects: [
    { kind: "applyStatus", statusId: "status.fear", durationTurns: 1 },
    { kind: "applyStatus", statusId: "status.weakness", magnitude: 10, durationTurns: 2 },
  ],
});

export const CERBERUS_ABILITIES: Ability[] = [THREE_BITES, GUARD_THE_GATE, SNARL, HOWL_OF_HADES];

export const CERBERUS: CharacterDefinition = characterDefinitionSchema.parse({
  id: "cerberus",
  version: 1,
  displayName: "Cerberus",
  rarity: "CORE",
  tags: ["BEAST", "MYTHOLOGY", "DEFENDER"],
  baseHp: 150,
  abilityIds: CERBERUS_ABILITIES.map((a) => a.id),
  passiveId: GATE_GUARD.id,
  artSpecId: "cerberus",
});

const built = buildArt({
  bible: {
    characterId: "cerberus",
    species: "a three-headed hound of the underworld from Mediterranean myth",
    ageRange: "ageless",
    face: "three heavy black hound heads, one snarling, one watching, one sleeping",
    bodyType: "a massive low-slung hound with a serpent's tail",
    clothingArmor: "none — matted black fur and a heavy iron collar",
    weaponsProps: "fangs and a broken iron chain hanging from the collar",
    markings: "ember-red eyes and a single white scar on the middle head",
    silhouette: "a wide crouched hound with three heads in a row above the shoulders",
    signatureProps: ["three heads", "a broken chain", "an iron collar"],
  },
  region: "Ancient Mediterranean (weathered bronze, marble, geometric borders)",
  visualTheme: "a loyal guard that never stops watching",
  environment: "a stone gate at the edge of a river of shadow",
  lighting: "dim red glow from beyond the gate",
  paletteConcept: "black fur, ember red, iron grey, bone white",
  avoid: ["any existing game's three-headed dog design"],
  splashScene: "planted before a stone gate with all three heads snarling outward",
  portraitScene: "three overlapping hound heads with ember eyes",
  avatarScene: "close crop on the middle head",
  iconScenes: [
    "three jaws snapping together, for Three Bites",
    "a hound head before a closed gate, for Guard the Gate",
    "a bared fang in a curl of shadow, for Snarl",
    "a howling mouth with rings of red sound, for Howl of Hades",
  ],
});
export const CERBERUS_VISUAL_BIBLE = built.bible;
export const CERBERUS_ART = built.art;
