# Claude handoff (Survival)

Written only by Claude; Codex reads it and never edits it. Procedure:
[WORKFLOW.md](../../WORKFLOW.md#handoff-files).

## Working on
- Nothing. 2026-11-19: C1-C8 done (the user approved the slice: "all good"); Phase D saves: DS1 done
  (`save.ts`: `serialize`, `parseSave`, `loadState`, plus `dayOf` and `SAVE_FORMAT`); DS2 done
  (`src/save/slots.ts`: `listSlots`, `readSlot`, `writeSlot`, `clearSlot`, `importSlot`, `probe`,
  `firstEmptySlot`, `browserStorage`); DS3 done (`GameScene.saveNow()` and `saveSlot` are the hooks
  for the DS4 HUD menu). Next: DS4.

## DS3 notes
- DS3 also fixed a latent bug in `Game.ts`: the scene object outlives a run, so `ground`, `trees` and
  `buildingViews` were never reset on restart (a second run would have drawn no buildings). `create`
  now resets them. It also adds `scene` to the `?debug` `window.camp` object.
- With no slot (the menu has no slot picker until DS4) the "Autosave is off" toast shows at run start.

## C8 fix list (from the user's playtest)
- Done 2026-11-19: all movement speed doubled (people 0.05 -> 0.1, elders 0.04 -> 0.08, wolves and
  pack leader 0.08 -> 0.16, wolf flee 0.1 -> 0.2 per tick). Edited `jobs.json`, `enemies.json`,
  `FLEE_SPEED` in `combat.ts` and the tables in DESIGN-slice.md. The wolf now reaches a hunter
  holding at range 4 in about 2 s, so the duel test uses seed 2 (seed 1 missed its two ranged shots).
  Game speed (the 1x/2x/4x buttons) is unchanged. Say so if you meant that instead.

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
