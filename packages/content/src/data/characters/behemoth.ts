import { characterDefinitionSchema, type CharacterDefinition } from "../../schemas/character";
import { passiveDefinitionSchema, type PassiveDefinition } from "../../schemas/passive";
import type { Ability } from "../../schemas/ability";
import { ability, buildArt, ENEMY_ALL, ENEMY_SINGLE, SELF_ONLY } from "./helpers";

// spec/03 #6 Legend BEHEMOTH: ~220 HP, cannot receive healing. Balanced by
// heavy costs and long cooldowns; see docs/design/characters/behemoth.md.

// Re-applied every turn start (stack rule "refresh" makes it a no-op while
// held) — there are no innate statuses, and onTurnStart fires before any tier
// of turn 1, so no heal can ever land first.
export const PRIMORDIAL_HIDE: PassiveDefinition = passiveDefinitionSchema.parse({
  id: "passive.behemoth.primordial-hide",
  displayName: "Primordial Hide",
  description: "Nothing can mend this creature — but nothing has ever needed to.",
  trigger: { event: "onTurnStart", relation: "self" },
  effects: [{ kind: "applyStatus", statusId: "status.unhealable" }],
});

export const GORE = ability({
  id: "ability.behemoth.gore",
  displayName: "Gore",
  description: "A single crushing charge.",
  cost: { might: 3 },
  cooldown: 2,
  target: ENEMY_SINGLE,
  effects: [{ kind: "damage", amount: 50 }],
});
export const PRIMORDIAL_STOMP = ability({
  id: "ability.behemoth.primordial-stomp",
  displayName: "Primordial Stomp",
  description: "The ground answers, hitting every enemy.",
  cost: { might: 3, spirit: 1 },
  cooldown: 3,
  target: ENEMY_ALL,
  effects: [{ kind: "damage", amount: 30 }],
});
export const THICK_HIDE = ability({
  id: "ability.behemoth.thick-hide",
  displayName: "Thick Hide",
  description: "Hunkers down, blunting incoming blows.",
  cost: { might: 2 },
  cooldown: 3,
  target: SELF_ONLY,
  effects: [{ kind: "applyStatus", statusId: "status.damage-reduction", magnitude: 20, durationTurns: 2 }],
});
export const RAMPAGE = ability({
  id: "ability.behemoth.rampage",
  displayName: "Rampage",
  description: "Wounded, it becomes far more dangerous to everyone nearby.",
  cost: { might: 4, chaos: 1 },
  cooldown: 4,
  target: ENEMY_ALL,
  effects: [
    {
      kind: "conditional",
      condition: { type: "hpBelowPercent", target: "self", percent: 50 },
      ifTrue: [{ kind: "damage", amount: 50 }],
      ifFalse: [{ kind: "damage", amount: 20 }],
    },
  ],
});

export const BEHEMOTH_ABILITIES: Ability[] = [GORE, PRIMORDIAL_STOMP, THICK_HIDE, RAMPAGE];

export const BEHEMOTH: CharacterDefinition = characterDefinitionSchema.parse({
  id: "behemoth",
  version: 1,
  displayName: "Behemoth",
  rarity: "LEGENDARY",
  tags: ["LEGENDARY", "BEAST", "BRUISER"],
  baseHp: 220,
  abilityIds: BEHEMOTH_ABILITIES.map((a) => a.id),
  passiveId: PRIMORDIAL_HIDE.id,
  artSpecId: "behemoth",
});

const built = buildArt({
  bible: {
    characterId: "behemoth",
    species: "a primordial biological horror of prehistoric anatomy",
    ageRange: "older than the arena",
    face: "a small, dull-eyed head sunk into heavy bone plates",
    bodyType: "mountain-sized build compressed to arena scale",
    clothingArmor: "none — a stone-like hide serves as armor",
    weaponsProps: "tusks and a bone-plated tail",
    markings: "lichen and old fractures across the hide",
    silhouette: "a vast hunched mass with a ridge of bone plates",
    signatureProps: ["stone-like hide", "bone-plated tail"],
  },
  region: "Original / no single-culture inspiration",
  visualTheme: "scale: something too large for the arena that came anyway",
  environment: "a cracked arena floor, walls dwarfed behind it",
  lighting: "low hard side light emphasising mass",
  paletteConcept: "slate grey hide, lichen green, bone ivory",
  avoid: ["any existing kaiju or dinosaur franchise creature"],
  splashScene: "rising over the arena wall, the crowd's banners tiny against its flank",
  portraitScene: "the small dull eye and heavy brow plate filling the frame",
  avatarScene: "close crop on the eye and tusk",
  iconScenes: [
    "a tusk splitting stone, for Gore",
    "concentric ground cracks radiating outward, for Primordial Stomp",
    "layered stone plates closing, for Thick Hide",
    "a roaring silhouette with dust exploding around it, for Rampage",
  ],
  legendRevealScene: "the full body revealed at last as dust settles, a colossal ridge of bone against a burning dusk",
});
export const BEHEMOTH_VISUAL_BIBLE = built.bible;
export const BEHEMOTH_ART = built.art;
