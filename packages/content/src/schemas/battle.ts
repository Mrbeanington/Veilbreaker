import { z } from "zod";
import { energyFamilySchema, idSchema, knowledgeLevelSchema } from "./common";
import { matchFormatSchema, turnModelSchema } from "./config";

// spec/02 "Core models": PlayerAction is one character's planned action for
// a turn, submitted during simultaneous planning (spec/01 "Turn system").
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

// spec/02 "Core models": BattleState is the engine's single source of truth
// for a match in progress. This is a foundational skeleton only — Phase 00
// is explicitly out of scope for resolution logic (docs/phases/phase-00
// -architecture.md "Out of scope"), so per-character runtime fields (HP,
// active statuses, cooldowns, resource values) are added in Phase 01 when
// the resolver is built, per the "simplest option that keeps the system
// reusable" rule in CLAUDE.md's session protocol. Logged as OQ-25.
export const battleTeamSchema = z.object({
  playerId: idSchema,
  characterIds: z.array(idSchema).min(1),
});
export type BattleTeam = z.infer<typeof battleTeamSchema>;

export const battleStateSchema = z.object({
  balanceVersionId: idSchema,
  rngState: z.string().min(1),
  turn: z.number().int().min(0),
  matchFormat: matchFormatSchema,
  turnModel: turnModelSchema.default("simultaneous"),
  teams: z.tuple([battleTeamSchema, battleTeamSchema]),
  energyPools: z.record(idSchema, z.record(energyFamilySchema, z.number().int().min(0))),
  eventLog: z.array(battleEventSchema).default([]),
});
export type BattleState = z.infer<typeof battleStateSchema>;
