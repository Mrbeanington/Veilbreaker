import data from "./meta-pool.json";
import type { MetaPool } from "./ladder";

// Measured by `pnpm meta` (see scripts/meta.ts); regenerate when the balance changes.
export const META_POOL: MetaPool = data;
