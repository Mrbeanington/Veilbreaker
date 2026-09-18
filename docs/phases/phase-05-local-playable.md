# Phase 05 — Playable local 3v3
**Read first:** spec/05 (match screen, tooltip, accessibility)

## Deliverables
- The `apps/web` match screen, driven entirely by the engine: three allies versus three enemies, HP, statuses (icon + text), abilities with cost/cooldown state, energy pool, turn timer, target selection, a queued-actions panel with cancel/confirm, a battle log, and custom resource indicators (Moonshot's bases must be visually obvious).
- Modes: hotseat (two humans, with a pass-the-device screen that hides each player's selections) and vs. a simple bot (random legal action, prefers kills). The bot runs in a Web Worker.
- Team picker limited to the implemented roster, with duplicates disallowed (OQ-15).
- Animation-speed setting and reduced motion. Full keyboard play.
- Placeholder portraits generated from character data (no external art).
- **PWA foundation:** a web app manifest (name from `GAME_TITLE`, generated placeholder icons, standalone display) and a service worker that precaches the build so the game works offline and is installable. No install prompt UI yet (Phase 09).
- An original dark-fantasy look; no resemblance to existing arena-game screens.

## Acceptance criteria
A full match can be played to a win or draw in the browser, served as static files with no network after load. The app passes the browser's installability check. There are component tests for action selection and validation feedback, and the UI never computes combat results itself.

Finish with the end-of-phase report.
