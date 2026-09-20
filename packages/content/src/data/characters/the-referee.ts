import { characterDefinitionSchema, defaultResourcesFor, type CharacterDefinition } from "../../schemas/character";
import { passiveDefinitionSchema, type PassiveDefinition } from "../../schemas/passive";
import type { Ability } from "../../schemas/ability";
import type { Effect } from "../../schemas/effect";
import type { Resource } from "../../schemas/common";
import { ability, buildArt, ENEMY_SINGLE, SELF_ONLY } from "./helpers";

// spec/03 #105 THE REFEREE [SECRET] — Fouls and ejection. Anyone who leans on
// the same ability twice in a row draws a Foul; the third Foul is an ejection.
// docs/design/characters/the-referee.md

// The Foul count lives on the OFFENDER (resources are per character), so the
// ledger follows the player who is being fouled, not the Referee.
export const FOULS_RESOURCE: Resource = {
  id: "resource.fouls",
  displayName: "Fouls",
  startingValue: 0,
  min: 0,
  max: 3,
  visibleToOpponent: true,
  displayHint: "pips",
  trackMode: true,
};

// Ejection: the offender is sent off for two turns and the ledger is wiped.
const EJECT: Effect[] = [
  { kind: "applyStatus", statusId: "status.stun", durationTurns: 2 },
  { kind: "modifyResource", resourceId: FOULS_RESOURCE.id, amount: -3 },
];

// Adds a Foul to the target and ejects on the third. `target: "target"` in the
// condition is the offender (the trigger's subject, or the ability's target).
const CALL_FOUL: Effect[] = [
  { kind: "modifyResource", resourceId: FOULS_RESOURCE.id, amount: 1 },
  {
    kind: "conditional",
    condition: { type: "resourceAtLeast", target: "target", resourceId: FOULS_RESOURCE.id, amount: 3 },
    ifTrue: EJECT,
  },
];

export const PLAY_ON_THE_WHISTLE: PassiveDefinition = passiveDefinitionSchema.parse({
  id: "passive.the-referee.play-the-whistle",
  displayName: "Play the Whistle",
  description: "Any enemy who uses the same ability twice in a row is called for a Foul. Three Fouls is an ejection.",
  trigger: { event: "onAbilityUsed", relation: "enemy" },
  condition: { type: "repeatedAbility", target: "target" },
  effects: CALL_FOUL,
  knowledgeLevel: "DISCOVERABLE",
});

export const BLOW_THE_WHISTLE = ability({
  id: "ability.the-referee.blow-the-whistle",
  displayName: "Blow the Whistle",
  description: "A sharp blast.",
  cost: { focus: 1 },
  target: ENEMY_SINGLE,
  effects: [{ kind: "damage", amount: 30 }],
});
export const PENALTY_FLAG = ability({
  id: "ability.the-referee.penalty-flag",
  displayName: "Penalty Flag",
  description: "Calls a Foul on an enemy, whatever they did.",
  cost: { focus: 1, spirit: 1 },
  cooldown: 2,
  target: ENEMY_SINGLE,
  effects: CALL_FOUL,
});
export const RED_CARD = ability({
  id: "ability.the-referee.red-card",
  displayName: "Red Card",
  description: "Ejects an enemy that already has 2 Fouls. Otherwise it adds a Foul.",
  cost: { might: 1, focus: 2 },
  cooldown: 4,
  target: ENEMY_SINGLE,
  effects: [
    {
      kind: "conditional",
      condition: { type: "resourceAtLeast", target: "target", resourceId: FOULS_RESOURCE.id, amount: 2 },
      ifTrue: EJECT,
      ifFalse: [{ kind: "modifyResource", resourceId: FOULS_RESOURCE.id, amount: 1 }],
    },
  ],
});
export const OVERRULE = ability({
  id: "ability.the-referee.overrule",
  displayName: "Overrule",
  description: "The call stands: a shield for two turns.",
  cost: { focus: 2 },
  cooldown: 3,
  target: SELF_ONLY,
  effects: [{ kind: "applyStatus", statusId: "status.shield", magnitude: 30, durationTurns: 2 }],
});

export const THE_REFEREE_ABILITIES: Ability[] = [BLOW_THE_WHISTLE, PENALTY_FLAG, RED_CARD, OVERRULE];

export const THE_REFEREE: CharacterDefinition = characterDefinitionSchema.parse({
  id: "the-referee",
  version: 1,
  displayName: "The Referee",
  rarity: "SECRET",
  tags: ["SECRET", "ATHLETE", "CONTROLLER"],
  baseHp: 110,
  abilityIds: THE_REFEREE_ABILITIES.map((a) => a.id),
  passiveId: PLAY_ON_THE_WHISTLE.id,
  resources: [FOULS_RESOURCE],
  knowledgeLevel: "DISCOVERABLE",
  artSpecId: "the-referee",
});
export const THE_REFEREE_INITIAL_RESOURCES = defaultResourcesFor(THE_REFEREE);

const built = buildArt({
  bible: {
    characterId: "the-referee",
    species: "a stern, impartial human official of an invented sport",
    ageRange: "middle-aged",
    face: "a lined, unsmiling face with a whistle clamped between the teeth",
    bodyType: "lean and upright",
    clothingArmor: "a black-and-white striped official's jersey with a plain unbranded collar",
    weaponsProps: "a silver whistle, a folded red card and a yellow flag",
    markings: "a neat armband with a plain circular mark",
    silhouette: "a thin upright figure with one arm raised holding a card",
    signatureProps: ["silver whistle", "red card", "yellow flag"],
  },
  region: "Modern stadium (invented sport, no real league, team or sponsor marks)",
  visualTheme: "impartial authority, the rules made physical",
  environment: "a floodlit empty arena floor with painted boundary lines",
  lighting: "hard white floodlights with long shadows",
  paletteConcept: "black and white stripes, signal red and yellow accents",
  avoid: ["any real sports league branding or logos", "any real referee's likeness", "real team colors"],
  splashScene: "arm raised with the red card, whistle mid-blast, painted lines radiating outward",
  portraitScene: "level stare over the whistle",
  avatarScene: "close crop on the face and whistle",
  iconScenes: [
    "a silver whistle mid-blast, for Blow the Whistle",
    "a yellow flag thrown through the air, for Penalty Flag",
    "a red card held out at arm's length, for Red Card",
    "a raised open palm over a glowing line, for Overrule",
  ],
  secretSilhouetteScene: "a thin upright figure with one arm raised holding a small card",
});
export const THE_REFEREE_VISUAL_BIBLE = built.bible;
export const THE_REFEREE_ART = built.art;
