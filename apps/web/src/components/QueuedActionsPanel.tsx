import { ABILITY_LIBRARY, CHARACTER_LIBRARY } from "@veilbreak/content";
import type { PlayerAction } from "@veilbreak/engine";

interface QueuedActionsPanelProps {
  actions: Record<string, PlayerAction>;
  skipped: ReadonlySet<string>;
  readyCharacterIds: string[];
  onCancel: (characterId: string) => void;
  onConfirm: () => void;
}

function targetSummary(targetIds: string[]): string {
  if (targetIds.length === 0) return "";
  return ` → ${targetIds.map((id) => CHARACTER_LIBRARY[id]?.displayName ?? id).join(", ")}`;
}

// phase-05-local-playable.md "a queued-actions panel with cancel/confirm".
export function QueuedActionsPanel({ actions, skipped, readyCharacterIds, onCancel, onConfirm }: QueuedActionsPanelProps) {
  const allResolved = readyCharacterIds.every((id) => actions[id] || skipped.has(id));

  return (
    <div className="panel">
      <div className="section-title">Queued actions</div>
      {readyCharacterIds.length === 0 && <p className="hp-text">No one on this team can act this turn.</p>}
      {readyCharacterIds.map((characterId) => {
        const action = actions[characterId];
        const isSkipped = skipped.has(characterId);
        const characterName = CHARACTER_LIBRARY[characterId]?.displayName ?? characterId;
        let summary = " — choose an action";
        if (action) summary = `: ${ABILITY_LIBRARY[action.abilityId]?.displayName ?? action.abilityId}${targetSummary(action.targetIds)}`;
        else if (isSkipped) summary = ": passes this turn";
        return (
          <div key={characterId} className="character-name-row" style={{ marginBottom: 6 }}>
            <span>
              {characterName}
              {summary}
            </span>
            {(action || isSkipped) && (
              <button type="button" className="btn" onClick={() => onCancel(characterId)}>
                Change
              </button>
            )}
          </div>
        );
      })}
      <button type="button" className="btn primary" disabled={!allResolved} onClick={onConfirm} style={{ marginTop: 10 }}>
        Confirm turn
      </button>
    </div>
  );
}
