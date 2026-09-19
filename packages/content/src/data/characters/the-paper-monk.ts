import { characterDefinitionSchema, type CharacterDefinition } from "../../schemas/character";
import { summonSchema, type Summon } from "../../schemas/summon";
import type { Ability } from "../../schemas/ability";
import { ability, ALLY_SINGLE, buildArt, ENEMY_SINGLE, SELF_ONLY } from "./helpers";

// spec/03 #23 THE PAPER MONK (Japanese Folklore / Ink Realm) — a scribe whose
// prayers are written in ink on paper. He heals with prayer slips, folds paper
// cranes that stand between the enemy and his team, and seals a foe's
// abilities with a charm. docs/design/characters/the-paper-monk.md

export const PAPER_CRANE_SUMMON: Summon = summonSchema.parse({
  id: "summon.the-paper-monk.paper-crane-familiar",
  displayName: "Paper Crane Familiar",
  occupiesSlot: false,
  hp: 30,
  duration: { turns: 3, permanent: false },
});

export const PRAYER_SLIP = ability({
  id: "ability.the-paper-monk.prayer-slip",
  displayName: "Prayer Slip",
  description: "A written prayer heals an ally for 20.",
  cost: { spirit: 1 },
  cooldown: 1,
  target: ALLY_SINGLE,
  effects: [{ kind: "heal", healingClass: "heal", amount: 20 }],
});
export const FOLD_A_CRANE = ability({
  id: "ability.the-paper-monk.fold-a-crane",
  displayName: "Fold a Crane",
  description: "Folds a paper crane familiar with 30 health that stays for 3 turns.",
  cost: { focus: 1 },
  cooldown: 3,
  target: SELF_ONLY,
  effects: [{ kind: "summon", summonId: PAPER_CRANE_SUMMON.id }],
});
export const SEAL_CHARM = ability({
  id: "ability.the-paper-monk.seal-charm",
  displayName: "Seal Charm",
  description: "Pastes a sealing charm on an enemy: silenced for a turn.",
  cost: { focus: 1, spirit: 1 },
  cooldown: 4,
  target: ENEMY_SINGLE,
  effects: [{ kind: "applyStatus", statusId: "status.silence", durationTurns: 1 }],
});
export const INK_BLOT = ability({
  id: "ability.the-paper-monk.ink-blot",
  displayName: "Ink Blot",
  description: "Flicks wet ink into an enemy's eyes: 10 damage and its attacks are weakened by 10 for 2 turns.",
  cost: { chaos: 1 },
  cooldown: 2,
  target: ENEMY_SINGLE,
  effects: [
    { kind: "damage", amount: 10 },
    { kind: "applyStatus", statusId: "status.weakness", magnitude: 10, durationTurns: 2 },
  ],
});

export const THE_PAPER_MONK_ABILITIES: Ability[] = [PRAYER_SLIP, FOLD_A_CRANE, SEAL_CHARM, INK_BLOT];

export const THE_PAPER_MONK: CharacterDefinition = characterDefinitionSchema.parse({
  id: "the-paper-monk",
  version: 1,
  displayName: "The Paper Monk",
  rarity: "RARE",
  tags: ["FOLKLORE", "SUPPORT", "SUMMONER", "HEALER"],
  baseHp: 110,
  abilityIds: THE_PAPER_MONK_ABILITIES.map((a) => a.id),
  artSpecId: "the-paper-monk",
});

const built = buildArt({
  bible: {
    characterId: "the-paper-monk",
    species: "a wandering scribe-monk of Japanese folklore",
    ageRange: "elderly",
    face: "a gentle lined face with closed eyes and a faint calm smile",
    bodyType: "thin and stooped, always carrying a load of scrolls",
    clothingArmor: "a plain grey monk's robe pinned with strips of paper prayer slips",
    weaponsProps: "a long calligraphy brush and a bundle of folded paper",
    markings: "ink-stained fingers and a line of black characters (invented, unreadable) on his forearm",
    silhouette: "a stooped robed figure trailing paper cranes",
    signatureProps: ["a calligraphy brush", "folded paper cranes", "prayer slips"],
  },
  region: "Japanese folklore / Ink Realm inspiration (sumi-e brush language; cultural review required, OQ-12)",
  visualTheme: "faith written in ink and folded with care",
  environment: "a hillside scriptorium with drying paper on lines",
  lighting: "soft window light and lamp glow",
  paletteConcept: "paper white, ink black, monk grey, faint vermilion seal red",
  avoid: ["any existing game's monk design", "real sacred text"],
  splashScene: "brush raised over a scroll while a flock of paper cranes lifts from the page",
  portraitScene: "a serene face with a drifting paper crane at one shoulder",
  avatarScene: "close crop on the face and the brush tip",
  iconScenes: [
    "a scrap of paper with a brushed prayer glowing, for Prayer Slip",
    "a paper crane taking flight, for Fold a Crane",
    "a paper charm with a red seal, for Seal Charm",
    "a splash of black ink, for Ink Blot",
  ],
});
export const THE_PAPER_MONK_VISUAL_BIBLE = built.bible;
export const THE_PAPER_MONK_ART = built.art;
