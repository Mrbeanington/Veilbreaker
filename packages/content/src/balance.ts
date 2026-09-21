import { z } from "zod";
import { CHARACTER_LIBRARY, ABILITY_LIBRARY, PASSIVE_LIBRARY, TRANSFORMATION_LIBRARY, SUMMON_LIBRARY } from "./data/characters/index";
import { STATUS_LIBRARY as STATUSES } from "./data/statuses";
import { abilitySchema } from "./schemas/ability";
import { characterDefinitionSchema } from "./schemas/character";
import { energyRulesSchema, type EnergyRules } from "./schemas/config";
import { passiveDefinitionSchema } from "./schemas/passive";
import { statusDefinitionSchema } from "./schemas/status";
import { transformationSchema } from "./schemas/transformation";
import { idSchema } from "./schemas/common";
import energyRulesJson from "./config/energy-rules.json";
import release2 from "./balance-patches/release-2.json";
import release3 from "./balance-patches/release-3.json";
import release4 from "./balance-patches/release-4.json";

// phase-12 / spec/06 "Balance tools": a balance change is *data*, never source.
// A BalanceDraft lists numeric edits by path; applying it to the shipped
// libraries gives a new, schema-validated set of libraries for the engine.
// Every shipped version stays resolvable (`librariesForVersion`) so old
// replays keep running under the numbers they were recorded with.
//
// This file is pure and small on purpose: the game itself needs it to resolve
// a replay's version. The editor, simulation dashboard and everything else
// that is developer-only lives in apps/web/src/dev and is kept out of
// production builds.

export const BALANCE_FORMAT = "veilbreak-balance";
/**
 * The numbers the first public release shipped with (they include the phase-15
 * pass). Replays recorded under the earlier development id `phase-05-v1` are
 * reported as an unknown version rather than replayed with different numbers.
 */
export const BASE_BALANCE_VERSION_ID = "release-1";

/** Live energy rules. Shared with the engine's default deps; `activateBalance` may patch it in place. */
export const defaultEnergyRules: EnergyRules = energyRulesSchema.parse(energyRulesJson);

export interface BalanceLibraries {
  characters: typeof CHARACTER_LIBRARY;
  abilities: typeof ABILITY_LIBRARY;
  passives: typeof PASSIVE_LIBRARY;
  statuses: typeof STATUSES;
  transformations: typeof TRANSFORMATION_LIBRARY;
  summons: typeof SUMMON_LIBRARY;
  energyRules: EnergyRules;
}

let pristine: BalanceLibraries | null = null;

/**
 * The libraries exactly as released in BASE_BALANCE_VERSION_ID. Shared, never
 * mutate. Before any patch is activated these are the live objects; activation
 * snapshots them first, so the base stays the base.
 */
export function baseLibraries(): BalanceLibraries {
  if (pristine) return pristine;
  return {
    characters: CHARACTER_LIBRARY,
    abilities: ABILITY_LIBRARY,
    passives: PASSIVE_LIBRARY,
    statuses: STATUSES,
    transformations: TRANSFORMATION_LIBRARY,
    summons: SUMMON_LIBRARY,
    energyRules: energyRulesSchema.parse(energyRulesJson),
  };
}

// ------------------------------------------------------------- tunables

export type TunableCategory = "hp" | "damage" | "healing" | "cost" | "cooldown" | "duration" | "status" | "transformation" | "rng" | "energy";

export const TUNABLE_CATEGORIES: readonly { id: TunableCategory; label: string }[] = [
  { id: "hp", label: "Health" },
  { id: "damage", label: "Damage" },
  { id: "healing", label: "Healing" },
  { id: "cost", label: "Energy cost" },
  { id: "cooldown", label: "Cooldown" },
  { id: "duration", label: "Duration" },
  { id: "status", label: "Status and effect values" },
  { id: "transformation", label: "Transformation requirements" },
  { id: "rng", label: "Random weights" },
  { id: "energy", label: "Energy rules" },
];

