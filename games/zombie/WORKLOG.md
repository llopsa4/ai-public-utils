# Dead Woods current status

Updated 2026-11-24 (cleanup K1–K5). Shared procedure: [WORKFLOW.md](../WORKFLOW.md). Per-agent
activity and requests: [from Claude](handoff/from-claude.md), [from Codex](handoff/from-codex.md).
Per-unit history lives in git log and the PLAN.md rows, not here.

## Mode
- **Codex + Claude** since 2026-11-22 (user): Claude builds code and grey stand-ins; Codex generates
  and installs all art ([modes](../WORKFLOW.md#modes-and-ownership)).

## Current state
- Playable slice: New Game → Intro (tutorial) → Mission 1 (house in the woods) → Base 1 (fix, cook,
  traps, 12-zombie herd, herd checkpoint) → "To be continued", with saves (v2), pause menu, options,
  key rebinding, squad panel, Commandos-style mouse, code-made audio and adaptive ambience.
- Art installed locally and final: Cass, Eli, the nine zombie sheets (fresh, decayed, rotting), the
  UI kit, icons, portraits, title background and logo (A1–A11). The environment (ground, walls,
  roof, props) is still grey stand-ins.
- Balance (Z43) accepted: careful defence wins about 77% of seeds, passive 0%.
- Checks at the last run (K4): typecheck, 271 unit tests, 2 e2e specs pass. Gate 3 (playtest) passed
  2026-11-24. Not played by hand since the A10/A11 art and the title screen (Z57).
- Git: cleanup K1–K5 is one local commit on `main`; nothing is pushed. The published `index.html` +
  `build/` may predate the latest art; run `npm run publish` and commit before any push meant to
  change the live site (and only push on the user's request, with the branch named).

## Pending decisions
- The 7-character roster (user deciding; grill when ready, PLAN.md *Later*). The slice uses Cass
  (Fighter) and Eli (Scout).
- Environment art: grilling queued (PLAN.md *Environment art grilling*), then Codex batches.

## Next action
- Claude: nothing queued. Likely next: environment art grilling (Opus) when the user is ready, or
  Z26 (publish) before a push.
- Codex: nothing open; waits for the environment art spec.
