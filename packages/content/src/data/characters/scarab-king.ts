import { characterDefinitionSchema, type CharacterDefinition } from "../../schemas/character";
import { passiveDefinitionSchema, type PassiveDefinition } from "../../schemas/passive";
import { summonSchema, type Summon } from "../../schemas/summon";
import type { Ability } from "../../schemas/ability";
import type { Resource } from "../../schemas/common";
import { ENEMY_SINGLE, SELF_ONLY, ability, buildArt } from "./helpers";

// spec/03 #55 THE SCARAB KING (Egypt / Desert) — a beetle-crowned lord of the swarm. Every action feeds the Swarm; when it is thick the Tide devours. docs/design/characters/scarab-king.md

export const SWARM_RESOURCE: Resource = {
  id: "resource.swarm",
  displayName: "Swarm",
  startingValue: 0,
  min: 0,
  max: 4,
  visibleToOpponent: true,
  displayHint: "pips",
  trackMode: true,
};

export const SCARAB_SWARM_SUMMON: Summon = summonSchema.parse({
  id: "summon.scarab-king.scarab-swarm",
  displayName: "Scarab Swarm",
  occupiesSlot: false,
  hp: 30,
  duration: { turns: 3, permanent: false },
});

export const SKITTERING_HORDE: PassiveDefinition = passiveDefinitionSchema.parse({
  id: "passive.scarab-king.skittering-horde",
  displayName: "Skittering Horde",
  description: "Every ability he uses feeds the Swarm by 1.",
  trigger: { event: "onAbilityUsed", relation: "self", effectTarget: "self" },
  effects: [{ kind: "modifyResource", resourceId: SWARM_RESOURCE.id, amount: 1 }],
});

export const CHITIN_BITE = ability({
  id: "ability.scarab-king.chitin-bite",
  displayName: "Chitin Bite",
  description: "A thousand tiny jaws: 20 damage.",
  cost: { might: 1 },
  target: ENEMY_SINGLE,
  effects: [{ kind: "damage", amount: 20 }],
});
export const CALL_THE_SWARM = ability({
  id: "ability.scarab-king.call-the-swarm",
  displayName: "Call the Swarm",
  description: "Whistles up a scarab swarm with 30 health that stays 3 turns.",
  cost: { focus: 1 },
  cooldown: 3,
  target: SELF_ONLY,
  effects: [{ kind: "summon", summonId: SCARAB_SWARM_SUMMON.id }],
});
export const SCARAB_TIDE = ability({
  id: "ability.scarab-king.scarab-tide",
  displayName: "Scarab Tide",
  description: "The swarm devours: 30 damage, or 60 with 3 Swarm (which it spends).",
  cost: { might: 2, spirit: 1 },
  cooldown: 2,
  target: ENEMY_SINGLE,
  effects: [
    {
      kind: "conditional",
      condition: { type: "resourceAtLeast", target: "self", resourceId: SWARM_RESOURCE.id, amount: 3 },
      ifTrue: [{ kind: "damage", amount: 60 }, { kind: "modifyResource", resourceId: SWARM_RESOURCE.id, amount: -3, target: SELF_ONLY }],
      ifFalse: [{ kind: "damage", amount: 30 }],
    },
  ],
});
export const CARAPACE = ability({
  id: "ability.scarab-king.carapace",
  displayName: "Carapace",
  description: "Hardens his shell: takes 20 less damage for 2 turns.",
  cost: { spirit: 1 },
  cooldown: 3,
  target: SELF_ONLY,
  effects: [{ kind: "applyStatus", statusId: "status.damage-reduction", magnitude: 20, durationTurns: 2 }],
});

export const SCARAB_KING_ABILITIES: Ability[] = [CHITIN_BITE, CALL_THE_SWARM, SCARAB_TIDE, CARAPACE];

export const SCARAB_KING: CharacterDefinition = characterDefinitionSchema.parse({
  id: "scarab-king",
  version: 1,
  displayName: "The Scarab King",
  rarity: "RARE",
  tags: ["MYTHOLOGY", "BEAST", "SUMMONER"],
  baseHp: 120,
  abilityIds: SCARAB_KING_ABILITIES.map((a) => a.id),
  passiveId: SKITTERING_HORDE.id,
  resources: [SWARM_RESOURCE],
  artSpecId: "scarab-king",
});

const built = buildArt({
  bible: {
    characterId: "scarab-king",
    species: "a scarab-crowned lord of the desert dead",
    ageRange: "ancient",
    face: "a gaunt grey face with black compound-eye lenses over the eyes",
    bodyType: "thin and tall with a hunched, insect-like stance",
    clothingArmor: "glossy green-black chitin armour plates over linen wraps",
    weaponsProps: "a curved beetle-horn staff and a cloud of scarabs",
    markings: "iridescent green beetle-shell scales across the shoulders",
    silhouette: "a tall crowned figure wreathed in a swirling cloud of beetles",
    signatureProps: ["a beetle-shell crown", "a horned staff", "a swirling scarab cloud"],
  },
  region: "Egyptian / Desert inspiration (sandstone, gold leaf, hieroglyph-free geometric borders, endless dunes)",
  visualTheme: "the swarm that wears a crown",
  environment: "a sand-choked burial chamber",
  lighting: "dim gold with green shimmer off the shells",
  paletteConcept: "beetle green, obsidian black, tarnished gold, dust",
  avoid: ["any existing game's the scarab king design"],
  splashScene: "rising from a heap of scarabs with the swarm pouring off his shoulders",
  portraitScene: "a gaunt face with black lenses among a few crawling beetles",
  avatarScene: "close crop on the crown and eyes",
  iconScenes: ["a single green beetle on a stone, for Chitin Bite", "a whistle-shaped horn with beetles pouring out, for Call the Swarm", "a black tide of beetles across sand, for Scarab Tide", "a shell plate closing over a small figure, for Carapace"],
});
export const SCARAB_KING_VISUAL_BIBLE = built.bible;
export const SCARAB_KING_ART = built.art;
