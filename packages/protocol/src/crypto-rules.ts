import type { CharacterDefinition, MatchFormat } from "@veilbreak/content";
import type { ResolveTurnDeps } from "@veilbreak/engine";
import { canonicalJson, sha256Hex } from "./hash";

// spec/06 "Balance-version and content-hash checks ensure both clients run
// identical rules": both sides hash the exact rule data the engine will use.
export interface RuleSet {
  balanceVersionId: string;
  deps: ResolveTurnDeps;
  characters: Record<string, CharacterDefinition>;
  matchFormat: MatchFormat;
  /** Characters a friend match may use ("everything unlocked" mode). */
  playableIds: readonly string[];
}

export async function contentHash(rules: RuleSet): Promise<string> {
  const { deps } = rules;
  return sha256Hex(
    canonicalJson({
      balance: rules.balanceVersionId,
      abilities: deps.abilities,
      characters: rules.characters,
      energyRules: deps.energyRules,
      passives: deps.passives,
      resolutionOrder: deps.resolutionOrder,
      resources: deps.resourceLibrary,
      statuses: deps.statusLibrary,
      summons: deps.summonLibrary,
      transformations: deps.transformationLibrary,
      matchFormat: rules.matchFormat,
    }),
  );
}
