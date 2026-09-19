import { balanceDraftSchema, type BalanceDraft } from "@veilbreak/content";
import type { KeyValueStore } from "@veilbreak/persistence";

// Developer-only (phase-12): drafts live in IndexedDB (through the same
// key-value store as the save), never in source files. They are exported as
// JSON to be committed into packages/content.

const PREFIX = "dev.balance.draft.";
export const MAX_DRAFTS = 20;

export async function listDrafts(store: KeyValueStore): Promise<BalanceDraft[]> {
  const keys = (await store.keys()).filter((k) => k.startsWith(PREFIX));
  const out: BalanceDraft[] = [];
  for (const key of keys) {
    const parsed = balanceDraftSchema.safeParse(await store.get(key));
    if (parsed.success) out.push(parsed.data);
  }
  return out.sort((a, b) => b.createdAt.localeCompare(a.createdAt) || a.id.localeCompare(b.id));
}

export async function saveDraft(store: KeyValueStore, draft: BalanceDraft): Promise<void> {
  const checked = balanceDraftSchema.parse(draft);
  const existing = (await store.keys()).filter((k) => k.startsWith(PREFIX));
  if (!existing.includes(PREFIX + checked.id) && existing.length >= MAX_DRAFTS) throw new Error(`At most ${MAX_DRAFTS} drafts can be kept. Delete one first.`);
  await store.set(PREFIX + checked.id, checked);
}

export async function deleteDraft(store: KeyValueStore, id: string): Promise<void> {
  await store.delete(PREFIX + id);
}

/** A draft id from a free-form name: kebab-case, at most 40 characters. */
export function draftIdFrom(name: string, taken: readonly string[]): string {
  const base = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 36) || "draft";
  let id = base;
  for (let n = 2; taken.includes(id); n += 1) id = `${base}-${n}`;
  return id;
}
