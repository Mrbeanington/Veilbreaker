// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { PLAYABLE_CHARACTERS } from "@veilbreak/content";
import { MIN_SOURCE_SIZE, checkSource, fighterIdFromFileName } from "./portraitFiles";

vi.mock("./portraits", () => ({ portraitUrl: (id: string) => (id === "tortuga-rex" ? "/art/tortuga-rex.webp" : undefined), portraitIds: () => ["tortuga-rex"] }));
const { Portrait } = await import("../components/Portrait");

afterEach(cleanup);

describe("Portrait", () => {
  it("shows the picture for a fighter that has art, hidden from screen readers", () => {
    const { container } = render(<Portrait characterId="tortuga-rex" displayName="Tortuga Rex" size={56} />);
    const img = container.querySelector("img")!;
    expect(img).toHaveAttribute("src", "/art/tortuga-rex.webp");
    expect(img).toHaveAttribute("alt", "");
    expect(container.firstElementChild).toHaveAttribute("aria-hidden", "true");
  });
  it("keeps the initials badge for a fighter without art", () => {
    const { container } = render(<Portrait characterId="hydra" displayName="Hydra" />);
    expect(container.querySelector("img")).toBeNull();
    expect(container).toHaveTextContent("H");
  });
});

describe("portrait files", () => {
  it("maps generator file names to fighter ids", () => {
    expect(fighterIdFromFileName("tortuga-rex.portrait.png")).toBe("tortuga-rex");
    expect(fighterIdFromFileName("Tortuga-Rex.PORTRAIT.PNG")).toBe("tortuga-rex");
    expect(fighterIdFromFileName("hydra.jpg")).toBe("hydra");
    expect(fighterIdFromFileName("the-lawyer.portrait.webp")).toBe("the-lawyer");
    expect(fighterIdFromFileName("notes.txt")).toBeUndefined();
  });
  it("warns about small or non-square sources", () => {
    expect(checkSource(1024, 1024).warnings).toEqual([]);
    expect(checkSource(MIN_SOURCE_SIZE - 1, MIN_SOURCE_SIZE - 1).warnings[0]).toMatch(/pixels on the short side/);
    expect(checkSource(1536, 1024).warnings[0]).toMatch(/not square/);
  });
  it("only ever stores art for fighters that exist", async () => {
    const ids = new Set(PLAYABLE_CHARACTERS.map((c) => c.id));
    const real = await vi.importActual<typeof import("./portraits")>("./portraits");
    for (const id of real.portraitIds()) expect(ids.has(id), id).toBe(true);
  });
});

describe("splash art files (ADR-047)", () => {
  it("tells splashes from portraits by file name", async () => {
    const { parseArtFileName } = await import("./portraitFiles");
    expect(parseArtFileName("zeiron.splash.png")).toEqual({ id: "zeiron", kind: "splash" });
    expect(parseArtFileName("Zeiron.PORTRAIT.jpg")).toEqual({ id: "zeiron", kind: "portrait" });
    expect(parseArtFileName("zeiron.png")).toEqual({ id: "zeiron", kind: "portrait" });
    expect(parseArtFileName("notes.txt")).toBeUndefined();
  });
  it("wants a tall 2:3 source for a splash", () => {
    expect(checkSource(1024, 1536, "splash").warnings).toEqual([]);
    expect(checkSource(1024, 1024, "splash").warnings.join(" ")).toMatch(/2:3/);
    expect(checkSource(500, 750, "splash").warnings.join(" ")).toMatch(/pixels on the short side/);
  });
  it("only ever stores splashes for fighters that exist", async () => {
    const ids = new Set(PLAYABLE_CHARACTERS.map((c) => c.id));
    const real = await vi.importActual<typeof import("./splashes")>("./splashes");
    for (const id of real.splashIds()) expect(ids.has(id), id).toBe(true);
  });
});
