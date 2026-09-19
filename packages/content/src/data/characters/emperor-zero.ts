import { characterDefinitionSchema, type CharacterDefinition } from "../../schemas/character";
import { passiveDefinitionSchema, type PassiveDefinition } from "../../schemas/passive";
import { LAST_USED_ABILITY } from "../../schemas/effect";
import type { Ability } from "../../schemas/ability";
import { ability, buildArt, ENEMY_ALL, ENEMY_SINGLE, SELF_ONLY } from "./helpers";

// spec/03 Legend #11 EMPEROR ZERO — cooldown control and the near-removal of an
// enemy ability. docs/design/characters/emperor-zero.md

// "Near-removal": the enemy's most recently used ability is locked for six turns
// (ADR-015 `@lastUsed`). Not permanent, dispellable, and it only ever hits what
// they just used — so a throwaway last move is a decoy.
export const REVOKE = ability({
  id: "ability.emperor-zero.revoke",
  displayName: "Revoke",
  description: "Strikes an enemy's most recently used ability from the record for six turns.",
  cost: { focus: 2, chaos: 1 },
  cooldown: 5,
  target: ENEMY_SINGLE,
  effects: [{ kind: "applyStatus", statusId: "status.ability-lock", param: LAST_USED_ABILITY, durationTurns: 6 }],
});
export const COLD_LOGIC = ability({
  id: "ability.emperor-zero.cold-logic",
  displayName: "Cold Logic",
  description: "A precise strike that ignores flat defenses.",
  cost: { focus: 2 },
  target: ENEMY_SINGLE,
  effects: [{ kind: "damage", amount: 25, damageType: "piercing" }],
});
export const STASIS_FIELD = ability({
  id: "ability.emperor-zero.stasis-field",
  displayName: "Stasis Field",
  description: "Every enemy's cooldowns stop ticking for two turns.",
  cost: { focus: 1, spirit: 1 },
  cooldown: 3,
  target: ENEMY_ALL,
  effects: [{ kind: "applyStatus", statusId: "status.cooldown-increase", magnitude: 1, durationTurns: 2 }],
});
export const IRON_DECREE = ability({
  id: "ability.emperor-zero.iron-decree",
  displayName: "Iron Decree",
  description: "Ceramic plating: Damage Reduction 20 for two turns.",
  cost: { spirit: 1 },
  cooldown: 2,
  target: SELF_ONLY,
  effects: [{ kind: "applyStatus", statusId: "status.damage-reduction", magnitude: 20, durationTurns: 2 }],
});

// A hurt machine tries harder: below 40% every wound resets Revoke.
export const FAILSAFE_PROTOCOL: PassiveDefinition = passiveDefinitionSchema.parse({
  id: "passive.emperor-zero.failsafe-protocol",
  displayName: "Failsafe Protocol",
  description: "Below 40% health, each wound makes Revoke ready again.",
  trigger: { event: "onDamaged", relation: "self" },
  condition: { type: "hpBelowPercent", target: "self", percent: 40 },
  effects: [{ kind: "modifyCooldown", abilityId: REVOKE.id, mode: "set", amount: 0 }],
});

export const EMPEROR_ZERO_ABILITIES: Ability[] = [REVOKE, COLD_LOGIC, STASIS_FIELD, IRON_DECREE];

export const EMPEROR_ZERO: CharacterDefinition = characterDefinitionSchema.parse({
  id: "emperor-zero",
  version: 1,
  displayName: "Emperor Zero",
  rarity: "LEGENDARY",
  tags: ["LEGENDARY", "CONTROLLER"],
  baseHp: 130,
  abilityIds: EMPEROR_ZERO_ABILITIES.map((a) => a.id),
  passiveId: FAILSAFE_PROTOCOL.id,
  artSpecId: "emperor-zero",
});

const built = buildArt({
  bible: {
    characterId: "emperor-zero",
    species: "an ancient machine sovereign of black ceramic and aged metal",
    ageRange: "millennia old",
    face: "a smooth, expressionless ceramic mask with a single horizontal glyph-slit",
    bodyType: "tall, symmetrical and rigid",
    clothingArmor: "black ceramic plates over aged bronze-grey metal, with a stiff layered mantle",
    weaponsProps: "a slender rod of dark metal engraved with counting marks",
    markings: "glowing original mathematical glyphs in orderly rows across the chest and mask",
    silhouette: "a perfectly symmetrical crowned figure with a rigid, layered mantle",
    signatureProps: ["glowing mathematical glyphs", "engraved counting rod"],
  },
  region: "Invented machine-empire (ceramic, patinated metal, strict geometric borders)",
  visualTheme: "an empire that has been counting for so long it forgot why",
  environment: "an enormous silent hall of black ceramic columns with glowing tally marks",
  lighting: "cold amber-white glyph glow against deep black",
  paletteConcept: "matte black ceramic, aged bronze-grey, glyph amber-white",
  avoid: ["any existing game's robot emperor or sci-fi villain", "real-world numerals or scripts as glyphs"],
  splashScene: "seated upright on a black throne, rows of glyphs igniting one by one down his chest",
  portraitScene: "the blank ceramic mask lit by a single row of glyphs",
  avatarScene: "close crop on the mask and glowing slit",
  iconScenes: [
    "a glowing glyph struck through with a black line, for Revoke",
    "a single perfect line of light, for Cold Logic",
    "a frozen clock face inside a square field, for Stasis Field",
    "interlocking black plates, for Iron Decree",
  ],
  legendRevealScene: "the throne room igniting row by row until every glyph burns and the mask turns toward the viewer",
});
export const EMPEROR_ZERO_VISUAL_BIBLE = built.bible;
export const EMPEROR_ZERO_ART = built.art;
