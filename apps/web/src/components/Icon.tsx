// Self-hosted icon set (phase-08 "Self-hosted fonts and icons only"): small
// inline SVGs drawn on a 24x24 grid, coloured by `currentColor`. Nothing is
// fetched at runtime. Icons are decoration; the text next to them carries the
// meaning (spec/05: never colour or symbol alone).
const PATHS = {
  play: "M8 5v14l11-7z",
  characters: "M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4 20c0-4 3.5-6 8-6s8 2 8 6",
  teams: "M8 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM16 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM2 19c0-3 2.5-5 6-5s6 2 6 5M14 14c4 0 8 1 8 5",
  ranked: "M6 4h12v4a6 6 0 0 1-12 0zM12 14v4M8 20h8M6 6H3v2a3 3 0 0 0 3 3M18 6h3v2a3 3 0 0 1-3 3",
  codex: "M5 4h10a3 3 0 0 1 3 3v13H8a3 3 0 0 1-3-3zM5 17a3 3 0 0 1 3-3h10",
  missions: "M5 21V4M5 5h11l-2 4 2 4H5",
  legends: "M12 3l2.6 5.6 6.1.7-4.5 4.2 1.2 6L12 16.5 6.6 19.5l1.2-6L3.3 9.3l6.1-.7z",
  profile: "M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM5 21v-2a5 5 0 0 1 5-5h4a5 5 0 0 1 5 5v2",
  settings: "M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM19 12l2-1-2-4-2 1-2-1-1-2H9L8 7 6 8 4 7l-2 4 2 1v2l-2 1 2 4 2-1 2 1 1 2h4l1-2 2-1 2 1 2-4-2-1z",
  star: "M12 3l2.6 5.6 6.1.7-4.5 4.2 1.2 6L12 16.5 6.6 19.5l1.2-6L3.3 9.3l6.1-.7z",
  lock: "M7 11V8a5 5 0 0 1 10 0v3M5 11h14v10H5z",
  sword: "M5 19L19 5M14 5h5v5M5 19l3-1M6 14l4 4",
  shield: "M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z",
  heart: "M12 20s-8-5-8-11a4.5 4.5 0 0 1 8-2.5A4.5 4.5 0 0 1 20 9c0 6-8 11-8 11z",
  bolt: "M13 2L5 13h6l-1 9 8-11h-6z",
  skull: "M12 3a8 8 0 0 0-5 14v3h10v-3a8 8 0 0 0-5-14zM9 12h.01M15 12h.01M10 17v3M14 17v3",
  drop: "M12 3s6 6.5 6 11a6 6 0 0 1-12 0c0-4.5 6-11 6-11z",
  flame: "M12 3c1 4 5 6 5 11a5 5 0 0 1-10 0c0-2 1-3 2-4 0 2 1 3 2 3 0-4-1-6 1-10z",
  chain: "M9 15l6-6M8 11l-2 2a4 4 0 0 0 6 6l2-2M16 13l2-2a4 4 0 0 0-6-6l-2 2",
  mute: "M4 9h4l5-4v14l-5-4H4zM17 9l4 6M21 9l-4 6",
  eye: "M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12zM12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z",
  sparkle: "M12 3v6M12 15v6M3 12h6M15 12h6M6 6l3 3M15 15l3 3M18 6l-3 3M9 15l-3 3",
  clock: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 7v5l3 2",
  question: "M9 9a3 3 0 1 1 4.5 2.6c-1 .6-1.5 1.2-1.5 2.4M12 18h.01",
} as const;

export type IconName = keyof typeof PATHS;

export function Icon({ name, size = 18 }: { name: IconName; size?: number }) {
  return (
    <svg
      className="icon"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      <path d={PATHS[name]} />
    </svg>
  );
}

const STATUS_ICONS: Record<string, IconName> = {
  "status.stun": "chain",
  "status.silence": "mute",
  "status.petrification": "chain",
  "status.fear": "eye",
  "status.shield": "shield",
  "status.damage-reduction": "shield",
  "status.invulnerable": "shield",
  "status.untargetable": "eye",
  "status.death-prevention": "heart",
  "status.counter": "sword",
  "status.reflect": "sparkle",
  "status.burn": "flame",
  "status.bleed": "drop",
  "status.poison": "drop",
  "status.infection": "skull",
  "status.anti-heal": "heart",
  "status.unhealable": "heart",
  "status.curse": "skull",
  "status.cooldown-increase": "clock",
  "status.cooldown-reduction": "clock",
  "status.ability-lock": "lock",
};

export function statusIconName(statusId: string): IconName {
  return STATUS_ICONS[statusId] ?? "sparkle";
}
