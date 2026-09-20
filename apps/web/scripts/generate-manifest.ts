import { mkdirSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { GAME_TITLE } from "@veilbreak/content";

// phase-05-local-playable.md "PWA foundation: a web app manifest (name from
// GAME_TITLE, generated placeholder icons, standalone display)". Run as a
// pre-step of both `dev` and `build` (package.json) rather than from inside
// vite.config.ts itself: Vite's config file is loaded through a minimal
// esbuild pass that treats workspace packages as external, so it can't
// resolve @veilbreak/content's own extensionless internal imports
// (ADR-003) the way `tsx` (already used by packages/content/scripts/
// generate-coverage.ts) or the real app build can. See docs/DECISIONS.md
// ADR-012. Writes into public/, which Vite copies to dist/ verbatim and
// dev-serves directly — both stay in sync with GAME_TITLE automatically.

function iconSvg(size: number): string {
  const initial = GAME_TITLE.trim().charAt(0).toUpperCase() || "V";
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}">` +
    `<rect width="${size}" height="${size}" rx="${size * 0.12}" fill="#1c1729"/>` +
    `<text x="50%" y="54%" font-family="system-ui, sans-serif" font-size="${size * 0.5}" ` +
    `font-weight="700" fill="#e0b34d" text-anchor="middle" dominant-baseline="middle">${initial}</text></svg>`
  );
}

const publicDir = fileURLToPath(new URL("../public", import.meta.url));
mkdirSync(`${publicDir}/icons`, { recursive: true });
writeFileSync(`${publicDir}/icons/icon-192.svg`, iconSvg(192));
writeFileSync(`${publicDir}/icons/icon-512.svg`, iconSvg(512));

const manifest = {
  name: GAME_TITLE,
  short_name: GAME_TITLE,
  description: `${GAME_TITLE} — a client-only 3v3 turn-based arena.`,
  id: "./",
  lang: "en",
  categories: ["games"],
  orientation: "any",
  start_url: "./",
  scope: "./",
  display: "standalone",
  background_color: "#100d18",
  theme_color: "#100d18",
  icons: [
    { src: "./icons/icon-192.svg", sizes: "192x192", type: "image/svg+xml", purpose: "any" },
    { src: "./icons/icon-512.svg", sizes: "512x512", type: "image/svg+xml", purpose: "any" },
  ],
};
writeFileSync(`${publicDir}/manifest.webmanifest`, JSON.stringify(manifest, null, 2));

console.log(`Generated manifest.webmanifest and placeholder icons for "${GAME_TITLE}".`);
