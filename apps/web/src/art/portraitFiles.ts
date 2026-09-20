// How a file name from an image generator maps to a fighter (used by `pnpm art:import`).
// Accepted: `<id>.portrait.png`, `<id>.png`, in png, jpg, jpeg or webp, any letter case.
const NAME = /^(.+?)(?:\.portrait)?\.(png|jpe?g|webp)$/i;

export function fighterIdFromFileName(fileName: string): string | undefined {
  const match = NAME.exec(fileName.trim());
  return match?.[1]?.toLowerCase();
}

export const PORTRAIT_SIZE = 256;
export const MIN_SOURCE_SIZE = 512;

export interface SourceCheck {
  ok: boolean;
  warnings: string[];
}

/** Warnings for a source image: too small to shrink cleanly, or far from square (the crop would cut the character). */
export function checkSource(width: number, height: number): SourceCheck {
  const warnings: string[] = [];
  if (Math.min(width, height) < MIN_SOURCE_SIZE) warnings.push(`only ${width}x${height}; ${MIN_SOURCE_SIZE} pixels or more is better`);
  const ratio = width / height;
  if (ratio < 0.95 || ratio > 1.05) warnings.push(`${width}x${height} is not square, so the edges are cropped`);
  return { ok: width > 0 && height > 0, warnings };
}
