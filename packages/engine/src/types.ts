// Shared between effects.ts, damage.ts, statuses.ts, and targeting.ts. Kept
// in its own file (rather than defined in effects.ts, where it started in
// Phase 01) because damage.ts and effects.ts each need to produce these and
// each other's functions, which would otherwise create a circular import.
export interface AppliedEvent {
  type: string;
  sourceId?: string;
  targetId?: string;
  payload?: Record<string, unknown>;
}
