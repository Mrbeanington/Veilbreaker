interface PassDeviceScreenProps {
  playerLabel: string;
  onReady: () => void;
}

// phase-05-local-playable.md "hotseat (two humans, with a pass-the-device
// screen that hides each player's selections)". Rendered instead of the
// match board itself, so the outgoing player's queued actions are never on
// screen while the device changes hands.
export function PassDeviceScreen({ playerLabel, onReady }: PassDeviceScreenProps) {
  return (
    <div className="pass-device panel">
      <h2>Pass the device to {playerLabel}</h2>
      <p className="subtitle">Your opponent's choices are hidden until you're ready.</p>
      <button type="button" className="btn primary" onClick={onReady} autoFocus>
        I'm {playerLabel} — Ready
      </button>
    </div>
  );
}
