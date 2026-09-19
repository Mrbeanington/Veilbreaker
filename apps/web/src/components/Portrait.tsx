import { portraitColor, portraitInitials } from "../game/portrait";

interface PortraitProps {
  characterId: string;
  displayName: string;
  size?: number;
}

export function Portrait({ characterId, displayName, size = 40 }: PortraitProps) {
  return (
    <span
      className="portrait"
      style={{ width: size, height: size, fontSize: size * 0.38, background: portraitColor(characterId) }}
      aria-hidden="true"
    >
      {portraitInitials(displayName)}
    </span>
  );
}
