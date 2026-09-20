// ADR-042: fighter portraits. Real art is optional per fighter: a file named `<id>.webp` in
// ./portraits (made by `pnpm art:import`) replaces the initials badge for that fighter, and every
// other fighter keeps the badge. Vite emits each file with a hashed name, so the service worker
// caches them and the single-file build inlines them, with no code change.
const files = import.meta.glob("./portraits/*.webp", { eager: true, query: "?url", import: "default" }) as Record<string, string>;

const urls: Record<string, string> = {};
for (const [path, url] of Object.entries(files)) {
  const id = /([^/]+)\.webp$/.exec(path)?.[1];
  if (id) urls[id] = url;
}

/** The portrait picture for a fighter, or undefined while it only has initials. */
export function portraitUrl(characterId: string): string | undefined {
  return urls[characterId];
}

/** Ids that have art, for the status report and tests. */
export function portraitIds(): string[] {
  return Object.keys(urls).sort();
}
