import type { BattleState } from "@veilbreak/content";

// phase-03-advanced-systems.md "State snapshot and restore (the foundation
// for rewind; see OQ-06)". BattleState is already a plain, JSON-serializable
// structure (CLAUDE.md rule 4: no class instances, no hidden state), so a
// snapshot is a full deep clone — no bespoke (de)serialization format is
// needed, and none should be added ahead of a real use case (CLAUDE.md rule
// 11). A JSON round-trip is used over `structuredClone` so this has no
// dependency on DOM/Node-specific globals being present in every environment
// this pure package might run in (a Web Worker, a Node CLI, a browser tab).
export type BattleStateSnapshot = BattleState;

export function snapshotBattleState(state: BattleState): BattleStateSnapshot {
  return JSON.parse(JSON.stringify(state)) as BattleStateSnapshot;
}

export function restoreFromSnapshot(snapshot: BattleStateSnapshot): BattleState {
  return JSON.parse(JSON.stringify(snapshot)) as BattleState;
}
