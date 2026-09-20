import { existsSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { ABILITY_LIBRARY, CHARACTER_ART_LIBRARY, CHARACTER_LIBRARY, CHARACTER_VISUAL_BIBLE_LIBRARY, PASSIVE_LIBRARY, PLAYABLE_CHARACTERS, RESOURCE_LIBRARY, SUMMON_LIBRARY, TRANSFORMATION_LIBRARY } from "./data/characters/index";
import { STATUS_LIBRARY } from "./data/statuses";

// Shared checks for every roster region (phase 13): the same structural rules
// hold for each character added, so each region's test file only lists ids.
const notesDir = fileURLToPath(new URL("../../../docs/design/characters/", import.meta.url));

export interface RegionSpec {
  name: string;
  /** Characters added by this region's session. */
  added: string[];
  /** Characters of the region that existed before it (earlier phases). */
  existing: string[];
  secrets: string[];
  /** Legends among the added characters (spec/03: powerful but counterable). */
  legends?: string[];
  /** Every character of the region carries this archetype tag. */
  tag: "MYTHOLOGY" | "FOLKLORE" | "ATHLETE" | "MUSIC";
}

export function describeRegionRoster(spec: RegionSpec): void {
  const { added, existing, secrets, tag, legends = [] } = spec;
  describe(`roster: ${spec.name}`, () => {
    it("has every character of the region from spec/03, all playable", () => {
      for (const id of [...added, ...existing]) {
        expect(CHARACTER_LIBRARY[id], id).toBeDefined();
        expect(PLAYABLE_CHARACTERS.some((c) => c.id === id), id).toBe(true);
      }
    });

    it("every new character has a real, referenced kit with stable ids", () => {
      for (const id of added) {
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
        expect(c.tags, id).toContain(tag);
      }
    });

    it("every ability stays understandable: a short description, known statuses and summons, and the damage language", () => {
      for (const id of added) {
        const c = CHARACTER_LIBRARY[id]!;
        const all = [...c.abilityIds, ...c.transformationIds.flatMap((t) => TRANSFORMATION_LIBRARY[t]?.changes.abilityIds ?? [])];
        for (const abilityId of new Set(all)) {
          const ability = ABILITY_LIBRARY[abilityId]!;
          const json = JSON.stringify(ability.effects);
          expect(ability.description.length, abilityId).toBeLessThanOrEqual(190);
          for (const status of json.match(/status\.[a-z-]+/g) ?? []) expect(STATUS_LIBRARY[status], `${abilityId} -> ${status}`).toBeDefined();
          for (const summon of json.match(/summon\.[a-z.-]+/g) ?? []) expect(SUMMON_LIBRARY[summon], `${abilityId} -> ${summon}`).toBeDefined();
          for (const m of json.matchAll(/"kind":"(?:damage|heal)","amount":(\d+)/g)) expect(Number(m[1]) % 10, `${abilityId}: ${m[1]}`).toBe(0);
        }
      }
    });

    it("has art for each: a visual bible, splash, portrait and avatar prompts, four ability icons, no forbidden references", () => {
      for (const id of added) {
        const art = CHARACTER_ART_LIBRARY[id]!;
        expect(CHARACTER_VISUAL_BIBLE_LIBRARY[id], id).toBeDefined();
        expect(art.splashPrompt.length, id).toBeGreaterThan(40);
        expect(art.portraitPrompt.length, id).toBeGreaterThan(40);
        expect(art.battleAvatarPrompt.length, id).toBeGreaterThan(40);
        expect(art.abilityIconPrompts, id).toHaveLength(4);
        for (const prompt of [art.splashPrompt, art.portraitPrompt, art.battleAvatarPrompt, ...art.abilityIconPrompts]) expect(prompt, id).not.toMatch(/in the style of|like (?:a )?(?:disney|marvel|pokemon|naruto)/i);
      }
    });

    it("Secrets are Secret and discoverable, with a silhouette prompt; the rest are not Secret", () => {
      for (const id of secrets) {
        const c = CHARACTER_LIBRARY[id]!;
        expect(c.rarity).toBe("SECRET");
        expect(c.knowledgeLevel).toBe("DISCOVERABLE");
        expect(CHARACTER_ART_LIBRARY[id]!.secretSilhouettePrompt, id).toBeTruthy();
      }
      for (const id of added.filter((n) => !secrets.includes(n))) expect(CHARACTER_LIBRARY[id]!.rarity).not.toBe("SECRET");
      for (const id of added.filter((n) => !legends.includes(n) && !secrets.includes(n))) expect(CHARACTER_LIBRARY[id]!.rarity, id).not.toBe("LEGENDARY");
    });

    it("every new character has a design note with identity, counterplay, readability and deviations", () => {
      for (const id of added) {
        const path = `${notesDir}${id}.md`;
        expect(existsSync(path), id).toBe(true);
        const text = readFileSync(path, "utf8");
        for (const heading of ["## Identity / win condition", "## Counterplay", "## Readability", "## Deviations"]) expect(text, `${id} ${heading}`).toContain(heading);
      }
    });

    it("Legends are LEGENDARY with a reveal prompt, a heavy cost or cooldown lever, and named roster counters", () => {
      for (const id of legends) {
        const c = CHARACTER_LIBRARY[id]!;
        expect(c.rarity).toBe("LEGENDARY");
        expect(c.tags).toContain("LEGENDARY");
        expect(CHARACTER_ART_LIBRARY[id]!.legendRevealPrompt, id).toBeTruthy();
        const heavy = c.abilityIds.some((a) => {
          const ab = ABILITY_LIBRARY[a]!;
          const total = Object.values(ab.cost).reduce((x, n) => x + n, 0);
          return total >= 5 || ab.cooldown >= 5;
        });
        expect(heavy, `${id} needs a costly or long-cooldown ability`).toBe(true);
        const note = readFileSync(`${notesDir}${id}.md`, "utf8");
        expect(note, id).toContain("## Balance levers");
        const counterSection = note.slice(note.indexOf("## Counterplay"));
        const named = [...counterSection.matchAll(/[*][*]([^*]+)[*][*]/g)].map((m) => m[1]!.trim()).filter((n) => Object.values(CHARACTER_LIBRARY).some((x) => x.displayName === n || x.displayName.startsWith(n)));
        expect(new Set(named).size, `${id} must name at least two roster counters`).toBeGreaterThanOrEqual(2);
      }
    });
  });
}
