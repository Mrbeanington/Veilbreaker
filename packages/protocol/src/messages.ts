import { z } from "zod";
import { packCode, unpackCode } from "@veilbreak/persistence";
import { HEX_64 } from "./hash";

// spec/06 "Friend match by code": message types are setup, commit, reveal,
// state-hash and resign. Messages travel in bundles (a compact, compressed,
// checksummed code that fits a URL fragment). Everything here is untrusted
// input, so every field is length-limited and validated before use.

export const roleSchema = z.enum(["playerA", "playerB"]);
export type Role = z.infer<typeof roleSchema>;

const id = z.string().min(1).max(80);
const hex = z.string().regex(HEX_64);

export const actionSchema = z.object({
  characterId: id,
  abilityId: id.max(120),
  targetIds: z.array(id).max(6),
});
export type Action = z.infer<typeof actionSchema>;

export const messageSchema = z.union([
  z.object({
    type: z.literal("setup"),
    role: roleSchema,
    matchId: z.string().regex(/^[0-9a-f]{16}$/),
    balanceVersionId: z.string().min(1).max(60),
    contentHash: hex,
    unlockRule: z.enum(["own", "all"]),
    team: z.array(id).min(1).max(6),
    /** Host only: SHA-256 commitment to its seed contribution. */
    seedCommit: hex.optional(),
    /** Guest only: its seed contribution, in the clear (the host's is already committed). */
    seedContribution: hex.optional(),
  }),
  z.object({ type: z.literal("commit"), step: z.number().int().min(0).max(1000), commitment: hex }),
  z.object({ type: z.literal("reveal"), kind: z.literal("seed"), seedContribution: hex, salt: hex }),
  z.object({ type: z.literal("reveal"), kind: z.literal("turn"), step: z.number().int().min(0).max(1000), actions: z.array(actionSchema).max(6), salt: hex }),
  z.object({ type: z.literal("stateHash"), step: z.number().int().min(0).max(1000), hash: hex }),
  z.object({ type: z.literal("resign"), step: z.number().int().min(0).max(1000) }),
]);
export type Message = z.infer<typeof messageSchema>;

export const bundleSchema = z.object({
  v: z.literal(1),
  match: z.string().regex(/^[0-9a-f]{16}$/),
  from: roleSchema,
  /** Absolute index (in the sender's outbox) of the first message here. */
  start: z.number().int().min(0).max(100_000),
  /** How many of the receiver's messages the sender has already processed. */
  ack: z.number().int().min(0).max(100_000),
  msgs: z.array(messageSchema).max(64),
  /** The sender's latest state hash, checked against ours (desync detection). */
  sh: z.object({ step: z.number().int().min(0).max(1000), hash: hex }).optional(),
});
export type Bundle = z.infer<typeof bundleSchema>;

export const BUNDLE_PREFIX = "VM1.";

export function encodeBundle(bundle: Bundle): string {
  return packCode(BUNDLE_PREFIX, bundle);
}

export type BundleDecode = { ok: true; bundle: Bundle } | { ok: false; error: string };

/** Accepts a bare code or a whole link with `#match=<code>`. Never throws. */
export function decodeBundle(input: string): BundleDecode {
  const code = /#match=([A-Za-z0-9_.-]+)/.exec(input)?.[1] ?? input;
  const unpacked = unpackCode(BUNDLE_PREFIX, code);
  if (!unpacked.ok) return { ok: false, error: unpacked.error };
  const parsed = bundleSchema.safeParse(unpacked.json);
  if (!parsed.success) return { ok: false, error: "That match code is damaged." };
  return { ok: true, bundle: parsed.data };
}

export function matchLink(origin: string, code: string): string {
  return `${origin}#match=${code}`;
}
