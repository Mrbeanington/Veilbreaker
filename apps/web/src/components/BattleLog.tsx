import type { BattleEvent } from "@veilbreak/engine";
import { describeBattleEvent } from "../game/describeEvent";

interface BattleLogProps {
  events: BattleEvent[];
}

// spec/05 "battle log" — a first-class, always-visible record of what the
// engine actually did (CLAUDE.md rule 9: every state change is logged, even
// hidden ones). Rendered newest-first (playtest feedback — the latest turn's
// result is what a player wants without scrolling); new entries appear at
// the top. `events` itself (and every other consumer of it — replays,
// achievements, discovery) stays in chronological order, since this reverses
// only the display, via a display-only copy keyed by each entry's original
// position so keys stay stable as the log grows.
export function BattleLog({ events }: BattleLogProps) {
  const newestFirst = events.map((event, index) => ({ event, index })).reverse();
  return (
    <div className="battle-log" aria-live="polite">
      {events.length === 0 && <div className="battle-log-entry">The battle has not yet begun.</div>}
      {newestFirst.map(({ event, index }) => {
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
