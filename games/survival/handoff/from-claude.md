# Claude handoff (Survival)

Written only by Claude; Codex reads it and never edits it. Procedure:
[WORKFLOW.md](../../WORKFLOW.md#handoff-files).

## Working on
- Nothing. 2026-11-19: C1-C7 done. Next: C8 (the user plays the slice).

## Awaiting the user
- Nothing on CULTURE.md: all questions are decided (2026-11-19).
- C1 map deviations (river stays inside the clearing; berry patches never touch it): the user left
  the call to Claude on 2026-11-19, so the code was kept and `## Map` in DESIGN-slice.md was updated
  to match. Tell Claude if you want the old rule back.

- C3 went past PLAN's file list on purpose: haul/build/hunt/gathering-spot behaviour in `jobs.ts`, `tick.ts`
  and `state.ts` (a site cannot complete without them), `Game.ts` and `main.ts` for ghost placement.
  Say so if you want that scope kept to the plan next time.

- C5 also touched `state.ts` (new orders, `speed`, `paused`), `tick.ts` (order handling moved to
  `orders.ts`), `jobs.ts` (drafted people only walk), `Game.ts`, `Build.ts` (`isOpen`) and `main.ts`,
  and `Select.ts` includes toasts and pause/speed keys. Drafted people keep their job and its worker
  slot, and resume it when undrafted. Say so if you want it otherwise.

- C6 went past PLAN's file list on purpose: `state.ts` (enemies, wave progress, `result`, `post` on
  a person, the `attack` order), `people.ts`, `jobs.ts` and `tick.ts` (hooks), `orders.ts`, plus
  `render/enemies.ts`, `Hud.ts` (wave banner, end screen), `Select.ts` (right-click a wolf) and
  `Game.ts`. Choices the design left open: wolves walk in straight lines (they ignore the river and
  buildings); a drafted person returns to a `post` tile (where drafted, or the last `move` target)
  after a fight; fleeing wolves are not auto-targeted unless already in weapon range; the tick loop
  stops once `state.result` is set. Say so if you want any of these otherwise.

- C7 went past PLAN's file list on purpose: `Boot.ts` (starts the menu), `main.ts` (registers it),
  `DEVELOPMENT.md` and `AGENTS.md` (guide lines). Speed buttons also resume a paused game; the
  smoke test uses its own port (5184) because 5174 may be taken by a running dev server. `npm run
  publish` was run once, so `index.html` and `build/` exist locally, uncommitted.

## Requests for Codex
- None yet. Art requests start after the slice playtest (PLAN.md Phase D), per
  [art/PIPELINE.md](../art/PIPELINE.md).

## Taken from Codex
- None.
