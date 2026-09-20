import { mkdirSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { buildArtExport } from "../src/artExport";
import { GLOBAL_ART_LANGUAGE } from "../src/schemas/art";
import { CHARACTER_ART_LIBRARY, CHARACTER_LIBRARY, CHARACTER_VISUAL_BIBLE_LIBRARY, STUB_CHARACTER_IDS } from "../src/data/characters/index";

// Writes docs/art/portrait-prompts.md: every playable fighter's portrait prompt, ready to paste into an
// image generator (a chat tool such as ChatGPT), grouped by origin. The shared style language and negative
// prompt appear once at the top instead of in every prompt, so each prompt stays short and only the
// character changes. Regenerate with `pnpm art:portraits`. Never edit the output by hand.

const out = fileURLToPath(new URL("../../../docs/art/portrait-prompts.md", import.meta.url));
const data = buildArtExport({ characters: Object.values(CHARACTER_LIBRARY), art: CHARACTER_ART_LIBRARY, bibles: CHARACTER_VISUAL_BIBLE_LIBRARY, nonPlayableIds: STUB_CHARACTER_IDS });
const fighters = data.characters.filter((c) => c.playable);

/** The prompt without the shared style line and the closing "no text" clause, which the style block carries. */
function scene(prompt: string): string {
  return prompt
    .replace(`, ${GLOBAL_ART_LANGUAGE}`, "")
    .replace(/, no text, no logo$/, "")
    .replace(/^square roster-portrait crop, shoulders-up, /, "");
}

const REFERENCE = ["tortuga-rex", "koschei", "zeiron", "yuki-onna"];
const RARITY: Record<string, string> = { CORE: "Core", RARE: "Rare", SECRET: "Secret", LEGENDARY: "Legend" };
const groups = new Map<string, typeof fighters>();
for (const f of fighters) {
  const key = data.culturalGroups.find((g) => g.characters.includes(f.id))?.label ?? "Original";
  groups.set(key, [...(groups.get(key) ?? []), f]);
}
const priority = (label: string) => data.culturalGroups.find((g) => g.label === label)?.priority ?? "low";

const lines: string[] = [];
lines.push(
  "# Portrait prompts",
  "",
  `Generated from the game data (${fighters.length} playable fighters). Do not edit by hand: run \`pnpm art:portraits\`.`,
  "",
  "## How to use this file",
  "",
  "1. **Start a chat** with your image generator and paste the **style block** below as your first message. Say you will send characters one at a time and want a square 1:1 portrait for each.",
  "2. **Make the reference set first**: the four fighters listed below, one at a time. Look at all four together. If they do not look like one game, change the style block (never a single prompt) and redo them. Keep the four you approve.",
  "3. **Run the rest in batches** of one origin group per chat. Start each chat with the style block and attach one approved reference image, telling the generator to match its painting style, framing and lighting.",
  "4. For each fighter, paste its prompt. **Reject** any image with letters, a logo, a watermark or a signature, a cropped head, or extra or missing limbs, and ask for another.",
  "5. **Save each approved image** as `<id>.portrait.png` (the file name is under every heading), square, at least 512 pixels. Put them all in one folder and run `pnpm art:import <folder>`. It shrinks them to the game's size and reports anything missing.",
  "6. Groups marked **cultural review** draw on living traditions. Treat their art as a draft until someone from or expert in that tradition has looked at it (OQ-12).",
  "",
  "## Style block (paste once at the start of every chat)",
  "",
  "```text",
  "I am making portraits for an original 3v3 fantasy arena game. I will describe one character at a time. For each, make ONE square 1:1 image: a shoulders-up character portrait that reads clearly at small size, on a plain dark neutral background.",
  "",
  `Style, the same for every image: ${GLOBAL_ART_LANGUAGE}.`,
  "",
  `Never include: ${data.globalNegativePrompt}. There must be no writing of any kind anywhere in the image. Do not imitate any living artist, studio, game or franchise.`,
  "```",
  "",
  "## Reference set (make these four first)",
  "",
);
for (const id of REFERENCE) {
  const f = fighters.find((x) => x.id === id);
  if (f) lines.push(`- **${CHARACTER_LIBRARY[id]?.displayName ?? id}** (${RARITY[f.rarity] ?? f.rarity}, ${f.culturalGroup}): \`${id}.portrait.png\``);
}
lines.push("", "They cover a starter, a Secret, a Legend and a high-priority cultural group, so the look has to hold across very different designs.", "");

for (const [label, list] of [...groups].sort((a, b) => a[0].localeCompare(b[0]))) {
  const review = priority(label) === "high" ? " (cultural review: high priority)" : priority(label) === "medium" ? " (cultural review: medium priority)" : "";
  lines.push(`## ${label}${review}`, "", `${list.length} fighters.`, "");
  for (const f of [...list].sort((a, b) => (CHARACTER_LIBRARY[a.id]?.displayName ?? a.id).localeCompare(CHARACTER_LIBRARY[b.id]?.displayName ?? b.id))) {
    const portrait = f.assets.find((a) => a.kind === "portrait");
    if (!portrait) continue;
    lines.push(`### ${CHARACTER_LIBRARY[f.id]?.displayName ?? f.id}`, "", `${RARITY[f.rarity] ?? f.rarity} · file: \`${f.id}.portrait.png\``, "", "```text", scene(portrait.prompt), "```", "");
  }
}

mkdirSync(dirname(out), { recursive: true });
writeFileSync(out, `${lines.join("\n")}\n`);
console.log(`Wrote ${out}: ${fighters.length} prompts in ${groups.size} groups`);
