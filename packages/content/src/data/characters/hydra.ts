import { characterDefinitionSchema, defaultResourcesFor, type CharacterDefinition } from "../../schemas/character";
import { passiveDefinitionSchema, type PassiveDefinition } from "../../schemas/passive";
import type { Ability } from "../../schemas/ability";
import type { Resource } from "../../schemas/common";
import { ability, buildArt, ENEMY_ALL, ENEMY_SINGLE, SELF_ONLY } from "./helpers";

// spec/03 #9 HYDRA (Ancient Mediterranean) — the "heads" mechanic. More heads,
// harder hits; every wound costs a head; Regrow buys them back unless cauterized
// by Burn. docs/design/characters/hydra.md.

export const HEADS_RESOURCE: Resource = {
  id: "resource.heads",
  displayName: "Heads",
  startingValue: 3,
  min: 1,
  max: 5,
  visibleToOpponent: true,
  displayHint: "pips",
  trackMode: true,
};

// Any damage (including DoT ticks, which resolve as self-damage) costs a head,
// never below 1.
export const CUT_ONE_TWO_GROW: PassiveDefinition = passiveDefinitionSchema.parse({
  id: "passive.hydra.cut-one-two-grow",
  displayName: "Cut One, Two Grow",
  description: "Each time it is wounded it loses a head.",
  trigger: { event: "onDamaged", relation: "self" },
  effects: [
    {
      kind: "conditional",
      condition: { type: "resourceAtLeast", target: "self", resourceId: HEADS_RESOURCE.id, amount: 2 },
      ifTrue: [{ kind: "modifyResource", resourceId: HEADS_RESOURCE.id, amount: -1 }],
    },
  ],
});

const headsAtLeast = (amount: number) =>
  ({ type: "resourceAtLeast", target: "self", resourceId: HEADS_RESOURCE.id, amount }) as const;

export const SERPENT_BITE = ability({
  id: "ability.hydra.serpent-bite",
  displayName: "Serpent Bite",
  description: "Every head bites: damage rises with the number of heads.",
  cost: { might: 1, focus: 1 },
  target: ENEMY_SINGLE,
  effects: [
    {
      kind: "conditional",
      condition: headsAtLeast(5),
      ifTrue: [{ kind: "damage", amount: 40 }],
      ifFalse: [
        {
          kind: "conditional",
          condition: headsAtLeast(3),
          ifTrue: [{ kind: "damage", amount: 25 }],
          ifFalse: [{ kind: "damage", amount: 12 }],
        },
      ],
    },
  ],
});
export const VENOM_SPIT = ability({
  id: "ability.hydra.venom-spit",
  displayName: "Venom Spit",
  description: "Poisons an enemy.",
  cost: { chaos: 1 },
  cooldown: 1,
  target: ENEMY_SINGLE,
  effects: [{ kind: "applyStatus", statusId: "status.poison", magnitude: 5, durationTurns: 3 }],
});
export const MANY_MOUTHED_LUNGE = ability({
  id: "ability.hydra.many-mouthed-lunge",
  displayName: "Many-Mouthed Lunge",
  description: "Lashes every enemy at once.",
  cost: { might: 3 },
  cooldown: 3,
  target: ENEMY_ALL,
  effects: [{ kind: "damage", amount: 20 }],
});
// Burn cauterizes the stumps: no regrowth while burning.
export const REGROW = ability({
  id: "ability.hydra.regrow",
  displayName: "Regrow",
  description: "Grows two heads back and knits some flesh — unless the wounds are burning.",
  cost: { spirit: 2 },
  cooldown: 2,
  target: SELF_ONLY,
  effects: [
    {
      kind: "conditional",
      condition: { type: "not", condition: { type: "hasStatus", target: "self", statusId: "status.burn" } },
      ifTrue: [
        { kind: "modifyResource", resourceId: HEADS_RESOURCE.id, amount: 2 },
        { kind: "heal", healingClass: "heal", amount: 20 },
      ],
    },
  ],
});

export const HYDRA_ABILITIES: Ability[] = [SERPENT_BITE, VENOM_SPIT, MANY_MOUTHED_LUNGE, REGROW];

export const HYDRA: CharacterDefinition = characterDefinitionSchema.parse({
  id: "hydra",
  version: 1,
  displayName: "Hydra",
  rarity: "CORE",
  tags: ["BEAST", "MYTHOLOGY", "BRUISER"],
  baseHp: 150,
  abilityIds: HYDRA_ABILITIES.map((a) => a.id),
  passiveId: CUT_ONE_TWO_GROW.id,
  resources: [HEADS_RESOURCE],
  artSpecId: "hydra",
});
export const HYDRA_INITIAL_RESOURCES = defaultResourcesFor(HYDRA);

const built = buildArt({
  bible: {
    characterId: "hydra",
    species: "a many-headed marsh serpent of Mediterranean myth",
    ageRange: "ancient",
    face: "several narrow serpent heads with amber slit eyes",
    bodyType: "a thick coiled body on short clawed limbs",
    clothingArmor: "none — overlapping dark green scales",
    weaponsProps: "fangs dripping pale venom",
    markings: "weathered bronze-coloured scale ridges",
    silhouette: "a fan of serpent necks rising from a single mass",
    signatureProps: ["multiple serpent heads", "dripping venom"],
  },
  region: "Ancient Mediterranean (weathered bronze, marble, geometric borders)",
  visualTheme: "a swamp horror that punishes half-measures",
  environment: "a flooded ruined colonnade",
  lighting: "grey overcast light with green water reflections",
  paletteConcept: "deep green scales, weathered bronze, marsh grey",
  avoid: ["any existing game's Hydra design"],
  splashScene: "rearing from black water between broken marble columns, five heads fanned",
  portraitScene: "three serpent heads overlapping the frame, amber eyes fixed forward",
  avatarScene: "close crop on the central head",
  iconScenes: [
    "a fanged head striking, for Serpent Bite",
    "a drop of venom on a fang, for Venom Spit",
    "several heads lunging outward, for Many-Mouthed Lunge",
    "a stump sprouting two new necks, for Regrow",
  ],
});
export const HYDRA_VISUAL_BIBLE = built.bible;
export const HYDRA_ART = built.art;
