# Roadmap: from proof of concept to a polished indie game

Written 2026-09-21, after Phase 15 and the release polish rounds (quests, tutorial, balance releases 2 and 3, single-file build, portrait pipeline). This is a planning note, not a spec. Nothing here is committed work.

## Where the project stands

**Strong**
- A deterministic, tested engine; 119 data-driven fighters; versioned balance patches; offline play; a single-file build.
- About 1,180 tests, CI with security, accessibility, size and offline guards, Lighthouse 100/100/100, keyboard play works.
- Progression: a curated 12-fighter starter roster (ADR-058), per-fighter unlock quests, Legend trials gated by level, ranked at level 3, cosmetic titles and frames, mastery rings.
- A portrait pipeline: prompt files for portraits and splashes, an importer, coverage status, size budgets.

**Weak**
- Nobody outside development has played it. Every design number (quest pacing, level gates, balance) is validated only by bots.
- Presentation: matches are health bars and a text log. No animation, no sound assets.
- Art coverage: portraits 36 of 119; no splashes, ability icons, status icons or backgrounds yet.
- Online play is code swapping; there is no live or matchmade play.

The code is past proof of concept. The game is not yet, and the gap to "indie AAA" is art, audio, feel and validation, not engineering.

## What "indie AAA" would take

1. **Prove the fun.** 10 to 20 real players through the tutorial and several matches. Watch where they get confused or quit. Everything else depends on this.
2. **Presentation and game feel.** Hit and damage animations, floating numbers, ability effects, transitions, characters shown on the board with their splash art, a proper visual design pass on the whole UI.
3. **Finish the art.** 119 portraits, 119 splashes, about 480 ability icons, status icons, backgrounds, UI kit. Cultural review for the Japanese, Slavic, Egyptian and world-folklore designs (OQ-12).
4. **Audio.** Music and sound effects. The sound system exists (`soundBus`) but has no assets.
5. **Live play.** Peer-to-peer or a small server, decided on purpose (see below).
6. **Content depth.** Campaign or story mode, daily and weekly challenges, draft-and-ban, seasons. A tighter, fully polished launch roster can beat 119 fighters with initials.
7. **Platform reach.** Phone layouts, text translation, desktop and mobile packaging, store pages.
8. **Stronger bots** for single-player, with recognisable personalities.

## Decisions that need the owner

- **Serverless or not.** The client-only rule is a distinctive strength (private, free to run, works offline). Live matchmaking and shared leaderboards need either WebRTC with manual or QR signalling (still serverless) or a small optional server. Decide before building online play.
- **AI-generated art.** Copyright protection for it is weak, and some communities and stores dislike it or require disclosure. A common compromise is to commission the logo, key art and Legend art from human artists and use generated art for the rest.
- **The name.** "Veilbreak: Arena of the Fallen" is provisional (`GAME_TITLE` in `packages/content/src/branding.ts`). It needs a trademark check before any store page.
- **Scope.** Polished indie is reachable with this workflow. True AAA production values (animation, audio, art volume, live operations) need a team or a real budget.

## Suggested order

| Step | What | Who |
|---|---|---|
| 1 | Playtest kit: an in-game feedback report players send back as a code, and 10 to 20 real playtests | Claude builds the kit, the owner recruits |
| 2 | Battle presentation pass: animations, damage numbers, effects, audio hooks | Claude |
| 3 | Art completion: portraits, splashes, then ability and status icons (needs importer and prompt support first) | Owner generates, Claude tooling |
| 4 | Phone layout audit and fixes; text-translation scaffolding | Claude |
| 5 | Live play: WebRTC friend matches | Claude |
| 6 | Ship prep: desktop (Tauri or Electron) and mobile (Capacitor) packaging, store page, legal and name check | Claude and owner |

## Things that can start now without waiting for art or people

- The playtest feedback kit.
- A phone-layout audit with device emulation.
- The battle presentation pass.
- Text-translation scaffolding (all strings are English literals today).

## Standing open items (from `docs/OPEN-QUESTIONS.md`)

- Android packaging (step 6) is well underway: Capacitor is set up and the first debug APK built successfully (ADR-061, ADR-062; recipe in `docs/ANDROID-BUILD.md`). Not yet done: running it on a real device (the owner's is an unusually square-screened Unihertz Titan 2 — a rough layout check on an estimated matching viewport found no breakage, but the real device hasn't confirmed it), and release signing / a Play Store `.aab` if that's ever wanted.
- OQ-106: Firefox, a real iPhone and a real Android device are untested.
- OQ-105 and OQ-12: finish portraits; cultural review.
- OQ-110: real playtests; a few fighters still sit far from 50% with bots.
- A real screen-reader session.

## Ideas not yet scheduled

- **Selectable art themes** (owner idea, 2026-09-23): let a player pick a visual theme in Settings — today's painted/AI-generated style, plus e.g. a cartoon style — swapping portraits, splashes, and possibly the palette. Real upside: replayability, and an out for anyone who doesn't like generated art. Real cost: art volume roughly multiplies per theme (119 portraits + 119 splashes, each style), and every theme ships in the static build — the client-only rule means no per-theme CDN fetch, so `verify-bundle-budget.mjs`'s image budget needs watching as themes are added. Don't restructure `apps/web/src/art/portraits/` / `.../splashes/` ahead of time for this; when it actually starts, move the current set into a `default/` subfolder and add a second `<theme>/` alongside it — one new theme at a time, not several. Sequencing: finish splashes (119/119) for the one style already in progress before starting a second style.

## Tools that already exist

- `pnpm sim`, `pnpm meta`: balance simulation and the ladder meta pool. `docs/design/balance-workflow.md`.
- `pnpm art:portraits`, `pnpm art:splashes`, `pnpm art:import`, `pnpm art:status`. `docs/art/README.md`.
- `pnpm build:single`: one html file that opens from disk.
- `scripts/manual/`: cross-browser, Lighthouse and keyboard checks (need Playwright).
