# Balance workflow (phase 12)

Balance numbers are data. Changing them never means editing character source files.

## 1. Open dev mode
- **Dev server:** `pnpm --filter @veilbreak/web dev`, then open the page with `?dev=1` (for example `http://localhost:5173/?dev=1`). A **Dev** button appears in the navigation.
- **A build made on purpose:** `VITE_DEV_MODE=1 pnpm build` compiles the workbench in and shows the Dev button without the URL flag. Do not publish that build.
- A normal `pnpm build` contains no dev-mode code. `pnpm verify-no-dev-mode` (part of `pnpm ci`) checks that, and also proves the check works by building once with the flag on.

## 2. Make a draft
1. Create a draft (a name becomes a kebab-case id).
2. Search or filter by kind and change values: health, damage, healing, energy costs, cooldowns, durations, status and effect values, transformation requirements, random-outcome weights, and the energy rules (`perLivingCharacter`, `poolCap`).
3. The **diff** lists every value that differs from the shipped version. **Validation** rejects a value below its minimum or an entry that no longer passes its schema, and warns when damage or healing leaves the multiples-of-10 damage language.
4. Drafts are saved in this browser's IndexedDB. Nothing changes for anyone else.

## 3. Test it
- In the workbench, **Run simulation** runs the shipped balance and the draft on random teams in a Worker and shows character win rates side by side, outlier flags (60% and above, 40% and below), first-player advantage, match length, and recommendations. **Recommendations are text only. Nothing is ever changed automatically.**
- From a terminal: download the draft, then `pnpm sim --matches 10000 --bots intermediate --balance path/to/balance-<id>.json`.
- Situational characters do not have to sit at 50% (spec/07). Re-run at a higher bot level before acting on a flag.

## 4. Publish it
1. Download the draft JSON.
2. Add the file's contents to `SHIPPED_BALANCE_PATCHES` in `packages/content/src/balance.ts` (the draft id, for example `release-2`, is the balance version id; patches are cumulative against `release-1`, so a new patch contains every change since the base).
3. Add a test for anything that matters, run `pnpm ci`, and note the change in `docs/DECISIONS.md`.
4. Old replays keep the version id they were recorded with, and `librariesForVersion` resolves them under those numbers. A replay from a version this build does not know is flagged, not silently replayed.
5. Re-run `pnpm meta` (the ranked ladder's meta pool) after a balance change.

> New matches and the UI follow the newest published patch automatically: `CURRENT_BALANCE_VERSION_ID` feeds `BALANCE_VERSION_ID`, and `activateBalance()` (called at startup on the page and in the bot worker) applies the newest patch to the live libraries. The numbers written in character source are the frozen `release-1` base: never edit them after release. Change a number only by publishing a patch. A fingerprint test (`balance.release.test.ts`) fails if source drifts from the base (ADR-035).
