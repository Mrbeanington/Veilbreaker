# VEILBREAK — Claude Code Kit (client-only edition)

The original single prompt, restructured for iterative work in Claude Code, with a hard **client-only** platform constraint: no backend, no database, no server-side processing, no authentication, and no external APIs for core functionality. The game ships as static files and plays offline.

## Setup
1. Copy this folder's contents into the root of an empty git repo.
2. Review `docs/OPEN-QUESTIONS.md` and override any defaults you disagree with.
3. Start Claude Code in the repo.

## Kickoff prompt (paste this at the start of each session)
> Read CLAUDE.md and docs/PROGRESS.md, then execute the current phase file in docs/phases/. Follow the session protocol and stop at the end-of-phase report.

## What "client-only" changed
| Original | Client-only replacement |
|---|---|
| Server-authoritative battles | Local deterministic engine; friend matches verified by commit-reveal and state hashes |
| Accounts / auth | An automatic local profile |
| Database | Automatic browser saving, protected by installing as an app; QR/link device transfer; share-sheet backup; JSON fallback |
| Online ranked + leaderboards | Local ranked ladder vs. tiered bots, with personal bests |
| Online PvP | Async friend matches by code/link; optional LAN WebRTC |
| Admin panel | Dev mode that exports balance JSON files |
| Aggregate analytics | Simulation reports plus personal stats |

## Tips
- Review each end-of-phase report and commit before starting the next phase.
- Phases 06 and 13 are multi-session; each session does one batch or region.
- To change a rule globally, edit the spec file, not the phase file. Phase files only point at the spec.
