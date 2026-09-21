import { mkdirSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { buildArtExport } from "../src/artExport";
import { GLOBAL_ART_LANGUAGE } from "../src/schemas/art";
import { CHARACTER_ART_LIBRARY, CHARACTER_LIBRARY, CHARACTER_VISUAL_BIBLE_LIBRARY, STUB_CHARACTER_IDS } from "../src/data/characters/index";

// Writes docs/art/portrait-prompts.md (or, with `splash`, docs/art/splash-prompts.md): every playable fighter's
// prompt, ready to paste into an image generator (a chat tool such as ChatGPT), grouped by origin. The shared style
// language and negative prompt appear once at the top instead of in every prompt, so each prompt stays short and
// only the character changes. Regenerate with `pnpm art:portraits` or `pnpm art:splashes`. Never edit the output by hand.

const kind = process.argv[2] === "splash" ? "splash" : "portrait";
const splash = kind === "splash";
const out = fileURLToPath(new URL(`../../../docs/art/${kind}-prompts.md`, import.meta.url));
const data = buildArtExport({ characters: Object.values(CHARACTER_LIBRARY), art: CHARACTER_ART_LIBRARY, bibles: CHARACTER_VISUAL_BIBLE_LIBRARY, nonPlayableIds: STUB_CHARACTER_IDS });
const fighters = data.characters.filter((c) => c.playable);

/** The prompt without the shared style line and the closing "no text" clause, which the style block carries. */
function scene(prompt: string): string {
  return prompt
    .replace(`, ${GLOBAL_ART_LANGUAGE}`, "")
    .replace(/, no text, no logo$/, "")
    .replace(/^(square roster-portrait crop, shoulders-up|full-body splash illustration), /, "");
}

const REFERENCE = ["tortuga-rex", "koschei", "zeiron", "yuki-onna"];
const RARITY: Record<string, string> = { CORE: "Core", RARE: "Rare", SECRET: "Secret", LEGENDARY: "Legend" };
const groups = new Map<string, typeof fighters>();
for (const f of fighters) {
  const key = data.culturalGroups.find((g) => g.characters.includes(f.id))?.label ?? "Original";
  groups.set(key, [...(groups.get(key) ?? []), f]);
}
const priority = (name: string) => data.culturalGroups.find((g) => g.label === name)?.priority ?? "low";
const nameOf = (id: string) => CHARACTER_LIBRARY[id]?.displayName ?? id;

const shape = splash ? "a full-body figure in tall 2:3 portrait orientation, head to feet, the whole figure inside the frame" : "a shoulders-up character portrait that reads clearly at small size";
const wanted = splash ? "a tall 2:3 full-body splash illustration" : "a square 1:1 portrait";
const size = splash ? "tall 2:3, at least 768 pixels on the short side" : "square, at least 512 pixels";
const command = splash ? "pnpm art:splashes" : "pnpm art:portraits";

const lines: string[] = [];
lines.push(
  splash ? "# Splash prompts" : "# Portrait prompts",
  "",
  `Generated from the game data (${fighters.length} playable fighters). Do not edit by hand: run \`${command}\`.`,
  "",
  "## How to use this file",
  "",
  `1. **Start a chat** with your image generator and paste the **style block** below as your first message. Say you will send characters one at a time and want ${wanted} for each.`,
  splash
    ? "2. **Match the portraits.** Attach the fighter's approved portrait (and a reference image) and ask for the same face, colours and painting style. If a batch drifts from the look you approved, change the style block, never a single prompt, and redo it."
    : "2. **Make the reference set first**: the four fighters listed below, one at a time. Look at all four together. If they do not look like one game, change the style block (never a single prompt) and redo them. Keep the four you approve.",
  "3. **Run the rest in batches** of one origin group per chat. Start each chat with the style block and attach one approved reference image.",
  "4. For each fighter, paste its prompt. **Reject** any image with letters, a logo, a watermark or a signature, a cropped head or feet, or extra or missing limbs, and ask for another.",
  `5. **Save each approved image** as \`<id>.${kind}.png\` (the file name is under every heading), ${size}. Put them all in one folder and run \`pnpm art:import <folder>\`. It shrinks them to the game's size and reports anything missing.`,
  "6. Groups marked **cultural review** draw on living traditions. Treat their art as a draft until someone from or expert in that tradition has looked at it (OQ-12).",
  "",
  "## Style block (paste once at the start of every chat)",
  "",
  "```text",
  `I am making ${kind} art for an original 3v3 fantasy arena game. I will describe one character at a time. For each, make ONE ${splash ? "tall 2:3" : "square 1:1"} image: ${shape}, on a plain dark neutral background.`,
  "",
  `Style, the same for every image: ${GLOBAL_ART_LANGUAGE}.`,
  "",
  `Never include: ${data.globalNegativePrompt}. There must be no writing of any kind anywhere in the image. Do not imitate any living artist, studio, game or franchise.`,
  "```",
  "",
);
if (!splash) {
  lines.push("## Reference set (make these four first)", "");
  for (const id of REFERENCE) {
    const f = fighters.find((x) => x.id === id);
    if (f) lines.push(`- **${nameOf(id)}** (${RARITY[f.rarity] ?? f.rarity}, ${f.culturalGroup}): \`${id}.${kind}.png\``);
  }
  lines.push("", "They cover a starter, a Secret, a Legend and a high-priority cultural group, so the look has to hold across very different designs.", "");
}

// A splash is bigger art, so the Legends come first as their own section.
const sections: [string, typeof fighters][] = [...groups].sort((a, b) => a[0].localeCompare(b[0]));
if (splash) sections.unshift(["Legends (do these first)", fighters.filter((f) => f.rarity === "LEGENDARY")]);
for (const [groupName, list] of sections) {
  const review = priority(groupName) === "high" ? " (cultural review: high priority)" : priority(groupName) === "medium" ? " (cultural review: medium priority)" : "";
  lines.push(`## ${groupName}${review}`, "", `${list.length} fighters.`, "");
  for (const f of [...list].sort((a, b) => nameOf(a.id).localeCompare(nameOf(b.id)))) {
    const asset = f.assets.find((a) => a.kind === kind);
    if (!asset) continue;
    lines.push(`### ${nameOf(f.id)}`, "", `${RARITY[f.rarity] ?? f.rarity} · file: \`${f.id}.${kind}.png\``, "", "```text", scene(asset.prompt), "```", "");
  }
}

mkdirSync(dirname(out), { recursive: true });
writeFileSync(out, `${lines.join("\n")}\n`);
console.log(`Wrote ${out}: ${fighters.length} prompts in ${groups.size} groups`);
