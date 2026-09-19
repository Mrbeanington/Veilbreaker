import { characterDefinitionSchema, defaultResourcesFor, type CharacterDefinition } from "../../schemas/character";
import type { Ability } from "../../schemas/ability";
import type { Resource, TargetRule } from "../../schemas/common";
import { ability, buildArt, ENEMY_SINGLE, SELF_ONLY } from "./helpers";

// spec/03 #24 NEKOMATA (Japanese Folklore) — a two-tailed cat that walks among
// the dead. Once a battle she can call a fallen ally back (a resurrection, the
// first character to target the fallen: TargetRule.includeDead).
// docs/design/characters/nekomata.md

export const SECOND_LIFE_RESOURCE: Resource = {
  id: "resource.second-life",
  displayName: "Second Life",
  startingValue: 1,
  min: 0,
  max: 1,
  visibleToOpponent: true,
  displayHint: "pips",
  trackMode: true,
};

const FALLEN_ALLY: TargetRule = { side: "ally", scope: "single", count: 1, includeSelf: false, includeDead: true, filterTags: [] };

export const CLAW_SWIPE = ability({
  id: "ability.nekomata.claw-swipe",
  displayName: "Claw Swipe",
  description: "A quick swipe: 20 damage.",
  cost: { might: 1 },
  target: ENEMY_SINGLE,
  effects: [{ kind: "damage", amount: 20 }],
});
export const CURSED_PURR = ability({
  id: "ability.nekomata.cursed-purr",
  displayName: "Cursed Purr",
  description: "10 damage, and the enemy is cursed for 3 turns.",
  cost: { chaos: 1 },
  cooldown: 2,
  target: ENEMY_SINGLE,
  effects: [
    { kind: "damage", amount: 10 },
    { kind: "applyStatus", statusId: "status.curse", durationTurns: 3 },
  ],
});
export const LICK_WOUNDS = ability({
  id: "ability.nekomata.lick-wounds",
  displayName: "Lick Wounds",
  description: "Grooms herself: heals 20.",
  cost: { spirit: 1 },
  cooldown: 2,
  target: SELF_ONLY,
  effects: [{ kind: "heal", healingClass: "heal", amount: 20 }],
});
export const RISE_AGAIN = ability({
  id: "ability.nekomata.rise-again",
  displayName: "Rise Again",
  description: "Calls a fallen ally back to their feet with 30% health. Once per battle.",
  cost: { spirit: 2, chaos: 1 },
  cooldown: 3,
  target: FALLEN_ALLY,
  effects: [
    {
      kind: "conditional",
      condition: { type: "resourceAtLeast", target: "self", resourceId: SECOND_LIFE_RESOURCE.id, amount: 1 },
      ifTrue: [
        { kind: "resurrect", healthPercent: 30 },
        { kind: "modifyResource", resourceId: SECOND_LIFE_RESOURCE.id, amount: -1, target: SELF_ONLY },
      ],
    },
  ],
});

export const NEKOMATA_ABILITIES: Ability[] = [CLAW_SWIPE, CURSED_PURR, LICK_WOUNDS, RISE_AGAIN];

export const NEKOMATA: CharacterDefinition = characterDefinitionSchema.parse({
  id: "nekomata",
  version: 1,
  displayName: "Nekomata",
  rarity: "RARE",
  tags: ["FOLKLORE", "BEAST", "CURSE", "NECROMANCER"],
  baseHp: 110,
  abilityIds: NEKOMATA_ABILITIES.map((a) => a.id),
  resources: [SECOND_LIFE_RESOURCE],
  artSpecId: "nekomata",
});
export const NEKOMATA_INITIAL_RESOURCES = defaultResourcesFor(NEKOMATA);

const built = buildArt({
  bible: {
    characterId: "nekomata",
    species: "an old two-tailed cat spirit of Japanese folklore",
    ageRange: "very old",
    face: "a lean grey cat's face with pale green eyes that never quite blink",
    bodyType: "a sleek cat, standing partly upright, with a long forked tail",
    clothingArmor: "a torn indigo scarf tied around her neck",
    weaponsProps: "long curved claws and two tails flickering with cold blue flame",
    markings: "a white patch over one eye",
    silhouette: "a lean cat standing on hind legs with two tails curling behind her",
    signatureProps: ["two tails", "cold blue flame", "an indigo scarf"],
  },
  region: "Japanese folklore inspiration (woodblock composition; cultural review required, OQ-12)",
  visualTheme: "a graveyard pet who has decided who gets another day",
  environment: "a moonlit graveyard with mossy stone markers",
  lighting: "cold moonlight with blue tail-fire",
  paletteConcept: "grey fur, indigo, moon white, cold-fire blue",
  avoid: ["any existing game's cat-spirit design"],
  splashScene: "standing over a grave marker with both tails lit blue and a pale figure stirring",
  portraitScene: "pale green eyes in the dark with a flicker of blue tail-fire",
  avatarScene: "close crop on the face and one lit tail",
  iconScenes: [
    "a claw raking across a stone, for Claw Swipe",
    "a curl of purple smoke around two eyes, for Cursed Purr",
    "a cat grooming a paw in moonlight, for Lick Wounds",
    "a hand rising from the earth into blue light, for Rise Again",
  ],
});
export const NEKOMATA_VISUAL_BIBLE = built.bible;
export const NEKOMATA_ART = built.art;
