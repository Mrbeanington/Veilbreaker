import { characterDefinitionSchema, type CharacterDefinition } from "../../schemas/character";
import { summonSchema, type Summon } from "../../schemas/summon";
import type { Ability } from "../../schemas/ability";
import { ENEMY_SINGLE, SELF_ONLY, ability, buildArt } from "./helpers";

// spec/03 #74 THE MONKEY TRICKSTER (World Folklore) — the stone monkey with the staff and the cloud. He plucks hairs into clones, somersaults out of reach and steals the peaches of immortality. docs/design/characters/the-monkey-trickster.md

export const HAIR_CLONE_SUMMON: Summon = summonSchema.parse({
  id: "summon.the-monkey-trickster.hair-clone",
  displayName: "Hair Clone",
  occupiesSlot: false,
  hp: 20,
  duration: { turns: 3, permanent: false },
});

export const STAFF_STRIKE = ability({
  id: "ability.the-monkey-trickster.staff-strike",
  displayName: "Staff Strike",
  description: "A whirl of the staff: 30 damage.",
  cost: { might: 2 },
  cooldown: 1,
  target: ENEMY_SINGLE,
  effects: [{ kind: "damage", amount: 30 }],
});
export const PLUCK_HAIRS = ability({
  id: "ability.the-monkey-trickster.pluck-hairs",
  displayName: "Pluck Hairs",
  description: "Blows on a handful of hairs: a clone with 20 health stays for 3 turns.",
  cost: { focus: 1 },
  cooldown: 3,
  target: SELF_ONLY,
  effects: [{ kind: "summon", summonId: HAIR_CLONE_SUMMON.id }],
});
export const CLOUD_SOMERSAULT = ability({
  id: "ability.the-monkey-trickster.cloud-somersault",
  displayName: "Cloud Somersault",
  description: "Tumbles away on a cloud: untargetable for a turn.",
  cost: { focus: 1 },
  cooldown: 3,
  target: SELF_ONLY,
  effects: [{ kind: "applyStatus", statusId: "status.untargetable", durationTurns: 1 }],
});
export const STEAL_A_PEACH = ability({
  id: "ability.the-monkey-trickster.steal-a-peach",
  displayName: "Steal a Peach",
  description: "Grabs a peach of immortality: 10 damage, and he heals 20.",
  cost: { chaos: 1 },
  cooldown: 2,
  target: ENEMY_SINGLE,
  effects: [{ kind: "damage", amount: 10 }, { kind: "heal", healingClass: "lifeTransfer", amount: 20, target: SELF_ONLY }],
});

export const THE_MONKEY_TRICKSTER_ABILITIES: Ability[] = [STAFF_STRIKE, PLUCK_HAIRS, CLOUD_SOMERSAULT, STEAL_A_PEACH];

export const THE_MONKEY_TRICKSTER: CharacterDefinition = characterDefinitionSchema.parse({
  id: "the-monkey-trickster",
  version: 1,
  displayName: "The Monkey Trickster",
  rarity: "RARE",
  tags: ["FOLKLORE", "ATTACKER", "ASSASSIN"],
  baseHp: 120,
  abilityIds: THE_MONKEY_TRICKSTER_ABILITIES.map((a) => a.id),
  artSpecId: "the-monkey-trickster",
});

const built = buildArt({
  bible: {
    characterId: "the-monkey-trickster",
    species: "a stone-born monkey king of Chinese folk tales",
    ageRange: "ageless",
    face: "a grinning, bright-eyed monkey face with a golden-brown fur ruff",
    bodyType: "agile and wiry",
    clothingArmor: "a tiger-skin kilt, a golden headband and light red armour plates",
    weaponsProps: "a long iron-banded staff and a peach in one hand",
    markings: "a golden headband with no writing on it",
    silhouette: "a lean monkey figure balanced on a small cloud with a long staff",
    signatureProps: ["a long staff", "a golden headband", "a small cloud"],
  },
  region: "World folk-tale inspiration (storybook borders, market-day colour, moonlit roads, hand-stitched cloth and lacquer)",
  visualTheme: "the joke that nobody can catch",
  environment: "a mountain peach orchard above the clouds",
  lighting: "bright morning light through peach blossom",
  paletteConcept: "peach pink, gold, cloud white, tiger orange",
  avoid: ["any existing game's the monkey trickster design"],
  splashScene: "leaping through peach blossom with the staff spinning and a small cloud beneath him",
  portraitScene: "a grinning monkey face under a golden headband",
  avatarScene: "close crop on the face and headband",
  iconScenes: ["a long staff mid-spin, for Staff Strike", "a puff of hairs turning into little monkeys, for Pluck Hairs", "a small cloud with a tumbling shape, for Cloud Somersault", "a single glowing peach in a paw, for Steal a Peach"],
});
export const THE_MONKEY_TRICKSTER_VISUAL_BIBLE = built.bible;
export const THE_MONKEY_TRICKSTER_ART = built.art;
