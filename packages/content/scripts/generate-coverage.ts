import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { generateCoverageMarkdown } from "../src/coverage";

const outPath = fileURLToPath(new URL("../coverage.md", import.meta.url));
writeFileSync(outPath, generateCoverageMarkdown(), "utf8");
console.log(`Wrote ${outPath}`);
