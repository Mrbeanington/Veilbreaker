import { readdirSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { PLAYABLE_CHARACTERS } from "@veilbreak/content";

// Usage: pnpm art:status. Which fighters have a portrait in apps/web/src/art/portraits and which still show initials.
const dir = resolve(fileURLToPath(new URL("../src/art/portraits", import.meta.url)));
const have = new Set(existsSync(dir) ? readdirSync(dir).filter((f) => f.endsWith(".webp")).map((f) => f.replace(/\.webp$/, "")) : []);
const byRarity = new Map<string, { have: number; total: number }>();
for (const c of PLAYABLE_CHARACTERS) {
  const row = byRarity.get(c.rarity) ?? { have: 0, total: 0 };
  row.total += 1;
  if (have.has(c.id)) row.have += 1;
  byRarity.set(c.rarity, row);
}
console.log(`Portraits: ${have.size} of ${PLAYABLE_CHARACTERS.length}`);
for (const [rarity, row] of byRarity) console.log(`  ${rarity}: ${row.have} of ${row.total}`);
const stray = [...have].filter((id) => !PLAYABLE_CHARACTERS.some((c) => c.id === id));
if (stray.length) console.log(`Files that match no fighter: ${stray.join(", ")}`);
