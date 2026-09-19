import { PLAYABLE_CHARACTERS, defaultMatchFormat, type CharacterDefinition } from "@veilbreak/content";

// phase-05-local-playable.md "Team picker limited to the implemented
// roster" — excludes the Phase 04 stub (one placeholder ability, not a real
// playable kit; see docs/design/characters/mister-whiskers.md) so a player
// can never pick a character with nothing to actually do in a match.
export const PICKABLE_CHARACTERS: CharacterDefinition[] = [...PLAYABLE_CHARACTERS].sort((a, b) => a.displayName.localeCompare(b.displayName));

// CLAUDE.md rule 6 "configuration over constants" — team size comes from
// spec/01's MatchFormat, never a locally hard-coded number.
export const TEAM_SIZE = defaultMatchFormat.teamSize;
