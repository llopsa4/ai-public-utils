# Survival saves spec (Phase D)

Settled with the user 2026-11-19 (grilling, Q1-Q8). Extends `DESIGN.md` *Saving* ("automatic to
the browser's localStorage, 3 slots, export/import as a file"). Build tasks: [PLAN.md](PLAN.md)
*Phase D: saves*.

## Slots

- 3 slots. Each slot holds **one camp** (one run). There is no manual save button.
- A run is tied to the slot it was started in (`slot: 1 | 2 | 3`), or to no slot when storage is
  unavailable (see `## Storage failure`).
- localStorage keys: `campfire.slot.1`, `campfire.slot.2`, `campfire.slot.3`. The value is the save
  file text (`## Save file`), exactly what Export writes.
- Import only goes into an **empty** slot; to replace a camp, delete it first.

## When it saves

The Game scene writes the run's slot when any of these happens, and never in the middle of a tick:

1. **Day start:** each frame (also while paused, after any ticks), `Math.floor(tick / DAY_TICKS)`
   is larger than at the last check (`DAY_TICKS = 1200`). The check starts from the loaded or new
   state's day, so loading does not save at once.
2. **Pause:** `state.paused` turns from `false` to `true` (Space, the pause button, or opening the
   HUD menu panel).
3. **Tab hidden or closed:** `document` `visibilitychange` to `hidden`, and `pagehide`.
4. **Save and quit** in the HUD menu panel (`## HUD menu`).

When `state.result` becomes `won` or `lost`, the slot is **cleared** (key removed) instead, and no
save is written after that. The end screen's **Play again** returns to the menu as now.

## Save file

JSON text, one object:

```json
{
  "format": "camp-fire-save",
  "version": 1,
  "savedAt": "2026-11-19T18:04:00.000Z",
  "summary": { "day": 3, "people": 18, "seed": 1 },
  "state": { "...": "the GameState" }
}
```

- `state` is the full `GameState` (map, people, buildings, enemies, waves, `rng`, `tick`, store,
  Wotakuye, id counters, `blocked`, `mapVersion`), with `orders: []` and `messages: []` written
  empty. Camera, selection and queued orders are not saved.
- `summary.day = Math.floor(tick / DAY_TICKS) + 1`, `summary.people = people.length`.
- `version` is `SAVE_VERSION = 1` in `src/sim/save.ts`. Raise it whenever `GameState` changes shape.
  Old versions are **not migrated**: they are unreadable.

## Reading a save

`parseSave(text)` returns either the save or a reason. A save is **readable** only when all hold:

- it parses as JSON; `format === "camp-fire-save"`; `version === SAVE_VERSION`;
- `state` has `seed`, `tick`, `wotakuye`, `nextPersonId`, `nextBuildingId`, `nextEnemyId` as
  numbers; `rng.s` a number; `people`, `buildings`, `enemies`, `waves`, `blocked` arrays;
  `store.food/wood/hides` numbers; `map.size` a number with `map.tiles.length === size * size` and
  `blocked.length === size * size`; `result === null`.

Anything else is **unreadable**. Nothing is ever deleted or rewritten automatically.

## Continue (loading)

The loaded state starts **paused**, at **1x**, with `orders` and `messages` empty and the camera
centred on the fire. Stepping a loaded run gives exactly the same state as stepping the run that
was never saved (the `rng` is part of the state).

## Menu

The Menu scene keeps the title, tagline and controls list, and replaces Start / Random seed with
3 slot cards side by side (centred, about 360x150 each, above the controls):

| Card | Shows | Buttons |
|---|---|---|
| Empty | `Slot n` · `Empty` | **New camp** (default seed: `?seed=` or `map.json` start seed), **Random seed**, **Import** |
| Filled | `Slot n` · `Day d · People p · Seed s` | **Continue**, **Export**, **Delete** |
| Unreadable | `Slot n` · `Unreadable save` | **Export**, **Delete** |

- **Delete** asks inline (the card shows `Delete this camp?` **Yes** **No**); no browser dialogs.
- **Export** downloads the slot's stored text as `camp-fire-slot<n>-day<d>.json`
  (`camp-fire-slot<n>.json` when unreadable).
- **Import** opens a file picker (`.json`); a readable file is stored in that slot and the card
  refreshes (it does not start the run). An unreadable file is refused with the menu line
  `That file is not a Camp Fire save, or it is from another version.` and the slot stays empty.
- **Enter** starts a New camp with the default seed in the first empty slot; it does nothing when
  every slot is filled.

## HUD menu

- A **Menu** button in the HUD, left of the pause button.
- Clicking it pauses the game (which saves, `## When it saves`) and opens a centred panel:
  **Resume** (closes the panel and unpauses at the previous speed), **Export this camp** (downloads
  the current state as `camp-fire-slot<n>-day<d>.json`, or `camp-fire-day<d>.json` with no slot),
  **Save and quit to menu** (saves, stops Game/Build/Select/Hud, starts Menu).
- While the panel is open, clicks do not reach the map.
- With no slot (`## Storage failure`), the quit button reads **Quit to menu (not saved)**.

## Storage failure

- At menu start, probe localStorage (write and remove `campfire.probe`). If it throws, the 3 cards
  are replaced by the line `Saving is not available in this browser.` and the old **Start** and
  **Random seed** buttons; runs then have no slot.
- During a run without a slot, or when a save write throws (blocked or full), the toast
  `Autosave is off: the browser can't store it.` shows once per run. The game keeps running, later
  triggers keep trying silently, and **Export this camp** in the HUD menu still works.

## Tests

- `tests/sim/save.test.ts`: `serialize` then `parseSave` returns an equal state (orders and
  messages empty); a run stepped 2500 ticks, saved, loaded and stepped 1000 more equals the same
  run stepped 3500 without saving; wrong `format`, wrong `version`, bad JSON, a short `map.tiles`
  and a finished run (`result: "won"`) are each unreadable.
- `tests/save/slots.test.ts` (an in-memory `Storage`): write, read, clear and list 3 slots; the list
  reports empty / filled with summary / unreadable; import into an empty slot stores the text, into
  a filled slot is refused; a storage that throws reports "unavailable".
- `tests/smoke.spec.ts`: clear localStorage, click **New camp** on slot 1, `window.camp.step(1200)`,
  check `campfire.slot.1` exists; reload, check the card shows `Day 2`, click **Continue**, check
  `window.camp.state.paused === true` and 20 people. No console errors.
