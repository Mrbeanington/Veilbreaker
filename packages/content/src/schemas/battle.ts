import { z } from "zod";
import { energyPoolSchema, idSchema, knowledgeLevelSchema } from "./common";
import { matchFormatSchema, turnModelSchema } from "./config";

// spec/02 "Core models": PlayerAction is one character's planned action for
// a turn, submitted during simultaneous planning (spec/01 "Turn system").
// An empty `targetIds` array is a legal pass (OQ-08: unlocked/un-submitted
// actions are dropped, i.e. the character does nothing that turn) when no
// PlayerAction is submitted for a living character at all.
export const playerActionSchema = z.object({
  playerId: idSchema,
  characterId: idSchema,
  abilityId: idSchema,
  targetIds: z.array(idSchema).default([]),
});
export type PlayerAction = z.infer<typeof playerActionSchema>;

// spec/02 "Core models" / "Replays and determinism": the engine emits
// structured BattleEvents as a first-class log the UI and replays consume
// (CLAUDE.md conventions). `turnRelativeSequence` orders events deterministically
// within a turn without ever touching the wall clock (CLAUDE.md rule 4).
export const battleEventSchema = z.object({
  turn: z.number().int().min(0),
  tierId: idSchema,
  turnRelativeSequence: z.number().int().min(0),
  type: z.string().min(1),
  sourceId: idSchema.optional(),
  targetId: idSchema.optional(),
  payload: z.record(z.string(), z.unknown()).default({}),
  knowledgeLevel: knowledgeLevelSchema.default("PUBLIC"),
});
export type BattleEvent = z.infer<typeof battleEventSchema>;

// phase-02-combat-primitives.md: one applied status. `stacks` counts how
// many applications are currently active (capped at the StatusDefinition's
// maxStacks); `magnitude` is the most recent application's strength. The
// engine's generic rule (packages/engine/src/statuses.ts, docs/DECISIONS.md)
// is: effective strength for any math (Shield's absorption, Damage
// Reduction's flat reduction, a DoT/HoT's per-tick amount, ...) is always
// `magnitude * stacks`. `remainingTurns: null` means indefinite (cleared only
// by dispel or an explicit removeStatus effect), matching
// StatusDuration.permanent on the definition.
export const activeStatusSchema = z.object({
  statusId: idSchema,
  remainingTurns: z.number().int().min(0).nullable(),
  stacks: z.number().int().min(1),
  magnitude: z.number().int().default(0),
});
export type ActiveStatus = z.infer<typeof activeStatusSchema>;

// spec/02 "Core models": BattleState is the engine's single source of truth
// for a match in progress. Phase 00 shipped this as a foundational skeleton
// (OQ-25) since resolution logic was out of scope; Phase 01 (the resolver)
// added current/max HP, per-ability cooldowns, and whether the character is
// still alive. Phase 02 ("Combat primitives") adds `statuses`. Transformation
// stage and live resource values are still out of scope — Phase 03
// ("Advanced systems").
export const characterRuntimeStateSchema = z.object({
  characterId: idSchema,
  currentHp: z.number().int().min(0),
  maxHp: z.number().int().positive(),
  alive: z.boolean(),
  // Turns remaining before the ability can be used again; an ability with no
  // entry here (or a value of 0) is off cooldown.
  cooldowns: z.record(idSchema, z.number().int().min(0)).default({}),
  statuses: z.array(activeStatusSchema).default([]),
});
export type CharacterRuntimeState = z.infer<typeof characterRuntimeStateSchema>;

// Team membership and turn order (OQ-02: "within a player, order follows the
// ally slot 1→3"), kept separate from the live `characters` record on
// BattleState so a character's position in its team's slot order never
// changes even as its runtime state does.
export const battleTeamSchema = z.object({
  playerId: idSchema,
  characterIds: z.array(idSchema).min(1),
});
export type BattleTeam = z.infer<typeof battleTeamSchema>;

export const battleStateSchema = z.object({
  balanceVersionId: idSchema,
  rngState: z.string().min(1),
  turn: z.number().int().min(1),
  matchFormat: matchFormatSchema,
  turnModel: turnModelSchema.default("simultaneous"),
  teams: z.tuple([battleTeamSchema, battleTeamSchema]),
  // Keyed by characterId, covering every character across both teams — an
  // ability can target across team lines, so lookup does not go through a
  // specific team first.
  characters: z.record(idSchema, characterRuntimeStateSchema),
  energyPools: z.record(idSchema, energyPoolSchema),
  // spec/01 OQ-02: "Initiative alternates each turn (a coin-flip seeded from
  // RNG decides turn 1)." Whoever holds it resolves first within each tier.
  initiativePlayerId: idSchema,
  eventLog: z.array(battleEventSchema).default([]),
});
export type BattleState = z.infer<typeof battleStateSchema>;
