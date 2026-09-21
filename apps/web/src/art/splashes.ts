// ADR-047: full-body splash art, optional per fighter like the portrait (see portraits.ts). A file
// `<id>.webp` in ./splashes (made by `pnpm art:import` from `<id>.splash.png`) is shown at the top of
// the fighter's Codex and Characters sheet. Fighters without one show nothing extra.
const files = import.meta.glob("./splashes/*.webp", { eager: true, query: "?url", import: "default" }) as Record<string, string>;

const urls: Record<string, string> = {};
for (const [path, url] of Object.entries(files)) {
  const id = /([^/]+)\.webp$/.exec(path)?.[1];
  if (id) urls[id] = url;
}

export function splashUrl(characterId: string): string | undefined {
  return urls[characterId];
}

export function splashIds(): string[] {
  return Object.keys(urls).sort();
}