export interface Tunable {
  /** `library/id/json/path`, for example `abilities/ability.tortuga-rex.shell-bash/effects/0/amount`. */
  path: string;
  library: string;
  ownerId: string;
  category: TunableCategory;
  /** What it is, in words a designer can search: "Tortuga Rex: Shell Bash, damage". */
  label: string;
  value: number;
  min: number;
}

type Json = null | boolean | number | string | Json[] | { [key: string]: Json };

const COST_KEYS = new Set(["might", "focus", "spirit", "chaos", "neutral"]);

function classify(library: string, trail: readonly string[], kind: string | undefined): { category: TunableCategory; min: number } | null {
  const key = trail[trail.length - 1] ?? "";
  const parent = trail[trail.length - 2] ?? "";
  if (library === "energyRules") return key === "perLivingCharacter" || key === "poolCap" ? { category: "energy", min: key === "poolCap" ? 1 : 0 } : null;
  if (library === "characters") return key === "baseHp" ? { category: "hp", min: 1 } : null;
  if (key === "maxHp") return { category: "hp", min: 1 };
  if (COST_KEYS.has(key) && (parent === "cost" || trail.includes("energyCostOverrides"))) return { category: "cost", min: 0 };
  if (key === "cooldown" || trail.includes("cooldownOverrides")) return { category: "cooldown", min: 0 };
  if (key === "durationTurns" || (key === "turns" && parent === "duration")) return { category: "duration", min: 0 };
  if (key === "weight") return { category: "rng", min: 1 };
  if (library === "transformations" && trail.includes("trigger") && ["percent", "turn", "amount", "count"].includes(key)) return { category: "transformation", min: 0 };
  if (key === "amount") {
    if (kind === "damage") return { category: "damage", min: 1 };
    if (kind === "heal") return { category: "healing", min: 1 };
    if (kind === "drainEnergy") return { category: "status", min: 1 };
    if (kind === "modifyResource" || kind === "modifyEnergy" || kind === "modifyCooldown") return null; // signed; not a simple tunable
    return null;
  }
  if (key === "healthPercent") return { category: "healing", min: 1 };
  if (key === "stacks") return { category: "status", min: 1 };
  if (key === "maxStacks") return { category: "status", min: 1 };
  if (key === "magnitude") return { category: "status", min: 0 };
  return null;
}

const LIBRARY_KEYS = ["characters", "abilities", "passives", "statuses", "transformations", "summons"] as const;

function nameOf(libs: BalanceLibraries, library: string, id: string): string {
  const entry = (libs as unknown as Record<string, Record<string, { displayName?: string }>>)[library]?.[id];
  return entry?.displayName ?? id;
}

/** Every number the balance tools may change, found by walking the libraries. Order is stable. */
export function listTunables(libs: BalanceLibraries): Tunable[] {
  const out: Tunable[] = [];
  const walk = (library: string, ownerId: string, node: Json, trail: string[], kind: string | undefined) => {
    if (typeof node === "number") {
      if (!Number.isInteger(node)) return;
      const found = classify(library, trail, kind);
      if (!found) return;
      out.push({
        path: [library, ownerId, ...trail].join("/"),
        library,
        ownerId,
        category: found.category,
        label: `${nameOf(libs, library, ownerId)}: ${trail.join(" › ")}${kind ? ` (${kind})` : ""}`,
        value: node,
        min: found.min,
      });
      return;
    }
    if (Array.isArray(node)) {
      node.forEach((child, i) => walk(library, ownerId, child, [...trail, String(i)], kind));
      return;
    }
    if (node && typeof node === "object") {
      const here = typeof node.kind === "string" ? node.kind : kind;
      for (const [k, v] of Object.entries(node)) walk(library, ownerId, v, [...trail, k], here);
    }
  };
  for (const library of LIBRARY_KEYS) {
    const table = libs[library] as Record<string, unknown>;
    for (const id of Object.keys(table).sort()) walk(library, id, table[id] as Json, [], undefined);
  }
  walk("energyRules", "energy-rules", libs.energyRules as unknown as Json, [], undefined);
  return out;
}

// ------------------------------------------------------------- drafts

