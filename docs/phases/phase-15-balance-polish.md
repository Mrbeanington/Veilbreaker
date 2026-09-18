# Phase 15 — Balance pass, polish, accessibility, performance, security
**Read first:** spec/05 (accessibility), spec/06 (security), spec/07

## Deliverables
- A large simulation run across the full roster, with fixes for infinite loops, stun locks, resource locks, unavoidable OTKs, and resurrection/rewind loops.
- A balance report with recommendations.
- An accessibility audit (keyboard, colorblind, reduced motion, scaling, timers).
- Performance targets: turn resolution under 10 ms in the browser on mid-range devices, a 60 fps UI, a bot move within its time budget, and a reasonable initial bundle (lazy-load region content and art).
- A client-only security review: CSP, untrusted-input handling for saves/codes/replays, text sanitization, dev mode excluded from production, and zero external requests.
- Offline/PWA audit (the foundation was built in Phase 05 and the install flow in Phase 09): the service worker caches the full game, updates apply cleanly without losing saves, the Lighthouse PWA check passes, and the Playwright offline test passes on Chromium, Firefox, and WebKit. Test on a real iPhone and a real Android device if available.
- Optional single-file build verified to run when opened as a local file.

Finish with the end-of-phase report.
