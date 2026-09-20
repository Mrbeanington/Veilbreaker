// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom/vitest";
import axe from "axe-core";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { createDefaultProfile, createMemoryStore, saveProfile } from "@veilbreak/persistence";
import { AppShell } from "./App";
import { SettingsProvider } from "./settings/SettingsContext";

// phase-15 accessibility audit. axe-core checks names, roles, labels, ARIA
// and landmarks on every main screen (colour contrast needs a real layout
// engine, so it is audited separately from the stylesheet tokens below).

vi.mock("./game/useBotWorker", () => ({ useBotWorker: () => ({ requestBotActions: vi.fn() }) }));
afterEach(cleanup);

async function renderApp() {
  const store = createMemoryStore();
  const base = createDefaultProfile();
  await saveProfile(store, { ...base, install: { ...base.install, firstLaunchHandled: true } });
  render(
    <SettingsProvider store={store}>
      <AppShell />
    </SettingsProvider>,
  );
}

async function violations(): Promise<string[]> {
  const result = await axe.run(document.body, {
    rules: { "color-contrast": { enabled: false }, region: { enabled: false } },
  });
  return result.violations.map((v) => `${v.id}: ${v.help} (${v.nodes.length} node(s), e.g. ${v.nodes[0]?.html.slice(0, 120)})`);
}

const SECTIONS = ["Play", "Characters", "Teams", "Ranked", "Codex", "Missions", "Legends", "Profile", "Settings"];

describe("automated accessibility audit of every main screen", () => {
  for (const section of SECTIONS) {
    it(`${section} has no axe violations`, async () => {
      const user = userEvent.setup();
      await renderApp();
      await user.click(screen.getByRole("button", { name: section }));
      await screen.findByRole("heading", { level: 1 }).catch(() => undefined);
      expect(await violations()).toEqual([]);
    });
  }
});

describe("the match screen", () => {
  it("the tutorial match has no axe violations, a labelled energy pool and headings for its panels", async () => {
    const user = userEvent.setup();
    await renderApp();
    await user.click(await screen.findByRole("button", { name: "Start the tutorial" }));
    await screen.findByRole("complementary", { name: "Tutorial tip" });
    expect(screen.getByRole("group", { name: "Energy pool" })).toBeInTheDocument();
    for (const name of ["Player 1's team", "Player 2's team", "Queued actions", "Battle log"]) expect(screen.getByRole("heading", { name })).toBeInTheDocument();
    expect(await violations()).toEqual([]);
  });
});

describe("codex reference pages", () => {
  for (const part of ["Rules", "Statuses"]) {
    it(`Codex ${part} has no axe violations`, async () => {
      const user = userEvent.setup();
      await renderApp();
      await user.click(screen.getByRole("button", { name: "Codex" }));
      await user.click(screen.getByRole("tab", { name: part }));
      expect(await violations()).toEqual([]);
    });
  }
});

// ------------------------------------------------------------ colour contrast

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace("#", "");
  const full = h.length === 3 ? [...h].map((c) => c + c).join("") : h;
  return [parseInt(full.slice(0, 2), 16), parseInt(full.slice(2, 4), 16), parseInt(full.slice(4, 6), 16)];
}
function luminance(hex: string): number {
  const [r, g, b] = hexToRgb(hex).map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  }) as [number, number, number];
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
export function contrast(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x) as [number, number];
  return (hi + 0.05) / (lo + 0.05);
}

const css = readFileSync(join(process.cwd(), "apps", "web", "src", "styles.css"), "utf8");
function tokens(block: RegExp): Record<string, string> {
  const body = block.exec(css)?.[1] ?? "";
  return Object.fromEntries([...body.matchAll(/--([a-z0-9-]+):\s*(#[0-9a-fA-F]{3,6})\s*;/g)].map((m) => [m[1]!, m[2]!]));
}
const normal = tokens(/:root\s*\{([^}]*)\}/);
const high = { ...normal, ...tokens(/:root\[data-contrast="high"\]\s*\{([^}]*)\}/) };

describe("colour contrast (WCAG 2.1 AA)", () => {
  const surfaces = ["bg", "surface", "surface-2"];
  for (const [name, t] of [["default theme", normal], ["high-contrast theme", high]] as const) {
    it(`${name}: text and muted text are at least 4.5:1 on every surface`, () => {
      for (const s of surfaces) {
        expect(contrast(t.text!, t[s]!), `text on ${s}`).toBeGreaterThanOrEqual(4.5);
        expect(contrast(t["text-muted"]!, t[s]!), `muted text on ${s}`).toBeGreaterThanOrEqual(4.5);
      }
    });
    it(`${name}: the accent and the team colours read at least 4.5:1 as text on the surfaces`, () => {
      for (const s of surfaces) for (const c of ["accent", "enemy", "ally", "good", "warn", "danger"]) expect(contrast(t[c]!, t[s]!), `${c} on ${s}`).toBeGreaterThanOrEqual(4.5);
    });
  }
  it("the high-contrast theme's borders are at least 3:1 against the background (non-text UI)", () => {
    expect(contrast(high.border!, high.bg!)).toBeGreaterThanOrEqual(3);
  });
  it("the two team colours differ in lightness too, so they stay distinct without hue (colour-blind safety)", () => {
    expect(Math.abs(luminance(normal.enemy!) - luminance(normal.ally!))).toBeGreaterThan(0.03);
  });
});

describe("motion, scale and focus", () => {
  it("reduced motion is honoured from the system and from the setting", () => {
    expect(css).toMatch(/prefers-reduced-motion:\s*reduce[\s\S]*--anim-duration:\s*0ms/);
    expect(css).toMatch(/\[data-motion="reduced"\][\s\S]*animation:\s*none\s*!important/);
  });
  it("focus is always visible", () => {
    expect(css).toMatch(/:focus-visible\s*\{[^}]*outline/);
  });
  it("text sizes are relative (rem), so the interface-size setting scales all of it", () => {
    const sizes = [...css.matchAll(/font-size:\s*([0-9.]+)(px|rem|em|%)/g)];
    const px = sizes.filter((m) => m[2] === "px");
    expect(px.length, "font sizes in px do not scale with the interface-size setting").toBe(0);
  });
});
