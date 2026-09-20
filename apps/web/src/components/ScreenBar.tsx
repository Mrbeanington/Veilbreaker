import { useLayoutEffect, useRef, useState } from "react";

interface ScreenBarProps {
  onBack: () => void;
  backLabel?: string;
  /** The screen's main action (Start match, Create invite...). It stays in reach while the page scrolls. */
  action?: { label: string; onClick: () => void; disabled?: boolean };
  /** A short line between the two, such as "2 of 3 picked". */
  status?: string;
}

/**
 * Back and the primary action, pinned under the main navigation. On a long page
 * (a roster of 119 fighters) they used to sit at the very bottom, so leaving or
 * starting meant scrolling all the way down (ADR-037).
 */
export function ScreenBar({ onBack, backLabel = "Back", action, status }: ScreenBarProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [top, setTop] = useState(0);

  // Sit exactly under the sticky main navigation, whatever the text size setting makes its height.
  useLayoutEffect(() => {
    const nav = document.querySelector<HTMLElement>(".main-nav");
    if (!nav) return;
    const measure = () => setTop(nav.offsetHeight);
    measure();
    if (typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(measure);
    observer.observe(nav);
    return () => observer.disconnect();
  }, []);

  return (
    <div className="screen-bar" ref={ref} style={{ top }}>
      <button type="button" className="btn" onClick={onBack}>
        {backLabel}
      </button>
      {status && (
        <span className="screen-bar-status" role="status">
          {status}
        </span>
      )}
      {action && (
        <button type="button" className="btn primary" disabled={action.disabled} onClick={action.onClick}>
          {action.label}
        </button>
      )}
    </div>
  );
}
