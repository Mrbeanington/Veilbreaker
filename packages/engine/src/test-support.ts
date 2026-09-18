import type { CharacterRuntimeState } from "@veilbreak/content";

// Shared test fixture helper (not exported from index.ts — this is test
// infrastructure, not part of the public engine API, and unrelated to the
// "test fixtures instead of hard-coded content" convention used for
// abilities/statuses elsewhere). Every *.test.ts file across this package
// needs a well-formed, mostly-empty CharacterRuntimeState; keeping the
// construction in one place means a future required field only needs
// updating here instead of in every test file.
export function testCharacter(
  overrides: Partial<CharacterRuntimeState> & Pick<CharacterRuntimeState, "characterId">,
): CharacterRuntimeState {
  return {
    currentHp: 100,
    maxHp: 100,
    alive: true,
    cooldowns: {},
    statuses: [],
    resources: {},
    abilityIds: [],
    abilityHistory: [],
    stats: { damageDealt: 0, damageReceived: 0, healingDone: 0, kills: 0, deaths: 0 },
    pendingRngModifiers: [],
    ...overrides,
  };
}
