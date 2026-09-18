import { describe, expect, it } from "vitest";
import { characterVisualBibleSchema, composePrompt, missingIdentityAnchors, GLOBAL_ART_LANGUAGE, type CharacterVisualBible } from "./art";

const bible: CharacterVisualBible = characterVisualBibleSchema.parse({
  characterId: "test-character",
  baseArtSpecId: "test-character",
  species: "a spectral fox",
  ageRange: "ageless",
  face: "a narrow masked face",
  bodyType: "lean and low-slung",
  clothingArmor: "tattered ceremonial wrappings",
  weaponsProps: "a broken lantern",
  markings: "faint glowing seams along the fur",
  silhouette: "a low fox shape trailing smoke",
  signatureProps: ["the broken lantern", "trailing smoke"],
});

describe("composePrompt", () => {
  it("includes every one of the bible's identity anchors", () => {
    const prompt = composePrompt(bible, "splash", "prowling through a ruined shrine at night");
    for (const anchor of [bible.species, bible.face, bible.bodyType, bible.silhouette]) {
      expect(prompt).toContain(anchor);
    }
  });

  it("includes the global art language and the scene detail", () => {
    const prompt = composePrompt(bible, "portrait", "a specific scene detail");
    expect(prompt).toContain(GLOBAL_ART_LANGUAGE);
    expect(prompt).toContain("a specific scene detail");
  });

  it("varies its framing by shot type", () => {
    const splash = composePrompt(bible, "splash", "x");
    const icon = composePrompt(bible, "abilityIcon", "x");
    const silhouette = composePrompt(bible, "secretSilhouette", "x");
    expect(splash).not.toBe(icon);
    expect(silhouette).toContain("featureless dark silhouette");
  });

  it("never bakes in text or a logo", () => {
    expect(composePrompt(bible, "splash", "x")).toContain("no text, no logo");
  });
});

describe("missingIdentityAnchors — spec/04's own validation step", () => {
  it("finds nothing missing from a properly composed prompt", () => {
    const prompt = composePrompt(bible, "splash", "a scene");
    expect(missingIdentityAnchors(bible, prompt)).toEqual([]);
  });

  it("flags a hand-written prompt that dropped an anchor", () => {
    const handWritten = "a vaguely fox-like creature standing somewhere";
    expect(missingIdentityAnchors(bible, handWritten).length).toBeGreaterThan(0);
  });
});
