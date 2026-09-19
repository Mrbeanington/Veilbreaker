// phase-05-local-playable.md "Placeholder portraits generated from
// character data (no external art)" — OQ-21's stopgap ("initials plus a
// regional color") until real art ships (Phase 14). Both are pure functions
// of the character's own id/name, so no image asset or network call is
// ever involved.

function hashHue(id: string): number {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
  return hash % 360;
}

export function portraitInitials(displayName: string): string {
  const words = displayName.replace(/["“”,]/g, "").split(/\s+/).filter(Boolean);
  const letters = words.slice(0, 2).map((word) => word[0]?.toUpperCase() ?? "");
  return letters.join("") || "?";
}

export function portraitColor(characterId: string): string {
  const hue = hashHue(characterId);
  return `hsl(${hue}, 45%, 32%)`;
}
