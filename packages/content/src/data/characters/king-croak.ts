import { characterDefinitionSchema, type CharacterDefinition } from "../../schemas/character";
import type { Ability } from "../../schemas/ability";
import { ENEMY_SINGLE, SELF_ONLY, ability, buildArt } from "./helpers";

// spec/03 #95 KING CROAK (Animals / Weird) — a swamp monarch of poisoned courtesies. A long tongue, a dart, and a royal curse that silences. docs/design/characters/king-croak.md

export const CROAK_TONGUE_LASH = ability({
  id: "ability.king-croak.tongue-lash",
  displayName: "Tongue Lash",
  description: "A long sticky tongue: 20 damage.",
  cost: { might: 1 },
  target: ENEMY_SINGLE,
  effects: [{ kind: "damage", amount: 20 }],
});
export const POISON_DART = ability({
  id: "ability.king-croak.poison-dart",
  displayName: "Poison Dart",
  description: "A dart from the royal quiver: 10 damage and Poison for 3 turns.",
  cost: { focus: 1 },
  cooldown: 1,
  target: ENEMY_SINGLE,
  effects: [{ kind: "damage", amount: 10 }, { kind: "applyStatus", statusId: "status.poison", magnitude: 10, durationTurns: 3 }],
});
export const FROG_CURSE = ability({
  id: "ability.king-croak.frog-curse",
  displayName: "Frog Curse",
  description: "A royal curse: the enemy is silenced for a turn and weakened for 2.",
  cost: { spirit: 2 },
  cooldown: 5,
  target: ENEMY_SINGLE,
  effects: [{ kind: "applyStatus", statusId: "status.silence", durationTurns: 1 }, { kind: "applyStatus", statusId: "status.weakness", magnitude: 10, durationTurns: 2 }],
});
export const LILY_PAD_THRONE = ability({
  id: "ability.king-croak.lily-pad-throne",
  displayName: "Lily Pad Throne",
  description: "Settles on the throne: a shield of 30 for 3 turns.",
  cost: { spirit: 1 },
  cooldown: 3,
  target: SELF_ONLY,
  effects: [{ kind: "applyStatus", statusId: "status.shield", magnitude: 30, durationTurns: 3 }],
});

export const KING_CROAK_ABILITIES: Ability[] = [CROAK_TONGUE_LASH, POISON_DART, FROG_CURSE, LILY_PAD_THRONE];

export const KING_CROAK: CharacterDefinition = characterDefinitionSchema.parse({
  id: "king-croak",
  version: 1,
  displayName: "King Croak",
  rarity: "RARE",
  tags: ["FOLKLORE", "BEAST", "CONTROLLER"],
  baseHp: 120,
  abilityIds: KING_CROAK_ABILITIES.map((a) => a.id),
  artSpecId: "king-croak",
});

const built = buildArt({
  bible: {
    characterId: "king-croak",
    species: "a crowned frog monarch of swamp fairy tales",
    ageRange: "old and pompous",
    face: "a wide, warty green face with bulging gold eyes and a wider mouth",
    bodyType: "squat, round and regal",
    clothingArmor: "a moth-eaten ermine-trimmed red robe and a tarnished gold crown that sits between the eyes",
    weaponsProps: "a long sceptre topped with a dragonfly and a quiver of dart-thorns",
    markings: "dark warts and a pale throat that swells when he speaks",
    silhouette: "a squat crowned frog on a huge lily pad holding a tall sceptre",
    signatureProps: ["a tarnished crown", "an ermine-trimmed robe", "a dragonfly sceptre"],
  },
  region: "Storybook-animal and tall-tale inspiration (worn fur, patched uniforms, bright props, painterly wilderness)",
  visualTheme: "a king who rules exactly one pond",
  environment: "a misty swamp with lily pads and a rotting throne",
  lighting: "green-gold light through mist",
  paletteConcept: "swamp green, royal red, tarnished gold, mist grey",
  avoid: ["any existing game's king croak design"],
  splashScene: "seated on a great lily pad with the sceptre raised and his throat swelled mid-croak",
  portraitScene: "a warty green face with bulging gold eyes under a crown",
  avatarScene: "close crop on the crown and eyes",
  iconScenes: ["a pink tongue snapping out, for Tongue Lash", "a thorn dart with a green drip, for Poison Dart", "a crown glowing sickly green, for Frog Curse", "a lily pad with a tiny throne, for Lily Pad Throne"],
});
export const KING_CROAK_VISUAL_BIBLE = built.bible;
export const KING_CROAK_ART = built.art;
