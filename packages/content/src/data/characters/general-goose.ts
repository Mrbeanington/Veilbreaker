import { characterDefinitionSchema, type CharacterDefinition } from "../../schemas/character";
import type { Ability } from "../../schemas/ability";
import { ENEMY_ALL, ENEMY_SINGLE, ability, buildArt } from "./helpers";

// spec/03 #92 GENERAL GOOSE (Animals / Weird) — a military goose who is genuinely dangerous. A bayonet, an intimidating honk, and a bugle call that gets the whole team's abilities back sooner. docs/design/characters/general-goose.md

export const PECK = ability({
  id: "ability.general-goose.peck",
  displayName: "Peck",
  description: "A hard, fast peck: 20 damage.",
  cost: { might: 1 },
  target: ENEMY_SINGLE,
  effects: [{ kind: "damage", amount: 20 }],
});
export const FIXED_BAYONET = ability({
  id: "ability.general-goose.fixed-bayonet",
  displayName: "Fixed Bayonet",
  description: "A charge with the bayonet: 40 damage and Bleed.",
  cost: { might: 2, focus: 1 },
  cooldown: 2,
  target: ENEMY_SINGLE,
  effects: [{ kind: "damage", amount: 40 }, { kind: "applyStatus", statusId: "status.bleed", magnitude: 5, durationTurns: 2 }],
});
export const COMMANDING_HONK = ability({
  id: "ability.general-goose.commanding-honk",
  displayName: "Commanding Honk",
  description: "A honk that stops the room: every enemy is weakened for 2 turns.",
  cost: { spirit: 1, chaos: 1 },
  cooldown: 3,
  target: ENEMY_ALL,
  effects: [{ kind: "applyStatus", statusId: "status.weakness", magnitude: 10, durationTurns: 2 }],
});
export const REVEILLE = ability({
  id: "ability.general-goose.reveille",
  displayName: "Reveille",
  description: "A bugle call: every ally's abilities recover faster for 2 turns.",
  cost: { focus: 1, spirit: 1 },
  cooldown: 3,
  target: { side: "ally", scope: "all", count: 1, includeSelf: true, filterTags: [] },
  effects: [{ kind: "applyStatus", statusId: "status.cooldown-reduction", durationTurns: 2 }],
});

export const GENERAL_GOOSE_ABILITIES: Ability[] = [PECK, FIXED_BAYONET, COMMANDING_HONK, REVEILLE];

export const GENERAL_GOOSE: CharacterDefinition = characterDefinitionSchema.parse({
  id: "general-goose",
  version: 1,
  displayName: "General Goose",
  rarity: "RARE",
  tags: ["FOLKLORE", "BEAST", "SUPPORT"],
  baseHp: 140,
  abilityIds: GENERAL_GOOSE_ABILITIES.map((a) => a.id),
  artSpecId: "general-goose",
});

const built = buildArt({
  bible: {
    characterId: "general-goose",
    species: "a decorated military goose of barnyard-war satire",
    ageRange: "an old campaigner",
    face: "a stern, flat-billed goose face with a hard yellow eye and a scar over one brow",
    bodyType: "broad-chested and upright",
    clothingArmor: "a dark green dress uniform with gold epaulettes, a chest of medals and a peaked cap",
    weaponsProps: "a short bayonet-tipped rifle and a brass bugle",
    markings: "a small feather-scar over one eye",
    silhouette: "an upright goose in a peaked cap and medals with a bayonet over one wing",
    signatureProps: ["a peaked cap", "a chest of medals", "a brass bugle"],
  },
  region: "Storybook-animal and tall-tale inspiration (worn fur, patched uniforms, bright props, painterly wilderness)",
  visualTheme: "a veteran nobody argues with",
  environment: "a muddy parade ground before a barn-fort at dawn",
  lighting: "cold dawn light and steam from a field kitchen",
  paletteConcept: "uniform green, medal gold, mud brown, dawn grey",
  avoid: ["any existing game's general goose design"],
  splashScene: "standing at attention on a parade ground with the bayonet lowered and the bugle at the hip",
  portraitScene: "a stern goose face under a peaked cap",
  avatarScene: "close crop on the cap and eye",
  iconScenes: ["a hard beak striking, for Peck", "a bayonet flashing, for Fixed Bayonet", "a raised beak with sound-rings, for Commanding Honk", "a brass bugle with sun-rays, for Reveille"],
});
export const GENERAL_GOOSE_VISUAL_BIBLE = built.bible;
export const GENERAL_GOOSE_ART = built.art;
