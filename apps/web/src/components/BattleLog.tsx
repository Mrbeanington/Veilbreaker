import type { BattleEvent } from "@veilbreak/engine";
import { describeBattleEvent } from "../game/describeEvent";

interface BattleLogProps {
  events: BattleEvent[];
}

// spec/05 "battle log" — a first-class, always-visible record of what the
// engine actually did (CLAUDE.md rule 9: every state change is logged, even
// hidden ones). Rendered oldest-first; new entries appear at the bottom.
export function BattleLog({ events }: BattleLogProps) {
  return (
    <div className="battle-log" aria-live="polite">
      {events.length === 0 && <div className="battle-log-entry">The battle has not yet begun.</div>}
      {events.map((event, index) => {
        const text = describeBattleEvent(event);
        if (!text) return null;
        return (
          <div className="battle-log-entry" key={index}>
            {text}
          </div>
        );
      })}
    </div>
  );
}
