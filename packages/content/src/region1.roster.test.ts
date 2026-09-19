import { existsSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { ABILITY_LIBRARY, CHARACTER_ART_LIBRARY, CHARACTER_LIBRARY, CHARACTER_VISUAL_BIBLE_LIBRARY, PASSIVE_LIBRARY, PLAYABLE_CHARACTERS, RESOURCE_LIBRARY, TRANSFORMATION_LIBRARY } from "./data/characters/index";
import { STATUS_LIBRARY } from "./data/statuses";

// phase-13, region 1 (spec/03 "Ancient Mediterranean", 15 characters). Hydra and
// Zeiron were built in earlier phases; these are the 13 added now.
const NEW = ["asterion", "medusa", "charon", "the-bronze-giant", "arachne", "cyclops-brontes", "the-oracle", "cerberus", "the-siren", "nemesis", "hecates-disciple", "icarion", "the-forgotten-titan"];
const REGION = [...NEW, "hydra", "zeiron"];
const SECRETS = ["icarion", "the-forgotten-titan"];
const notesDir = fileURLToPath(new URL("../../../docs/design/characters/", import.meta.url));

describe("region 1: Ancient Mediterranean", () => {
  it("has all fifteen characters from spec/03, all playable", () => {
    for (const id of REGION) {
      expect(CHARACTER_LIBRARY[id], id).toBeDefined();
      expect(PLAYABLE_CHARACTERS.some((c) => c.id === id), id).toBe(true);
    }
    expect(NEW).toHaveLength(13);
  });

  it("every new character has a real, referenced kit: abilities, passive, resources and a stable id", () => {
    for (const id of NEW) {
      const c = CHARACTER_LIBRARY[id]!;
      expect(c.abilityIds.length, id).toBeGreaterThanOrEqual(3);
      expect(c.abilityIds.length, id).toBeLessThanOrEqual(5);
      for (const abilityId of c.abilityIds) {
        expect(ABILITY_LIBRARY[abilityId], abilityId).toBeDefined();
        expect(abilityId.startsWith(`ability.${id}.`), abilityId).toBe(true);
      }
      if (c.passiveId) expect(PASSIVE_LIBRARY[c.passiveId], c.passiveId).toBeDefined();
      for (const r of c.resources) expect(RESOURCE_LIBRARY[r.id], r.id).toBeDefined();
      for (const t of c.transformationIds) expect(TRANSFORMATION_LIBRARY[t], t).toBeDefined();
      expect(c.tags).toContain("MYTHOLOGY");
    }
  });

  it("every ability stays understandable in a few seconds: a short description and only known statuses", () => {
    for (const id of NEW) {
      const c = CHARACTER_LIBRARY[id]!;
      const all = [...c.abilityIds, ...c.transformationIds.flatMap((t) => TRANSFORMATION_LIBRARY[t]?.changes.abilityIds ?? [])];
      for (const abilityId of new Set(all)) {
        const ability = ABILITY_LIBRARY[abilityId]!;
        expect(ability.description.length, abilityId).toBeLessThanOrEqual(190);
        for (const effect of JSON.stringify(ability.effects).match(/status\.[a-z-]+/g) ?? []) expect(STATUS_LIBRARY[effect], `${abilityId} -> ${effect}`).toBeDefined();
      }
    }
  });

  it("uses the damage language (multiples of 10) unless a design reason is logged", () => {
    for (const id of NEW) {
      const c = CHARACTER_LIBRARY[id]!;
      for (const abilityId of c.abilityIds) {
        for (const amount of [...JSON.stringify(ABILITY_LIBRARY[abilityId]!.effects).matchAll(/"kind":"(?:damage|heal)","amount":(\d+)/g)].map((m) => Number(m[1]))) {
          expect(amount % 10, `${abilityId}: ${amount}`).toBe(0);
        }
      }
    }
  });

  it("has art for each: a visual bible, a splash, portrait and avatar prompt, and four ability icons", () => {
    for (const id of NEW) {
      const art = CHARACTER_ART_LIBRARY[id]!;
      expect(CHARACTER_VISUAL_BIBLE_LIBRARY[id], id).toBeDefined();
      expect(art.splashPrompt.length, id).toBeGreaterThan(40);
      expect(art.portraitPrompt.length, id).toBeGreaterThan(40);
      expect(art.battleAvatarPrompt.length, id).toBeGreaterThan(40);
      expect(art.abilityIconPrompts, id).toHaveLength(4);
      // spec/04 "Forbidden references": never name a franchise or "in the style of".
      for (const prompt of [art.splashPrompt, art.portraitPrompt, art.battleAvatarPrompt, ...art.abilityIconPrompts]) expect(prompt, id).not.toMatch(/in the style of|like (?:a )?(?:disney|marvel|pokemon)/i);
    }
  });

  it("Secrets are Secret and discoverable, with a silhouette prompt", () => {
    for (const id of SECRETS) {
      const c = CHARACTER_LIBRARY[id]!;
      expect(c.rarity).toBe("SECRET");
      expect(c.knowledgeLevel).toBe("DISCOVERABLE");
      expect(CHARACTER_ART_LIBRARY[id]!.secretSilhouettePrompt, id).toBeTruthy();
    }
    for (const id of NEW.filter((n) => !SECRETS.includes(n))) expect(CHARACTER_LIBRARY[id]!.rarity).not.toBe("SECRET");
  });

  it("every new character has a design note with identity, counterplay and readability", () => {
    for (const id of NEW) {
      const path = `${notesDir}${id}.md`;
      expect(existsSync(path), id).toBe(true);
      const text = readFileSync(path, "utf8");
      for (const heading of ["## Identity / win condition", "## Counterplay", "## Readability", "## Deviations"]) expect(text, `${id} ${heading}`).toContain(heading);
    }
  });

  it("The Island King is a backlog design note only, not in the roster", () => {
    expect(CHARACTER_LIBRARY["the-island-king"]).toBeUndefined();
    expect(existsSync(`${notesDir}the-island-king.md`)).toBe(true);
    expect(readFileSync(`${notesDir}the-island-king.md`, "utf8")).toMatch(/BACKLOG/);
  });
});
