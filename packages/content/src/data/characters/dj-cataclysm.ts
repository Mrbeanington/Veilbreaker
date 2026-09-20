import { characterDefinitionSchema, type CharacterDefinition } from "../../schemas/character";
import type { Ability } from "../../schemas/ability";
import { ENEMY_ALL, ENEMY_SINGLE, ability, buildArt } from "./helpers";

// spec/03 #108 DJ CATACLYSM (Music / Entertainment / Chaos) — a turntable sorcerer. A build-up, then the drop; a scratch that silences; a surge that lifts the team. docs/design/characters/dj-cataclysm.md

export const BUILD_UP = ability({
  id: "ability.dj-cataclysm.build-up",
  displayName: "Build Up",
  description: "The tension rises: 10 damage.",
  cost: { focus: 1 },
  target: ENEMY_SINGLE,
  effects: [{ kind: "damage", amount: 10 }],
});
export const BASS_DROP = ability({
  id: "ability.dj-cataclysm.bass-drop",
  displayName: "Bass Drop",
  description: "20 damage to every enemy, or 50 right after Build Up.",
  cost: { might: 2 },
  cooldown: 1,
  target: ENEMY_ALL,
  effects: [
    {
      kind: "conditional",
      condition: { type: "usedAbilityLastTurn", target: "self", abilityId: "ability.dj-cataclysm.build-up" },
      ifTrue: [{ kind: "damage", amount: 50 }],
      ifFalse: [{ kind: "damage", amount: 20 }],
    },
  ],
});
export const RECORD_SCRATCH = ability({
  id: "ability.dj-cataclysm.record-scratch",
  displayName: "Record Scratch",
  description: "A screeching stop: the enemy is silenced for a turn.",
  cost: { focus: 1, spirit: 1 },
  cooldown: 4,
  target: ENEMY_SINGLE,
  effects: [{ kind: "applyStatus", statusId: "status.silence", durationTurns: 1 }],
});
export const CROWD_SURGE = ability({
  id: "ability.dj-cataclysm.crowd-surge",
  displayName: "Crowd Surge",
  description: "The floor erupts: every ally is shielded for 20 for 2 turns.",
  cost: { spirit: 2 },
  cooldown: 4,
  target: { side: "ally", scope: "all", count: 1, includeSelf: true, filterTags: [] },
  effects: [{ kind: "applyStatus", statusId: "status.shield", magnitude: 20, durationTurns: 2 }],
});

export const DJ_CATACLYSM_ABILITIES: Ability[] = [BUILD_UP, BASS_DROP, RECORD_SCRATCH, CROWD_SURGE];

export const DJ_CATACLYSM: CharacterDefinition = characterDefinitionSchema.parse({
  id: "dj-cataclysm",
  version: 1,
  displayName: "DJ Cataclysm",
  rarity: "RARE",
  tags: ["MUSIC", "CONTROLLER", "SUPPORT"],
  baseHp: 110,
  abilityIds: DJ_CATACLYSM_ABILITIES.map((a) => a.id),
  artSpecId: "dj-cataclysm",
});

const built = buildArt({
  bible: {
    characterId: "dj-cataclysm",
    species: "a turntable sorcerer of neon club legend",
    ageRange: "a woman in her thirties",
    face: "a cool, smirking face behind mirrored cyan visor-glasses with a shaved-side undercut",
    bodyType: "tall, lean and hunched over decks",
    clothingArmor: "a silver reflective jacket over a black bodysuit, oversized headphones and fingerless gloves",
    weaponsProps: "a pair of glowing turntables and a cloud of floating vinyl discs",
    markings: "cyan waveform lines glowing along the hands and jaw",
    silhouette: "a hunched figure behind a pair of turntables with vinyl discs orbiting overhead",
    signatureProps: ["glowing turntables", "oversized headphones", "orbiting vinyl discs"],
  },
  region: "Stage, studio and street-theatre inspiration (spotlights, patched amps, greasepaint, checkered kitchens, neon and cardboard sets)",
  visualTheme: "the room does what the record says",
  environment: "a neon warehouse dance floor with a laser rig",
  lighting: "strobing cyan and magenta lasers in haze",
  paletteConcept: "neon cyan, magenta, chrome silver, club black",
  avoid: ["any existing game's dj cataclysm design"],
  splashScene: "behind glowing turntables with vinyl discs orbiting and lasers fanning over a roaring crowd",
  portraitScene: "a smirk behind mirrored cyan visor-glasses",
  avatarScene: "close crop on the visor and headphones",
  iconScenes: ["a rising waveform climbing a scale, for Build Up", "a huge shockwave ring from a speaker, for Bass Drop", "a vinyl disc screeching to a halt, for Record Scratch", "a crowd's raised hands under laser light, for Crowd Surge"],
});
export const DJ_CATACLYSM_VISUAL_BIBLE = built.bible;
export const DJ_CATACLYSM_ART = built.art;
