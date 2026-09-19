import { existsSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { CHARACTER_LIBRARY } from "./data/characters/index";
import { describeRegionRoster } from "./regionRoster.testkit";

// phase-13, region 1 (spec/03 "Ancient Mediterranean", 15 characters). Hydra and
// Zeiron were built in earlier phases.
describeRegionRoster({
  name: "Ancient Mediterranean",
  added: ["asterion", "medusa", "charon", "the-bronze-giant", "arachne", "cyclops-brontes", "the-oracle", "cerberus", "the-siren", "nemesis", "hecates-disciple", "icarion", "the-forgotten-titan"],
  existing: ["hydra", "zeiron"],
  secrets: ["icarion", "the-forgotten-titan"],
  tag: "MYTHOLOGY",
});

const notesDir = fileURLToPath(new URL("../../../docs/design/characters/", import.meta.url));

describe("backlog", () => {
  it("The Island King is a backlog design note only, not in the roster", () => {
    expect(CHARACTER_LIBRARY["the-island-king"]).toBeUndefined();
    expect(existsSync(`${notesDir}the-island-king.md`)).toBe(true);
    expect(readFileSync(`${notesDir}the-island-king.md`, "utf8")).toMatch(/BACKLOG/);
  });
});
