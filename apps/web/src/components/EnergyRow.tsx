import type { EnergyPool } from "@veilbreak/engine";

const FAMILY_LABELS: Record<keyof EnergyPool, string> = { MIGHT: "Might", FOCUS: "Focus", SPIRIT: "Spirit", CHAOS: "Chaos" };

export function EnergyRow({ pool }: { pool: EnergyPool }) {
  return (
    <div className="energy-row" aria-label="Energy pool">
      {(Object.keys(FAMILY_LABELS) as (keyof EnergyPool)[]).map((family) => (
        <span key={family} className="energy-chip">
          {FAMILY_LABELS[family]}: {pool[family]}
        </span>
      ))}
    </div>
  );
}
