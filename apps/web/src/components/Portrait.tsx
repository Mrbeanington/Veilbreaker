import { portraitUrl } from "../art/portraits";
import { portraitColor, portraitInitials } from "../game/portrait";

interface PortraitProps {
  characterId: string;
  displayName: string;
  size?: number;
}

export function Portrait({ characterId, displayName, size = 40 }: PortraitProps) {
  const url = portraitUrl(characterId);
  if (url) {
    // Decorative: the fighter's name is always shown next to the picture.
    return (
      <span className="portrait portrait-art" style={{ width: size, height: size, background: portraitColor(characterId) }} aria-hidden="true">
        <img src={url} alt="" width={size} height={size} loading="lazy" decoding="async" draggable={false} />
      </span>
    );
  }
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
