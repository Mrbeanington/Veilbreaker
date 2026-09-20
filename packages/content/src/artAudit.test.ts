import { existsSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { auditArt, summarizeAudit, type ArtAuditInput } from "./artAudit";
import { ART_EXPORT_FORMAT, ASSET_SIZES, buildArtExport, culturalGroupOf, GLOBAL_NEGATIVE_PROMPT } from "./artExport";
import { CHARACTER_ART_LIBRARY, CHARACTER_LIBRARY, CHARACTER_VISUAL_BIBLE_LIBRARY, PLAYABLE_CHARACTERS, STUB_CHARACTER_IDS, TRANSFORMATION_LIBRARY } from "./data/characters/index";
import { GLOBAL_ART_LANGUAGE } from "./schemas/art";

// phase-14: the art audit over the real roster, and over deliberately broken specs.

const real: ArtAuditInput = { characters: PLAYABLE_CHARACTERS, art: CHARACTER_ART_LIBRARY, bibles: CHARACTER_VISUAL_BIBLE_LIBRARY, transformations: TRANSFORMATION_LIBRARY };

/** One character's real spec with a change applied, audited on its own. */
function broken(id: string, change: (art: (typeof CHARACTER_ART_LIBRARY)[string]) => Partial<(typeof CHARACTER_ART_LIBRARY)[string]>) {
  const character = CHARACTER_LIBRARY[id]!;
  const art = { ...CHARACTER_ART_LIBRARY[id]!, ...change(CHARACTER_ART_LIBRARY[id]!) };
  return auditArt({ characters: [character], art: { [id]: art }, bibles: CHARACTER_VISUAL_BIBLE_LIBRARY, transformations: TRANSFORMATION_LIBRARY });
}

describe("art audit over the real roster", () => {
  it("has no errors and no warnings for all 119 playable characters", () => {
    const findings = auditArt(real);
    expect(findings, summarizeAudit(findings)).toEqual([]);
    expect(PLAYABLE_CHARACTERS).toHaveLength(119);
  });

  it("every spec is still a draft awaiting cultural review (OQ-12)", () => {
    for (const c of PLAYABLE_CHARACTERS) {
      expect(CHARACTER_ART_LIBRARY[c.id]!.status, c.id).toBe("draft");
      expect(CHARACTER_ART_LIBRARY[c.id]!.culturalConsultationNeeded, c.id).toBe(true);
    }
  });

  it("every prompt of every character carries the global art language and the four identity anchors", () => {
    for (const c of PLAYABLE_CHARACTERS) {
      const art = CHARACTER_ART_LIBRARY[c.id]!;
      const bible = CHARACTER_VISUAL_BIBLE_LIBRARY[c.id]!;
      const prompts = [art.splashPrompt, art.portraitPrompt, art.battleAvatarPrompt, ...art.abilityIconPrompts, ...art.transformationPrompts, art.secretSilhouettePrompt, art.legendRevealPrompt].filter((p): p is string => !!p);
      for (const p of prompts) {
        expect(p, c.id).toContain(GLOBAL_ART_LANGUAGE);
        for (const anchor of [bible.species, bible.face, bible.bodyType, bible.silhouette]) expect(p, c.id).toContain(anchor);
      }
    }
  });

  it("every Secret has a silhouette, every Legend a reveal, every transformation art, and every palette is listed", () => {
    for (const c of PLAYABLE_CHARACTERS) {
      const art = CHARACTER_ART_LIBRARY[c.id]!;
      if (c.rarity === "SECRET") expect(art.secretSilhouettePrompt, c.id).toBeTruthy();
      if (c.rarity === "LEGENDARY") expect(art.legendRevealPrompt, c.id).toBeTruthy();
      expect(art.transformationPrompts.length, c.id).toBeGreaterThanOrEqual(c.transformationIds.length);
      expect(art.colorPalette.length, c.id).toBeGreaterThan(0);
    }
  });
});

describe("art audit catches what it is meant to catch", () => {
  it("an empty field", () => {
    expect(broken("tortuga-rex", () => ({ visualTheme: "  " })).some((f) => f.level === "error" && f.field === "visualTheme")).toBe(true);
    expect(broken("tortuga-rex", () => ({ colorPalette: [], paletteConcept: "" })).some((f) => f.field === "paletteConcept")).toBe(true);
  });

  it("a prompt that lost its identity anchors", () => {
    const f = broken("tortuga-rex", () => ({ splashPrompt: "a turtle, no other detail" }));
    expect(f.some((x) => x.field === "splashPrompt" && /identity anchors/.test(x.message))).toBe(true);
  });

  it("a style imitation, a franchise name, a living artist and an artist credit", () => {
    const anchors = (art: { splashPrompt: string }) => art.splashPrompt;
    for (const [phrase, pattern] of [
      ["in the style of a famous painter", /style imitation/],
      ["a hero from Pokemon", /franchise/],
      ["painted by Greg Rutkowski", /living artist/],
      ["illustrated by Jane Painter", /artist credit/],
    ] as const) {
      const f = broken("tortuga-rex", (art) => ({ splashPrompt: `${anchors(art)}, ${phrase}` }));
      expect(f.some((x) => x.field === "splashPrompt" && pattern.test(x.message)), phrase).toBe(true);
    }
  });

  it("a request for text or a logo, but not the standard negatives", () => {
    const asks = broken("tortuga-rex", (art) => ({ portraitPrompt: `${art.portraitPrompt}, a banner reading the game's logo in gold lettering` }));
    expect(asks.some((x) => x.field === "portraitPrompt" && /lettering/.test(x.message))).toBe(true);
    expect(broken("tortuga-rex", () => ({}))).toEqual([]); // the built-in "no text, no logo" is fine
  });

  it("a Secret without a silhouette, a Legend without a reveal and a transformation without art", () => {
    expect(broken("icarion", () => ({ secretSilhouettePrompt: undefined })).some((x) => x.field === "secretSilhouettePrompt")).toBe(true);
    expect(broken("zeiron", () => ({ legendRevealPrompt: undefined })).some((x) => x.field === "legendRevealPrompt")).toBe(true);
    expect(broken("patient-zero", () => ({ transformationPrompts: [] })).some((x) => x.field === "transformationPrompts")).toBe(true);
  });

  it("a spec promoted past draft without review, and fewer than four icons", () => {
    expect(broken("tortuga-rex", () => ({ status: "final" })).some((x) => x.field === "status")).toBe(true);
    expect(broken("tortuga-rex", (art) => ({ abilityIconPrompts: art.abilityIconPrompts.slice(0, 2) })).some((x) => x.field === "abilityIconPrompts")).toBe(true);
  });
});

describe("art export", () => {
  const data = buildArtExport({ characters: Object.values(CHARACTER_LIBRARY), art: CHARACTER_ART_LIBRARY, bibles: CHARACTER_VISUAL_BIBLE_LIBRARY, nonPlayableIds: STUB_CHARACTER_IDS });

  it("covers every character with every required asset", () => {
    expect(data.format).toBe(ART_EXPORT_FORMAT);
    expect(data.counts.characters).toBe(120);
    expect(data.counts.playable).toBe(119);
    for (const c of data.characters.filter((x) => x.playable)) {
      const kinds = c.assets.map((a) => a.kind);
      for (const kind of ["portrait", "splash", "battleAvatar"]) expect(kinds, c.id).toContain(kind);
      expect(kinds.filter((k) => k === "abilityIcon").length, c.id).toBeGreaterThanOrEqual(4);
    }
    expect(data.counts.byKind.legendReveal).toBe(12);
    expect(data.counts.byKind.secretSilhouette).toBeGreaterThanOrEqual(14);
  });

  it("gives every asset a unique id, a size and the shared negative prompt", () => {
    const ids = new Set<string>();
    for (const c of data.characters) {
      for (const a of c.assets) {
        expect(ids.has(a.id), a.id).toBe(false);
        ids.add(a.id);
        expect(a.negativePrompt).toBe(GLOBAL_NEGATIVE_PROMPT);
        expect(a.width).toBe(ASSET_SIZES[a.kind].width);
        expect(a.prompt.length).toBeGreaterThan(40);
      }
    }
  });

  it("puts the highest-priority cultural groups first and lists every character in one", () => {
    expect(data.culturalGroups[0]!.priority).toBe("high");
    const listed = data.culturalGroups.flatMap((g) => g.characters);
    expect(new Set(listed).size).toBe(data.characters.length);
    expect(culturalGroupOf("Japanese folklore inspiration (woodblock composition)").id).toBe("japanese");
    expect(culturalGroupOf("World folk-tale inspiration (storybook borders)").priority).toBe("high");
    expect(culturalGroupOf(undefined).id).toBe("original");
  });

  it("the committed docs/art/art-specs.json is up to date (run `pnpm art:export` after changing art)", () => {
    const file = fileURLToPath(new URL("../../../docs/art/art-specs.json", import.meta.url));
    expect(existsSync(file), "docs/art/art-specs.json is missing: run pnpm art:export").toBe(true);
    expect(JSON.parse(readFileSync(file, "utf8"))).toEqual(JSON.parse(JSON.stringify(data)));
  });
});
