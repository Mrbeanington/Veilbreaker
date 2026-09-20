import { characterDefinitionSchema, defaultResourcesFor, type CharacterDefinition } from "../../schemas/character";
import { passiveDefinitionSchema, type PassiveDefinition } from "../../schemas/passive";
import type { Ability } from "../../schemas/ability";
import type { Resource } from "../../schemas/common";
import { ability, buildArt, ENEMY_ALL, ENEMY_SINGLE, SELF_ONLY } from "./helpers";

// spec/03 #51 FENRIS (Northern / Celtic) — the chained wolf. He begins bound: a
// link of the chain breaks each time he is wounded, and every broken link
// frees more of him. The opposite of a slow build: his best moment comes from
// being hurt. docs/design/characters/fenris.md

export const CHAINS_RESOURCE: Resource = {
  id: "resource.chains",
  displayName: "Chains",
  startingValue: 3,
  min: 0,
  max: 3,
  visibleToOpponent: true,
  displayHint: "pips",
  trackMode: true,
};

export const LINKS_BREAK: PassiveDefinition = passiveDefinitionSchema.parse({
  id: "passive.fenris.links-break",
  displayName: "Links Break",
  description: "Every wound breaks a link of his chain.",
  trigger: { event: "onDamaged", relation: "self", effectTarget: "self" },
  effects: [{ kind: "modifyResource", resourceId: CHAINS_RESOURCE.id, amount: -1 }],
});

export const SNAP = ability({
  id: "ability.fenris.snap",
  displayName: "Snap",
  description: "A lunge to the end of his chain: 20 damage.",
  cost: { might: 1 },
  target: ENEMY_SINGLE,
  effects: [{ kind: "damage", amount: 20 }],
});
export const HOWL_OF_THE_BOUND = ability({
  id: "ability.fenris.howl-of-the-bound",
  displayName: "Howl of the Bound",
  description: "A howl that shakes the arena: every enemy is weakened by 10 for 2 turns.",
  cost: { chaos: 1 },
  cooldown: 3,
  target: ENEMY_ALL,
  effects: [{ kind: "applyStatus", statusId: "status.weakness", magnitude: 10, durationTurns: 2 }],
});
export const STRAIN_AT_THE_CHAIN = ability({
  id: "ability.fenris.strain-at-the-chain",
  displayName: "Strain at the Chain",
  description: "Throws his weight against it: breaks a link and costs him 10 health.",
  cost: { spirit: 1 },
  cooldown: 2,
  target: SELF_ONLY,
  effects: [
    { kind: "damage", amount: 10, damageType: "affliction", target: SELF_ONLY },
    { kind: "modifyResource", resourceId: CHAINS_RESOURCE.id, amount: -1 },
  ],
});
export const RAGNAROK_BITE = ability({
  id: "ability.fenris.ragnarok-bite",
  displayName: "Ragnarök Bite",
  description: "70 damage once his chain is broken (no links left). While bound, only 30.",
  cost: { might: 3 },
  cooldown: 3,
  target: ENEMY_SINGLE,
  effects: [
    {
      kind: "conditional",
      condition: { type: "resourceAtLeast", target: "self", resourceId: CHAINS_RESOURCE.id, amount: 1 },
      ifTrue: [{ kind: "damage", amount: 30 }],
      ifFalse: [{ kind: "damage", amount: 70 }],
    },
  ],
});

export const FENRIS_ABILITIES: Ability[] = [SNAP, HOWL_OF_THE_BOUND, STRAIN_AT_THE_CHAIN, RAGNAROK_BITE];

export const FENRIS: CharacterDefinition = characterDefinitionSchema.parse({
  id: "fenris",
  version: 1,
  displayName: "Fenris",
  rarity: "RARE",
  tags: ["MYTHOLOGY", "BEAST", "ATTACKER"],
  baseHp: 160,
  abilityIds: FENRIS_ABILITIES.map((a) => a.id),
  passiveId: LINKS_BREAK.id,
  resources: [CHAINS_RESOURCE],
  artSpecId: "fenris",
});
export const FENRIS_INITIAL_RESOURCES = defaultResourcesFor(FENRIS);

const built = buildArt({
  bible: {
    characterId: "fenris",
    species: "the great wolf of Norse myth",
    ageRange: "ageless",
    face: "a huge grey wolf's head with amber eyes and bared, scarred fangs",
    bodyType: "a wolf the size of a house, straining forward",
    clothingArmor: "none — grey fur scarred with old chain marks",
    weaponsProps: "fangs and a broken, glowing chain around the neck and forelegs",
    markings: "pale scars where the chain has bitten into the fur",
    silhouette: "an enormous wolf straining against a chain, jaws wide",
    signatureProps: ["a heavy chain", "scarred fur", "bared fangs"],
  },
  region: "Norse / Celtic inspiration (carved knotwork, weathered stone, stormy northern landscapes)",
  visualTheme: "a fate held back by a thread",
  environment: "a barren rock in a frozen lake with a chain staked to it",
  lighting: "cold grey light with a hint of dawn red on the horizon",
  paletteConcept: "wolf grey, iron black, ember amber, snow white",
  avoid: ["any existing game's giant wolf design"],
  splashScene: "straining against the chain with the last link cracking and jaws wide",
  portraitScene: "the great grey head with amber eyes and bared fangs",
  avatarScene: "close crop on the jaws and eyes",
  iconScenes: [
    "a snapping jaw at the end of a taut chain, for Snap",
    "a howling wolf head with sound rings, for Howl of the Bound",
    "a chain link cracking, for Strain at the Chain",
    "a wide open jaw swallowing a small sun, for Ragnarök Bite",
  ],
});
export const FENRIS_VISUAL_BIBLE = built.bible;
export const FENRIS_ART = built.art;
