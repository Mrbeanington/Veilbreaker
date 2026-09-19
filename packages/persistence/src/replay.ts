import { z } from "zod";
import { energyRulesSchema } from "@veilbreak/content";
import type { KeyValueStore } from "./store";

// spec/02 "Replays and determinism": same seed + same actions + same balance
// version = identical result. A replay is therefore just the setup and the
// actions chosen each turn; the viewer re-runs the engine. The energy rules in
// force are stored too, because they are balance data that can change.
const actionSchema = z.object({
  playerId: z.string().min(1).max(30),
  characterId: z.string().min(1).max(80),
  abilityId: z.string().min(1).max(120),
  targetIds: z.array(z.string().max(80)).max(6),
});

export const replayRecordSchema = z.object({
  version: z.literal(1),
  id: z.string().min(1).max(60),
  playedAt: z.number().int().min(0),
  mode: z.enum(["bot", "hotseat", "trial", "friend", "ranked"]),
  seed: z.number().int().min(0),
  balanceVersionId: z.string().min(1).max(60),
  energyRules: energyRulesSchema,
  teamAIds: z.array(z.string().min(1).max(80)).min(1).max(6),
  teamBIds: z.array(z.string().min(1).max(80)).min(1).max(6),
  /** One entry per resolved turn, including turns a Nameless One rewind replayed. */
  turns: z
    .array(
      z.object({
        a: z.array(actionSchema).max(6),
        b: z.array(actionSchema).max(6),
        /** Friend matches mix both players' salts into the RNG each turn; this is the resulting RNG state, applied before the turn. */
        rng: z.string().regex(/^\d{1,10}$/).optional(),
      }),
    )
    .max(200),
  winnerPlayerId: z.string().nullable(),
});
export type ReplayRecord = z.infer<typeof replayRecordSchema>;

export const MAX_STORED_REPLAYS = 20;
const replayKey = (id: string) => `replay.${id}`;

export async function saveReplay(store: KeyValueStore, replay: ReplayRecord): Promise<void> {
  await store.set(replayKey(replay.id), replay);
  // Keep only the newest MAX_STORED_REPLAYS replays.
  const keys = (await store.keys()).filter((k) => k.startsWith("replay."));
  if (keys.length <= MAX_STORED_REPLAYS) return;
  const dated = await Promise.all(
    keys.map(async (k) => {
      const parsed = replayRecordSchema.safeParse(await store.get(k));
      return { key: k, at: parsed.success ? parsed.data.playedAt : 0 };
    }),
  );
  dated.sort((x, y) => x.at - y.at);
  for (const old of dated.slice(0, dated.length - MAX_STORED_REPLAYS)) await store.delete(old.key);
}

export async function loadReplay(store: KeyValueStore, id: string): Promise<ReplayRecord | null> {
  const parsed = replayRecordSchema.safeParse(await store.get(replayKey(id)));
  return parsed.success ? parsed.data : null;
}

export async function listReplays(store: KeyValueStore): Promise<ReplayRecord[]> {
  const out: ReplayRecord[] = [];
  for (const key of (await store.keys()).filter((k) => k.startsWith("replay."))) {
    const parsed = replayRecordSchema.safeParse(await store.get(key));
    if (parsed.success) out.push(parsed.data);
  }
  return out.sort((a, b) => b.playedAt - a.playedAt);
}
