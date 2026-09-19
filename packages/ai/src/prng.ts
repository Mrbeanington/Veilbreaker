// Seeded PRNG for bots and the simulator (mulberry32). Kept separate from the
// engine's in-state RNG on purpose: bot choices must never consume or disturb
// the battle's own random stream, and a simulation run must be reproducible
// from `--seed` alone. Not part of packages/engine, so CLAUDE.md rule 4's
// determinism ban on Math.random is met by never calling it here.
export type Random = () => number;

export function createRandom(seed: number): Random {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function pickOne<T>(items: readonly T[], random: Random): T | undefined {
  if (items.length === 0) return undefined;
  return items[Math.floor(random() * items.length)];
}

export function shuffled<T>(items: readonly T[], random: Random): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1));
    [copy[i], copy[j]] = [copy[j] as T, copy[i] as T];
  }
  return copy;
}
