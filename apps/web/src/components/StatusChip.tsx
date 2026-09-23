import { useEffect, useRef, useState } from "react";
import { STATUS_LIBRARY, type ActiveStatus } from "@veilbreak/content";
import { Icon, statusIconName } from "./Icon";

// Playtest feedback: a status chip in a match (e.g. "Poison 5 (3)") gave a beginner no way
// to learn what the status actually does without already knowing the character's kit. The
// chip previously carried its description only in a native `title` attribute, which is slow
// to appear, tiny, and invisible on touch devices. This replaces it with a styled card shown
// on hover (mouse), tap (touch — toggled, closes on an outside tap), and always available to
// screen readers via visually-hidden text read in normal document order (docs/DECISIONS.md
// ADR-055).
export function StatusChip({ active }: { active: ActiveStatus }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLSpanElement>(null);
  const def = STATUS_LIBRARY[active.statusId];
  const label = def?.displayName ?? active.statusId;
  const magnitudeLabel = active.magnitude > 0 ? ` ${active.magnitude * active.stacks}` : "";
  const durationLabel = active.remainingTurns !== null ? ` (${active.remainingTurns})` : "";

  useEffect(() => {
    if (!open) return;
    const closeIfOutside = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("click", closeIfOutside);
    return () => document.removeEventListener("click", closeIfOutside);
  }, [open]);

  return (
    <span
      ref={ref}
      className="status-chip"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onClick={(event) => {
        // A status chip sits inside a card that is itself a click target for aiming an
        // ability (CharacterCard). Without this, tapping a chip to read it would also
        // submit that character as the target.
        event.stopPropagation();
        setOpen((current) => !current);
      }}
    >
      <Icon name={statusIconName(active.statusId)} size={12} /> {label}
      {magnitudeLabel}
      {durationLabel}
      {def?.tooltip && <span className="sr-only"> — {def.tooltip}</span>}
      {open && def?.tooltip && (
        <span className="status-popover" role="tooltip">
          <strong className="status-popover-name">{label}</strong>
          <span>{def.tooltip}</span>
        </span>
      )}
    </span>
  );
}
