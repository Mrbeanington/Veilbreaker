import { characterDefinitionSchema, type CharacterDefinition } from "../../schemas/character";
import { passiveDefinitionSchema, type PassiveDefinition } from "../../schemas/passive";
import type { Ability } from "../../schemas/ability";
import { ENEMY_SINGLE, SELF_ONLY, ability, buildArt } from "./helpers";

// spec/03 #115 THE TAX COLLECTOR (Final Seven) — an extremely irritating control character who steals unused resources. Every audited enemy turn ends a little poorer, and he takes it. docs/design/characters/the-tax-collector.md

export const LEVY: PassiveDefinition = passiveDefinitionSchema.parse({
  id: "passive.the-tax-collector.levy",
  displayName: "Levy",
  description: "At the end of the turn of any enemy under Audit, the enemy team's richest energy is taxed: 1 is taken and given to him.",
  trigger: { event: "onTurnEnd", relation: "enemy", effectTarget: "subject" },
  condition: { type: "hasStatus", target: "target", statusId: "status.energy-cost-increase" },
  effects: [{ kind: "drainEnergy", family: "any", amount: 1, grantToSelf: true }],
});

export const AUDIT = ability({
  id: "ability.the-tax-collector.audit",
  displayName: "Audit",
  description: "Goes through the books: 20 damage, and everything costs the enemy more for 2 turns.",
  cost: { focus: 1 },
  cooldown: 1,
  target: ENEMY_SINGLE,
  effects: [{ kind: "damage", amount: 20 }, { kind: "applyStatus", statusId: "status.energy-cost-increase", durationTurns: 2 }],
});
export const SEIZE_ASSETS = ability({
  id: "ability.the-tax-collector.seize-assets",
  displayName: "Seize Assets",
  description: "Takes 2 of the enemy team's richest energy for himself.",
  cost: { chaos: 1 },
  cooldown: 3,
  target: ENEMY_SINGLE,
  effects: [{ kind: "drainEnergy", family: "any", amount: 2, grantToSelf: true }],
});
export const LIEN = ability({
  id: "ability.the-tax-collector.lien",
  displayName: "Lien",
  description: "Puts a lien on the enemy's Focus: it cannot use any Focus ability for 2 turns.",
  cost: { spirit: 1, focus: 1 },
  cooldown: 4,
  target: ENEMY_SINGLE,
  effects: [{ kind: "applyStatus", statusId: "status.energy-lock", param: "FOCUS", durationTurns: 2 }],
});
export const RED_TAPE = ability({
  id: "ability.the-tax-collector.red-tape",
  displayName: "Red Tape",
  description: "Hides behind paperwork: takes 20 less damage for 2 turns.",
  cost: { spirit: 1 },
  cooldown: 3,
  target: SELF_ONLY,
  effects: [{ kind: "applyStatus", statusId: "status.damage-reduction", magnitude: 20, durationTurns: 2 }],
});

export const THE_TAX_COLLECTOR_ABILITIES: Ability[] = [AUDIT, SEIZE_ASSETS, LIEN, RED_TAPE];

export const THE_TAX_COLLECTOR: CharacterDefinition = characterDefinitionSchema.parse({
  id: "the-tax-collector",
  version: 1,
  displayName: "The Tax Collector",
  rarity: "RARE",
  tags: ["FOLKLORE", "CONTROLLER", "ASSASSIN"],
  baseHp: 110,
  abilityIds: THE_TAX_COLLECTOR_ABILITIES.map((a) => a.id),
  passiveId: LEVY.id,
  artSpecId: "the-tax-collector",
});

const built = buildArt({
  bible: {
    characterId: "the-tax-collector",
    species: "a relentless revenue collector of dry-humoured tall tales",
    ageRange: "a man in his fifties",
    face: "a thin, joyless face with a sharp nose, rimless spectacles and a permanent pinched frown",
    bodyType: "narrow, stooped and precise",
    clothingArmor: "a grey pinstriped suit, a high starched collar, black sleeve-guards and a battered black bowler hat",
    weaponsProps: "a heavy brass-bound ledger and a long quill pen",
    markings: "ink stains up both cuffs",
    silhouette: "a narrow stooped figure in a bowler hat clutching a huge ledger under one arm",
    signatureProps: ["a heavy ledger", "a quill pen", "a black bowler hat"],
  },
  region: "Mythic-finale inspiration (courtroom oak, brass ledgers, abyssal coral, sealed iron gates, original sigils only)",
  visualTheme: "the bill always arrives",
  environment: "a cramped counting-house with towers of ledgers and a barred window",
  lighting: "a single green-shaded desk lamp and dust",
  paletteConcept: "ledger black, pinstripe grey, brass, ink blue",
  avoid: ["any existing game's the tax collector design"],
  splashScene: "towering over a desk of ledgers with the quill raised and coins drifting out of the enemy's pockets towards him",
  portraitScene: "a pinched frown behind rimless spectacles",
  avatarScene: "close crop on the spectacles and bowler hat",
  iconScenes: ["a red stamp coming down on a ledger, for Audit", "a hand lifting glowing coins out of a pouch, for Seize Assets", "a chain and padlock round a small glowing gem, for Lien", "a tall stack of paperwork forming a wall, for Red Tape"],
});
export const THE_TAX_COLLECTOR_VISUAL_BIBLE = built.bible;
export const THE_TAX_COLLECTOR_ART = built.art;
