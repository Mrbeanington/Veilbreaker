import type { TutorialTip } from "../game/tutorial";
import { useNavHeight } from "./useNavHeight";

interface TutorialCoachProps {
  tip: TutorialTip;
  onSkip: () => void;
}

/** One short tip pinned above the match, with a way out. It never blocks the board. */
export function TutorialCoach({ tip, onSkip }: TutorialCoachProps) {
  const top = useNavHeight();
  return (
    <aside className="coach" aria-label="Tutorial tip" aria-live="polite" style={{ top }}>
      <div className="coach-text">
        <strong>{tip.title}</strong>
        <span>{tip.text}</span>
      </div>
      <button type="button" className="btn" onClick={onSkip}>
        Skip tutorial
      </button>
    </aside>
  );
}
