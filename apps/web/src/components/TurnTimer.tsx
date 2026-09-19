interface TurnTimerProps {
  secondsLeft: number;
}

// spec/05 "turn timer" — purely a display; MatchScreen owns the actual
// countdown and what happens when it reaches zero.
export function TurnTimer({ secondsLeft }: TurnTimerProps) {
  return (
    <span className="energy-chip" aria-label="Time remaining this turn">
      ⏱ {secondsLeft}s
    </span>
  );
}
