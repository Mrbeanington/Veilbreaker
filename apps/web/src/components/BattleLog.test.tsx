// @vitest-environment jsdom
import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import type { BattleEvent } from "@veilbreak/engine";
import { BattleLog } from "./BattleLog";

afterEach(cleanup);

function ev(type: string, turnRelativeSequence: number, extra: Partial<BattleEvent> = {}): BattleEvent {
  return { turn: 1, tierId: "standard-attacks-support", turnRelativeSequence, type, knowledgeLevel: "PUBLIC", payload: {}, ...extra };
}

describe("BattleLog", () => {
  it("says nothing has happened yet when there are no events", () => {
    render(<BattleLog events={[]} />);
    expect(screen.getByText("The battle has not yet begun.")).toBeInTheDocument();
  });

  it("renders newest-first: the most recently resolved event appears at the top (playtest feedback)", () => {
    const events = [
      ev("abilityUsed", 0, { sourceId: "hydra", payload: { abilityId: "ability.hydra.serpent-bite" } }),
      ev("damageDealt", 1, { sourceId: "hydra", targetId: "the-scarecrow", payload: { amount: 25 } }),
      ev("death", 2, { targetId: "the-scarecrow" }),
    ];
    render(<BattleLog events={events} />);
    const entries = screen.getAllByText(/./, { selector: ".battle-log-entry" }).map((el) => el.textContent);
    expect(entries).toEqual(["The Scarecrow has fallen.", "Hydra deals 25 damage to The Scarecrow.", "Hydra uses Serpent Bite."]);
  });

  it("still holds every event in the underlying array in chronological order — only the display is reversed", () => {
    const events = [ev("abilityUsed", 0, { sourceId: "hydra" }), ev("damageDealt", 1, { sourceId: "hydra", targetId: "the-scarecrow" })];
    render(<BattleLog events={events} />);
    expect(events[0]?.type).toBe("abilityUsed");
    expect(events[1]?.type).toBe("damageDealt");
  });
});
