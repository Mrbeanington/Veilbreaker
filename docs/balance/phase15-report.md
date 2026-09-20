# Phase 15 report: balance, accessibility, performance, security, offline

Everything here is measured by tests or simulations that are committed. Recommendations are at the end.

## 1. Simulation and balance
**Runs:** 30,000 matches at INTERMEDIATE and at ADVANCED (seed 21) on the roster of 119 playable characters, before and after; 15,000-match runs to check each draft round and the final source. (EXPERT bots are about 20 times slower, so a 30,000-match EXPERT run was abandoned.)

**A. The energy floor (5,000 INTERMEDIATE matches, seed 1):**

| Detector | Before | With `minPerTeam` 4 |
|---|---|---|
| Teams with no legal action for 3 turns | 594 | 189 |
| Matches reaching the 40-turn limit | 118 | 43 |
| Resurrection loops | 6 | 0 |
| One-turn kills from full health | 13 | 10 |

**B. The balance patch (30,000-match baselines, with the floor, against the final source; 15,000-match finals scaled to 30,000):**

| Measure (average of two bot levels) | Before | After |
|---|---|---|
| Spread of character win rates (standard deviation) | 9.4 points | 7.9 |
| Characters above 60% / above 65% | 13 / 3 | 11 / 1 |
| Characters below 40% / below 35% | 21 / 10 | 19 / 1 |
| Teams with no legal action for 3 turns (INTERMEDIATE) | 1,183 | about 860 |
| Matches reaching the turn limit (INTERMEDIATE) | 295 | about 290 |
| One-turn kills from full health (INTERMEDIATE / ADVANCED) | 81 / 213 | about 70 / 200 |
| First-seat win rate | 51.4 / 51.8 | 51.7 / 51.9 |
| Legend teams vs no-Legend teams (INTERMEDIATE) | 47.6% vs 49.6% | 48.7% vs 49.6% |

**Detector results (Phase 07 list):** no state loops, no perpetual stun, no rewind loops, no illegal bot actions, no engine errors and no stalled matches in any run. The **resource lock** was the real finding: teams with no legal action for three turns were almost always a last survivor (348 of 353 in a diagnostic run) whose 2 energy a turn could not pay for a specific mix of families. Fix: `generation.minPerTeam = 4` in `energy-rules.json`. Raising the per-character rate (3 or 4) was tried and rejected: it widened the spread of win rates from 9.5 to 10.5 and 11.6 points and shortened matches to 11-13 turns.

**Patch `phase-15-v1` (58 edits):** see `docs/balance/drafts/phase-15-v1.json` and the Phase 15 section of each changed character's design note. Biggest movers: Behemoth 35 to 54, The Referee 29 to 47, Koschei 30 to 46, Maestro Nocturne 27 to 40, The Marionettist 35 to 47, Oni of the Red Gate 26 to 37, Zeiron 34 to 42; Draugr 66 to 60, Rusalka 63 to 59, Patient Zero 65 to 61, The Lawyer 64 to 60.
**Still outside 40-60%:** highest The Firebird 67, El Magnífico 64, The Birch Witch 62, Shieldmaiden Yrsa 62, The Valkyrie 62; lowest Malachar 32, Kappa Kiro 36, The Gunslinger QB 37, Moonshot Maddox 37, Oni of the Red Gate 37, The Painted Ronin 37, Shiro 37, The Gambler 37. Situational characters do not have to sit at 50% (spec/07), and the win rates are against heuristic bots.

## 2. Accessibility audit
- **Automated (axe-core, in CI):** every main screen (Play, Characters, Teams, Ranked, Codex, Missions, Legends, Profile, Settings) has zero violations (names, roles, labels, landmarks, ARIA).
- **Colour contrast (WCAG AA, both themes):** text and muted text at least 4.5:1 on all three surfaces; accent, ally, enemy, good, warn and danger colours at least 4.5:1 as text; high-contrast borders at least 3:1. One failure fixed: the enemy colour on the raised surface was 4.43:1 and is now above 4.5:1.
- **Colour-blind safety:** ally and enemy colours differ in lightness as well as hue (tested); team membership is also given by position and name, not colour alone.
- **Keyboard:** the navigation is operable with the keyboard alone (existing test); focus is always visible (tested); a skip link exists.
- **Reduced motion:** honoured from the system and from the setting (tested). **Scaling:** four interface sizes; no font size in pixels (tested), so all text scales. **Timers:** the turn timer is optional (setting).
- **Not covered:** a screen-reader pass by a person, and contrast of text over future art.

## 3. Performance
- **Turn cost:** about 0.2 ms per turn at INTERMEDIATE, 0.5 ms at ADVANCED and 4 ms at EXPERT, including both bots' planning and the engine's resolution, on the development machine, against a 10 ms target for resolution alone (CI tests enforce generous limits for all three).
- **Bundle:** initial download 279 KB gzip (app 163 KB, libraries 116 KB); bot worker 125 KB gzip, loaded only when a match starts. Budgets in CI: 340 KB and 190 KB. Region content is not split: every region is needed by the character browser and no art ships yet.
- **Not measured:** frame rate and resolution time on a real mid-range phone.

## 4. Security review (client-only)
- **CSP:** default-src, script-src, connect-src, worker-src, manifest-src, font-src all 'self'; object-src and frame-src 'none'; no eval, no inline script, no remote host (tests).
- **Untrusted input:** backup files, transfer codes, replay files and friend-match codes are fuzzed (mutations, truncation, hostile literals, prototype-pollution keys, 2 MB inputs, decompression-bomb-looking data): none throws, none pollutes prototypes, all damaged input is rejected. Codes are size-limited before decompression.
- **Sanitisation:** React escapes all text; names are limited to 40 characters by schema; a single innerHTML sink (the QR picture) is fed only our own QR renderer, and its output is tested to contain only drawing elements even for hostile text.
- **Network and dev mode:** `verify-client-only` finds no external URL or network call in the build; game source has no fetch, XHR, WebSocket or beacon (tested); `verify-no-dev-mode` proves the dev tools are absent from production.

## 5. Offline / PWA audit
- **Real-browser check (Chromium):** fresh visit, service worker installed and controlling with 12 files precached; the server was then stopped and `/?dev=1` navigated to: the whole app loaded from the service worker (all nine sections). This found and fixed two bugs (stale-cache mixing, `Vary: Origin` misses).
- **Update safety:** a new build's worker waits for old tabs; it never deletes the running build's cache; saves are in IndexedDB and unaffected. **Manifest:** name, id, lang, categories, standalone, relative URLs, 192 and 512 icons.
- **Not done:** Firefox, WebKit, a real iPhone or Android device, Lighthouse, Playwright, the single-file build (OQ-106, OQ-107).

## Recommendations
1. Run the offline check on Firefox, Safari and real phones, and Lighthouse, before release (OQ-106).
2. Close OQ-65 and switch to balance patches before the first public release (OQ-109).
3. Add an update banner (OQ-108) and, if wanted, the single-file build (OQ-107).
4. Run an EXPERT-level batch on faster hardware and start real playtests; then revisit the remaining high and low characters (OQ-110).
5. Have a person do a screen-reader pass and review contrast over real art.
