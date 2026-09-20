import { characterDefinitionSchema, type CharacterDefinition } from "../../schemas/character";
import type { Ability } from "../../schemas/ability";
import { ENEMY_SINGLE, SELF_ONLY, ability, buildArt } from "./helpers";

// spec/03 #60 SAND ASSASSIN (Egypt / Desert) — a blade that vanishes into the dune and strikes from nowhere. The strike after a vanishing is the killer. docs/design/characters/sand-assassin.md

export const DUST_BLADE = ability({
  id: "ability.sand-assassin.dust-blade",
  displayName: "Dust Blade",
  description: "A quick cut: 20 damage.",
  cost: { might: 1 },
  target: ENEMY_SINGLE,
  effects: [{ kind: "damage", amount: 20 }],
});
export const SHIFTING_DUNE = ability({
  id: "ability.sand-assassin.shifting-dune",
  displayName: "Shifting Dune",
  description: "Melts into the sand: untargetable for a turn.",
  cost: { focus: 1 },
  cooldown: 3,
  target: SELF_ONLY,
  effects: [{ kind: "applyStatus", statusId: "status.untargetable", durationTurns: 1 }],
});
export const AMBUSH = ability({
  id: "ability.sand-assassin.ambush",
  displayName: "Ambush",
  description: "30 damage. Right after Shifting Dune it deals 70.",
  cost: { might: 2 },
  cooldown: 2,
  target: ENEMY_SINGLE,
  effects: [
    {
      kind: "conditional",
      condition: { type: "usedAbilityLastTurn", target: "self", abilityId: SHIFTING_DUNE.id },
      ifTrue: [{ kind: "damage", amount: 70 }],
      ifFalse: [{ kind: "damage", amount: 30 }],
    },
  ],
});
export const POISON_KRIS = ability({
  id: "ability.sand-assassin.poison-kris",
  displayName: "Poison Kris",
  description: "A nicked wrist: 10 damage and Poison for 3 turns.",
  cost: { focus: 1 },
  cooldown: 2,
  target: ENEMY_SINGLE,
  effects: [{ kind: "damage", amount: 10 }, { kind: "applyStatus", statusId: "status.poison", magnitude: 10, durationTurns: 3 }],
});

export const SAND_ASSASSIN_ABILITIES: Ability[] = [DUST_BLADE, SHIFTING_DUNE, AMBUSH, POISON_KRIS];

export const SAND_ASSASSIN: CharacterDefinition = characterDefinitionSchema.parse({
  id: "sand-assassin",
  version: 1,
  displayName: "Sand Assassin",
  rarity: "RARE",
  tags: ["MYTHOLOGY", "ASSASSIN", "ATTACKER"],
  baseHp: 100,
  abilityIds: SAND_ASSASSIN_ABILITIES.map((a) => a.id),
  artSpecId: "sand-assassin",
});

const built = buildArt({
  bible: {
    characterId: "sand-assassin",
    species: "a masked desert killer of legend",
    ageRange: "a young adult",
    face: "a face wrapped in a sand-coloured veil with only narrow dark eyes showing",
    bodyType: "lean, low and quick",
    clothingArmor: "layered sand-tan wraps, a hooded half-cloak and leather bracers",
    weaponsProps: "a pair of curved daggers and a small blowpipe",
    markings: "a thin line of black paint under each eye",
    silhouette: "a hooded crouching figure with two curved daggers against a dune",
    signatureProps: ["curved daggers", "a sand-coloured veil", "a hooded half-cloak"],
  },
  region: "Egyptian / Desert inspiration (sandstone, gold leaf, hieroglyph-free geometric borders, endless dunes)",
  visualTheme: "a stab from the dune itself",
  environment: "a wind-shaped dune ridge at noon",
  lighting: "harsh white noon sun with long sharp shadows",
  paletteConcept: "sand tan, shadow brown, steel grey, rust red",
  avoid: ["any existing game's sand assassin design"],
  splashScene: "rising out of a dune in a spray of sand with both daggers crossed",
  portraitScene: "two dark eyes in a sand-coloured veil",
  avatarScene: "close crop on the veil and eyes",
  iconScenes: ["a dagger tip in a puff of dust, for Dust Blade", "a figure sinking into a sand ripple, for Shifting Dune", "a blade flash from an empty dune, for Ambush", "a dagger with a green droplet, for Poison Kris"],
});
export const SAND_ASSASSIN_VISUAL_BIBLE = built.bible;
export const SAND_ASSASSIN_ART = built.art;
