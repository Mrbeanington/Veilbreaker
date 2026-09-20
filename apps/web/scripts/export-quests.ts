import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { QUESTS, STARTER_IDS } from "../src/game/quests";

// A snapshot of every fighter's unlock quest for the wiki page.
// Usage: `pnpm --filter @veilbreak/web exec tsx scripts/export-quests.ts <out.json>`.
const out = resolve(process.argv[2] ?? "quests.json");
const data = {
  starters: STARTER_IDS,
  quests: Object.fromEntries(Object.values(QUESTS).map((q) => [q.characterId, { kind: q.kind, level: q.level, steps: q.steps.map((s) => s.description) }])),
};
mkdirSync(dirname(out), { recursive: true });
writeFileSync(out, JSON.stringify(data));
console.log(`Wrote ${out}: ${data.starters.length} starters, ${Object.keys(data.quests).length} quests`);
