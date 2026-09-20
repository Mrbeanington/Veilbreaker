import { characterDefinitionSchema, type CharacterDefinition } from "../../schemas/character";
import type { Ability } from "../../schemas/ability";
import { ability, buildArt, ENEMY_SINGLE, SELF_ONLY } from "./helpers";

// spec/03 #35 THE BIRCH WITCH (Slavic / Russian Night) — bark, bitter sap and
// switches. She bleeds her enemies and drinks what they lose.
// docs/design/characters/the-birch-witch.md

export const BIRCH_SWITCH = ability({
  id: "ability.the-birch-witch.birch-switch",
  displayName: "Birch Switch",
  description: "A lash of birch rods: 10 damage and Bleed.",
  cost: { focus: 1 },
  target: ENEMY_SINGLE,
  effects: [
    { kind: "damage", amount: 10 },
    { kind: "applyStatus", statusId: "status.bleed", magnitude: 5, durationTurns: 3 },
  ],
});
export const BITTER_SAP = ability({
  id: "ability.the-birch-witch.bitter-sap",
  displayName: "Bitter Sap",
  description: "A foul draught of sap: poison, and the enemy heals 10 less for 3 turns.",
  cost: { chaos: 1 },
  cooldown: 2,
  target: ENEMY_SINGLE,
  effects: [
    { kind: "applyStatus", statusId: "status.poison", magnitude: 5, durationTurns: 3 },
    { kind: "applyStatus", statusId: "status.healing-reduction", magnitude: 10, durationTurns: 3 },
  ],
});
export const SAP_DRAIN = ability({
  id: "ability.the-birch-witch.sap-drain",
  displayName: "Sap Drain",
  description: "Drinks from a bleeding enemy: 30 damage and she heals 20 (if it is bleeding); otherwise 10 damage.",
  cost: { spirit: 1, chaos: 1 },
  cooldown: 3,
  target: ENEMY_SINGLE,
  effects: [
    {
      kind: "conditional",
      condition: { type: "hasStatus", target: "target", statusId: "status.bleed" },
      ifTrue: [
        { kind: "damage", amount: 30 },
        { kind: "heal", healingClass: "lifeTransfer", amount: 20, target: SELF_ONLY },
      ],
      ifFalse: [{ kind: "damage", amount: 10 }],
    },
  ],
});
export const PAPER_BARK_SHELL = ability({
  id: "ability.the-birch-witch.paper-bark-shell",
  displayName: "Paper Bark Shell",
  description: "Peels a shell of white bark around herself: a shield of 30 for 3 turns.",
  cost: { spirit: 1 },
  cooldown: 3,
  target: SELF_ONLY,
  effects: [{ kind: "applyStatus", statusId: "status.shield", magnitude: 30, durationTurns: 3 }],
});

export const THE_BIRCH_WITCH_ABILITIES: Ability[] = [BIRCH_SWITCH, BITTER_SAP, SAP_DRAIN, PAPER_BARK_SHELL];

export const THE_BIRCH_WITCH: CharacterDefinition = characterDefinitionSchema.parse({
  id: "the-birch-witch",
  version: 1,
  displayName: "The Birch Witch",
  rarity: "RARE",
  tags: ["FOLKLORE", "MAGE", "CURSE", "ANTI-HEALER"],
  baseHp: 110,
  abilityIds: THE_BIRCH_WITCH_ABILITIES.map((a) => a.id),
  artSpecId: "the-birch-witch",
});

const built = buildArt({
  bible: {
    characterId: "the-birch-witch",
    species: "a forest witch of Slavic folklore",
    ageRange: "old and wiry",
    face: "a narrow pale face with sunken cheeks and pale birch-white eyebrows",
    bodyType: "thin and straight like a sapling",
    clothingArmor: "a layered dress of peeling white birch bark and grey linen",
    weaponsProps: "a bundle of birch switches and a small wooden cup",
    markings: "black birch-bark stripes along her arms",
    silhouette: "a thin white-clad figure among birch trunks holding a bundle of switches",
    signatureProps: ["birch switches", "peeling bark dress", "a wooden cup of sap"],
  },
  region: "Slavic folklore inspiration (deep forests, folk ornament geometry, wood carving)",
  visualTheme: "a grove that bleeds you slowly",
  environment: "a birch grove at dusk with black-and-white trunks",
  lighting: "flat grey twilight with white trunks glowing",
  paletteConcept: "birch white, bark black, sap amber, dark green",
  avoid: ["any existing game's tree-witch design"],
  splashScene: "standing among birch trunks with the switches raised and bark peeling around her",
  portraitScene: "a narrow pale face half hidden by a fold of bark",
  avatarScene: "close crop on the face and one switch",
  iconScenes: [
    "birch rods lashing in a cross, for Birch Switch",
    "a wooden cup of dark sap, for Bitter Sap",
    "a bleeding trunk with a cup beneath, for Sap Drain",
    "curling white bark closing like a shell, for Paper Bark Shell",
  ],
});
export const THE_BIRCH_WITCH_VISUAL_BIBLE = built.bible;
export const THE_BIRCH_WITCH_ART = built.art;
