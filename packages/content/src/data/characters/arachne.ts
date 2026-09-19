import { characterDefinitionSchema, defaultResourcesFor, type CharacterDefinition } from "../../schemas/character";
import { passiveDefinitionSchema, type PassiveDefinition } from "../../schemas/passive";
import type { Ability } from "../../schemas/ability";
import type { Resource } from "../../schemas/common";
import { ability, buildArt, ENEMY_SINGLE, SELF_ONLY } from "./helpers";

// spec/03 #5 ARACHNE (Ancient Mediterranean) — the weaver. Every strand she
// spins is a Thread; a full Tapestry stops an enemy in its tracks. Slow and
// fragile, she wins by taxing what her enemies can do. docs/design/characters/arachne.md

export const THREADS_RESOURCE: Resource = {
  id: "resource.threads",
  displayName: "Threads",
  startingValue: 0,
  min: 0,
  max: 4,
  visibleToOpponent: true,
  displayHint: "pips",
  trackMode: true,
};

export const WEB_SENSE: PassiveDefinition = passiveDefinitionSchema.parse({
  id: "passive.arachne.web-sense",
  displayName: "Web Sense",
  description: "Any blow that reaches her also gives her a Thread.",
  trigger: { event: "onDamaged", relation: "self", effectTarget: "self" },
  effects: [{ kind: "modifyResource", resourceId: THREADS_RESOURCE.id, amount: 1 }],
});

const oneThread = { kind: "modifyResource", resourceId: THREADS_RESOURCE.id, amount: 1, target: SELF_ONLY } as const;

export const SPIN_WEB = ability({
  id: "ability.arachne.spin-web",
  displayName: "Spin Web",
  description: "Slows an enemy's cooldowns for 2 turns and adds a Thread.",
  cost: { focus: 1 },
  target: ENEMY_SINGLE,
  effects: [{ kind: "applyStatus", statusId: "status.cooldown-increase", magnitude: 1, durationTurns: 2 }, oneThread],
});
export const SNARE_LINE = ability({
  id: "ability.arachne.snare-line",
  displayName: "Snare Line",
  description: "10 damage, the enemy's abilities cost 1 more for 2 turns, and a Thread.",
  cost: { chaos: 1 },
  cooldown: 2,
  target: ENEMY_SINGLE,
  effects: [
    { kind: "damage", amount: 10 },
    { kind: "applyStatus", statusId: "status.energy-cost-increase", magnitude: 1, durationTurns: 2 },
    oneThread,
  ],
});
export const VENOM_FANG = ability({
  id: "ability.arachne.venom-fang",
  displayName: "Venom Fang",
  description: "10 damage and poison.",
  cost: { chaos: 1 },
  cooldown: 1,
  target: ENEMY_SINGLE,
  effects: [
    { kind: "damage", amount: 10 },
    { kind: "applyStatus", statusId: "status.poison", magnitude: 5, durationTurns: 3 },
  ],
});
export const TAPESTRY = ability({
  id: "ability.arachne.tapestry",
  displayName: "Tapestry",
  description: "30 damage. With three Threads it also stuns the enemy for a turn, and spends them.",
  cost: { spirit: 2 },
  cooldown: 3,
  target: ENEMY_SINGLE,
  effects: [
    { kind: "damage", amount: 30 },
    {
      kind: "conditional",
      condition: { type: "resourceAtLeast", target: "self", resourceId: THREADS_RESOURCE.id, amount: 3 },
      ifTrue: [
        { kind: "applyStatus", statusId: "status.stun", durationTurns: 1 },
        { kind: "modifyResource", resourceId: THREADS_RESOURCE.id, amount: -3, target: SELF_ONLY },
      ],
    },
  ],
});

export const ARACHNE_ABILITIES: Ability[] = [SPIN_WEB, SNARE_LINE, VENOM_FANG, TAPESTRY];

export const ARACHNE: CharacterDefinition = characterDefinitionSchema.parse({
  id: "arachne",
  version: 1,
  displayName: "Arachne",
  rarity: "RARE",
  tags: ["MYTHOLOGY", "CONTROLLER", "ASSASSIN"],
  baseHp: 110,
  abilityIds: ARACHNE_ABILITIES.map((a) => a.id),
  passiveId: WEB_SENSE.id,
  resources: [THREADS_RESOURCE],
  artSpecId: "arachne",
});
export const ARACHNE_INITIAL_RESOURCES = defaultResourcesFor(ARACHNE);

const built = buildArt({
  bible: {
    characterId: "arachne",
    species: "a weaver transformed into a spider-woman of Mediterranean myth",
    ageRange: "an ageless woman",
    face: "a proud narrow face with a cold smile and many small dark eyes across her brow",
    bodyType: "a slender woman's torso above a long-legged spider body",
    clothingArmor: "a sleeveless tunic woven of fine grey thread",
    weaponsProps: "a loom-shuttle in one hand and glinting strands trailing from her fingers",
    markings: "loom-pattern lines in pale gold across her arms",
    silhouette: "a woman's figure rising from eight long jointed legs against a web",
    signatureProps: ["a loom shuttle", "gleaming threads", "a half-finished tapestry"],
  },
  region: "Ancient Mediterranean (weathered bronze, marble, geometric borders)",
  visualTheme: "a craftswoman whose pride became a trap",
  environment: "a colonnade strung with shimmering webs and woven tapestries",
  lighting: "dusty gold light through threads",
  paletteConcept: "silk white, pale gold, purple dye, shadow black",
  avoid: ["any existing game's spider-woman design"],
  splashScene: "hanging from a great web with a tapestry unfurling beneath her",
  portraitScene: "a cold smile, threads drawn taut between her fingers",
  avatarScene: "close crop on the many eyes and one taut thread",
  iconScenes: [
    "a spiral web with a dewdrop, for Spin Web",
    "a taut thread pulled tight across a doorway, for Snare Line",
    "a fang with a bead of venom, for Venom Fang",
    "a finished tapestry in gold thread, for Tapestry",
  ],
});
export const ARACHNE_VISUAL_BIBLE = built.bible;
export const ARACHNE_ART = built.art;
