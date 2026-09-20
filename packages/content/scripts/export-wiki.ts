import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { ABILITY_LIBRARY, CHARACTER_ART_LIBRARY, CHARACTER_LIBRARY, PASSIVE_LIBRARY, STUB_CHARACTER_IDS, TRANSFORMATION_LIBRARY } from "../src/data/characters/index";
import { STATUS_LIBRARY } from "../src/data/statuses";
import { defaultEnergyRules } from "../src/balance";
import { generateAbilityTooltip } from "../src/tooltip";
import { culturalGroupOf } from "../src/artExport";

// A player-facing snapshot of the roster for the wiki page: only what the game
// itself shows a player. Secret characters are flagged so a page can hide them
// by default. Usage: `pnpm --filter @veilbreak/content exec tsx scripts/export-wiki.ts <out.json>`.
const out = resolve(process.argv[2] ?? "wiki-data.json");

const title = (id: string) => id.replace(/^stage\./, "").replace(/[.-]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

const characters = Object.values(CHARACTER_LIBRARY)
  .filter((c) => !STUB_CHARACTER_IDS.has(c.id))
  .map((c) => {
    const art = CHARACTER_ART_LIBRARY[c.id];
    const passive = c.passiveId ? PASSIVE_LIBRARY[c.passiveId] : undefined;
    return {
      id: c.id,
      name: c.displayName,
      rarity: c.rarity,
      tags: c.tags,
      hp: c.baseHp,
      origin: culturalGroupOf(art?.region).label,
      theme: art?.visualTheme ?? "",
      palette: (art?.colorPalette ?? []).slice(0, 3),
      cheater: c.isCheater ? { rule: c.cheaterRuleBreak ?? "", counterplay: c.counterplay ?? "" } : null,
      abilities: c.abilityIds.map((id) => {
        const a = ABILITY_LIBRARY[id]!;
        return { name: a.displayName, text: a.description, cooldown: a.cooldown, cost: a.cost, detail: generateAbilityTooltip(a), hidden: a.knowledgeLevel !== "PUBLIC" };
      }),
      passive: passive ? { name: passive.displayName, text: passive.description, hidden: passive.knowledgeLevel !== "PUBLIC" } : null,
      resources: c.resources.map((r) => ({ name: r.displayName, start: r.startingValue, max: r.max ?? null, hint: r.displayHint ?? "" })),
      transformations: c.transformationIds.map((id) => title(TRANSFORMATION_LIBRARY[id]?.toStageId ?? id)),
    };
  })
  .sort((a, b) => a.name.localeCompare(b.name));

const statuses = Object.values(STATUS_LIBRARY)
  .filter((s) => !s.hidden && s.knowledgeLevel === "PUBLIC")
  .map((s) => ({ id: s.id, name: s.displayName, text: s.tooltip, stack: s.stackRule, maxStacks: s.maxStacks, dispellable: s.dispellable, tick: s.tickBehavior, source: s.source }))
  .sort((a, b) => a.name.localeCompare(b.name));

const data = { generated: new Date().toISOString(), energy: defaultEnergyRules, characters, statuses };
mkdirSync(dirname(out), { recursive: true });
writeFileSync(out, JSON.stringify(data));
console.log(`Wrote ${out}: ${characters.length} characters, ${statuses.length} statuses`);
const counts: Record<string, number> = {};
for (const c of characters) counts[c.rarity] = (counts[c.rarity] ?? 0) + 1;
console.log(counts);
console.log("regions:", [...new Set(characters.map((c) => c.origin))].length, "hiddenAbilities:", characters.filter((c) => c.abilities.some((a) => a.hidden)).length);
