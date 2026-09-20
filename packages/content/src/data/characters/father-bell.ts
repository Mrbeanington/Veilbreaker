import { characterDefinitionSchema, type CharacterDefinition } from "../../schemas/character";
import { passiveDefinitionSchema, type PassiveDefinition } from "../../schemas/passive";
import type { Ability } from "../../schemas/ability";
import { ability, buildArt, ENEMY_SINGLE, SELF_ONLY } from "./helpers";

// spec/03 FATHER BELL. Passive LET THE DEAD REST: deaths that occur while his
// effect applies become Consecrated. The game never states which character
// this answers (docs/design/characters/father-bell.md).

// Anyone driven below 25% while Father Bell stands is Consecrated. The status
// must land before the death-checks tier (a dead character can't receive a
// status), so it keys on onHpThreshold, which fires with the damage itself.
export const LET_THE_DEAD_REST: PassiveDefinition = passiveDefinitionSchema.parse({
  id: "passive.father-bell.let-the-dead-rest",
  displayName: "Let the Dead Rest",
  description: "Anyone brought near death while he stands is laid to rest properly.",
  trigger: { event: "onHpThreshold", relation: "any" },
  condition: { type: "hpBelowPercent", target: "target", percent: 25 },
  effects: [{ kind: "applyStatus", statusId: "status.soul-consecration" }],
  knowledgeLevel: "DISCOVERABLE",
});

export const TOLL_THE_BELL = ability({
  id: "ability.father-bell.toll-the-bell",
  displayName: "Toll the Bell",
  description: "A resonant peal that rattles one enemy.",
  cost: { spirit: 1, focus: 1 },
  target: ENEMY_SINGLE,
  effects: [{ kind: "damage", amount: 20 }],
});
export const HUSH = ability({
  id: "ability.father-bell.hush",
  displayName: "Hush",
  description: "Silences an enemy for a turn.",
  cost: { spirit: 2 },
  cooldown: 3,
  target: ENEMY_SINGLE,
  effects: [{ kind: "applyStatus", statusId: "status.silence", durationTurns: 1 }],
});
export const SANCTUARY = ability({
  id: "ability.father-bell.sanctuary",
  displayName: "Sanctuary",
  description: "Wards himself with a shield.",
  cost: { spirit: 1, neutral: 1 },
  cooldown: 2,
  target: SELF_ONLY,
  effects: [{ kind: "applyStatus", statusId: "status.shield", magnitude: 30, durationTurns: 3 }],
});
export const LAST_RITES = ability({
  id: "ability.father-bell.last-rites",
  displayName: "Last Rites",
  description: "Mends his own wounds.",
  cost: { spirit: 2 },
  cooldown: 2,
  target: SELF_ONLY,
  effects: [{ kind: "heal", healingClass: "heal", amount: 30 }],
});

export const FATHER_BELL_ABILITIES: Ability[] = [TOLL_THE_BELL, HUSH, SANCTUARY, LAST_RITES];

export const FATHER_BELL: CharacterDefinition = characterDefinitionSchema.parse({
  id: "father-bell",
  version: 1,
  displayName: "Father Bell",
  rarity: "RARE",
  tags: ["SUPPORT", "CONTROLLER", "DEFENDER"],
  baseHp: 130,
  abilityIds: FATHER_BELL_ABILITIES.map((a) => a.id),
  passiveId: LET_THE_DEAD_REST.id,
  knowledgeLevel: "DISCOVERABLE",
  artSpecId: "father-bell",
});

const built = buildArt({
  bible: {
    characterId: "father-bell",
    species: "a human sexton-priest of an original order",
    ageRange: "weathered late middle age",
    face: "a kind, tired face with unwavering eyes",
    bodyType: "stooped but sturdy",
    clothingArmor: "patched dark vestments with a rope belt, no real religious insignia",
    weaponsProps: "a large hand bell on a worn cord",
    markings: "ash smudged on the brow in an invented mark",
    silhouette: "a hunched figure holding a bell at arm's length",
    signatureProps: ["the hand bell", "ash-smudged brow"],
  },
  region: "Original / no single-culture inspiration",
  visualTheme: "a gravedigger's gentleness carrying an unflinching duty",
  environment: "a lantern-lit cemetery path",
  lighting: "warm lantern light against cold blue night",
  paletteConcept: "charcoal vestments, brass bell, lantern amber",
  avoid: ["any real religious iconography", "a menacing expression"],
  splashScene: "standing among leaning gravestones, bell raised mid-toll, faint motes of light rising from the ground",
  portraitScene: "head bowed slightly, bell cord in hand, lantern glow on one side of the face",
  avatarScene: "close crop on the face and the bell",
  iconScenes: [
    "a bell mid-swing with sound rings, for Toll the Bell",
    "a finger to lips over a bell, for Hush",
    "a ring of lantern light around a bell, for Sanctuary",
    "an open hand over a small flame, for Last Rites",
  ],
});
export const FATHER_BELL_VISUAL_BIBLE = built.bible;
export const FATHER_BELL_ART = built.art;
