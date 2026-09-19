import { characterDefinitionSchema, defaultResourcesFor, type CharacterDefinition } from "../../schemas/character";
import type { Ability } from "../../schemas/ability";
import type { Resource } from "../../schemas/common";
import { ability, buildArt, ENEMY_SINGLE, SELF_ONLY } from "./helpers";

// spec/03 #6 CYCLOPS BRONTES (Ancient Mediterranean) — thunder-smith of the
// forge. He stokes Heat with his hammer, and a hot forge makes his lightning
// certain; a cold one is a gamble. docs/design/characters/cyclops-brontes.md

export const HEAT_RESOURCE: Resource = {
  id: "resource.forge-heat",
  displayName: "Forge Heat",
  startingValue: 0,
  min: 0,
  max: 3,
  visibleToOpponent: true,
  displayHint: "pips",
  trackMode: true,
};

export const HAMMER_BLOW = ability({
  id: "ability.cyclops-brontes.hammer-blow",
  displayName: "Hammer Blow",
  description: "20 damage, and the forge grows hotter.",
  cost: { might: 1 },
  target: ENEMY_SINGLE,
  effects: [
    { kind: "damage", amount: 20 },
    { kind: "modifyResource", resourceId: HEAT_RESOURCE.id, amount: 1, target: SELF_ONLY },
  ],
});
export const STOKE_THE_FORGE = ability({
  id: "ability.cyclops-brontes.stoke-the-forge",
  displayName: "Stoke the Forge",
  description: "Pumps the bellows: two Heat.",
  cost: { spirit: 1 },
  cooldown: 2,
  target: SELF_ONLY,
  effects: [{ kind: "modifyResource", resourceId: HEAT_RESOURCE.id, amount: 2 }],
});
// A cold forge means an uncertain bolt; two Heat makes the lightning sure.
export const THUNDERBOLT = ability({
  id: "ability.cyclops-brontes.thunderbolt",
  displayName: "Thunderbolt",
  description: "With two Heat: a sure 70 damage (spends the Heat). Without it, a gamble of 20, 40 or 60.",
  cost: { might: 2, focus: 1 },
  cooldown: 2,
  target: ENEMY_SINGLE,
  effects: [
    {
      kind: "conditional",
      condition: { type: "resourceAtLeast", target: "self", resourceId: HEAT_RESOURCE.id, amount: 2 },
      ifTrue: [
        { kind: "damage", amount: 70 },
        { kind: "modifyResource", resourceId: HEAT_RESOURCE.id, amount: -2, target: SELF_ONLY },
      ],
      ifFalse: [
        {
          kind: "randomOutcome",
          outcome: {
            rerollable: false,
            branches: [
              { weight: 3, effects: [{ kind: "damage", amount: 20 }] },
              { weight: 2, effects: [{ kind: "damage", amount: 40 }] },
              { weight: 1, effects: [{ kind: "damage", amount: 60 }] },
            ],
          },
        },
      ],
    },
  ],
});
export const MOLTEN_SLAG = ability({
  id: "ability.cyclops-brontes.molten-slag",
  displayName: "Molten Slag",
  description: "Sprays burning slag: 10 damage and Burn.",
  cost: { chaos: 1 },
  cooldown: 3,
  target: ENEMY_SINGLE,
  effects: [
    { kind: "damage", amount: 10 },
    { kind: "applyStatus", statusId: "status.burn", magnitude: 10, durationTurns: 3 },
  ],
});

export const CYCLOPS_BRONTES_ABILITIES: Ability[] = [HAMMER_BLOW, STOKE_THE_FORGE, THUNDERBOLT, MOLTEN_SLAG];

export const CYCLOPS_BRONTES: CharacterDefinition = characterDefinitionSchema.parse({
  id: "cyclops-brontes",
  version: 1,
  displayName: "Cyclops Brontes",
  rarity: "CORE",
  tags: ["MYTHOLOGY", "ATTACKER", "BEAST"],
  baseHp: 140,
  abilityIds: CYCLOPS_BRONTES_ABILITIES.map((a) => a.id),
  resources: [HEAT_RESOURCE],
  artSpecId: "cyclops-brontes",
});
export const CYCLOPS_BRONTES_INITIAL_RESOURCES = defaultResourcesFor(CYCLOPS_BRONTES);

const built = buildArt({
  bible: {
    characterId: "cyclops-brontes",
    species: "a one-eyed giant smith of Mediterranean myth",
    ageRange: "middle-aged for his kind",
    face: "a broad soot-smeared face with one large central eye and a heavy brow",
    bodyType: "huge, barrel-chested, thick forearms scarred by sparks",
    clothingArmor: "a scorched leather apron and iron wrist guards",
    weaponsProps: "a great forge hammer and tongs holding a glowing bolt",
    markings: "burn scars in a lightning-fork pattern on his arms",
    silhouette: "a huge one-eyed figure with a hammer raised over an anvil",
    signatureProps: ["a great hammer", "a glowing bolt", "an anvil"],
  },
  region: "Ancient Mediterranean (weathered bronze, marble, geometric borders)",
  visualTheme: "a craftsman whose masterpieces are weapons of the sky",
  environment: "a cavern forge under a volcano's mouth",
  lighting: "furnace orange with white sparks",
  paletteConcept: "furnace orange, soot black, bronze, white-blue spark",
  avoid: ["any existing game's one-eyed giant design"],
  splashScene: "hammering a crackling bolt on an anvil, sparks filling the cavern",
  portraitScene: "the single eye lit orange by the forge, soot on his brow",
  avatarScene: "close crop on the eye and the hammer head",
  iconScenes: [
    "a hammer striking an anvil in sparks, for Hammer Blow",
    "a bellows blowing on coals, for Stoke the Forge",
    "a jagged bolt over a forge, for Thunderbolt",
    "a drop of glowing slag on stone, for Molten Slag",
  ],
});
export const CYCLOPS_BRONTES_VISUAL_BIBLE = built.bible;
export const CYCLOPS_BRONTES_ART = built.art;
