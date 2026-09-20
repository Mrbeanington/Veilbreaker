import { characterDefinitionSchema, type CharacterDefinition } from "../../schemas/character";
import { passiveDefinitionSchema, type PassiveDefinition } from "../../schemas/passive";
import type { Ability } from "../../schemas/ability";
import type { Resource } from "../../schemas/common";
import { ENEMY_ALL, ENEMY_SINGLE, SELF_ONLY, ability, buildArt } from "./helpers";

// spec/03 #107 JOHNNY FEEDBACK (Music / Entertainment / Chaos) — a supernatural punk guitarist who builds Feedback. High Feedback boosts his damage, and at the cap every note he plays hurts him. docs/design/characters/johnny-feedback.md

export const FEEDBACK_RESOURCE: Resource = {
  id: "resource.feedback",
  displayName: "Feedback",
  startingValue: 0,
  min: 0,
  max: 5,
  visibleToOpponent: true,
  displayHint: "pips",
  trackMode: true,
};

export const AMP_IT_UP: PassiveDefinition = passiveDefinitionSchema.parse({
  id: "passive.johnny-feedback.amp-it-up",
  displayName: "Amp It Up",
  description: "Every ability he uses adds a Feedback (max 5). At the maximum, every ability also hurts him for 10.",
  trigger: { event: "onAbilityUsed", relation: "self", effectTarget: "self" },
  effects: [
    { kind: "modifyResource", resourceId: FEEDBACK_RESOURCE.id, amount: 1 },
    {
      kind: "conditional",
      condition: { type: "resourceAtLeast", target: "self", resourceId: FEEDBACK_RESOURCE.id, amount: 5 },
      ifTrue: [{ kind: "damage", amount: 10, damageType: "affliction", target: SELF_ONLY }],
    },
  ],
});

export const POWER_CHORD = ability({
  id: "ability.johnny-feedback.power-chord",
  displayName: "Power Chord",
  description: "A crunching chord: 20 damage, or 40 with 2 or more Feedback.",
  cost: { might: 1 },
  target: ENEMY_SINGLE,
  effects: [
    {
      kind: "conditional",
      condition: { type: "resourceAtLeast", target: "self", resourceId: FEEDBACK_RESOURCE.id, amount: 2 },
      ifTrue: [{ kind: "damage", amount: 40 }],
      ifFalse: [{ kind: "damage", amount: 20 }],
    },
  ],
});
export const WALL_OF_SOUND = ability({
  id: "ability.johnny-feedback.wall-of-sound",
  displayName: "Wall of Sound",
  description: "The amps roar: 10 damage to every enemy, or 30 with 3 or more Feedback.",
  cost: { might: 2, chaos: 1 },
  cooldown: 2,
  target: ENEMY_ALL,
  effects: [
    {
      kind: "conditional",
      condition: { type: "resourceAtLeast", target: "self", resourceId: FEEDBACK_RESOURCE.id, amount: 3 },
      ifTrue: [{ kind: "damage", amount: 30 }],
      ifFalse: [{ kind: "damage", amount: 10 }],
    },
  ],
});
export const CUT_THE_AMP = ability({
  id: "ability.johnny-feedback.cut-the-amp",
  displayName: "Cut the Amp",
  description: "Kills the noise: all Feedback is spent and he heals 10.",
  cost: { spirit: 1 },
  cooldown: 2,
  target: SELF_ONLY,
  effects: [{ kind: "modifyResource", resourceId: FEEDBACK_RESOURCE.id, amount: -5, target: SELF_ONLY }, { kind: "heal", healingClass: "heal", amount: 10 }],
});
export const CROWD_SURF = ability({
  id: "ability.johnny-feedback.crowd-surf",
  displayName: "Crowd Surf",
  description: "Rides the crowd away: untargetable for a turn.",
  cost: { focus: 1 },
  cooldown: 3,
  target: SELF_ONLY,
  effects: [{ kind: "applyStatus", statusId: "status.untargetable", durationTurns: 1 }],
});

export const JOHNNY_FEEDBACK_ABILITIES: Ability[] = [POWER_CHORD, WALL_OF_SOUND, CUT_THE_AMP, CROWD_SURF];

export const JOHNNY_FEEDBACK: CharacterDefinition = characterDefinitionSchema.parse({
  id: "johnny-feedback",
  version: 1,
  displayName: "Johnny Feedback",
  rarity: "RARE",
  tags: ["MUSIC", "ATTACKER", "MAGE"],
  baseHp: 120,
  abilityIds: JOHNNY_FEEDBACK_ABILITIES.map((a) => a.id),
  passiveId: AMP_IT_UP.id,
  resources: [FEEDBACK_RESOURCE],
  artSpecId: "johnny-feedback",
});

const built = buildArt({
  bible: {
    characterId: "johnny-feedback",
    species: "a supernatural punk guitarist of stage legend",
    ageRange: "a man in his late twenties",
    face: "a sneering, sweaty face with a mohawk of sharp blue spikes and heavy black eyeliner",
    bodyType: "wiry and restless",
    clothingArmor: "a studded black leather vest over a torn band-less T-shirt, ripped jeans and battered boots",
    weaponsProps: "a scarred electric guitar with a cracked body and a cable that trails off into the dark",
    markings: "electric-blue crackles running along the forearms and neck",
    silhouette: "a wiry spiky-haired figure leaning back with a guitar and a cable trailing behind",
    signatureProps: ["a cracked electric guitar", "a spiked blue mohawk", "a studded vest"],
  },
  region: "Stage, studio and street-theatre inspiration (spotlights, patched amps, greasepaint, checkered kitchens, neon and cardboard sets)",
  visualTheme: "louder is truer",
  environment: "a dive-bar stage with a wall of battered amps",
  lighting: "hot stage lights and blue static sparks",
  paletteConcept: "amp black, static blue, stage red, leather brown",
  avoid: ["any existing game's johnny feedback design"],
  splashScene: "mid-power-chord with static arcing off the guitar and the amp wall glowing behind him",
  portraitScene: "a sneering face with blue spikes and heavy eyeliner",
  avatarScene: "close crop on the mohawk and sneer",
  iconScenes: ["a guitar neck with a chord shape in sparks, for Power Chord", "a wall of amps blasting sound-rings, for Wall of Sound", "a hand pulling out a guitar cable, for Cut the Amp", "a figure held up on a sea of hands, for Crowd Surf"],
});
export const JOHNNY_FEEDBACK_VISUAL_BIBLE = built.bible;
export const JOHNNY_FEEDBACK_ART = built.art;
