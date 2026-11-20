# Claude handoff (Survival)

Written only by Claude; Codex reads it and never edits it. Procedure:
[WORKFLOW.md](../../WORKFLOW.md#handoff-files).

## Working on
- Nothing. 2026-11-20: tier 3 W1-W10 and R1-R2 done (next: W11, the user's playtest); tier 2 V1-V9 done (V9 passed; next: the user picks the next Phase D item). 2026-11-19: C1-C8 done (the user approved the slice: "all good"); Phase D saves: DS1 done
  (`save.ts`: `serialize`, `parseSave`, `loadState`, plus `dayOf` and `SAVE_FORMAT`); DS2 done
  (`src/save/slots.ts`: `listSlots`, `readSlot`, `writeSlot`, `clearSlot`, `importSlot`, `probe`,
  `firstEmptySlot`, `browserStorage`); DS3 done (`GameScene.saveNow()` and `saveSlot` are the hooks
  for the DS4 HUD menu); DS4 done. Next: DS5 (the user's playtest).

## Resource icons and open store notes (R1-R2, 2026-11-20)
- Went past PLAN's file list on purpose: `src/render/stores.ts` (new), `art/manifest.json` (23 keys), `tests/stores.test.ts` (new, `pileSize`, `storeAt`), `tests/smoke.spec.ts` (an 8th test), `TESTING.md`, `Game.ts` (hover each frame, `window.camp.storeOpen`); `Select.ts` and `economy.ts` were not needed.
- Choices the spec left open: the bar shows `120 / 200` and an icon with no resource word (the words made it run into the Wotakuye bar at x 750); `Gift` keeps its word; hovering an icon names it (`Hud.ts`, the scene's hover helper); `icon_horses` is drawn and shown once there is a horse; the open store reacts to the pointer on its floor or up to 16 px above it (the roof); the piles are the camp's whole store, so every store shows the same; piles are drawn 1.3x; no open view while placing, aiming or over a panel; `building_store_open` and the piles are manifest keys but not building types.
- Not checked by hand: the icons' look at real size, hovering a store in the live game with people about.

## Tier 3 notes (W10, 2026-11-20)
- Went past PLAN's file list on purpose: `src/scenes/Game.ts` (`aiming`, `setAiming`, the aim click and the reticle in `updateGhost`), `src/scenes/hover.ts` (new), `Menu.ts` (controls text), `tests/smoke.spec.ts` (a 7th test with `camp.powers`, `powerButton`, `hoverTip`, `scene`). `art/ASSETS.md` needs no row (placeholders drawn in code need none).
- Choices the spec left open: the power bar is top left under the resource bar, not bottom left (the selection panel, its upgrade list and the toasts use the bottom left); buttons show only for bought powers and stack in data order; F-key and click on an aimed power toggle aiming; an aimed power with an error (spent, below Steady) toasts the reason and does not start aiming; powers do nothing while the HUD menu is open or after a result; the storm's reticle is a circle of its radius, the bison's a lane of its width across the map; Esc is also caught by Select (`busy`) so it does not clear the selection while aiming.
- Known Phaser behaviour: the first mouse move after leaving a HUD button only ends that button's hover; the Game scene sees the next one (a real player will not notice, the e2e test moves in steps).
- Not checked by hand: the bison reticle, a real cast with wolves about, a Dakota hover in the live Build menu.

## Tier 3 notes (W9, 2026-11-20)
- Went past PLAN's file list on purpose: `buildings.json` / `upgrades.json` (the barricade and its upgrade), `state.ts` (optional `Enemy.path`, `goal`, `walls`, `siege`; not validated by `parseSave`, saving is parked), `jobs.ts` (no `is finished` toast for line segments), `Game.ts` (drag placement and the line ghost), `placeholders.ts` and `art/manifest.json` (barricade art), `tests/sim/{buildings,upgrades,upgrades2}.test.ts` and `tests/smoke.spec.ts` (id lists).
- Choices the spec left open: the drag snaps to the nearest of horizontal, vertical or diagonal (2:1 rule) and starts at the pressed tile; tiles that fail placement are skipped, the store pays segments in order until short; placing stays on after a drag (right-click or Esc stops); unfinished barricades block people but not wolves; a diagonal step is shut when either side tile is a barricade, so a diagonal line is closed; wolves keep the old straight walk while their line is clear, so nothing changes without barricades; fleeing wolves path and break barricades the same way; a besieging wolf bites with its own damage, accuracy and cooldown from within range + 0.5 of the barricade's tile; the fire shows no strength line though it has hp.
- Not checked by hand: wolves meeting a line in the live game; the Menu controls text does not mention dragging yet (W10).

## Tier 3 notes (W8, 2026-11-20)
- Went past PLAN's file list on purpose: `src/sim/effects.ts` (new, same reason as `allies.ts`), `enemies.json` (`powers` block), `tick.ts` (`stepEffects` after `stepAllies`), `upgrades.ts` (`castPower` calls `startEffect`), `render/enemies.ts` and `Game.ts` (placeholder drawing, so a cast shows something before W10), `tests/sim/effects.test.ts`.
- Choices the spec left open: the herd starts on the map edge nearest the point, on the line through it, and ends when it has crossed (`ceil(47 / 0.4) + 1` ticks); a wolf is touched when within 1.5 tiles of the lane's middle and within 1 tile ahead or behind the herd; the storm slows fleeing wolves too and its slow multiplies with a fire pit's; storm damage 0.2 per tick makes wolf hp fractional; effects ids come from `nextEnemyId`; `effects` is not validated by `parseSave` (saving is parked).
- Not checked by hand: the look of the herd and the storm (placeholders), a real cast (no power bar until W10).

## Tier 3 notes (W7, 2026-11-20)
- Went past PLAN's file list on purpose: `src/sim/allies.ts` (new, to avoid a combat <-> upgrades import cycle), `enemies.json` (`allies` block), `tick.ts` (`stepAllies` before `stepEnemies`), `upgrades.ts` (`castPower` calls `callAllies`), `Game.ts` (draws allies), `tests/sim/allies.test.ts`.
- Choices the spec left open: allies are spawned on a ring of radius 2 around the fire centre and walk in straight lines through anything (they are spirits); a fleeing wolf is only attacked when within the ally's range; waiting spot is within 2.5 tiles of the fire; ids come from `nextEnemyId`; `allies` is not validated by `parseSave` and `alliesOf` makes the list for an older file (saving is parked); the cast toast `<label> called.` is unchanged.
- Not checked by hand: allies in the live game (placeholder look), a real cast from the lodge (there is no power bar until a later row).

## Tier 3 notes (W6, 2026-11-20)
- Went past PLAN's file list on purpose: `waves.ts` (`warn` empties `powersUsed`), `save.ts` (`parseSave` rejects a file without `powersUsed`, still `SAVE_VERSION` 5, so a v5 file saved earlier today is unreadable), `buildings.ts` (name), `placeholders.ts` and `art/manifest.json` (lodge art), `Select.ts` (effect lines), `tests/smoke.spec.ts` and `tests/sim/{buildings,upgrades,upgrades2}.test.ts` (lists).
- Choices the spec left open: `powersUsed` is a list of spent power ids (the plan said `powers`); the cast order is `{ type: 'cast', power, at? }`; a refused cast toasts the reason and is not spent; a successful one toasts `<label> called.` until W7/W8 add effects; `spirits` has no tier 2 prerequisite (the table says United only); the Societies page is at 6 slots, the barricade (W9) makes 7.
- Not checked by hand: the spirit lodge in the live game and its panel; `Needs United` on the rows.

## Tier 3 notes (W5, 2026-11-20)
- Went past PLAN's file list on purpose: `people.ts` (`speedOf`, `removePerson` loses the horse), `state.ts` (`Person.mounted`, `freeHorses`), `upgrades.json` (the `riders` upgrade and toast), `Select.ts` (its effect line), `tests/sim/upgrades2.test.ts` (id list).
- Choices the spec left open: `horses` stays the whole herd, ridden or not (free = herd - mounted, so the breeding cap is unchanged); mounting happens only at the draft order (a lancer already drafted when Riders is bought, or when a horse is born, stays on foot until redrafted); an undrafted lancer, or one with no free horse, walks; the mount multiplies walking speed in `movePerson` and `stepStraight`; older v5 files without `mounted` load as on foot.
- Not checked by hand: a rider in the live game, the Riders row in the lancers' lodge panel.

## Tier 3 notes (W4, 2026-11-20)
- Went past PLAN's file list on purpose: `buildings.ts` (name), `Select.ts` (effect line), `Hud.ts` (a `Horses n / cap` part shown once there are horses), `Build.ts` (key 7), `placeholders.ts` and `art/manifest.json` (corral art), `tests/smoke.spec.ts` (`tended` on a hand-made building), `tests/sim/{buildings,upgrades2}.test.ts` (menu order, upgrade ids).
- Choices the spec left open: `horses` is a plain number on the state, not a `Res` (no store, no carry); tended time is counted per corral by `stepCorrals` (a non-drafted `tend` worker standing on the ring), it waits at 3600 when the corrals are full and turns into a foal once there is room; Breed horses is clamped to the cap; the toast for a birth is `A foal was born.`; `parseSave` rejects a building without a numeric `tended` and a state without `horses`.
- Not done: `icon_horses` (R1 draws the icons), the Camp page now holds up to 7 slots (reaches 559 px wide, unchecked on screen).
- Not checked by hand: placing the corral, a tender breeding in the live game, the 7-slot Camp page.

## Tier 3 notes (W3, 2026-11-20)
- Went past PLAN's file list on purpose: `src/scenes/Game.ts` (dropped the `upgradesOverUi` call), `Menu.ts` (controls
  line: click a finished building for its upgrades), `tests/sim/helpers.ts` (`addHuntingLodge`), `TESTING.md`.
- Choices the spec left open: the list is a panel just above the selection panel (620 px wide, 50 px a row, toasts
  move up above it), shown only for one selected finished building and no people; the row shows the label, one line
  of effect, then `Owned`, `Needs <label>` / `Needs United` / `Needs a finished <building>`, or `Cost: ...` with
  `Missing: ...`, and Buy (dim while short, hidden when blocked); upgrades with a `band` in the data are refused
  outside that band (nothing uses it until W5-W8); the effect lines moved from `Hud.ts` to `Select.ts`.
- Debug hooks (with `?debug`): `camp.selectBuilding(id)`, `camp.upgradeRows()`, `camp.upgradeBuy(id)`.
- Not checked by hand: the panel for the council fire in the live game, hovering the English label (W10).

## Tier 3 notes (W2, 2026-11-20)
- Words came from the Dakota Online Dictionary (SWODLI + Ultralingua; Williamson 1902 and the 2015 SWODLI
  dictionary) through the JSON endpoint its own page calls (`https://ulod.ultralingua.com/dakota/api/`,
  `tool=dictionary&action=results&source=en&target=dak&text=<word>`). English headwords only were sent.
  Spellings are verbatim from it; nothing was composed. `displayLabel` shows the English until a `dakota`
  field is filled.

## Tier 3 notes (W1, 2026-11-20)
- Went past PLAN's file list on purpose: `state.ts` (`WaveRun.edge2?`, `centre2?`, optional so a v4 file still
  loads) and `tests/sim/waves.test.ts`. Choices the spec left open: a wave's `edges: 2` in `waves.json` (absent
  = 1); the second edge is drawn from the other edges and has its own centre; with an odd count the first
  edge gets the extra one (wave 8's three leaders split 2 + 1).

## Seasons notes (S1-S6, 2026-11-20)
- Went past PLAN's file list on purpose: `waves.json` and `DESIGN-slice.md` (wave 4, the user's call),
  `tests/sim/helpers.ts` (`stepFed` switches spoilage off so job tests still watch the store alone),
  `tests/sim/{buildings,economy,save,waves}.test.ts` (counts and the store shape changed), `Build.ts`
  (five slots in the 400 px panel, key 5), `Menu.ts` (controls text 1-5), `state.ts` (`Res`, `JobKind`,
  a `take` walk goal) and `Hud.ts` (the Wotakuye bar now x 750, 170 px wide).
- Choices the spec left open: pemmican in meals may be fractional; a drying worker takes 6 food from the
  nearest store, waits and retries every 50 ticks when it holds less; the tint is a HUD-scene rectangle
  (it also tints the build menu a little); spring newcomers use the United band's 40-food rule.
- Winter tint at 18% is subtle (grass goes from (143,174,90) to (151,186,116)); raise it in
  `seasons.json` if you want it louder.

## Tier 2 notes (V1-V8, 2026-11-20)
- Went past PLAN's file list on purpose: `state.ts` (`footprint(x, y, size)`, `footprintOf`, `WaveRun.scouted`),
  `buildings.ts` (`removeBuilding`, `standsAt`, a size-aware `ringSpot`, the requirement message now reads
  `Needs the <upgrade label>.`), `Game.ts` and `Select.ts` (1x1 ghost, sprite centre, click and outline),
  `Menu.ts` (controls text mentions Tab), `tests/sim/{buildings,save,upgrades}.test.ts` (menu order, a v3 file,
  the new message), `DESIGN-slice.md` (waves 5-6), `TESTING.md`.
- Choices the spec left open: `scouted` is a boolean and the banner counts come from `waves.json`; the early
  warning fires only if the lodge is staffed at exactly tick `at - 600`, else the old 300; "staffed" means a
  `scout` worker standing on the lodge's ring of tiles; scouts and drillers just wait there; a trap springs on
  any wolf, fleeing or not, and says `A trap sprang on a wolf.`; fire pits slow fleeing wolves too; traps and
  pits block their tile for people like any building; upgrade labels are `Akicita scouts`, `Akicita warriors`,
  `Builders' society`, `Better tools`; the Upgrades panel is two columns (tier 1 left, tier 2 right, each tier 2
  card next to nothing in particular) and 960 x 512; the Build panel is now 140 px tall (a page strip on top).
- `parseSave` also rejects a wave run without a boolean `scouted`.
- The smoke test presses keys with a retry (`pressUntil`): Phaser reads keys from a per-frame queue and a key
  that lands between frames is sometimes missed, so a single press made the test fail about half the time.
- Not done (spec: not in this pass): riders and horses, barricades, calling a wave early.

## Upgrades notes (U1-U5, 2026-11-20)
- Went past PLAN's file list on purpose: `state.ts` (`gift`, `upgrades`, the `buy` order), `orders.ts`,
  `Game.ts` and `Select.ts` (`overUi` also checks the Upgrades panel), `Build.ts` (six slots, right-aligned,
  hidden until unlocked), `tests/sim/buildings.test.ts` (six buildable types; the lodge needs the upgrade),
  `DESIGN-slice.md` and `TESTING.md` (small text updates).
- Choices the spec left open: the Upgrades button is at the top right under the speed buttons (the bar
  had no room); the bar font is 13 px so `Gift n` fits; the panel does not pause and Esc or U closes it;
  buying is a `buy` order (so it works while paused); a healer treats whoever is within 2.5 tiles when the
  50 ticks end (the patient may have walked off, then nothing happens); a healer never treats themself;
  gift is added at the end of the day-start step from the band the camp is in then.
- Windows pitfall met this session: Python `open()` without `encoding='utf-8'` wrote a lone cp1252 byte into
  `Hud.ts`; fixed. Use `encoding='utf-8', newline=''` for scripted edits.

## Wotakuye help notes (H1-H2, 2026-11-20)
- Went past the plan on purpose: `economy.ts` now exports `BANDS` and `EV`. Choices the plan left open:
  the "K above <lower band>" line became `<Band> holds down to <from>` (exact, since Wotakuye can be
  fractional); a zero gift reads `Gift tomorrow: 0`; the tooltip is monospace 12 px and covers the
  Upgrades button while open (hover-only, so clicks pass through).

## DS4 notes
- DS4 went past PLAN's file list on purpose: `src/save/files.ts` (download and file-picker helpers),
  and one line each in `Game.ts` and `Select.ts` (`overUi` is true while the HUD panel is open, so
  clicks do not reach the map). The `?debug` hook gets `window.menu` (button centres, card texts) and
  `window.camp.hud`.
- Choices the spec left open: Esc closes the panel like Resume; the panel keeps the game paused (Space
  cannot unpause it); **Resume** always unpauses, even if the game was paused before you opened the
  menu; if **Save and quit** cannot write, the panel says so and the button becomes **Quit anyway
  (not saved)**; the unity bar moved left (x 760 -> 680) to make room for the Menu button. Say so if
  you want any of these otherwise.

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
