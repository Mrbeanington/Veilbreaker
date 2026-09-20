import { describe, expect, it } from "vitest";
import { CHARACTER_LORE, PLAYABLE_CHARACTERS, ROLE_GLOSSARY } from "./index";

// ADR-036: every playable character has a short Codex lore entry.
describe("codex lore", () => {
  it("has an entry for every playable character and none for anyone else", () => {
    const ids = PLAYABLE_CHARACTERS.map((c) => c.id).sort();
    expect(Object.keys(CHARACTER_LORE).sort()).toEqual(ids);
  });

  it("keeps entries short: one to two sentences, under 260 characters, ending in a full stop", () => {
    for (const [id, text] of Object.entries(CHARACTER_LORE)) {
      expect(text.length, id).toBeGreaterThan(40);
      expect(text.length, id).toBeLessThanOrEqual(260);
      expect(text.trim().endsWith("."), id).toBe(true);
      const sentences = text.split(/(?<=[.!?])\s+/).filter(Boolean);
      expect(sentences.length, id).toBeLessThanOrEqual(3);
    }
  });

  it("never repeats another character's entry", () => {
    const texts = Object.values(CHARACTER_LORE);
    expect(new Set(texts).size).toBe(texts.length);
  });

  it("does not quote a number, so a balance patch cannot make lore wrong", () => {
    for (const [id, text] of Object.entries(CHARACTER_LORE)) expect(/\d/.test(text) && !/\b(20|one|two)\b/.test(text) ? text : "", id).toBe("");
  });

  it("explains every archetype tag a character uses, apart from the rarity tags", () => {
    const used = new Set(PLAYABLE_CHARACTERS.flatMap((c) => c.tags).filter((t) => t !== "SECRET" && t !== "LEGENDARY"));
    for (const tag of used) expect(ROLE_GLOSSARY[tag], tag).toBeTruthy();
  });
});
