import { characterDefinitionSchema, type CharacterDefinition } from "../../schemas/character";
import { passiveDefinitionSchema, type PassiveDefinition } from "../../schemas/passive";
import type { Ability } from "../../schemas/ability";
import { ALLY_SINGLE, ENEMY_SINGLE, ability, buildArt } from "./helpers";

// spec/03 #4 Legend AURELIA, EMPRESS OF THE SUN — an ultimate defensive support. Her Sun Guard stops an ally falling below 1 health for a short time; it delays death, it does not prevent it. docs/design/characters/aurelia.md

// Legend lever (spec/03): a special vulnerability. When the sun sets on her,
// every wound leaves her more exposed for a turn.
export const SETTING_SUN: PassiveDefinition = passiveDefinitionSchema.parse({
  id: "passive.aurelia.setting-sun",
  displayName: "Setting Sun",
  description: "Below half health, every wound leaves her more exposed for a turn.",
  trigger: { event: "onDamaged", relation: "self" },
  condition: { type: "hpBelowPercent", target: "self", percent: 50 },
  effects: [{ kind: "applyStatus", statusId: "status.damage-amplification", magnitude: 10, durationTurns: 1 }],
});

export const RADIANT_LANCE = ability({
  id: "ability.aurelia.radiant-lance",
  displayName: "Radiant Lance",
  description: "A spear of sunlight: 30 damage.",
  cost: { might: 2 },
  cooldown: 1,
  target: ENEMY_SINGLE,
  effects: [{ kind: "damage", amount: 30 }],
});
export const SOLAR_MEND = ability({
  id: "ability.aurelia.solar-mend",
  displayName: "Solar Mend",
  description: "Warm light closes wounds: heals an ally for 20.",
  cost: { spirit: 1 },
  cooldown: 1,
  target: ALLY_SINGLE,
  effects: [{ kind: "heal", healingClass: "heal", amount: 20 }],
});
export const SUNS_VIGIL = ability({
  id: "ability.aurelia.suns-vigil",
  displayName: "Sun's Vigil",
  description: "Another ally cannot fall below 1 health for 2 turns. It delays a death; it does not cancel it.",
  cost: { spirit: 2, focus: 1 },
  cooldown: 4,
  target: { side: "ally", scope: "single", count: 1, includeSelf: false, filterTags: [] },
  effects: [{ kind: "applyStatus", statusId: "status.sun-guard", durationTurns: 2 }],
});
export const ZENITH_AEGIS = ability({
  id: "ability.aurelia.zenith-aegis",
  displayName: "Zenith Aegis",
  description: "At high noon every ally cannot fall below 1 health for a turn. Extremely expensive.",
  cost: { spirit: 3, focus: 2 },
  cooldown: 6,
  target: { side: "ally", scope: "all", count: 1, includeSelf: true, filterTags: [] },
  effects: [{ kind: "applyStatus", statusId: "status.sun-guard", durationTurns: 1 }],
});

export const AURELIA_ABILITIES: Ability[] = [RADIANT_LANCE, SOLAR_MEND, SUNS_VIGIL, ZENITH_AEGIS];

export const AURELIA: CharacterDefinition = characterDefinitionSchema.parse({
  id: "aurelia",
  version: 1,
  displayName: "Aurelia, Empress of the Sun",
  rarity: "LEGENDARY",
  tags: ["LEGENDARY", "MYTHOLOGY", "SUPPORT", "DEFENDER"],
  baseHp: 140,
  abilityIds: AURELIA_ABILITIES.map((a) => a.id),
  passiveId: SETTING_SUN.id,
  artSpecId: "aurelia",
});

const built = buildArt({
  bible: {
    characterId: "aurelia",
    species: "a solar empress of a lost desert empire",
    ageRange: "ageless, apparently in her prime",
    face: "a serene, luminous face with golden eyes and a slight, patient smile",
    bodyType: "tall, upright and dignified",
    clothingArmor: "radiant gold plate over layers of flowing ceremonial cloth in white and saffron",
    weaponsProps: "a long sun-tipped spear and a floating halo of geometric sun fragments",
    markings: "fine gold inlay lines on the armour, with no religious symbols",
    silhouette: "a tall armoured figure crowned by a ring of floating geometric sun shards",
    signatureProps: ["a halo of sun shards", "flowing saffron cloth", "a sun-tipped spear"],
  },
  region: "Egyptian / Desert inspiration (sandstone, gold leaf, hieroglyph-free geometric borders, endless dunes)",
  visualTheme: "the sun that will not set on you",
  environment: "a vast desert throne terrace at high noon",
  lighting: "brilliant overhead sun with long gold rays",
  paletteConcept: "sun gold, saffron, ivory white, deep blue sky",
  avoid: ["any existing game's aurelia, empress of the sun design"],
  splashScene: "standing on a sunlit terrace with the halo of shards behind her and both hands on the spear",
  portraitScene: "a serene face with golden eyes lit from above",
  avatarScene: "close crop on the face and halo",
  iconScenes: ["a spear of light striking down, for Radiant Lance", "warm golden light closing over a small wound, for Solar Mend", "a golden ring of light around one figure, for Sun's Vigil", "a huge sun-disc blazing over a group, for Zenith Aegis"],
  legendRevealScene: "rising into the noon sky with the halo of sun shards blazing behind her and the whole desert lit gold",
});
export const AURELIA_VISUAL_BIBLE = built.bible;
export const AURELIA_ART = built.art;
