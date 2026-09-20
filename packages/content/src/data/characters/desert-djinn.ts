import { characterDefinitionSchema, type CharacterDefinition } from "../../schemas/character";
import type { Ability } from "../../schemas/ability";
import { ALLY_SINGLE, ENEMY_ALL, ENEMY_SINGLE, ability, buildArt } from "./helpers";

// spec/03 #57 DESERT DJINN (Egypt / Desert) — a wish-granting spirit of the whirlwind. Its wishes come true, and never quite as asked. docs/design/characters/desert-djinn.md

export const SANDSTORM = ability({
  id: "ability.desert-djinn.sandstorm",
  displayName: "Sandstorm",
  description: "A scouring wind: 10 damage to every enemy.",
  cost: { spirit: 1 },
  cooldown: 1,
  target: ENEMY_ALL,
  effects: [{ kind: "damage", amount: 10 }],
});
export const GRANT_A_WISH = ability({
  id: "ability.desert-djinn.grant-a-wish",
  displayName: "Grant a Wish",
  description: "Grants an ally a wish at random: a shield of 30, a heal of 30, or Damage Reduction 20.",
  cost: { spirit: 2 },
  cooldown: 2,
  target: ALLY_SINGLE,
  effects: [
    {
      kind: "randomOutcome",
      outcome: {
        rerollable: false,
        branches: [
          { weight: 1, effects: [{ kind: "applyStatus", statusId: "status.shield", magnitude: 30, durationTurns: 3 }] },
          { weight: 1, effects: [{ kind: "heal", healingClass: "heal", amount: 30 }] },
          { weight: 1, effects: [{ kind: "applyStatus", statusId: "status.damage-reduction", magnitude: 20, durationTurns: 2 }] },
        ],
      },
    },
  ],
});
export const TWISTED_WISH = ability({
  id: "ability.desert-djinn.twisted-wish",
  displayName: "Twisted Wish",
  description: "Grants an enemy a wish at random, badly: 40 damage, a stun for a turn, or a heal of 20.",
  cost: { focus: 1, chaos: 1 },
  cooldown: 3,
  target: ENEMY_SINGLE,
  effects: [
    {
      kind: "randomOutcome",
      outcome: {
        rerollable: false,
        branches: [
          { weight: 1, effects: [{ kind: "heal", healingClass: "heal", amount: 20 }] },
          { weight: 1, effects: [{ kind: "applyStatus", statusId: "status.stun", durationTurns: 1 }] },
          { weight: 1, effects: [{ kind: "damage", amount: 40 }] },
        ],
      },
    },
  ],
});
export const WHIRLWIND_LIFT = ability({
  id: "ability.desert-djinn.whirlwind-lift",
  displayName: "Whirlwind Lift",
  description: "Sweeps an ally up in a whirlwind: untargetable for a turn.",
  cost: { spirit: 1 },
  cooldown: 4,
  target: ALLY_SINGLE,
  effects: [{ kind: "applyStatus", statusId: "status.untargetable", durationTurns: 1 }],
});

export const DESERT_DJINN_ABILITIES: Ability[] = [SANDSTORM, GRANT_A_WISH, TWISTED_WISH, WHIRLWIND_LIFT];

export const DESERT_DJINN: CharacterDefinition = characterDefinitionSchema.parse({
  id: "desert-djinn",
  version: 1,
  displayName: "Desert Djinn",
  rarity: "RARE",
  tags: ["MYTHOLOGY", "MAGE", "RANDOM"],
  baseHp: 100,
  abilityIds: DESERT_DJINN_ABILITIES.map((a) => a.id),
  artSpecId: "desert-djinn",
});

const built = buildArt({
  bible: {
    characterId: "desert-djinn",
    species: "a genie of desert whirlwind and smokeless fire",
    ageRange: "ageless",
    face: "a smiling, sharp-featured face with glowing white eyes",
    bodyType: "a lithe upper body that trails into a spiralling column of sand",
    clothingArmor: "silk sashes, gold armlets and a jewelled turban",
    weaponsProps: "a small brass lamp and swirling ribbons of sand",
    markings: "gold rings of glowing script-free geometric patterns on the forearms",
    silhouette: "a smiling figure rising from a swirling sand column with a lamp in one hand",
    signatureProps: ["a brass lamp", "a sand whirlwind", "gold armlets"],
  },
  region: "Egyptian / Desert inspiration (sandstone, gold leaf, hieroglyph-free geometric borders, endless dunes)",
  visualTheme: "a wish is a trap with good manners",
  environment: "a dune-top at dusk with a whirlwind rising",
  lighting: "warm sunset glow with blowing sand",
  paletteConcept: "dusk orange, brass gold, sand, smoke violet",
  avoid: ["any existing game's desert djinn design"],
  splashScene: "rising from a spiralling sand column holding the lamp with a wide clever grin",
  portraitScene: "a grinning face with white glowing eyes in swirling sand",
  avatarScene: "close crop on the grin and turban",
  iconScenes: ["a swirling sand cone, for Sandstorm", "a lamp with a gift-wrapped glow, for Grant a Wish", "a lamp with a crooked, mischievous glow, for Twisted Wish", "a small figure lifted inside a sand-whirl, for Whirlwind Lift"],
});
export const DESERT_DJINN_VISUAL_BIBLE = built.bible;
export const DESERT_DJINN_ART = built.art;
