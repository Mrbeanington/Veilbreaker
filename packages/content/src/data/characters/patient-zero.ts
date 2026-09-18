import { characterDefinitionSchema, defaultResourcesFor, type CharacterDefinition } from "../../schemas/character";
import { characterArtSpecSchema, characterVisualBibleSchema, composePrompt, type CharacterArtSpec, type CharacterVisualBible } from "../../schemas/art";
import { type Ability } from "../../schemas/ability";
import { passiveDefinitionSchema, type PassiveDefinition } from "../../schemas/passive";
import { transformationSchema, type Transformation } from "../../schemas/transformation";
import { type Resource } from "../../schemas/common";
import { ability, ENEMY_ALL, ENEMY_SINGLE } from "./helpers";

// spec/03 "PATIENT ZERO. Zombie Evolution character with at least one
// dramatic in-match evolution (→ The Infected → The Outbreak)." See
// docs/design/characters/patient-zero.md for the full breakdown, including
// why evolution is driven by a passive rather than by the (currently
// unwired — see docs/OPEN-QUESTIONS.md OQ-34) Transformation.trigger field.

export const OUTBREAK_PROGRESS_RESOURCE: Resource = {
  id: "resource.outbreak-progress",
  displayName: "Outbreak Progress",
  startingValue: 0,
  min: 0,
  max: 8,
  visibleToOpponent: true,
  displayHint: "bar",
  trackMode: true,
};

export const BITE = ability({
  id: "ability.patient-zero.bite",
  displayName: "Bite",
  description: "A hungry bite that leaves the wound infected.",
  cost: { might: 1, focus: 1 },
  target: ENEMY_SINGLE,
  effects: [
    { kind: "damage", amount: 15 },
    { kind: "applyStatus", statusId: "status.infection", magnitude: 5, stacks: 1, durationTurns: 4 },
  ],
});

export const FESTERING_WOUND = ability({
  id: "ability.patient-zero.festering-wound",
  displayName: "Festering Wound",
  description: "Digs the infection in deeper, piling on stacks.",
  cost: { might: 2 },
  cooldown: 1,
  target: ENEMY_SINGLE,
  effects: [
    { kind: "damage", amount: 10 },
    { kind: "applyStatus", statusId: "status.infection", magnitude: 5, stacks: 3, durationTurns: 4 },
  ],
});

export const SHAMBLING_GRASP = ability({
  id: "ability.patient-zero.shambling-grasp",
  displayName: "Shambling Grasp",
  description: "A crushing grip that saps the target's strength.",
  cost: { might: 2, focus: 1 },
  cooldown: 1,
  target: ENEMY_SINGLE,
  effects: [
    { kind: "damage", amount: 20 },
    { kind: "applyStatus", statusId: "status.weakness", magnitude: 10, durationTurns: 2 },
  ],
});

// spec/03's own phrase for this character's mechanic: "Infection spreading."
export const OUTBREAK_PULSE = ability({
  id: "ability.patient-zero.outbreak-pulse",
  displayName: "Outbreak Pulse",
  description: "The infection lashes outward, spreading to everyone nearby.",
  cost: { might: 2, spirit: 1 },
  cooldown: 2,
  target: ENEMY_ALL,
  effects: [
    { kind: "damage", amount: 15 },
    { kind: "applyStatus", statusId: "status.infection", magnitude: 5, stacks: 2, durationTurns: 4 },
  ],
});

// The Outbreak's replacement finisher (see the transformation below) —
// stronger, and infects on a bigger scale, matching "at least one dramatic
// in-match evolution" with a real kit change at the final stage, not just a
// stat bump.
export const CATACLYSMIC_SPREAD = ability({
  id: "ability.patient-zero.the-outbreak.cataclysmic-spread",
  displayName: "Cataclysmic Spread",
  description: "The outbreak reaches its terminal stage, and everyone nearby pays for it.",
  cost: { might: 2, spirit: 1 },
  cooldown: 2,
  target: ENEMY_ALL,
  effects: [
    { kind: "damage", amount: 25 },
    { kind: "applyStatus", statusId: "status.infection", magnitude: 8, stacks: 3, durationTurns: 4 },
  ],
});

// docs/design/characters/patient-zero.md: every attack he lands builds
// Outbreak Progress and checks the evolution thresholds — this doubles as
// his "passive" and his auto-evolution trigger, since a character only has
// one passive slot (CharacterRuntimeState.passiveId) and Transformation's own
// `trigger` field isn't automatically evaluated by the engine (OQ-34). The
// highest threshold is checked first so reaching The Outbreak never regresses
// him back to The Infected on a later hit.
export const THE_HUNGER_GROWS: PassiveDefinition = passiveDefinitionSchema.parse({
  id: "passive.patient-zero.the-hunger-grows",
  displayName: "The Hunger Grows",
  description: "Every hit he lands feeds the outbreak. At 4 progress he becomes The Infected; at 8, The Outbreak.",
  trigger: { event: "onDamageDealt", relation: "self", effectTarget: "self" },
  effects: [
    { kind: "modifyResource", resourceId: OUTBREAK_PROGRESS_RESOURCE.id, amount: 1 },
    {
      kind: "conditional",
      condition: { type: "resourceAtLeast", target: "self", resourceId: OUTBREAK_PROGRESS_RESOURCE.id, amount: 8 },
      ifTrue: [{ kind: "transformInto", transformationId: "transformation.patient-zero.to-the-outbreak" }],
      ifFalse: [
        {
          kind: "conditional",
          condition: { type: "resourceAtLeast", target: "self", resourceId: OUTBREAK_PROGRESS_RESOURCE.id, amount: 4 },
          ifTrue: [{ kind: "transformInto", transformationId: "transformation.patient-zero.to-the-infected" }],
        },
      ],
    },
  ],
});

