import { writeFileSync } from "node:fs";
import { baseLibraries, listTunables } from "../src/balance";

// Dev tool for the phase-15 bake: writes every tunable path and value from the CURRENT source to the file given as the first argument.
const out = process.argv[2];
if (!out) throw new Error("usage: tsx scripts/dump-tunables.ts <file>");
const values: Record<string, number> = {};
for (const t of listTunables(baseLibraries())) values[t.path] = t.value as number;
writeFileSync(out, `${JSON.stringify(values, null, 1)}\n`);
console.log(`${Object.keys(values).length} tunables written to ${out}`);
