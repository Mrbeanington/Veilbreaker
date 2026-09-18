import { describe, expect, it } from "vitest";
import { charactersCoveringMechanic, generateCoverageMarkdown, MECHANIC_DETECTORS, MECHANICS } from "./coverage";

describe("coverage matrix", () => {
  it("has a detector for every listed mechanic, and only listed mechanics", () => {
    expect(Object.keys(MECHANIC_DETECTORS).sort()).toEqual([...MECHANICS].sort());
  });

  it("credits Patient Zero with infection and DoT", () => {
    const infectionCharacters = charactersCoveringMechanic("infection").map((c) => c.id);
    expect(infectionCharacters).toContain("patient-zero");
    const dotCharacters = charactersCoveringMechanic("DoT").map((c) => c.id);
    expect(dotCharacters).toContain("patient-zero");
  });

  it("credits Malachar with souls, summons, thralls, and temporary fourth fighters", () => {
    for (const mechanic of ["souls", "summons", "thralls", "temporary fourth fighters"] as const) {
      expect(charactersCoveringMechanic(mechanic).map((c) => c.id)).toContain("malachar");
    }
  });

  it("credits Moonshot Maddox with sports mechanics, bases, and combo sequences", () => {
    for (const mechanic of ["sports mechanics", "bases", "combo sequences"] as const) {
      expect(charactersCoveringMechanic(mechanic).map((c) => c.id)).toContain("moonshot-maddox");
    }
  });

  it("credits Mister Whiskers with target manipulation, energy stealing, randomness, and probability manipulation", () => {
    for (const mechanic of ["target manipulation", "energy stealing", "randomness", "probability manipulation"] as const) {
      expect(charactersCoveringMechanic(mechanic).map((c) => c.id)).toContain("mister-whiskers");
    }
  });

  it("honestly reports zero coverage for a mechanic no Phase 04 character touches", () => {
    expect(charactersCoveringMechanic("labyrinths")).toEqual([]);
    expect(charactersCoveringMechanic("fire")).toEqual([]);
  });

  it("generates a markdown table with a row per mechanic", () => {
    const markdown = generateCoverageMarkdown();
    expect(markdown).toContain("# Mechanical Coverage Matrix");
    for (const mechanic of MECHANICS) {
      expect(markdown).toContain(`| ${mechanic} |`);
    }
  });
});
