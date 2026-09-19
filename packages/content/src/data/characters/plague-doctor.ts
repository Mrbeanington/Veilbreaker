import { characterDefinitionSchema, type CharacterDefinition } from "../../schemas/character";
import type { Ability } from "../../schemas/ability";
import { ability, buildArt, ENEMY_ALL, ENEMY_SINGLE } from "./helpers";

// spec/03 THE PLAGUE DOCTOR. "Premier anti-healing specialist." Every ability
// interacts with healing; see docs/design/characters/plague-doctor.md.

export const BITTER_DRAUGHT = ability({
  id: "ability.plague-doctor.bitter-draught",
  displayName: "Bitter Draught",
  description: "Forbids an enemy from being healed for two turns.",
  cost: { spirit: 1, focus: 1 },
  cooldown: 2,
  target: ENEMY_SINGLE,
  effects: [{ kind: "applyStatus", statusId: "status.anti-heal", durationTurns: 2 }],
});
export const SPOILED_TINCTURE = ability({
  id: "ability.plague-doctor.spoiled-tincture",
  displayName: "Spoiled Tincture",
  description: "Sours all healing an enemy receives, even stolen life.",
  cost: { spirit: 1 },
  target: ENEMY_SINGLE,
  effects: [{ kind: "applyStatus", statusId: "status.healing-reduction", magnitude: 10, durationTurns: 3 }],
});
export const MIASMA_FLASK = ability({
  id: "ability.plague-doctor.miasma-flask",
  displayName: "Miasma Flask",
  description: "Shatters a flask of poison over the enemy team.",
  cost: { might: 1, chaos: 1 },
  cooldown: 2,
  target: ENEMY_ALL,
  effects: [
    { kind: "damage", amount: 10 },
    { kind: "applyStatus", statusId: "status.poison", magnitude: 5, durationTurns: 3 },
  ],
});
export const CULL_THE_WEAK = ability({
  id: "ability.plague-doctor.cull-the-weak",
  displayName: "Cull the Weak",
  description: "Hits far harder against a patient who cannot be healed.",
  cost: { might: 2 },
  cooldown: 1,
  target: ENEMY_SINGLE,
  effects: [
    {
      kind: "conditional",
      condition: { type: "hasStatus", target: "target", statusId: "status.anti-heal" },
      ifTrue: [{ kind: "damage", amount: 40 }],
      ifFalse: [{ kind: "damage", amount: 15 }],
    },
  ],
});

export const PLAGUE_DOCTOR_ABILITIES: Ability[] = [BITTER_DRAUGHT, SPOILED_TINCTURE, MIASMA_FLASK, CULL_THE_WEAK];

export const PLAGUE_DOCTOR: CharacterDefinition = characterDefinitionSchema.parse({
  id: "plague-doctor",
  version: 1,
  displayName: "The Plague Doctor",
  rarity: "CORE",
  tags: ["ANTI-HEALER", "CONTROLLER", "FOLKLORE"],
  baseHp: 100,
  abilityIds: PLAGUE_DOCTOR_ABILITIES.map((a) => a.id),
  artSpecId: "plague-doctor",
});

const built = buildArt({
  bible: {
    characterId: "plague-doctor",
    species: "a human physician of an invented plague-stricken city",
    ageRange: "indeterminate behind the mask",
    face: "a long-beaked leather mask with round glass eyepieces",
    bodyType: "tall and narrow",
    clothingArmor: "a waxed black coat, wide-brimmed hat and gloves",
    weaponsProps: "a satchel of corked vials and a long cane",
    markings: "faded chalk tally marks along the coat hem",
    silhouette: "a tall beaked silhouette under a wide brim",
    signatureProps: ["the beaked mask", "corked vial satchel"],
  },
  region: "Original / no single-culture inspiration",
  visualTheme: "clinical menace, the cure that is worse than the disease",
  environment: "a fog-choked street of shuttered houses",
  lighting: "sickly green lantern light",
  paletteConcept: "waxed black, verdigris glass, bone-white mask",
  avoid: ["any existing plague-doctor game or film character", "gore"],
  splashScene: "striding through fog with a vial raised, shuttered windows behind him",
  portraitScene: "beaked mask turned three-quarters, glass eyepieces catching lantern light",
  avatarScene: "close crop on the beak and eyepieces",
  iconScenes: [
    "a vial of dark liquid with a crossed-out heart, for Bitter Draught",
    "a curdled drop falling into a cup, for Spoiled Tincture",
    "a shattering flask releasing green mist, for Miasma Flask",
    "a cane tapping a cracked heart, for Cull the Weak",
  ],
});
export const PLAGUE_DOCTOR_VISUAL_BIBLE = built.bible;
export const PLAGUE_DOCTOR_ART = built.art;
