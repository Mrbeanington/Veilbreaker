import { z } from "zod";
import { idSchema } from "./common";

// spec/01 "Resolution stack": the 15-tier default order lives in config
// (resolution-order.json), never hard-coded across files (CLAUDE.md rule 5).
export const resolutionTierSchema = z.object({
  id: idSchema,
  order: z.number().int().min(0),
  displayName: z.string().min(1),
});
export type ResolutionTier = z.infer<typeof resolutionTierSchema>;

export const resolutionOrderSchema = z
  .object({
    tiers: z.array(resolutionTierSchema).min(1),
  })
  .refine((o) => new Set(o.tiers.map((t) => t.order)).size === o.tiers.length, {
    message: "resolution tier `order` values must be unique",
    path: ["tiers"],
  })
  .refine((o) => new Set(o.tiers.map((t) => t.id)).size === o.tiers.length, {
    message: "resolution tier `id` values must be unique",
    path: ["tiers"],
  });
export type ResolutionOrder = z.infer<typeof resolutionOrderSchema>;

// spec/01 "Energy" and OQ-03: generation rate, pool cap, and carryover are
// all configurable, never embedded in character/ability data.
export const energyRulesSchema = z.object({
  generation: z.object({
    perLivingCharacter: z.number().int().min(0).default(1),
    /** A floor on a team's total units per turn (phase-15): a last survivor is not starved by a 2-unit trickle. 0 means no floor. */
    minPerTeam: z.number().int().min(0).default(0),
    mode: z.enum(["random", "fixed"]).default("random"),
  }),
  poolCap: z.number().int().positive().default(10),
  carryover: z.boolean().default(true),
  initiativePlayerSkipsTurnOneGeneration: z.boolean().default(true),
});
export type EnergyRules = z.infer<typeof energyRulesSchema>;

// spec/01 "Match format": team size is configuration, not a constant, so the
// same engine can later run 1v1, 2v2, 4v4, PvE, and boss encounters.
// OQ-14 sets the default max-turns tiebreak.
export const matchFormatSchema = z.object({
  teamSize: z.number().int().min(1).default(3),
  maxTurns: z.number().int().min(1).default(40),
});
export type MatchFormat = z.infer<typeof matchFormatSchema>;

export const turnModelSchema = z.enum(["simultaneous", "alternating"]);
export type TurnModel = z.infer<typeof turnModelSchema>;

// spec/02 "Balance versioning": every match records the BalanceVersion it
// ran under; every shipped version stays in the build so old replays
// (and this package's exported JSON) keep resolving.
export const balanceVersionSchema = z.object({
  id: idSchema,
  releasedAt: z.string().datetime(),
  changeNotes: z.string().optional(),
});
export type BalanceVersion = z.infer<typeof balanceVersionSchema>;
