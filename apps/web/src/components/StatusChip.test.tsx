// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import type { ActiveStatus } from "@veilbreak/content";
import { StatusChip } from "./StatusChip";

afterEach(cleanup);

const POISON: ActiveStatus = { statusId: "status.poison", remainingTurns: 3, stacks: 1, magnitude: 5 };

describe("StatusChip", () => {
  it("always shows the chip's short label, and reveals the full description only on hover", () => {
    render(<StatusChip active={POISON} />);
    expect(screen.getByText(/Poison/)).toBeInTheDocument();
    expect(screen.getByText(/5/)).toBeInTheDocument();
    expect(screen.getByText(/\(3\)/)).toBeInTheDocument();
    expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();

    const chip = screen.getByText(/Poison/);
    fireEvent.mouseEnter(chip);
    expect(screen.getByRole("tooltip")).toHaveTextContent("Deals damage at the start of each turn, per stack.");

    fireEvent.mouseLeave(chip);
    expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
  });

  it("gives screen readers the full description without requiring hover or focus", () => {
    render(<StatusChip active={POISON} />);
    expect(screen.getByText("Deals damage at the start of each turn, per stack.", { exact: false })).toHaveClass("sr-only");
  });

  it("toggles open on click/tap, for devices with no hover", () => {
    render(<StatusChip active={POISON} />);
    const chip = screen.getByText(/Poison/);
    fireEvent.click(chip);
    expect(screen.getByRole("tooltip")).toBeInTheDocument();
    fireEvent.click(chip);
    expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
  });

  it("stops a click from reaching a parent target-select handler (the chip sits inside a clickable card)", () => {
    const onCardClick = vi.fn();
    render(
      <button type="button" onClick={onCardClick}>
        <StatusChip active={POISON} />
      </button>,
    );
    fireEvent.click(screen.getByText(/Poison/));
    expect(onCardClick).not.toHaveBeenCalled();
  });

  it("falls back to the raw id if a status somehow isn't in the library", () => {
    render(<StatusChip active={{ statusId: "status.made-up", remainingTurns: null, stacks: 1, magnitude: 0 }} />);
    expect(screen.getByText(/status\.made-up/)).toBeInTheDocument();
  });
});
