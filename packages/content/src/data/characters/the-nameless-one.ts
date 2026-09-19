import { characterDefinitionSchema, defaultResourcesFor, type CharacterDefinition } from "../../schemas/character";
import { passiveDefinitionSchema, type PassiveDefinition } from "../../schemas/passive";
import type { Ability } from "../../schemas/ability";
import type { Resource } from "../../schemas/common";
import { ability, buildArt, ENEMY_ALL, ENEMY_SINGLE, SELF_ONLY } from "./helpers";

// spec/03 Final Legend #12 THE NAMELESS ONE — once per battle, when he would
// die, the turn is rewound (OQ-06, ADR-015). docs/design/characters/the-nameless-one.md

export const REWIND_RESOURCE: Resource = {
  id: "resource.rewind",
  displayName: "Unwritten Turn",
  startingValue: 1,
  min: 0,
  max: 1,
  visibleToOpponent: true,
  displayHint: "pips",
  trackMode: true,
};

// Fires in the death-check tier, before he is marked dead. The charge is spent
// and stays spent through the restore (rewindTurn.persistResourceId).
export const NOT_YET_WRITTEN: PassiveDefinition = passiveDefinitionSchema.parse({
  id: "passive.the-nameless-one.not-yet-written",
  displayName: "Not Yet Written",
  description: "Once per battle, when he would fall, the turn is rewound. Both sides plan it again.",
  trigger: { event: "onWouldDie", relation: "self" },
  condition: { type: "resourceAtLeast", target: "self", resourceId: REWIND_RESOURCE.id, amount: 1 },
  effects: [
    { kind: "modifyResource", resourceId: REWIND_RESOURCE.id, amount: -1 },
    { kind: "rewindTurn", persistResourceId: REWIND_RESOURCE.id },
  ],
});

export const UNWRITTEN_STRIKE = ability({
  id: "ability.the-nameless-one.unwritten-strike",
  displayName: "Unwritten Strike",
  description: "A blow that seems to have already happened.",
  cost: { might: 2 },
  target: ENEMY_SINGLE,
  effects: [{ kind: "damage", amount: 30 }],
});
export const ABSENCE = ability({
  id: "ability.the-nameless-one.absence",
  displayName: "Absence",
  description: "He is simply not there for a turn.",
  cost: { spirit: 1, chaos: 1 },
  cooldown: 3,
  target: SELF_ONLY,
  effects: [{ kind: "applyStatus", statusId: "status.untargetable", durationTurns: 1 }],
});
export const REDACT = ability({
  id: "ability.the-nameless-one.redact",
  displayName: "Redact",
  description: "Removes an enemy from the record for a turn: they cannot act.",
  cost: { chaos: 2 },
  cooldown: 3,
  target: ENEMY_SINGLE,
  effects: [{ kind: "applyStatus", statusId: "status.silence", durationTurns: 1 }],
});
export const FRACTURE = ability({
  id: "ability.the-nameless-one.fracture",
  displayName: "Fracture",
  description: "The world cracks along one white line and everyone on the far side is cut.",
  cost: { might: 2, spirit: 1, chaos: 1 },
  cooldown: 3,
  target: ENEMY_ALL,
  effects: [{ kind: "damage", amount: 25 }],
});

export const THE_NAMELESS_ONE_ABILITIES: Ability[] = [UNWRITTEN_STRIKE, ABSENCE, REDACT, FRACTURE];

export const THE_NAMELESS_ONE: CharacterDefinition = characterDefinitionSchema.parse({
  id: "the-nameless-one",
  version: 1,
  displayName: "The Nameless One",
  rarity: "LEGENDARY",
  tags: ["LEGENDARY", "CONTROLLER", "ATTACKER"],
  baseHp: 170,
  abilityIds: THE_NAMELESS_ONE_ABILITIES.map((a) => a.id),
  passiveId: NOT_YET_WRITTEN.id,
  resources: [REWIND_RESOURCE],
  artSpecId: "the-nameless-one",
});
export const THE_NAMELESS_ONE_INITIAL_RESOURCES = defaultResourcesFor(THE_NAMELESS_ONE);

const built = buildArt({
  bible: {
    characterId: "the-nameless-one",
    species: "an uncanny humanoid sovereign whose appearance seems partially missing from reality",
    ageRange: "impossible to judge",
    face: "a face that the eye slides off, with parts simply absent, as if never drawn",
    bodyType: "tall, regal and subtly wrong in its proportions",
    clothingArmor: "ceremonial regalia whose edges fade into nothing",
    weaponsProps: "no visible weapon; one hand always slightly out of focus",
    markings: "one impossible white fracture running through the whole figure",
    silhouette: "a tall regal figure split by a single thin white fracture",
    signatureProps: ["the white fracture", "missing edges"],
  },
  region: "None; no place or culture can be identified",
  visualTheme: "the game's ultimate accomplishment: a sovereign the world has forgotten to render",
  environment: "a void with only the faintest suggestion of a floor",
  lighting: "dim, with the white fracture as the only true light",
  paletteConcept: "void black, bone white fracture, faint desaturated grey",
  avoid: ["a generic hooded villain", "any existing game's final boss design", "any readable text or symbol"],
  splashScene: "standing in the void, parts of the figure erased, the white fracture the only bright thing",
  portraitScene: "the almost-absent face, one edge of it simply missing",
  avatarScene: "close crop on the absent face and the white fracture",
  iconScenes: [
    "a thin white line cutting a dark shape, for Unwritten Strike",
    "an empty outline with nothing inside, for Absence",
    "a black bar drawn over a face, for Redact",
    "a wide white crack across a dark field, for Fracture",
  ],
  legendRevealScene: "the void resolving into a regal figure with one white fracture, most of it still missing",
  secretSilhouetteScene: "a dark silhouette with one impossible white fracture and nothing else readable",
});
export const THE_NAMELESS_ONE_VISUAL_BIBLE = built.bible;
export const THE_NAMELESS_ONE_ART = built.art;
