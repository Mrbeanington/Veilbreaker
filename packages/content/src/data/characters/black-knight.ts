import { characterDefinitionSchema, type CharacterDefinition } from "../../schemas/character";
import { passiveDefinitionSchema, type PassiveDefinition } from "../../schemas/passive";
import type { Ability } from "../../schemas/ability";
import { ability, buildArt, ENEMY_SINGLE, SELF_ONLY } from "./helpers";

// spec/03 Legend #8 THE BLACK KNIGHT — the anti-Legend. Ordinary against
// ordinary opponents; dangerous to anything tagged LEGENDARY (ADR-015: `hasTag`
// now works). docs/design/characters/black-knight.md

const targetIsLegend = { type: "hasTag", target: "target", tag: "LEGENDARY" } as const;

export const COLD_BLADE = ability({
  id: "ability.black-knight.cold-blade",
  displayName: "Cold Blade",
  description: "A heavy cut. Bites far deeper into a Legend.",
  cost: { might: 2 },
  target: ENEMY_SINGLE,
  effects: [
    {
      kind: "conditional",
      condition: targetIsLegend,
      ifTrue: [{ kind: "damage", amount: 55 }],
      ifFalse: [{ kind: "damage", amount: 30 }],
    },
  ],
});
export const BLACKENED_GUARD = ability({
  id: "ability.black-knight.blackened-guard",
  displayName: "Blackened Guard",
  description: "Sets his armor against the next blows.",
  cost: { might: 1, spirit: 1 },
  cooldown: 2,
  target: SELF_ONLY,
  effects: [{ kind: "applyStatus", statusId: "status.damage-reduction", magnitude: 20, durationTurns: 2 }],
});
export const OATHBREAKER = ability({
  id: "ability.black-knight.oathbreaker",
  displayName: "Oathbreaker",
  description: "Silences a Legend so its power cannot be spoken. Against anyone else it is just a blow.",
  cost: { might: 2, focus: 1 },
  cooldown: 3,
  target: ENEMY_SINGLE,
  effects: [
    {
      kind: "conditional",
      condition: targetIsLegend,
      ifTrue: [
        { kind: "damage", amount: 30 },
        { kind: "applyStatus", statusId: "status.silence", durationTurns: 1 },
      ],
      ifFalse: [{ kind: "damage", amount: 20 }],
    },
  ],
});
export const SWORD_PLANTED = ability({
  id: "ability.black-knight.sword-planted",
  displayName: "Sword Planted",
  description: "Plants his blade and dares the enemy to come at him.",
  cost: { spirit: 2 },
  cooldown: 4,
  target: SELF_ONLY,
  effects: [{ kind: "applyStatus", statusId: "status.taunt", durationTurns: 2 }],
});

// Whenever a Legend wounds him he hardens against the next blows.
export const LEGEND_SLAYERS_RESOLVE: PassiveDefinition = passiveDefinitionSchema.parse({
  id: "passive.black-knight.slayers-resolve",
  displayName: "Slayer's Resolve",
  description: "When a Legend hurts him, he hardens: Damage Reduction 10 for two turns.",
  trigger: { event: "onDamaged", relation: "self" },
  condition: { type: "hasTag", target: "source", tag: "LEGENDARY" },
  effects: [{ kind: "applyStatus", statusId: "status.damage-reduction", magnitude: 10, durationTurns: 2 }],
});

export const BLACK_KNIGHT_ABILITIES: Ability[] = [COLD_BLADE, BLACKENED_GUARD, OATHBREAKER, SWORD_PLANTED];

export const BLACK_KNIGHT: CharacterDefinition = characterDefinitionSchema.parse({
  id: "black-knight",
  version: 1,
  displayName: "The Black Knight",
  rarity: "LEGENDARY",
  tags: ["LEGENDARY", "WARRIOR", "DEFENDER"],
  baseHp: 150,
  abilityIds: BLACK_KNIGHT_ABILITIES.map((a) => a.id),
  passiveId: LEGEND_SLAYERS_RESOLVE.id,
  artSpecId: "black-knight",
});

const built = buildArt({
  bible: {
    characterId: "black-knight",
    species: "an unidentifiable armored warrior; nothing of the person inside is visible",
    ageRange: "unknowable",
    face: "a blank, unmarked black visor with no eye slits",
    bodyType: "tall, broad and rigidly upright",
    clothingArmor: "nearly featureless blackened plate armor with cracked seams",
    weaponsProps: "an enormous weathered greatsword planted point-down",
    markings: "cracked pale light leaking through every seam of the armor",
    silhouette: "a towering armored figure leaning on a huge sword",
    signatureProps: ["enormous weathered sword", "seams of cracked pale light"],
  },
  region: "Timeless medieval-inspired (no specific heraldry)",
  visualTheme: "an old duty that outlived every reason for it",
  environment: "a windswept ruined causeway under a grey sky",
  lighting: "flat grey daylight, with the seams of the armor glowing faintly",
  paletteConcept: "blackened steel, ash grey, cracked pale white light",
  avoid: ["any existing game's Black Knight or dark-armor knight design", "any heraldic device"],
  splashScene: "standing on a ruined causeway, sword planted, pale light bleeding from every seam",
  portraitScene: "the blank visor turned toward the viewer, cracks of light across the brow",
  avatarScene: "close crop on the visor and one shoulder",
  iconScenes: [
    "a black blade cutting across a golden crown, for Cold Blade",
    "layered black plates locking together, for Blackened Guard",
    "a broken chain around a sealed mouth, for Oathbreaker",
    "a great sword driven into stone, for Sword Planted",
  ],
  legendRevealScene: "rising from a kneeling stance beside his planted sword as pale light splits the armor's seams",
});
export const BLACK_KNIGHT_VISUAL_BIBLE = built.bible;
export const BLACK_KNIGHT_ART = built.art;