export const balanceDraftSchema = z.object({
  format: z.literal(BALANCE_FORMAT),
  formatVersion: z.literal(1),
  id: idSchema,
  baseVersionId: idSchema,
  createdAt: z.string().datetime(),
  changeNotes: z.string().max(4000).optional(),
  changes: z.array(z.object({ path: z.string().min(1).max(300), value: z.number().int().min(0).max(100_000) })).max(3000),
});
export type BalanceDraft = z.infer<typeof balanceDraftSchema>;

export function createDraft(id: string, changes: BalanceDraft["changes"] = [], now = new Date(0).toISOString(), changeNotes?: string): BalanceDraft {
  return { format: BALANCE_FORMAT, formatVersion: 1, id, baseVersionId: BASE_BALANCE_VERSION_ID, createdAt: now, changeNotes, changes };
}

export interface DraftDiffRow {
  path: string;
  label: string;
  category: TunableCategory;
  before: number;
  after: number;
}

export type ApplyResult =
  | { ok: true; libs: BalanceLibraries; diff: DraftDiffRow[]; warnings: string[] }
  | { ok: false; errors: string[] };

const clone = <T,>(value: T): T => JSON.parse(JSON.stringify(value)) as T;

function setAtPath(root: Record<string, unknown>, segments: string[], value: number): boolean {
  let node: unknown = root;
  for (const seg of segments.slice(0, -1)) {
    if (!node || typeof node !== "object") return false;
    node = (node as Record<string, unknown>)[seg];
  }
  const last = segments[segments.length - 1];
  if (!node || typeof node !== "object" || last === undefined || typeof (node as Record<string, unknown>)[last] !== "number") return false;
  (node as Record<string, unknown>)[last] = value;
  return true;
}

/**
 * Applies a draft to `base` and validates every touched entry against its
 * schema. Nothing is applied unless the whole draft is valid.
 */
export function applyBalanceDraft(base: BalanceLibraries, input: unknown): ApplyResult {
  const parsed = balanceDraftSchema.safeParse(input);
  if (!parsed.success) return { ok: false, errors: parsed.error.issues.slice(0, 5).map((i) => `${i.path.join(".") || "file"}: ${i.message}`) };
  const draft = parsed.data;

  const tunables = new Map(listTunables(base).map((t) => [t.path, t]));
  const errors: string[] = [];
  const seen = new Set<string>();
  const next: BalanceLibraries = clone(base);
  const diff: DraftDiffRow[] = [];
  const warnings: string[] = [];
  const touched = new Set<string>();

  for (const change of draft.changes) {
    const tunable = tunables.get(change.path);
    if (!tunable) {
      errors.push(`"${change.path}" is not a value the balance tools can change.`);
      continue;
    }
    if (seen.has(change.path)) {
      errors.push(`"${change.path}" is changed twice.`);
      continue;
    }
    seen.add(change.path);
    if (change.value < tunable.min) {
      errors.push(`${tunable.label}: ${change.value} is below the minimum of ${tunable.min}.`);
      continue;
    }
    const [library, ownerId, ...trail] = change.path.split("/");
    const table = library === "energyRules" ? { "energy-rules": next.energyRules } : ((next as unknown as Record<string, Record<string, unknown>>)[library ?? ""] ?? {});
    const owner = (table as Record<string, unknown>)[ownerId ?? ""];
    if (!owner || typeof owner !== "object" || !setAtPath({ v: owner }, ["v", ...trail], change.value)) {
      errors.push(`"${change.path}" no longer exists.`);
      continue;
    }
    touched.add(`${library}/${ownerId}`);
    if (tunable.value !== change.value) diff.push({ path: change.path, label: tunable.label, category: tunable.category, before: tunable.value, after: change.value });
    if ((tunable.category === "damage" || tunable.category === "healing") && change.value % 10 !== 0) warnings.push(`${tunable.label}: ${change.value} is not a multiple of 10 (the damage language).`);
  }
  if (errors.length > 0) return { ok: false, errors };

  const schemas: Record<string, z.ZodTypeAny> = {
    characters: characterDefinitionSchema,
    abilities: abilitySchema,
    passives: passiveDefinitionSchema,
    statuses: statusDefinitionSchema,
    transformations: transformationSchema,
  };
  for (const key of touched) {
    const [library, id] = key.split("/") as [string, string];
    if (library === "energyRules") {
      if (!energyRulesSchema.safeParse(next.energyRules).success) errors.push("The energy rules are no longer valid.");
      continue;
    }
    const schema = schemas[library];
    const entry = (next as unknown as Record<string, Record<string, unknown>>)[library]?.[id];
    if (schema && !schema.safeParse(entry).success) errors.push(`${library}/${id} no longer passes its schema.`);
  }
  if (errors.length > 0) return { ok: false, errors };
  return { ok: true, libs: next, diff, warnings };
}

