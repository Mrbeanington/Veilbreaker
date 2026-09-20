import { auditArt, summarizeAudit } from "../src/artAudit";
import { CHARACTER_ART_LIBRARY, PLAYABLE_CHARACTERS, CHARACTER_VISUAL_BIBLE_LIBRARY, TRANSFORMATION_LIBRARY } from "../src/data/characters/index";

const findings = auditArt({ characters: PLAYABLE_CHARACTERS, art: CHARACTER_ART_LIBRARY, bibles: CHARACTER_VISUAL_BIBLE_LIBRARY, transformations: TRANSFORMATION_LIBRARY });
console.log(summarizeAudit(findings));
if (findings.some((f) => f.level === "error")) process.exitCode = 1;
