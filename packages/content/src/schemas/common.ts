import { z } from "zod";

// Stable kebab-case IDs (CLAUDE.md conventions): tortuga-rex, status.stun,
// ability.tortuga-rex.shell-bash. Dots separate namespace segments; each
// segment is kebab-case.
export const idSchema = z
  .string()
  .min(1)
  .regex(
    /^[a-z0-9]+(?:[-.][a-z0-9]+)*$/,
    "IDs must be stable kebab-case, optionally dot-namespaced (e.g. 'tortuga-rex', 'status.stun').",
  );
export type Id = z.infer<typeof idSchema>;

// spec/01 "Energy": four families, plus a neutral cost any energy can satisfy.
export const energyFamilySchema = z.enum(["MIGHT", "FOCUS", "SPIRIT", "CHAOS"]);
export type EnergyFamily = z.infer<typeof energyFamilySchema>;

// A player's held energy, one amount per family. Deliberately a plain
// z.object rather than `z.record(energyFamilySchema, ...)` — zod v3 infers
// an enum-keyed record's output as `Partial<Record<Family, number>>` (every
// family optional), but a pool always holds a real, non-negative amount in
// every family; treating all four as required avoids `?? 0` fallbacks
// scattered through the engine every time a pool is read.
export const energyPoolSchema = z.object({
  MIGHT: z.number().int().min(0),
  FOCUS: z.number().int().min(0),
  SPIRIT: z.number().int().min(0),
  CHAOS: z.number().int().min(0),
});
export type EnergyPool = z.infer<typeof energyPoolSchema>;

// spec/01 "Archetype tags". An extensible enum: abilities/conditions may
// check tags, so this list is expected to grow as the roster grows.
export const archetypeTagSchema = z.enum([
  "ATTACKER",
  "TANK",
  "DEFENDER",
  "HEALER",
  "SUPPORT",
  "CONTROLLER",
  "ANTI-HEALER",
  "SUMMONER",
  "NECROMANCER",
  "ASSASSIN",
  "BRUISER",
  "EVOLUTION",
  "CHEATER",
  "RANDOM",
  "CURSE",
  "UNDEAD",
  "BEAST",
  "MAGE",
  "WARRIOR",
  "MUSIC",
  "ATHLETE",
  "FOLKLORE",
  "MYTHOLOGY",
  "SECRET",
  "LEGENDARY",
]);
export type ArchetypeTag = z.infer<typeof archetypeTagSchema>;

// spec/02 "Knowledge levels". Every mechanic carries one of these.
export const knowledgeLevelSchema = z.enum(["PUBLIC", "DISCOVERABLE", "TRUE_SECRET"]);
export type KnowledgeLevel = z.infer<typeof knowledgeLevelSchema>;

// spec/01 "Energy": a cost is a bundle of family amounts plus a neutral
// amount that any single family may satisfy. Generation rates, caps, and
// carryover live in EnergyRules (config.ts), never on the cost itself.
export const costSchema = z.object({
  might: z.number().int().min(0).default(0),
  focus: z.number().int().min(0).default(0),
  spirit: z.number().int().min(0).default(0),
  chaos: z.number().int().min(0).default(0),
  neutral: z.number().int().min(0).default(0),
});
export type Cost = z.infer<typeof costSchema>;

// spec/02 "Resource": custom counters such as Souls, Bases, Tails, Tide,
// Feedback, Fouls, Verse stage. phase-03-advanced-systems.md: "generic named
// counters with min/max, display hint, and optional 'track' mode" —
// `displayHint` is free-form UI guidance (e.g. "pips", "bar", "number"),
// bundled with the resource's own definition rather than hard-coded per
// resource id in the (not-yet-built) UI. `trackMode: true` marks a resource
// the UI should keep persistently visible during a match (Malachar's Souls,
// a boss's stage counter), as opposed to one only shown on hover/inspect.
export const resourceSchema = z.object({
  id: idSchema,
  displayName: z.string().min(1),
  startingValue: z.number().int().default(0),
  min: z.number().int().default(0),
  max: z.number().int().optional(),
  visibleToOpponent: z.boolean().default(true),
  displayHint: z.string().optional(),
  trackMode: z.boolean().default(false),
});
export type Resource = z.infer<typeof resourceSchema>;

// A reference to who/what a rule applies to, independent of the ability that
// invoked it (used inside Condition/Trigger, distinct from an ability's own
// TargetRule which selects battle targets to act on).
export const targetRefSchema = z.enum(["self", "source", "target", "ally", "enemy", "any"]);
export type TargetRef = z.infer<typeof targetRefSchema>;

// spec/02 "TargetRule": who an ability/effect can legally target.
export const targetRuleSchema = z.object({
  side: z.enum(["ally", "enemy", "self", "any"]),
  scope: z.enum(["single", "all", "random", "adjacent", "lowestHp", "highestHp"]),
  count: z.number().int().min(1).default(1),
  includeSelf: z.boolean().default(false),
  /** Phase 13: choose from the fallen instead of the living (a resurrection targets the dead). */
  includeDead: z.boolean().optional(),
  filterTags: z.array(archetypeTagSchema).default([]),
});
export type TargetRule = z.infer<typeof targetRuleSchema>;
