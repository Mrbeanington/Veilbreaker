import { portraitUrl } from "../art/portraits";
import { portraitColor, portraitInitials } from "../game/portrait";

interface PortraitProps {
  characterId: string;
  displayName: string;
  size?: number;
  /** Mastery ring (ADR-046): "bronze" from 1 mastery level, "silver" from 3, "gold" at the top. */
  ring?: "none" | "bronze" | "silver" | "gold";
}

export function Portrait({ characterId, displayName, size = 40, ring = "none" }: PortraitProps) {
  const ringClass = ring === "none" ? "" : ` ring-${ring}`;
  const url = portraitUrl(characterId);
  if (url) {
    // Decorative: the fighter's name is always shown next to the picture.
    return (
      <span className={`portrait portrait-art${ringClass}`} style={{ width: size, height: size, background: portraitColor(characterId) }} aria-hidden="true">
        <img src={url} alt="" width={size} height={size} loading="lazy" decoding="async" draggable={false} />
      </span>
    );
  }
  return (
    <span
      className={`portrait${ringClass}`}
      style={{ width: size, height: size, fontSize: size * 0.38, background: portraitColor(characterId) }}
      aria-hidden="true"
    >
      {portraitInitials(displayName)}
    </span>
  );
}
