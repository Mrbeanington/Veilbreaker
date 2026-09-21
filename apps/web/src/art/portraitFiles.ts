// How a file name from an image generator maps to a fighter and a kind of art (used by `pnpm art:import`).
// Accepted: `<id>.portrait.png`, `<id>.splash.png` and a bare `<id>.png` (a portrait), in png, jpg, jpeg or webp,
// any letter case.
export type ArtKind = "portrait" | "splash";

const NAME = /^(.+?)(?:.(portrait|splash))?.(png|jpe?g|webp)$/i;

export function parseArtFileName(fileName: string): { id: string; kind: ArtKind } | undefined {
  const match = NAME.exec(fileName.trim());
  if (!match?.[1]) return undefined;
  return { id: match[1].toLowerCase(), kind: (match[2]?.toLowerCase() as ArtKind | undefined) ?? "portrait" };
}

/** The fighter id from a file name, whatever the kind. */
export function fighterIdFromFileName(fileName: string): string | undefined {
  return parseArtFileName(fileName)?.id;
}

/** Output size and quality per kind: a 256 pixel square portrait and a 400 by 600 splash. */
export const ART_SPECS: Record<ArtKind, { width: number; height: number; quality: number; minSource: number }> = {
  portrait: { width: 256, height: 256, quality: 82, minSource: 512 },
  splash: { width: 400, height: 600, quality: 76, minSource: 768 },
};
export const PORTRAIT_SIZE = ART_SPECS.portrait.width;
export const MIN_SOURCE_SIZE = ART_SPECS.portrait.minSource;

export interface SourceCheck {
  ok: boolean;
  warnings: string[];
}

/** Warnings for a source image: too small to shrink cleanly, or the wrong shape (the crop would cut the character). */
export function checkSource(width: number, height: number, kind: ArtKind = "portrait"): SourceCheck {
  const spec = ART_SPECS[kind];
  const warnings: string[] = [];
  if (Math.min(width, height) < spec.minSource) warnings.push(`only ${width}x${height}; ${spec.minSource} pixels on the short side or more is better`);
  const want = spec.width / spec.height;
  const ratio = width / height;
  if (ratio < want * 0.95 || ratio > want * 1.05) warnings.push(`${width}x${height} is not ${kind === "splash" ? "2:3 (portrait orientation)" : "square"}, so the edges are cropped`);
  return { ok: width > 0 && height > 0, warnings };
}
