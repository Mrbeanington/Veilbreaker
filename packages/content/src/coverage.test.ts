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

  it("credits the region 3 relic user, so no required mechanic is left uncovered", () => {
    expect(charactersCoveringMechanic("relics").map((c) => c.id)).toContain("the-midnight-tsar");
    const gaps = MECHANICS.filter((m) => charactersCoveringMechanic(m).length === 0);
    expect(gaps).toEqual([]);
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

  it("credits region 2 (Japanese Folklore / Ink Realm) with the mechanics it was written for", () => {
    const covers = (mechanic: Parameters<typeof charactersCoveringMechanic>[0]) => charactersCoveringMechanic(mechanic).map((c) => c.id);
    expect(covers("resurrection")).toContain("nekomata");
    expect(covers("pets")).toContain("the-paper-monk");
    expect(covers("ink")).toEqual(expect.arrayContaining(["the-painted-ronin", "the-paper-monk"]));
    expect(covers("energy generation")).toContain("lantern-spirit");
    expect(covers("ice")).toContain("yuki-onna");
    expect(covers("HP sacrifice")).toEqual(expect.arrayContaining(["lantern-spirit", "oni-of-the-red-gate", "red-oni"]));
    expect(covers("cooldown manipulation")).toEqual(expect.arrayContaining(["yuki-onna", "tengu-swordsman", "the-mirror-samurai"]));
    expect(covers("water/tides")).toEqual(expect.arrayContaining(["kappa-kiro", "umbrella-yokai"]));
    expect(covers("energy stealing")).toContain("umbrella-yokai");
    expect(covers("summons")).toContain("the-paper-monk");
  });

  it("credits region 3 (Slavic / Russian Night) with the mechanics it was written for", () => {
    const covers = (mechanic: Parameters<typeof charactersCoveringMechanic>[0]) => charactersCoveringMechanic(mechanic).map((c) => c.id);
    expect(covers("relics")).toEqual(["the-midnight-tsar"]);
    expect(covers("combo sequences")).toContain("zmey-gorynych");
    expect(covers("curses")).toEqual(expect.arrayContaining(["rusalka", "one-eyed-likho", "the-midnight-tsar"]));
    expect(covers("randomness")).toContain("one-eyed-likho");
    expect(covers("death")).toContain("the-firebird");
    expect(covers("HP sacrifice")).toContain("one-eyed-likho");
    expect(covers("anti-healing")).toContain("the-birch-witch");
    expect(covers("energy stealing")).toContain("domovoi");
    expect(covers("fire")).toEqual(expect.arrayContaining(["zmey-gorynych", "the-firebird"]));
  });

  it("credits region 4 (Northern / Celtic) with the mechanics it was written for", () => {
    const covers = (mechanic: Parameters<typeof charactersCoveringMechanic>[0]) => charactersCoveringMechanic(mechanic).map((c) => c.id);
    expect(covers("prophecy")).toContain("morrigan");
    expect(covers("delayed attacks")).toContain("morrigan");
    expect(covers("curses")).toEqual(expect.arrayContaining(["banshee", "the-dullahan"]));
    expect(covers("target manipulation")).toContain("puca");
    expect(covers("fear")).toEqual(expect.arrayContaining(["banshee", "the-berserker"]));
    expect(covers("HP sacrifice")).toEqual(expect.arrayContaining(["the-berserker", "fenris"]));
    expect(covers("silences")).toContain("banshee");
    expect(covers("energy generation")).toContain("banshee");
    expect(covers("anti-healing")).toContain("draugr");
    expect(covers("randomness")).toContain("puca");
  });

  it("credits region 5 (Egypt / Desert / Ancient Kingdoms) with the mechanics it was written for", () => {
    const covers = (mechanic: Parameters<typeof charactersCoveringMechanic>[0]) => charactersCoveringMechanic(mechanic).map((c) => c.id);
    expect(covers("fire")).toContain("ifrit");
    expect(covers("randomness")).toEqual(expect.arrayContaining(["desert-djinn", "the-sphinx"]));
    expect(covers("poison")).toContain("sand-assassin");
    expect(covers("energy stealing")).toContain("pharaoh-without-a-tomb");
    expect(covers("curses")).toContain("the-mummy-prince");
    expect(covers("summons")).toEqual(expect.arrayContaining(["scarab-king", "pharaoh-without-a-tomb"]));
    expect(covers("reflection")).toContain("the-living-sarcophagus");
    expect(covers("counterattacks")).toContain("jackal-guardian");
    expect(covers("silences")).toContain("the-sphinx");
  });

  it("credits region 6 (World Folklore / Spirits / Tricksters) with the mechanics it was written for", () => {
    const covers = (mechanic: Parameters<typeof charactersCoveringMechanic>[0]) => charactersCoveringMechanic(mechanic).map((c) => c.id);
    expect(covers("probability manipulation")).toContain("madame-fortuna");
    expect(covers("randomness")).toEqual(expect.arrayContaining(["dokkaebi", "madame-fortuna"]));
    expect(covers("cooldown manipulation")).toContain("anansi");
    expect(covers("energy stealing")).toContain("jiangshi");
    expect(covers("anti-healing")).toContain("the-ghoul");
    expect(covers("summons")).toContain("the-monkey-trickster");
    expect(covers("combo sequences")).toContain("the-storyteller");
  });

  it("credits region 7 (Horror / Monsters / Dead) with the mechanics it was written for", () => {
    const covers = (mechanic: Parameters<typeof charactersCoveringMechanic>[0]) => charactersCoveringMechanic(mechanic).map((c) => c.id);
    expect(covers("resurrection")).toContain("the-grave-digger");
    expect(covers("cooldown manipulation")).toContain("the-marionettist");
    expect(covers("energy stealing")).toContain("the-collector");
    expect(covers("summons")).toContain("the-marionettist");
  });

  it("credits region 8 (Animals / Weird Characters) with the mechanics it was written for", () => {
    const covers = (mechanic: Parameters<typeof charactersCoveringMechanic>[0]) => charactersCoveringMechanic(mechanic).map((c) => c.id);
    expect(covers("target manipulation")).toContain("minotaur-king");
    expect(covers("cooldown manipulation")).toEqual(expect.arrayContaining(["professor-octopus", "general-goose"]));
    expect(covers("stuns")).toEqual(expect.arrayContaining(["minotaur-king", "sir-hopsalot"]));
    expect(covers("poison")).toContain("king-croak");
    expect(covers("counterattacks")).toContain("sir-hopsalot");
  });

  it("credits region 9 (Sports / Fighters) with the mechanics it was written for", () => {
    const covers = (mechanic: Parameters<typeof charactersCoveringMechanic>[0]) => charactersCoveringMechanic(mechanic).map((c) => c.id);
    expect(covers("sports mechanics")).toEqual(expect.arrayContaining(["moonshot-maddox"]));
    expect(covers("randomness")).toContain("the-gunslinger-qb");
    expect(covers("HP sacrifice")).toContain("the-gunslinger-qb");
    expect(covers("stuns")).toContain("el-magnifico");
    expect(covers("counterattacks")).toEqual(expect.arrayContaining(["the-contender", "ace"]));
  });

  it("credits region 10 (Music / Entertainment / Chaos) with the mechanics it was written for", () => {
    const covers = (mechanic: Parameters<typeof charactersCoveringMechanic>[0]) => charactersCoveringMechanic(mechanic).map((c) => c.id);
    expect(covers("transformations")).toContain("chef-ramble");
    expect(covers("combo sequences")).toEqual(expect.arrayContaining(["chef-ramble", "dj-cataclysm"]));
    expect(covers("HP sacrifice")).toContain("johnny-feedback");
    expect(covers("silences")).toEqual(expect.arrayContaining(["dj-cataclysm", "the-mime"]));
  });

  it("credits region 11 (the Final Seven) with the mechanics it was written for", () => {
    const covers = (mechanic: Parameters<typeof charactersCoveringMechanic>[0]) => charactersCoveringMechanic(mechanic).map((c) => c.id);
    expect(covers("energy stealing")).toEqual(expect.arrayContaining(["the-tax-collector", "the-lawyer"]));
    expect(covers("target manipulation")).toContain("the-lawyer");
    expect(covers("water/tides")).toContain("calypsa");
    expect(covers("silences")).toContain("the-lawyer");
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
