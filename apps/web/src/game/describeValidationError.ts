import { ABILITY_LIBRARY, CHARACTER_LIBRARY } from "@veilbreak/content";
import type { ActionValidationError } from "@veilbreak/engine";

function name(id: string): string {
  return CHARACTER_LIBRARY[id]?.displayName ?? id;
}

function abilityName(id: string): string {
  return ABILITY_LIBRARY[id]?.displayName ?? id;
}

// phase-05-local-playable.md acceptance criterion: "validation feedback."
// `validateAction` (packages/engine/src/actions.ts) is the single source of
// truth for legality — this only translates its typed error codes into a
// sentence, never re-derives whether the action was actually legal.
export function describeValidationError(error: ActionValidationError): string {
  switch (error.code) {
    case "unknownCharacter":
      return `Unknown character "${error.characterId}".`;
    case "characterNotAlive":
      return `${name(error.characterId)} has fallen and cannot act.`;
    case "characterCannotAct":
      return `${name(error.characterId)} cannot act right now (stunned or silenced).`;
    case "characterNotOnPlayersTeam":
      return `${name(error.characterId)} is not on your team.`;
    case "unknownAbility":
      return `Unknown ability "${error.abilityId}".`;
    case "abilityLocked":
      return `${abilityName(error.abilityId)} is locked for ${name(error.characterId)}.`;
    case "abilityOnCooldown":
      return `${abilityName(error.abilityId)} is on cooldown for ${error.turnsRemaining} more turn(s).`;
    case "energyFamilyLocked":
      return `${name(error.characterId)} cannot spend ${error.family} energy right now.`;
    case "cannotAfford":
      return `Not enough energy for ${abilityName(error.abilityId)}.`;
    case "invalidTarget":
      return `Invalid target: ${error.reason}.`;
  }
}
