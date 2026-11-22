# Dead Woods current status

Updated 2026-11-22. Shared procedure: [WORKFLOW.md](../WORKFLOW.md).
Per-agent activity and requests: [from Claude](handoff/from-claude.md), [from Codex](handoff/from-codex.md).

## Mode
- **Codex + Claude** since 2026-11-22 (user): Claude builds the grey-placeholder slice; Codex
  generates and installs art once an art spec exists ([modes](../WORKFLOW.md#modes-and-ownership)).

## Current state
- Branch `main`; nothing committed yet (all of `games/zombie/` is new and untracked, plus one-line
  links in `games/AGENTS.md`, `games/README.md`, `games/index.html`).
- Z6 (campaign + save) done 2026-11-22: `sim/campaign.ts` + `data/story.json`; Camp `M` starts the next mission, extraction + Enter opens `scenes/Debrief.ts`, back to Camp (food, scrap, barricades kept; zombies respawn); after the last mission Camp shows "To be continued...". Menu has Continue when `deadwoods.save` exists; New Game overwrites it. Checks: typecheck, 50 tests, browser run New Game → M → extract → Debrief → Camp → reload → Continue, no console errors.
- Z5 (camp upgrade + roamers) done 2026-11-22: the camp is now a mission-style state (`sim/camp.ts` extends `MissionState`): 4 zombies spawn at the reachable tiles nearest each map edge (the outer woods are sealed pockets), V watch, right-click attack, B barricade (COVER tile, 1 scrap, HP 100, chewed by walled-off chasing zombies), camp restarts when both survivors die. HUD gained hint, banner and zombie count.
- Z4 (mission scene) done 2026-11-22: m01 playable from the menu's "Mission 1 (test)" button: cones
  (enemy red near / yellow far, own watch cone green), noise rings, C stance, V watch, F takedown,
  G carry, L lure, crates, extract, restart on death, Space pause. Mission HUD lives in `scenes/Mission.ts`.
- Z0-Z3 done earlier the same day: docs, scaffold, camp scene (tent, fire, trees, Fighter + Scout, A*
  move, box-select), stealth core sim. `npm run publish` last ran after Z1, so the published build is stale.
- Checks run: typecheck, 50 unit tests; browser runs of m01 and of the camp (New Game, V watch by real click and key, zombie killed, barricades drawn,
  no console errors). Not played by hand with a real mouse and keyboard for long.

## Pending decisions
- The 7-character roster (user deciding). The slice uses Fighter + Scout placeholders.

## Next action
- Z7 done 2026-11-22: `tests/e2e/smoke.spec.ts` + `playwright.config.ts` (menu → New Game → `dw.step(50)`, no console errors; passes), `npm run publish` ran (local `index.html` + `build/` rewritten, not committed). Typecheck and 50 unit tests pass.
- Next: the user's gate, a hand playtest of the slice (PLAN.md *Gate*). Nothing is committed or pushed.
