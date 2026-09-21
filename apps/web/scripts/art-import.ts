import { existsSync, mkdirSync, readdirSync, statSync } from "node:fs";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";
import { PLAYABLE_CHARACTERS } from "@veilbreak/content";
import { ART_SPECS, checkSource, parseArtFileName } from "../src/art/portraitFiles";

// Usage: pnpm art:import <folder of generated images>
// Shrinks each `<id>.portrait.png` to a 256 pixel square WebP in apps/web/src/art/portraits, and each
// `<id>.splash.png` to a 400 by 600 WebP in apps/web/src/art/splashes, so the game stays small (about
// 15 KB a portrait, 40 KB a splash) and works offline. Prints what was imported, what did not match a
// fighter, and which fighters still have no portrait. Dev tool only: never shipped.
// pnpm runs scripts from apps/web, so a relative folder is resolved from where the command was typed.
const input = process.argv[2] ? resolve(process.env.INIT_CWD ?? process.cwd(), process.argv[2]) : undefined;
if (!input) {
  console.error("usage: pnpm art:import <folder>");
  process.exit(1);
}
const outDirs = {
  portrait: resolve(fileURLToPath(new URL("../src/art/portraits", import.meta.url))),
  splash: resolve(fileURLToPath(new URL("../src/art/splashes", import.meta.url))),
};
for (const dir of Object.values(outDirs)) mkdirSync(dir, { recursive: true });

const known = new Set(PLAYABLE_CHARACTERS.map((c) => c.id));
let imported = 0;
let bytes = 0;
const unknown: string[] = [];
const warned: string[] = [];

for (const name of readdirSync(input).sort()) {
  const path = join(input, name);
  if (!statSync(path).isFile()) continue;
  const parsed = parseArtFileName(name);
  if (!parsed) continue;
  const { id, kind } = parsed;
  if (!known.has(id)) {
    unknown.push(name);
    continue;
  }
  const image = sharp(path);
  const meta = await image.metadata();
  const check = checkSource(meta.width ?? 0, meta.height ?? 0, kind);
  if (!check.ok) {
    warned.push(`${name}: could not read the image`);
    continue;
  }
  for (const w of check.warnings) warned.push(`${name}: ${w}`);
  const spec = ART_SPECS[kind];
  const file = join(outDirs[kind], `${id}.webp`);
  // A splash is a full-body figure, so the crop keeps the top (the face) rather than the middle.
  const info = await image
    .resize(spec.width, spec.height, { fit: "cover", position: kind === "splash" ? "top" : "centre" })
    .webp({ quality: spec.quality })
    .toFile(file);
  imported += 1;
  bytes += info.size;
}

const webpIds = (dir: string): string[] => (existsSync(dir) ? readdirSync(dir).filter((f) => f.endsWith(".webp")).map((f) => f.slice(0, -5)) : []);
const have = new Set(webpIds(outDirs.portrait));
const splashes = webpIds(outDirs.splash).length;
const missing = [...known].filter((id) => !have.has(id)).sort();
console.log(`Imported ${imported} image(s), ${(bytes / 1024).toFixed(0)} KB in total.`);
if (warned.length) console.log(`\nCheck these:\n - ${warned.join("\n - ")}`);
if (unknown.length) console.log(`\nNot a known fighter id (renamed?):\n - ${unknown.join("\n - ")}`);
console.log(`\n${have.size} of ${known.size} fighters have a portrait (${missing.length} still use initials) and ${splashes} have a splash.`);