export const TO_THE_INFECTED: Transformation = transformationSchema.parse({
  id: "transformation.patient-zero.to-the-infected",
  characterId: "patient-zero",
  fromStageId: null,
  toStageId: "the-infected",
  trigger: { type: "resourceAtLeast", target: "self", resourceId: OUTBREAK_PROGRESS_RESOURCE.id, amount: 4 },
  changes: { displayName: "Patient Zero, the Infected", maxHp: 140 },
});

export const TO_THE_OUTBREAK: Transformation = transformationSchema.parse({
  id: "transformation.patient-zero.to-the-outbreak",
  characterId: "patient-zero",
  fromStageId: "the-infected",
  toStageId: "the-outbreak",
  trigger: { type: "resourceAtLeast", target: "self", resourceId: OUTBREAK_PROGRESS_RESOURCE.id, amount: 8 },
  changes: {
    displayName: "The Outbreak",
    maxHp: 180,
    abilityIds: [BITE.id, FESTERING_WOUND.id, SHAMBLING_GRASP.id, CATACLYSMIC_SPREAD.id],
  },
});

export const PATIENT_ZERO_ABILITIES: Ability[] = [BITE, FESTERING_WOUND, SHAMBLING_GRASP, OUTBREAK_PULSE, CATACLYSMIC_SPREAD];
export const PATIENT_ZERO_TRANSFORMATIONS: Transformation[] = [TO_THE_INFECTED, TO_THE_OUTBREAK];

export const PATIENT_ZERO: CharacterDefinition = characterDefinitionSchema.parse({
  id: "patient-zero",
  version: 1,
  displayName: "Patient Zero",
  rarity: "CORE",
  tags: ["UNDEAD", "EVOLUTION"],
  baseHp: 110,
  abilityIds: [BITE.id, FESTERING_WOUND.id, SHAMBLING_GRASP.id, OUTBREAK_PULSE.id],
  passiveId: THE_HUNGER_GROWS.id,
  resources: [OUTBREAK_PROGRESS_RESOURCE],
  transformationIds: PATIENT_ZERO_TRANSFORMATIONS.map((t) => t.id),
  artSpecId: "patient-zero",
});

export const PATIENT_ZERO_INITIAL_RESOURCES = defaultResourcesFor(PATIENT_ZERO);

export const PATIENT_ZERO_VISUAL_BIBLE: CharacterVisualBible = characterVisualBibleSchema.parse({
  characterId: "patient-zero",
  baseArtSpecId: "patient-zero",
  species: "a reanimated zombie, patient zero of an original plague",
  ageRange: "died in early adulthood, appearance frozen since",
  face: "sunken eyes, greyed skin, an expression caught between hunger and hollow grief",
  bodyType: "gaunt and shambling, stronger than the frame suggests",
  clothingArmor: "tattered original hospital-gown-like wrappings, no real-world medical branding",
  weaponsProps: "none — bites and grasping hands are the whole kit",
  markings: "spreading dark infection veins visible beneath greyed skin",
  silhouette: "a stooped, shambling humanoid outline",
  signatureProps: ["spreading infection veins", "tattered original wrappings"],
});

export const PATIENT_ZERO_ART: CharacterArtSpec = characterArtSpecSchema.parse({
  characterId: "patient-zero",
  region: "Original / no single-culture inspiration",
  visualTheme: "the origin point of a spreading plague, still tragically human underneath",
  environment: "a fog-choked quarantine ward bleeding into the arena",
  lighting: "sickly green-grey undertone with a single cold highlight",
  paletteConcept: "greyed skin, infection-vein green, faded hospital-wrap beige",
  colorPalette: ["greyed skin", "infection-vein green", "faded beige"],
  avoid: ["any existing zombie-franchise character or logo", "real medical branding", "gore played for shock rather than dread"],
  splashPrompt: composePrompt(
    PATIENT_ZERO_VISUAL_BIBLE,
    "splash",
    "shambling forward through fog at the edge of the arena, dark infection veins glowing faintly along greyed skin",
  ),
  portraitPrompt: composePrompt(PATIENT_ZERO_VISUAL_BIBLE, "portrait", "hollow stare directly at the camera, infection veins faintly visible at the temple"),
  battleAvatarPrompt: composePrompt(PATIENT_ZERO_VISUAL_BIBLE, "battleAvatar", "close crop, head slightly lowered"),
  abilityIconPrompts: [
    composePrompt(PATIENT_ZERO_VISUAL_BIBLE, "abilityIcon", "a bite mark radiating dark infection lines, for the ability Bite"),
    composePrompt(PATIENT_ZERO_VISUAL_BIBLE, "abilityIcon", "a wound splitting open with spreading dark veins, for the ability Festering Wound"),
    composePrompt(PATIENT_ZERO_VISUAL_BIBLE, "abilityIcon", "a grasping greyed hand draining color from what it grips, for the ability Shambling Grasp"),
    composePrompt(PATIENT_ZERO_VISUAL_BIBLE, "abilityIcon", "infection veins bursting outward in a radial pulse, for the ability Outbreak Pulse"),
  ],
  transformationPrompts: [
    composePrompt(
      PATIENT_ZERO_VISUAL_BIBLE,
      "transformation",
      "mid-transformation into The Infected — infection veins now fully luminous, posture more feral, torn wrappings falling away",
    ),
    composePrompt(
      PATIENT_ZERO_VISUAL_BIBLE,
      "transformation",
      "fully transformed into The Outbreak — skin nearly consumed by luminous infection, surrounded by a haze of spreading spores",
    ),
  ],
});