// ------------------------------------------------------------- versions

/** Balance versions published with the game, oldest first. Each is cumulative against the base. See docs/design/balance-workflow.md. */
export const SHIPPED_BALANCE_PATCHES: readonly BalanceDraft[] = [balanceDraftSchema.parse(release2), balanceDraftSchema.parse(release3), balanceDraftSchema.parse(release4)];

/** The version new matches are recorded under and the UI and engine read: the newest shipped patch, else the base. */
export function currentBalanceVersionId(patches: readonly BalanceDraft[] = SHIPPED_BALANCE_PATCHES): string {
  return patches[patches.length - 1]?.id ?? BASE_BALANCE_VERSION_ID;
}
export const CURRENT_BALANCE_VERSION_ID = currentBalanceVersionId();

/** Libraries for a recorded BalanceVersion id, or null if this build does not know it. Old replays resolve through this. */
export function librariesForVersion(id: string, patches: readonly BalanceDraft[] = SHIPPED_BALANCE_PATCHES): BalanceLibraries | null {
  const base = baseLibraries();
  if (id === BASE_BALANCE_VERSION_ID) return base;
  const patch = patches.find((p) => p.id === id);
  if (!patch) return null;
  const applied = applyBalanceDraft(base, patch);
  return applied.ok ? applied.libs : null;
}

/**
 * Makes the shared live libraries (what tooltips, the roster and the engine's
 * default deps read) carry the newest patch's numbers, in place. Call once at
 * startup on every thread. A no-op when no patch is shipped. Returns the id now active.
 */
export function activateBalance(patches: readonly BalanceDraft[] = SHIPPED_BALANCE_PATCHES): string {
  const id = currentBalanceVersionId(patches);
  if (id === BASE_BALANCE_VERSION_ID) return id;
  const patch = patches[patches.length - 1]!;
  if (!pristine) pristine = clone(baseLibraries());
  const applied = applyBalanceDraft(pristine, patch);
  if (!applied.ok) throw new Error(`Balance patch ${id} is invalid: ${applied.errors.join("; ")}`);
  const live: BalanceLibraries = { characters: CHARACTER_LIBRARY, abilities: ABILITY_LIBRARY, passives: PASSIVE_LIBRARY, statuses: STATUSES, transformations: TRANSFORMATION_LIBRARY, summons: SUMMON_LIBRARY, energyRules: defaultEnergyRules };
  for (const change of patch.changes) {
    const [library, ownerId, ...trail] = change.path.split("/");
    const table = library === "energyRules" ? { "energy-rules": live.energyRules } : (live as unknown as Record<string, Record<string, unknown>>)[library ?? ""];
    setAtPath({ v: (table as Record<string, unknown>)[ownerId ?? ""] }, ["v", ...trail], change.value);
  }
  return id;
}

/** A short fingerprint of every tunable number in `libs`. A test pins the base's, so source numbers cannot drift without a patch. */
export function balanceFingerprint(libs: BalanceLibraries): string {
  let h = 0x811c9dc5;
  for (const t of listTunables(libs)) {
    for (const ch of `${t.path}=${t.value};`) h = Math.imul(h ^ ch.charCodeAt(0), 0x01000193) >>> 0;
  }
  return h.toString(16).padStart(8, "0");
}
