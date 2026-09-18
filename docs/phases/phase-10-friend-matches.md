# Phase 10 — Friend matches (serverless)
**Read first:** spec/06 (trust model, friend match by code, live P2P), spec/05 (friend-match code UX)

## Deliverables
- **Match protocol module** (pure, fully unit-tested). It covers:
  - Message types: setup, commit, reveal, state-hash, resign.
  - Compact binary → base64url encoding.
  - Seed derivation from both players' commit-reveal contributions.
  - Per-turn salt mixing into the RNG stream.
  - SHA-256 via Web Crypto.
  - Balance-version and content-hash handshake.
  - Desync detection.
- **Friend Match UI:** create/join, copy/share/paste codes, turn status, verification badges, resign, and saving the match to replays. Asynchronous matches persist in IndexedDB, so players can close the tab and continue later.
- **Unlock-rule option:** "own unlocks" (honor-based, labeled as such) or "everything unlocked."
- **Stretch, only if time allows:** live WebRTC with manual offer/answer signaling, LAN-guaranteed, sharing the same protocol module. Any STUN use is optional and off by default. Log the outcome either way in DECISIONS.md.

## Acceptance criteria
Tests covering:
- two simulated clients completing a full match purely by exchanging messages, and reaching identical final state hashes
- a wrong reveal being rejected
- a player being unable to bias the seed
- a tampered state being detected
- malformed codes failing gracefully

The build still makes zero required external requests.

Finish with the end-of-phase report.
