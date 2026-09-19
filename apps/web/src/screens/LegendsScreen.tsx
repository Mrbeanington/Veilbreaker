import { useState } from "react";
import { CHARACTER_LIBRARY } from "@veilbreak/content";
import { CharacterSheet } from "../components/CharacterSheet";
import { Icon } from "../components/Icon";
import { Portrait } from "../components/Portrait";
import { isDiscovered } from "../game/knowledge";
import { legendUnlocked, namelessGateOpen } from "../game/progression";
import { useProfile } from "../profile/ProfileContext";
import type { Profile } from "@veilbreak/persistence";

// spec/05 "Legend Chamber": twelve positions, not a grid: eleven Legends stand
// in a ring around a hall and The Nameless One holds the ultimate position at
// the crown. Locked Legends are symbols; the hall lights up as Legends are met.
// Only Legends that exist in the game today have a characterId; the rest are
// symbols that will wake as they are built.
export interface LegendSlot {
  slot: number;
  characterId?: string;
  symbol: string;
}

export const LEGEND_SLOTS: LegendSlot[] = [
  { slot: 1, characterId: "zeiron", symbol: "⚡" },
  { slot: 2, characterId: "shiro", symbol: "✒" },
  { slot: 3, symbol: "🜁" },
  { slot: 4, symbol: "☼" },
  { slot: 5, symbol: "♠" },
  { slot: 6, characterId: "behemoth", symbol: "⛰" },
  { slot: 7, symbol: "♆" },
  { slot: 8, characterId: "black-knight", symbol: "⚔" },
  { slot: 9, symbol: "♪" },
  { slot: 10, symbol: "≈" },
  { slot: 11, characterId: "emperor-zero", symbol: "∅" },
  { slot: 12, characterId: "the-nameless-one", symbol: "?" },
];

export type SlotState = "awake" | "met" | "sleeping" | "unbuilt" | "sealed";

/** The Nameless One stays sealed until the other eleven Legends are unlocked (spec/03). */
export function slotState(slot: LegendSlot, profile: Profile): SlotState {
  if (!slot.characterId) return "unbuilt";
  if (slot.slot === 12) {
    const gate = namelessGateOpen(profile);
    if (profile.settings.showAllCharacters || legendUnlocked(profile, slot.characterId)) return "awake";
    return gate && isDiscovered(profile, slot.characterId) ? "met" : "sealed";
  }
  if (profile.settings.showAllCharacters || legendUnlocked(profile, slot.characterId)) return "awake";
  return isDiscovered(profile, slot.characterId) ? "met" : "sleeping";
}

export function LegendsScreen() {
  const { profile } = useProfile();
  const [openSlot, setOpenSlot] = useState<number | null>(null);
  const awake = LEGEND_SLOTS.filter((s) => slotState(s, profile) === "awake").length;
  const open = LEGEND_SLOTS.find((s) => s.slot === openSlot);
  const openCharacter = open?.characterId ? CHARACTER_LIBRARY[open.characterId] : undefined;

  return (
    <div>
      <h2 className="title small">Legend Chamber</h2>
      <p className="subtitle">
        {awake} of {LEGEND_SLOTS.length} Legends awake. Meet a Legend in battle, then win its trial to wake its place in the hall.
      </p>

      <div className={`chamber chamber-lit-${awake}`} role="group" aria-label="Legend Chamber">
        <svg className="chamber-lines" viewBox="0 0 100 100" aria-hidden="true">
          <circle cx="50" cy="52" r="34" />
          <circle cx="50" cy="52" r="20" />
          {LEGEND_SLOTS.map((s, i) => {
            const { x, y } = position(i);
            return <line key={s.slot} x1="50" y1="52" x2={x} y2={y} className={slotState(s, profile) === "awake" ? "lit" : ""} />;
          })}
        </svg>
        {LEGEND_SLOTS.map((s, i) => {
          const state = slotState(s, profile);
          const { x, y } = position(i);
          const character = s.characterId ? CHARACTER_LIBRARY[s.characterId] : undefined;
          const label =
            state === "awake" && character
              ? character.displayName
              : state === "met" && character
                ? `${character.displayName} (trial awaits)`
              : state === "sealed"
                ? "???"
                : state === "sleeping"
                  ? "A sleeping Legend"
                  : "An unawakened place";
          return (
            <button
              key={s.slot}
              type="button"
              className={`chamber-slot ${state}${s.slot === 12 ? " crown" : ""}${openSlot === s.slot ? " open" : ""}`}
              style={{ left: `${x}%`, top: `${y}%` }}
              aria-label={`Position ${s.slot}: ${label}`}
              aria-expanded={openSlot === s.slot}
              disabled={state === "unbuilt"}
              onClick={() => setOpenSlot(openSlot === s.slot ? null : s.slot)}
            >
              {(state === "awake" || state === "met") && character ? (
                <Portrait characterId={character.id} displayName={character.displayName} size={s.slot === 12 ? 64 : 48} />
              ) : (
                <span className="symbol" aria-hidden="true">
                  {state === "sealed" ? "?" : s.symbol}
                </span>
              )}
            </button>
          );
        })}
      </div>

      <div className="panel" aria-live="polite">
        {open && openCharacter && ["awake", "met"].includes(slotState(open, profile)) ? (
          <CharacterSheet character={openCharacter} profile={profile} mode="codex" />
        ) : open ? (
          <p>
            <Icon name="lock" size={16} /> {slotState(open, profile) === "sealed" ? "Sealed until every other Legend is unlocked and its boss encounter is won." : "Not yet met. Find it in battle."}
          </p>
        ) : (
          <p className="hp-text">Choose a position to learn more.</p>
        )}
      </div>
    </div>
  );
}

/** Slots 1-11 ring the hall (starting at the upper left, clockwise); slot 12 crowns it. */
function position(index: number): { x: number; y: number } {
  if (index === 11) return { x: 50, y: 12 };
  const angle = (-70 + (index / 11) * 320) * (Math.PI / 180);
  return { x: 50 + 40 * Math.cos(angle), y: 52 + 34 * Math.sin(angle) };
}
