import { characterDefinitionSchema, type CharacterDefinition } from "../../schemas/character";
import { passiveDefinitionSchema, type PassiveDefinition } from "../../schemas/passive";
import type { Ability } from "../../schemas/ability";
import { ability, ALLY_SINGLE, buildArt, ENEMY_ALL, ENEMY_SINGLE } from "./helpers";

// spec/03 #46 BANSHEE (Northern / Celtic) — the keening woman who announces a
// death. Grief feeds her: every death gives her Chaos. Her wail frightens, her
// portent curses, and one keen can silence. docs/design/characters/banshee.md

export const KEENING: PassiveDefinition = passiveDefinitionSchema.parse({
  id: "passive.banshee.keening",
  displayName: "Keening",
  description: "Whenever anyone dies, her team gains 1 Chaos energy.",
  trigger: { event: "onDeath", relation: "any", effectTarget: "self" },
  effects: [{ kind: "modifyEnergy", family: "CHAOS", amount: 1 }],
});

export const WAIL = ability({
  id: "ability.banshee.wail",
  displayName: "Wail",
  description: "A soul-tearing wail: 10 damage to every enemy, and they are frightened for a turn.",
  cost: { spirit: 1, chaos: 1 },
  cooldown: 2,
  target: ENEMY_ALL,
  effects: [
    { kind: "damage", amount: 10 },
    { kind: "applyStatus", statusId: "status.fear", durationTurns: 1 },
  ],
});
export const DEATHS_PORTENT = ability({
  id: "ability.banshee.deaths-portent",
  displayName: "Death's Portent",
  description: "Foretells a death: the enemy is cursed for 3 turns and weakened for 2.",
  cost: { chaos: 1 },
  cooldown: 2,
  target: ENEMY_SINGLE,
  effects: [
    { kind: "applyStatus", statusId: "status.curse", durationTurns: 3 },
    { kind: "applyStatus", statusId: "status.weakness", magnitude: 10, durationTurns: 2 },
  ],
});
export const THE_KEEN = ability({
  id: "ability.banshee.the-keen",
  displayName: "The Keen",
  description: "A single piercing note silences an enemy for a turn.",
  cost: { spirit: 1, focus: 1 },
  cooldown: 4,
  target: ENEMY_SINGLE,
  effects: [{ kind: "applyStatus", statusId: "status.silence", durationTurns: 1 }],
});
export const MOURNING_VEIL = ability({
  id: "ability.banshee.mourning-veil",
  displayName: "Mourning Veil",
  description: "Draws a veil over an ally: they take 20 less damage for 2 turns.",
  cost: { spirit: 1 },
  cooldown: 3,
  target: ALLY_SINGLE,
  effects: [{ kind: "applyStatus", statusId: "status.damage-reduction", magnitude: 20, durationTurns: 2 }],
});

export const BANSHEE_ABILITIES: Ability[] = [WAIL, DEATHS_PORTENT, THE_KEEN, MOURNING_VEIL];

export const BANSHEE: CharacterDefinition = characterDefinitionSchema.parse({
  id: "banshee",
  version: 1,
  displayName: "Banshee",
  rarity: "RARE",
  tags: ["MYTHOLOGY", "UNDEAD", "MAGE", "CURSE"],
  baseHp: 100,
  abilityIds: BANSHEE_ABILITIES.map((a) => a.id),
  passiveId: KEENING.id,
  artSpecId: "banshee",
});

const built = buildArt({
  bible: {
    characterId: "banshee",
    species: "a mourning spirit of Irish folklore",
    ageRange: "ageless",
    face: "a pale, tear-streaked woman's face with hollow dark eyes and an open mouth",
    bodyType: "slight and drifting, feet never quite touching ground",
    clothingArmor: "a long grey-white shroud and hair that streams like smoke",
    weaponsProps: "a silver comb held in one hand",
    markings: "faint blue veins at her temples",
    silhouette: "a floating pale figure with long streaming hair and a wide mouth",
    signatureProps: ["a silver comb", "long streaming hair", "a grey shroud"],
  },
  region: "Norse / Celtic inspiration (carved knotwork, weathered stone, stormy northern landscapes)",
  visualTheme: "a grief that arrives ahead of the death",
  environment: "a stone wall at the edge of a foggy moor",
  lighting: "moonlight in fog with a faint blue glow",
  paletteConcept: "shroud grey, fog white, faint blue, black",
  avoid: ["any existing game's banshee design"],
  splashScene: "floating above a stone wall with her hair streaming and her mouth open in a keen",
  portraitScene: "a pale face with open mouth and hollow eyes in fog",
  avatarScene: "close crop on the face and the comb",
  iconScenes: [
    "sound rings spreading from an open mouth, for Wail",
    "a black candle guttering, for Death's Portent",
    "a single thin high line piercing the frame, for The Keen",
    "a grey veil drawn over a small figure, for Mourning Veil",
  ],
});
export const BANSHEE_VISUAL_BIBLE = built.bible;
export const BANSHEE_ART = built.art;
