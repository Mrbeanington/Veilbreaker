import { describe, expect, it } from "vitest";
import { charactersCoveringMechanic, effectOverlap, effectSignatures, generateCoverageMarkdown, MECHANIC_DETECTORS, MECHANICS, OVERLAP_LIMIT, overlappingPairs } from "./coverage";
import { CHARACTER_LIBRARY, PLAYABLE_CHARACTERS } from "./data/characters/index";

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

  it("honestly reports zero coverage for a mechanic no character touches yet", () => {
    expect(charactersCoveringMechanic("pets")).toEqual([]);
    expect(charactersCoveringMechanic("relics")).toEqual([]);
  });

  it("credits region 1 (Ancient Mediterranean) with the mechanics it was written for", () => {
    const covers = (mechanic: Parameters<typeof charactersCoveringMechanic>[0]) => charactersCoveringMechanic(mechanic).map((c) => c.id);
    expect(covers("labyrinths")).toContain("asterion");
    expect(covers("berserk")).toContain("asterion");
    expect(covers("petrification")).toContain("medusa");
    expect(covers("HP sacrifice")).toEqual(expect.arrayContaining(["medusa", "icarion"]));
    expect(covers("energy stealing")).toContain("charon");
    expect(covers("anti-resurrection")).toContain("charon");
    expect(covers("lightning")).toContain("cyclops-brontes");
    expect(covers("fire")).toEqual(expect.arrayContaining(["cyclops-brontes", "hecates-disciple"]));
    expect(covers("prophecy")).toContain("the-oracle");
    expect(covers("delayed attacks")).toContain("the-oracle");
    expect(covers("songs")).toContain("the-siren");
    expect(covers("musical sequences")).toContain("the-siren");
    expect(covers("combo sequences")).toContain("the-siren");
    expect(covers("water/tides")).toContain("the-siren");
    expect(covers("curses")).toEqual(expect.arrayContaining(["nemesis", "hecates-disciple"]));
    expect(covers("reflection")).toContain("nemesis");
    expect(covers("counterattacks")).toEqual(expect.arrayContaining(["cerberus", "zeiron"]));
    expect(covers("transformations")).toContain("the-forgotten-titan");
    expect(covers("cooldown manipulation")).toContain("arachne");
  });

  it("generates a markdown table with a row per mechanic", () => {
    const markdown = generateCoverageMarkdown();
    expect(markdown).toContain("# Mechanical Coverage Matrix");
    for (const mechanic of MECHANICS) {
      expect(markdown).toContain(`| ${mechanic} |`);
    }
  });
});

// phase-13: "Check that no two characters share a template: flag any pair whose
// ability effect-sets overlap more than 70%."
describe("template overlap", () => {
  it("no two playable characters overlap by more than 70%", () => {
    expect(overlappingPairs()).toEqual([]);
  });

  it("measures shared over combined effect signatures", () => {
    const a = new Set(["x", "y", "z"]);
    expect(effectOverlap(a, a)).toBe(1);
    expect(effectOverlap(a, new Set(["q"]))).toBe(0);
    expect(effectOverlap(a, new Set(["x", "y", "w"]))).toBe(0.5);
    expect(effectOverlap(new Set(), a)).toBe(0);
    expect(OVERLAP_LIMIT).toBe(0.7);
  });

  it("does flag a genuinely duplicated kit", () => {
    const [first] = PLAYABLE_CHARACTERS;
    const clone = { ...first!, id: "clone-of-first" };
    (CHARACTER_LIBRARY as Record<string, typeof clone>)[clone.id] = clone;
    try {
      const pairs = overlappingPairs([first!.id, clone.id]);
      expect(pairs).toEqual([{ a: first!.id, b: clone.id, overlap: 1 }]);
    } finally {
      delete (CHARACTER_LIBRARY as Record<string, unknown>)[clone.id];
    }
  });

  it("signatures separate statuses, healing classes and self-damage, so different kits stay different", () => {
    const medusa = effectSignatures(CHARACTER_LIBRARY.medusa!);
    expect(medusa).toContain("applyStatus:status.petrification");
    expect(medusa).toContain("damage:affliction:self");
    expect(effectSignatures(CHARACTER_LIBRARY.hydra!)).not.toContain("applyStatus:status.petrification");
  });
});
