import { mkdirSync, readdirSync, statSync } from "node:fs";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";
import { PLAYABLE_CHARACTERS } from "@veilbreak/content";
import { PORTRAIT_SIZE, checkSource, fighterIdFromFileName } from "../src/art/portraitFiles";

// Usage: pnpm art:import <folder of generated images>
// Shrinks each `<id>.portrait.png` to a 256 pixel square WebP in apps/web/src/art/portraits, so the
// game stays small (about 15 KB a portrait) and works offline. Prints what was imported, what did
// not match a fighter, and which fighters still have no portrait. Dev tool only: never shipped.
// pnpm runs scripts from apps/web, so a relative folder is resolved from where the command was typed.
const input = process.argv[2] ? resolve(process.env.INIT_CWD ?? process.cwd(), process.argv[2]) : undefined;
if (!input) {
  console.error("usage: pnpm art:import <folder>");
  process.exit(1);
}
const outDir = resolve(fileURLToPath(new URL("../src/art/portraits", import.meta.url)));
mkdirSync(outDir, { recursive: true });

const known = new Set(PLAYABLE_CHARACTERS.map((c) => c.id));
let imported = 0;
let bytes = 0;
const unknown: string[] = [];
const warned: string[] = [];

for (const name of readdirSync(input).sort()) {
  const path = join(input, name);
  if (!statSync(path).isFile()) continue;
  const id = fighterIdFromFileName(name);
  if (!id) continue;
  if (!known.has(id)) {
    unknown.push(name);
    continue;
  }
  const image = sharp(path);
  const meta = await image.metadata();
  const check = checkSource(meta.width ?? 0, meta.height ?? 0);
  if (!check.ok) {
    warned.push(`${name}: could not read the image`);
    continue;
  }
  for (const w of check.warnings) warned.push(`${name}: ${w}`);
  const file = join(outDir, `${id}.webp`);
  const info = await image.resize(PORTRAIT_SIZE, PORTRAIT_SIZE, { fit: "cover", position: "centre" }).webp({ quality: 82 }).toFile(file);
  imported += 1;
  bytes += info.size;
}

const have = new Set(readdirSync(outDir).filter((f) => f.endsWith(".webp")).map((f) => f.replace(/\.webp$/, "")));
const missing = [...known].filter((id) => !have.has(id)).sort();
console.log(`Imported ${imported} portrait(s), ${(bytes / 1024).toFixed(0)} KB in total.`);
if (warned.length) console.log(`\nCheck these:\n - ${warned.join("\n - ")}`);
if (unknown.length) console.log(`\nNot a known fighter id (renamed?):\n - ${unknown.join("\n - ")}`);
console.log(`\n${have.size} of ${known.size} fighters have a portrait. ${missing.length} still use initials.`);
