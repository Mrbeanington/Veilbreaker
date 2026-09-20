import { characterDefinitionSchema, type CharacterDefinition } from "../../schemas/character";
import type { Ability } from "../../schemas/ability";
import { ALLY_SINGLE, ENEMY_SINGLE, SELF_ONLY, ability, buildArt } from "./helpers";

// spec/03 #91 SIR HOPSALOT (Animals / Weird) — a rabbit knight of absolute sincerity. A flurry of hops, a carrot for a friend, and a lance charge that ends arguments. docs/design/characters/sir-hopsalot.md

export const TRIPLE_HOP = ability({
  id: "ability.sir-hopsalot.triple-hop",
  displayName: "Triple Hop",
  description: "Three quick hops: 3 hits of 10 damage.",
  cost: { might: 1 },
  target: ENEMY_SINGLE,
  effects: [{ kind: "damage", amount: 10 }, { kind: "damage", amount: 10 }, { kind: "damage", amount: 10 }],
});
export const LANCE_CHARGE = ability({
  id: "ability.sir-hopsalot.lance-charge",
  displayName: "Lance Charge",
  description: "A charge with the little lance: 30 damage, and the enemy is stunned for a turn.",
  cost: { might: 2, focus: 1 },
  cooldown: 4,
  target: ENEMY_SINGLE,
  effects: [{ kind: "damage", amount: 30 }, { kind: "applyStatus", statusId: "status.stun", durationTurns: 1 }],
});
export const CARROT_OF_VALOR = ability({
  id: "ability.sir-hopsalot.carrot-of-valor",
  displayName: "Carrot of Valor",
  description: "Shares a carrot: an ally is shielded for 30 for 3 turns.",
  cost: { spirit: 1 },
  cooldown: 2,
  target: ALLY_SINGLE,
  effects: [{ kind: "applyStatus", statusId: "status.shield", magnitude: 30, durationTurns: 3 }],
});
export const KNIGHTS_GUARD = ability({
  id: "ability.sir-hopsalot.knights-guard",
  displayName: "Knight's Guard",
  description: "Raises his shield: strikes back for 20 whenever hit, for a turn.",
  cost: { focus: 1 },
  cooldown: 3,
  target: SELF_ONLY,
  effects: [{ kind: "applyStatus", statusId: "status.counter", magnitude: 20, durationTurns: 1 }],
});

export const SIR_HOPSALOT_ABILITIES: Ability[] = [TRIPLE_HOP, LANCE_CHARGE, CARROT_OF_VALOR, KNIGHTS_GUARD];

export const SIR_HOPSALOT: CharacterDefinition = characterDefinitionSchema.parse({
  id: "sir-hopsalot",
  version: 1,
  displayName: "Sir Hopsalot",
  rarity: "CORE",
  tags: ["FOLKLORE", "BEAST", "WARRIOR"],
  baseHp: 120,
  abilityIds: SIR_HOPSALOT_ABILITIES.map((a) => a.id),
  artSpecId: "sir-hopsalot",
});

const built = buildArt({
  bible: {
    characterId: "sir-hopsalot",
    species: "an earnest knight-errant rabbit of storybook tales",
    ageRange: "a young adult rabbit",
    face: "a long-eared, wide-eyed rabbit face with a determined set to the mouth",
    bodyType: "small, upright and springy",
    clothingArmor: "a dented silver breastplate a size too big, a tiny plumed helm with ear-holes and a red cloak",
    weaponsProps: "a slender lance with a carrot-orange pennant and a round shield",
    markings: "a white blaze down the nose",
    silhouette: "a small armoured rabbit with tall ears through a plumed helm holding a long lance",
    signatureProps: ["a plumed helm with ear-holes", "a lance with a pennant", "a red cloak"],
  },
  region: "Storybook-animal and tall-tale inspiration (worn fur, patched uniforms, bright props, painterly wilderness)",
  visualTheme: "the bravest heart in the smallest armour",
  environment: "a sunlit meadow with a castle far behind",
  lighting: "bright morning sun on silver armour",
  paletteConcept: "armour silver, cloak red, meadow green, carrot orange",
  avoid: ["any existing game's sir hopsalot design"],
  splashScene: "charging across a meadow with the lance levelled and the cloak streaming behind",
  portraitScene: "a determined rabbit face under a plumed helm",
  avatarScene: "close crop on the helm and ears",
  iconScenes: ["three small paw-prints in a bounding line, for Triple Hop", "a lance point with an orange pennant, for Lance Charge", "a glowing carrot held out, for Carrot of Valor", "a round shield planted in grass, for Knight's Guard"],
});
export const SIR_HOPSALOT_VISUAL_BIBLE = built.bible;
export const SIR_HOPSALOT_ART = built.art;
