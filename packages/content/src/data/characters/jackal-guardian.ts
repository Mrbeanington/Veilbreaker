import { characterDefinitionSchema, type CharacterDefinition } from "../../schemas/character";
import type { Ability } from "../../schemas/ability";
import { ENEMY_SINGLE, SELF_ONLY, ability, buildArt } from "./helpers";

// spec/03 #54 JACKAL GUARDIAN (Egypt / Desert) — the tomb's sentinel. He stands still, punishes whoever strikes him, and weakens the intruders he guards against. docs/design/characters/jackal-guardian.md

export const KHOPESH_SLASH = ability({
  id: "ability.jackal-guardian.khopesh-slash",
  displayName: "Khopesh Slash",
  description: "A sweep of the curved blade: 20 damage.",
  cost: { might: 1 },
  target: ENEMY_SINGLE,
  effects: [{ kind: "damage", amount: 20 }],
});
export const TOMB_WARD = ability({
  id: "ability.jackal-guardian.tomb-ward",
  displayName: "Tomb Ward",
  description: "Stands watch: strikes back for 20 whenever hit, for 2 turns.",
  cost: { spirit: 1 },
  cooldown: 3,
  target: SELF_ONLY,
  effects: [{ kind: "applyStatus", statusId: "status.counter", magnitude: 20, durationTurns: 2 }],
});
export const SENTINELS_HOWL = ability({
  id: "ability.jackal-guardian.sentinels-howl",
  displayName: "Sentinel's Howl",
  description: "A howl that unmans the intruder: the enemy is weakened for 2 turns.",
  cost: { focus: 1 },
  cooldown: 2,
  target: ENEMY_SINGLE,
  effects: [{ kind: "applyStatus", statusId: "status.weakness", magnitude: 10, durationTurns: 2 }],
});
export const POUNCE = ability({
  id: "ability.jackal-guardian.pounce",
  displayName: "Pounce",
  description: "Leaps from the dark: 30 damage and Bleed.",
  cost: { might: 2 },
  cooldown: 2,
  target: ENEMY_SINGLE,
  effects: [{ kind: "damage", amount: 30 }, { kind: "applyStatus", statusId: "status.bleed", magnitude: 5, durationTurns: 2 }],
});

export const JACKAL_GUARDIAN_ABILITIES: Ability[] = [KHOPESH_SLASH, TOMB_WARD, SENTINELS_HOWL, POUNCE];

export const JACKAL_GUARDIAN: CharacterDefinition = characterDefinitionSchema.parse({
  id: "jackal-guardian",
  version: 1,
  displayName: "Jackal Guardian",
  rarity: "CORE",
  tags: ["MYTHOLOGY", "BEAST", "DEFENDER"],
  baseHp: 140,
  abilityIds: JACKAL_GUARDIAN_ABILITIES.map((a) => a.id),
  artSpecId: "jackal-guardian",
});

const built = buildArt({
  bible: {
    characterId: "jackal-guardian",
    species: "a jackal-headed tomb guardian of desert myth",
    ageRange: "timeless",
    face: "a lean black jackal head with alert amber eyes and tall ears",
    bodyType: "tall, lean and still as a statue",
    clothingArmor: "a gold collar, linen kilt and bronze arm guards",
    weaponsProps: "a curved khopesh sword and a tall bronze-tipped staff",
    markings: "pale sand dust on the shoulders",
    silhouette: "a tall jackal-headed figure standing motionless with a curved blade",
    signatureProps: ["a curved khopesh", "a gold collar", "a tall staff"],
  },
  region: "Egyptian / Desert inspiration (sandstone, gold leaf, hieroglyph-free geometric borders, endless dunes)",
  visualTheme: "the guardian who never sleeps",
  environment: "a sealed tomb corridor with sand drifting in",
  lighting: "a single torch and warm sandstone glow",
  paletteConcept: "jet black, gold, linen white, sand",
  avoid: ["any existing game's jackal guardian design"],
  splashScene: "standing in a tomb doorway with blade lowered and sand pouring around his feet",
  portraitScene: "a still jackal face with amber eyes in torch light",
  avatarScene: "close crop on the jackal head and collar",
  iconScenes: ["a curved sword resting across a threshold, for Khopesh Slash", "a bronze shield turned to face outward, for Tomb Ward", "a jackal's raised muzzle mid-howl, for Sentinel's Howl", "a jackal mid-leap out of shadow, for Pounce"],
});
export const JACKAL_GUARDIAN_VISUAL_BIBLE = built.bible;
export const JACKAL_GUARDIAN_ART = built.art;
