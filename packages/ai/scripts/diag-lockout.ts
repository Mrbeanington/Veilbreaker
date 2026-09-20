import { validateAction } from "@veilbreak/engine";
import { PLAYABLE_CHARACTERS } from "@veilbreak/content";
import { defaultSimDeps, runBatch } from "../src/index";

// Diagnostic: why do teams have no legal action for three turns?
const deps = defaultSimDeps();
const reasons = new Map<string, number>();
const teams = new Map<string, number>();
let total = 0;
runBatch({
  deps, botA: "INTERMEDIATE", botB: "INTERMEDIATE", matches: Number(process.argv[2] ?? 1500), seed: Number(process.argv[3] ?? 1),
  onLockout: (state, playerId) => {
    total += 1;
    const team = state.teams.find((t) => t.playerId === playerId)!;
    const alive = team.characterIds.filter((id) => state.characters[id]?.alive);
    teams.set(String(alive.length), (teams.get(String(alive.length)) ?? 0) + 1);
    for (const id of alive) {
      const c = state.characters[id]!;
      for (const abilityId of c.abilityIds) {
        const ability = deps.abilities[abilityId]!;
        const target = ability.target.side === "self" ? id : ability.target.side === "ally" ? id : state.teams.find((t) => t !== team)!.characterIds[0]!;
        const errs = validateAction(state, { playerId, characterId: id, abilityId, targetIds: ability.target.scope === "single" ? [target] : [] }, deps.abilities).map((e) => e.code);
        const key = `${errs.join("+") || "legal?"}`;
        reasons.set(key, (reasons.get(key) ?? 0) + 1);
      }
    }
  },
});
console.log("lockouts", total, "alive-count histogram", Object.fromEntries(teams));
console.log([...reasons.entries()].sort((a, b) => b[1] - a[1]));
void PLAYABLE_CHARACTERS;
