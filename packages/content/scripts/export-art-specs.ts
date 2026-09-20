import { mkdirSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { auditArt, summarizeAudit } from "../src/artAudit";
import { buildArtExport } from "../src/artExport";
import { CHARACTER_ART_LIBRARY, CHARACTER_LIBRARY, CHARACTER_VISUAL_BIBLE_LIBRARY, PLAYABLE_CHARACTERS, STUB_CHARACTER_IDS, TRANSFORMATION_LIBRARY } from "../src/data/characters/index";

// phase-14: audit, then export docs/art/art-specs.json. Refuses to export
// while the audit has errors, so a bad prompt never reaches a pipeline.
const findings = auditArt({ characters: PLAYABLE_CHARACTERS, art: CHARACTER_ART_LIBRARY, bibles: CHARACTER_VISUAL_BIBLE_LIBRARY, transformations: TRANSFORMATION_LIBRARY });
if (findings.some((f) => f.level === "error")) {
  console.error(summarizeAudit(findings));
  process.exit(1);
}
const out = fileURLToPath(new URL("../../../docs/art/art-specs.json", import.meta.url));
mkdirSync(dirname(out), { recursive: true });
const data = buildArtExport({ characters: Object.values(CHARACTER_LIBRARY), art: CHARACTER_ART_LIBRARY, bibles: CHARACTER_VISUAL_BIBLE_LIBRARY, nonPlayableIds: STUB_CHARACTER_IDS });
writeFileSync(out, `${JSON.stringify(data, null, 2)}\n`);
console.log(`Wrote ${out}: ${data.counts.characters} characters (${data.counts.playable} playable), ${data.counts.assets} assets`);
