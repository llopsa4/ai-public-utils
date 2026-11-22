# Survival current status

Updated 2026-11-22. Shared procedure: [WORKFLOW.md](../WORKFLOW.md).
Per-agent activity and requests: [from Claude](handoff/from-claude.md), [from Codex](handoff/from-codex.md).
Finished tasks and their details are in Git history (`git log -- games/survival`).

## Mode
- **Codex + Claude** since 2026-11-20 (user): Codex generates and installs art (after the Phase D
  playtest) and does routine work; Claude does the rest
  ([modes](../WORKFLOW.md#modes-and-ownership)).

## Current state
- **Build stage.** [DESIGN-slice.md](DESIGN-slice.md) approved by the user 2026-11-19. C1-C4 done
  2026-11-19: scaffold, map, camera; 20 people who walk, gather, chop, haul, build, hunt and
  deliver; four buildings from a build menu (B, then 1-4, left-click); hunger, two evenly shared
  meals a day, starvation, deaths, Wotakuye with its bands and day-start effects; a HUD with the
  resource bar and the Wotakuye bar. C5 done 2026-11-19: click and box select, right-click move /
  gather / chop / build / assign, draft (R), stance (Z X C), Delete, Space pause, 1-3 speed, a
  selection panel and toasts. C6 done 2026-11-19: `combat.ts` (bow/club fighters by stance, wolves,
  undrafted people flee to the fire), `waves.ts` (30 s warning, 3 waves, won/lost result), the
  `attack` order (right-click a wolf), placeholder wolves, a wave banner and an end screen in the HUD.
  C7 done 2026-11-19: `Menu.ts` (Start, Random seed, controls), pause / 1x / 2x / 4x buttons in the
  HUD, "Play again" returns to the menu, `npm run e2e` smoke test, `TESTING.md`, `npm run publish`
  writes `index.html` + `build/` (local only). 60 tests pass. C7 files are not committed; nothing pushed.

## Parked
- **Saving** (user, 2026-11-20, until further notice): no new save work in any task. Existing save code
  stays untouched; new state (allies, storms, charges) is not written to saves. See [PLAN.md](PLAN.md).

## Open items
- CULTURE.md: the user decided 2026-11-19 (keep Tiyospaye and Wotakuye, free-form camp, generic
  seasons, abstract gift value). *Akicita* approved for the scouts/warriors society (use it in C6);
  hunters, healers and builders stay in English.
- Untested by hand: mouse-edge pan and WASD pan; shift-click toggle; Delete on a site; 1-3 speed keys.
- Untested by hand: wolves, fighting, the banner and the end screen (only the sim is tested).
- Hungry-bowl icon added 2026-11-19 in `Select.ts` (`drawWorld`, shown at hunger >= 70); untested by
  hand. Toasts live in `Select.ts` for now (a later HUD task may move them).
- Untested by hand: the pause / speed buttons and Play again (e2e covers menu -> run -> wave warning).
- Decided 2026-11-19 (user delegated): map deviations are now in the spec; drafted people keep
  their worker slot; balance is left to C8.
- Balance to judge at C8: 10 unhoused people cost 10 Wotakuye a day against +4 from meals, so the
  start camp slides into Quarrelling by about day 7 unless tipis are built; people walk 1.0
  tiles/s (doubled in C8), so a tipi takes about 1 minute to supply.

## Next action
- C8 passed 2026-11-19: the user played the slice and said "all good" (no further fixes; the balance
  items above stand as they are). The root landing link is still not added: it needs a push request.
- Phase D, saves first (user, 2026-11-19). Spec settled by grilling: [DESIGN-saves.md](DESIGN-saves.md).
  DS1 done 2026-11-19 (`src/sim/save.ts`, `tests/sim/save.test.ts`; 65 tests pass, uncommitted).
  DS2 done 2026-11-19 (`src/save/slots.ts`, `tests/save/slots.test.ts`; 73 tests pass, uncommitted).
  DS3 done 2026-11-19 (`Game.ts`: create from `{ slot, seed }` or `{ slot, save }`, the 4 save
  triggers via `saveNow()`, slot cleared on a result, once-per-run toast; checked in a browser with a
  throwaway Playwright script, since the menu cannot pick a slot until DS4; uncommitted).
  DS4 done 2026-11-19 (`Menu.ts` slot cards with Continue / Export / Delete (inline Yes / No) /
  Import and Enter; `Hud.ts` Menu button and panel; `src/save/files.ts`; the smoke test has a saves
  case; 73 tests and `npm run e2e` pass; Export, Import, Delete, Save and quit and Resume checked in
  a browser with a throwaway script; uncommitted).
  DS5 passed 2026-11-19: the user played the saves ("Done", no fixes raised). DS1-DS5 are uncommitted.
  Next item chosen 2026-11-19: **seasons**. Grilled Q1-Q4 (3-day seasons, start in spring, four
  effects, painful-but-survivable winter); spec drafted in [DESIGN-seasons.md](DESIGN-seasons.md) with
  proposed numbers, plan rows S1-S7 in [PLAN.md](PLAN.md). Waiting for the user to approve the numbers
  (and to accept that v1 saves become unreadable once `SAVE_VERSION` is 2).
  Approved by the user 2026-11-19. S1-S3 done 2026-11-19 (`src/data/seasons.json`, `src/sim/seasons.ts`;
  gather and hunt rates, winter meal need and cold, spring newcomers and spoilage in `jobs.ts` and
  `economy.ts`; `tests/sim/seasons.test.ts`; 81 tests pass; uncommitted). `stepFed` in
  `tests/sim/helpers.ts` now also switches spoilage off.
  **Problem found:** the slice is won by defeating wave 3, which arrives at tick 10800 = the first
  winter day, so a player never sees winter. Waiting for the user's call on how to lengthen the run.
  S4 (pemmican, save v2) and S5 (drying rack) do not depend on it.
  2026-11-20: the user chose **wave 4** (tick 14400, 7 wolves + a pack leader; the run is won after it),
  so the first winter is played. S4-S6 done 2026-11-20: pemmican (`store.pemmican`, cap 100 a store,
  meals eat food then pemmican at 1.5, `SAVE_VERSION` 2, so old camps read as Unreadable), the drying
  rack (build menu key 5, `dry` job: 6 food -> 4 pemmican, placeholder art), the HUD text
  `Spring, day 1` + Pemmican + a season tint, and a smoke test. 85 tests and `npm run e2e` (3 tests)
  pass; all uncommitted. Checked by screenshot (HUD, tint, five-slot build menu); not checked by hand:
  placing a rack with key 5 and watching a worker dry.
  S7 passed 2026-11-20: the user played and said "it looks good" (no fixes raised). DS1-DS5 and
  S1-S7 are all uncommitted; nothing pushed.
  Next item chosen 2026-11-20: **upgrade tiers, tier 1 only**. Grilled (gift value comes daily from
  Wotakuye; dogs, better bows and a healers' society that heals wounds and eases winter cold; an
  upgrade panel costing gift value + goods). Spec drafted in [DESIGN-upgrades.md](DESIGN-upgrades.md)
  with numbers, plan rows U1-U6 in [PLAN.md](PLAN.md). Approved by the user 2026-11-20 (numbers and
  the v2 -> v3 save break). U1-U5 done 2026-11-20: `src/data/upgrades.json`, `src/sim/upgrades.ts`
  (gift value daily by band, `buyUpgrade`, a `buy` order), dogs and bows in `jobs.ts` / `combat.ts`
  (`fighterOf(s, p)`), the healers' lodge and `heal` job, winter cold eased per staffed healer
  (`coldPerPerson`), `SAVE_VERSION` 3; the HUD shows `Gift n` and has an Upgrades panel (key U, button
  under the speed buttons); the Build menu grows to six with the lodge (key 6) after the upgrade.
  94 tests and `npm run e2e` (4 tests) pass; checked by screenshot (panel, 5- and 6-slot build menu);
  not checked by hand: the real Buy button, placing a lodge, a healer treating someone.
  Committed and pushed to `main` on the user's request, 2026-11-20 (`b47d7f3`).
  Wotakuye help done 2026-11-20 (the user asked for the rules to be shown in the game): a hover tooltip on
  the Wotakuye bar with a `?` hint (`src/sim/help.ts`, `Hud.ts`; live numbers and rules read from the data;
  101 tests and 5 e2e tests pass; checked by screenshot, not by hand). Uncommitted.
  Committed and pushed to `main` on the user's request, 2026-11-20 (`3ac7f71`).
  Tier 2 started 2026-11-20 before U6 (the user asked to go ahead). Grilled: all four items (scouts,
  warriors, builders, faster building), gated by gift + goods + one tier 1 upgrade, waves 5-6 added,
  scouts' lodge, warriors' lodges with a class per lodge (lancers or archers), traps and fire pits only.
  Spec drafted in [DESIGN-upgrades-2.md](DESIGN-upgrades-2.md), plan rows V1-V9 in [PLAN.md](PLAN.md).
  Approved by the user 2026-11-20 (numbers, the v3 -> v4 save break, the Tab-paged Build menu). U6
  passed 2026-11-20: the user said it is fine (no fixes raised).
  V1-V8 done 2026-11-20 (the user chose "all of V1-V8 in order"): waves 5-6 (`winAfterWave` 6); `requires`
  and `tools` (`buildSpeed`); the scouts' lodge (`scout` job, warning at `at - 600` only if staffed at that
  exact tick, `WaveRun.scouted`, banner `Wolves from the north: 9 and a leader`); traps and fire pits (1x1
  sites, `footprintOf`, `removeBuilding`); lancers' and archers' lodges (`drill` job, `fighterOf`);
  `SAVE_VERSION` 4; a two-column Upgrades panel, a Tab-paged Build menu (Camp / Societies, `page` in
  `buildings.json`), placeholder art for five new keys; 121 tests and `npm run e2e` (6 tests, stable over
  5 runs) pass; all uncommitted, nothing pushed. Checked by screenshot (panel, Societies page, the five new
  buildings, the fire pit ghost); not checked by hand: the real Buy button on tier 2, a scout staffing the
  lodge in the live game, wolves meeting a trap or pit, a lancer or archer drafted from their lodge.
  Committed (`3d92969`), not pushed. V9 passed 2026-11-20: the user played tier 2 and said it is fine
  (no fixes raised).
  Next item chosen 2026-11-20: **upgrade tier 3**. Grilled Q1-Q15b: the Fantasy powers plus riders/horses
  and barricades; all upgrades (tiers 1-3) move into their home buildings (the U panel goes); waves 7-8;
  Dakota labels "Dakota (English)" from a dictionary, approved in CULTURE.md; plus resource icons and an
  open store on hover (the user's additions). Spec in [DESIGN-upgrades-3.md](DESIGN-upgrades-3.md), rows
  W1-W11 + R1-R2 in [PLAN.md](PLAN.md). The plan and numbers were approved; `SAVE_VERSION` 5 breaks v4 saves.
  W1 done 2026-11-20: waves 7-8 (12 wolves + 2 leaders, 14 + 3; `edges: 2` in `waves.json`, spread 12, the
  second edge drawn different from the first, each group split evenly, banner `from the north and east`),
  `winAfterWave` 8; 123 tests pass; uncommitted. W2 drafted 2026-11-20: empty `dakota` fields in `upgrades.json` and `buildings.json`, `src/sim/labels.ts` (`displayLabel`, `englishLabel`, `labelText`), `tests/sim/labels.test.ts` (126 tests pass), and a candidate table in `CULTURE.md` *Needs review* (4-5 sourced words, the rest none found). The user approved four words (tipi, wakihnakapi, wihmuƞke, akaƞyaƞka) 2026-11-20; tipi, store and trap are filled in `buildings.json`, `akaƞyaƞka` goes on `riders` when W4/W5 adds it. W2 done. W3 done 2026-11-20: `home` per upgrade in `upgrades.json` (hunting lodge: dogs, bows, scouts; council fire: healers, warriors, builders, tools), optional `band` (checked, no upgrade uses it yet), `upgradeNeeds` / `missingHome` / `missingBand` / `upgradesOf` in `upgrades.ts`, `buyUpgrade` refuses without a finished home; the selection panel of a finished building lists its upgrades (`Select.ts`: label, effect, cost or Needs, Buy, Owned); the U key, the Upgrades button and the Hud panel are gone. 129 tests and `npm run e2e` (6 tests, 4 repeats, stable) pass; checked by screenshot and a real Buy click; uncommitted. W4 done 2026-11-20: `horse_corral` (Camp page, needs warriors, 1 `tend` worker, placeholder art), `horses` upgrade (Breed horses, +2 at once), `GameState.horses`, `Building.tended`, `stepCorrals` in `jobs.ts` (a foal per 3600 tended ticks, cap 6 per finished corral), `Horses n / cap` in the HUD once there is one, Build menu key 7, `SAVE_VERSION` 5 (v4 saves unreadable); 137 tests and `npm run e2e` (6 tests) pass; `tests/sim/horses.test.ts`; uncommitted; not checked by screenshot or by hand. W5 done 2026-11-20: `riders` upgrade (lancers' lodge, needs `horses`, 8 gift + 10 hides, toast `The lancers can ride.`), `Person.mounted`, `fighters.rider` in `enemies.json` (range 1.8, damage 18, speed x2.5), `speedOf` in `people.ts`, a draft takes a free horse and an undraft gives it back (`freeHorses`), `removePerson` loses the horse; 143 tests and `npm run e2e` (6 tests) pass; `tests/sim/riders.test.ts`; uncommitted; not checked by screenshot or by hand. **Next: W6** (Spirit society, Spirit lodge, the four power upgrades, `cast` order). `icon_horses` waits for R1.
  W6 done 2026-11-20: `spirits` (Spirit society, council fire, United, 10 gift + 20 wood) and the four power upgrades
  (`spirit_warriors`, `guardian_wolves`, `bison_charge`, `storm_caller`, home `spirit_lodge`, United, each needs its tier 2
  upgrade) in `upgrades.json` (`power: { key, aim }`, `castBand: "Steady"`); `spirit_lodge` in `buildings.json` (Societies page,
  needs `spirits`, no workers, placeholder art); `GameState.powersUsed` (reset when any wave warning starts); the `cast` order
  and `castPower` / `castError` in `upgrades.ts` (refused when unknown, spent, below Steady, or aimed without a point). The cast
  only marks the power spent and toasts; the effects are W7 (allies) and W8 (bison, storm). 154 tests and `npm run e2e` (6
  tests) pass; `tests/sim/powers.test.ts`; uncommitted; not checked by screenshot or by hand. **Next: W7** (allies).
  W7 done 2026-11-20: allies. `src/sim/allies.ts` (`callAllies`, `stepAllies`, `alliesOf`, `ALLIES` from `allies` in
  `enemies.json`): Spirit warriors call 4 spirits (hp 80, range 1.2, damage 12), Guardian wolves 5 wolves (the wolf's stats),
  both at the fire for 600 ticks; they fight the nearest wolf in sight 10, else wait near the fire, never touch people; wolves
  now pick the nearest person or ally in sight (`combat.ts`); `GameState.allies` (not saved on purpose, `alliesOf` tolerates an
  older file without it); `EnemiesView.syncAllies` draws placeholder spirits and white wolves. 162 tests and `npm run e2e` (6
  tests) pass; `tests/sim/allies.test.ts`; uncommitted; not checked by screenshot or by hand. **Next: W8** (bison lane and
  storm; the F1-F4 power bar and aiming come in W10).
  W8 done 2026-11-20: the bison lane and the storm. `src/sim/effects.ts` (`startEffect`, `stepEffects`, `stormSlow`,
  `bisonDirection`; numbers in `enemies.json` `powers`): the herd starts on the edge nearest the point and runs the whole
  way across, 3 tiles wide, speed 0.4 a tick, each wolf it touches takes 40 once; the storm (radius 5, 200 ticks) slows
  wolves to 40% (also fleeing ones) and hurts them 0.2 a tick; neither touches people or allies. `castPower` starts them
  (needs the clicked point), `GameState.effects` (not saved on purpose, `effectsOf` tolerates an older file), placeholder
  bison and storm drawn by `EnemiesView.syncEffects`. 170 tests and `npm run e2e` (6 tests) pass; `tests/sim/effects.test.ts`;
  uncommitted; not checked by screenshot or by hand (no power bar or aiming until W10). **Next: W9** (spike barricades; Opus
  per PLAN).
  W9 done 2026-11-20: spike barricades. `barricades` upgrade (council fire, needs builders, 6 gift + 15 wood, toast
  `The builders can raise barricades.`) and `barricade` in `buildings.json` (Societies page key 3 with builders only,
  1x1, 4 wood, 50 build points, hp 60, `line: true`); drag a straight line (horizontal, vertical or diagonal) and each
  free, paid-for tile gets its own site (`lineTiles`, `lineSites` in `buildings.ts`; placing stays on after a drag).
  People are blocked by any barricade (as by any building); wolves treat only finished barricades as walls: straight
  when the line is clear, else A* (`findGridPath`, shared with people) replanned when barricades change or the goal moves
  a tile; with no way round they break the first barricade on their line in (`A barricade broke.`). The panel shows
  `Strength n / 60`. 178 tests and `npm run e2e` (6 tests) pass; `tests/sim/barricades.test.ts`; uncommitted; a drag
  and the built line checked by screenshot (throwaway script); not checked by hand: wolves meeting a line in the live
  game. **Next: W10** (power bar, Societies keys, placeholders, labels; Sonnet per PLAN).
  W10 done 2026-11-20: the power bar and Dakota hovers. `Hud.ts` shows one button per bought power (`F1 Spirit warriors`, stacked
  top left under the resource bar), greyed while spent or below Steady, gold while aiming; F1-F4 or a click casts at once
  (spirit warriors, guardian wolves) or starts aiming (`GameScene.aiming`, `setAiming`) for the bison and the storm: the map
  shows the storm's circle or the bison's lane, a left-click sends the `cast` order, right-click or Esc cancels, a note above
  the selection panel says so. `src/scenes/hover.ts` (a one-tooltip-per-scene helper) shows the English when a label is
  Dakota: on power buttons, Build slots, upgrade rows and a building's panel title (Build slots and the panel title now use
  `displayLabel`). Menu controls text mentions 1-7, barricade drag and F1-F4. 178 tests and `npm run e2e` (7 tests, stable over
  5 repeats) pass; checked by screenshot (power bar, storm reticle); uncommitted; not checked by hand: the bison reticle, a real
  cast with wolves about, a Dakota hover in the live Build menu. **Next: W11** (the user plays to wave 8). R1 (resource icons)
  and R2 (open store on hover) are still not done; they can go before or after W11.
  R1 and R2 done 2026-11-20: the HUD bar is laid out in parts (`Hud.ts` `drawBar`): a 16 px icon (`icon_food`, `icon_wood`,
  `icon_hides`, `icon_pemmican`, `icon_gift`, `icon_horses` once there are horses) then its text; the resource words are gone
  from the bar (the icon stands in; hovering an icon names it), `window.camp.hudText()` still reads with the words. R2:
  `src/render/stores.ts` (`StoreHover`, `pileSize`, `storeAt`): the pointer on a finished store (floor or roof, not while placing,
  aiming or over a panel) swaps it for `building_store_open` and shows four piles sized `ceil(4 x amount / camp capacity)`; no sim
  change. All placeholders drawn in code; manifest, `ASSETS.md`, `SPEC.md` and `TESTING.md` updated. 180 tests and `npm run e2e`
  (8 tests) pass; checked by screenshot (the bar, a closed, empty, half and full store); uncommitted; not checked by hand.
  **Next: W11** (the user plays to wave 8).
  Committed and pushed to `main` on the user's request (`3752a25`), then the stale Pages build was republished (`428c84d`).
  Next item chosen 2026-11-20: **hunting and camp life**. Grilled one question at a time, plan reviewed by Opus: deer and
  bison, carcass loads to the store, arrows, hunt orders, no shared standing tile, right-click feedback, work
  animations, carried goods in the panel, names under selected people, store and council fire 4x4 (a plaza where idle
  people sit), the full-store fix, original generated music (war music while wolves are out). Spec in
  [DESIGN-hunting.md](DESIGN-hunting.md), rows G1-G15 in [PLAN.md](PLAN.md). Saves stay parked and old camps are left
  alone (they may load with overlapping buildings). Accepted by the user 2026-11-20 (spec and proposed details). G1 done 2026-11-20: `carryText` in `src/sim/labels.ts` and a `Carrying: ...` line in the selection panel (one person or the totals for several; nothing when empty); 181 tests and `npm run e2e` (8 tests) pass; checked by screenshot; uncommitted. **Next: G2** (Sonnet); W11 is still open.
  G2 done 2026-11-20: a selected person shows their name under their feet and the family under it in the family's colour
  (`Select.ts` `placeLabel`, a pool of text pairs); the user chose invented names, so people now get names from a
  pool (`start.names` in `map.json`, `pickName` in `people.ts`, also used for newcomers) instead of `Cottonwood 3`;
  181 tests and `npm run e2e` (8 tests) pass; checked by screenshot (two labelled, others not); uncommitted.
  W11 closed 2026-11-20 at the user's request (not played to the end; no fix list).
  G3 done 2026-11-20: the store is 4x4 (`buildings.json`), caps x4 (food 800, wood 600, hides 160, pemmican 400), start tile
  [22, 28] (`map.json`); new 256 x 208 art for the closed and open store (`placeholders.ts`, `manifest.json`); piles drawn 2x and
  spread wider, `ROOF_PX` 28 (`stores.ts`); 181 tests and `npm run e2e` (8 tests) pass; checked by screenshot (closed, empty,
  half and full); uncommitted. The fire is still 2x2 until G4.
  G4 done 2026-11-20: the council fire is a 4x4 plaza at [22, 22] (tiles 22-25), tipis at [18, 22] and [28, 22], store
  at [22, 28]; `spawnRadius` 5 (was 4, the plaza takes 16 tiles near the fire). One centre for every "from the fire"
  distance: `campCentre(map)` = fire + `FIRE_HALF` in `src/sim/map.ts` (still [24, 24]), used by map generation,
  placement range, spawn, hunt spots, wander, flee, wolves and allies; wolves with no one in sight stop
  `FIRE_HALF + 1` from the centre (was 2), allies appear on the ring and wait within `FIRE_HALF + 1.5`. New 256 x 208
  plaza art (`fire_central`: fire, hide mats, log seats, drying poles, a drum, baskets). 182 tests (a new layout test)
  and `npm run e2e` (8 tests) pass; checked by screenshot (the plaza and the start camp); uncommitted. **Next: G5** (Sonnet).
  G5 done 2026-11-20: right-click feedback in `Select.ts`. Every order draws a ring that grows and fades over 700 ms
  on the scene clock (so it also runs while paused): green move, gold work (tree, berry, building, site), red attack;
  the target pulses (a ring that follows the wolf, a flash outline on a building, a diamond on a tree or berry tile). A
  grey ring and a toast, with nothing sent, when the click can tell at once: attack with nobody drafted (`Nobody is
  drafted.`), a work order where nobody can work (`Drafted people can't take work orders.` or `Nobody can <job> there.`).
  `window.camp.lastPing()` (`kind`, `target`, `count`) is the hook. 182 tests and `npm run e2e` (9 tests) pass; checked
  by screenshot (move, tree, wolf); uncommitted; not checked by hand. **Next: G6** (Sonnet).
  G6 done 2026-11-20: work animations in `src/render/people.ts` (`workTool`, `drawTool`, a Graphics overlay per person, redrawn each frame): a stone hammer
  for a builder only while the site has all its materials, an axe for `chop`, a stooping lean plus a tuft reached from the ground for `gather`, both hands up
  turning a strip of meat on a pole for `dry`; drafted people never show one; no sim change. The bow draw waits for G10-G12 (hunt arrows). 182 tests and `npm run e2e` (9
  tests) pass; checked by screenshot (all four, and a builder on an unsupplied site with no hammer); uncommitted; not checked by hand. **Next: G7** (Opus).
  The user added four items 2026-11-20 and asked to build them before G7 (grilled Q1-Q7, spec in `DESIGN-hunting.md`
  `## Stock items` / `## People icon and berry patch panel`, rows G16-G19 in PLAN.md). **Done 2026-11-20:** the HUD shows only the
  head count with a new `icon_people` (hover `People`; no more `12 / 20`); the start store stands at [22, 17], north behind the fire, so the plaza
  is never covered; left-clicking a berry bush opens the panel `Berry patch` / `n of 40 fruit left` (`selectedTile` in `Select.ts`,
  `window.camp.panelText()`); the open store shows small isometric items, `ceil(40 x amount / capacity)` of them (basket of fruit per 20 food, log per 15
  wood, hide bundle per 4, pemmican bag per 10 with one store), each resource on its own quarter of the floor, a second layer after 20
  (`itemCount`, `itemSlot` in `stores.ts`, `item_*` props in `placeholders.ts`; the `pile_*` art is gone). Two sim tests that depended on the old store
  position were made layout-proof (riders: distance covered, not change in x; drying rack: pemmican in hand counts). 183 tests and `npm run e2e` (10 tests)
  pass; checked by screenshot (people icon, berry panel, the open store at half, full and zoom 3); uncommitted; not checked by hand. **Next: G7** (Opus).
  G7 done 2026-11-20: no shared standing tile. `src/sim/occupancy.ts` (`heldTile`: a drafted person's post, else a walk or flee
  goal, else where they stand; `heldTiles`, `nearestFreeTile`, `freeTileAt`); `ringState` / `ringSpot` skip held tiles; `goToRing`
  in `jobs.ts` waits on the nearest free tile with the job kept when a ring is full (store, site, rack, lodge); `spreadTargets`
  gives distinct free tiles (no wrap); draft posts, fleeing (ring, then nearest free), wander, chop/gather and heal use free
  tiles. 191 tests (8 new in `tests/sim/occupancy.test.ts`, which fail with the rule off) and `npm run e2e` (10) pass; checked
  in a browser (8 moved to one point, 4 waiting at a full store: no shared tiles). **Next: G8** (Sonnet).
  G1-G7 and G16-G19 committed with a fresh Pages build and pushed to `main` on the user's request, 2026-11-20 (`4d126fe`).
  G8 done 2026-11-20: sitting. `goSit` in `jobs.ts` (an idle person with no work, adults after `findAutoWork` finds none, elders and children instead of
  wandering, walks to a free tile on the finished fire's ring and stays; a full ring leaves adults standing and elders/children wandering as before);
  `plazaOf` and `isSitting` (idle, no job, undrafted, on the ring) in `buildings.ts`; `PeopleView` draws a seated person at 0.72 of their height
  (`SIT_SCALE`, placeholder). Idle people no longer wander, so the rng stream shifted: the summer-vs-winter hunt test now sums seeds 1-4. 196 tests
  (`tests/sim/plaza.test.ts`) and `npm run e2e` (11 tests) pass; checked by screenshot (a ring of seated people round the plaza); uncommitted; not
  checked by hand. **Next: G9** (Opus).
  G9 done 2026-11-20: full store. A person whose goods no store can take is blocked (`storeBlocked` in `jobs.ts`): they never queue
  at the store, keep the goods and get one `Store is full` toast; an order starts at once (build, move, chop...); with no job they
  take free work (`findAutoWork` gives them a haul only to a site that needs their load); a gatherer or woodcutter with full hands
  waits by the bush or tree and keeps the job; a builder drops wood or hides the site needs on arrival, and a hauler's drop now keeps
  what the site does not need instead of losing it. 205 tests (`tests/sim/fullstore.test.ts`, 9 new) and `npm run e2e` (11) pass;
  uncommitted; not checked by hand.
  G10 done 2026-11-20: wild game and hunting. `src/data/animals.json`, `src/sim/animals.ts` (`GameState.animals` and `wild`, read
  through `animalsOf` / `wildOf`; start herds, wander, flight, carcasses, respawn scaled by the season's `huntSuccess`); the hunt job
  rewritten in `jobs.ts` (`stepHunter`: nearest carcass, else nearest animal within 22 / 26 tiles of the fire, bow range and rolls
  from `fighterOf`, loads of 10 meat to the store, waits by the fire otherwise); the `hunt` order (animal or carcass) in `orders.ts`;
  dogs now widen spotting (`upgrades.json` `spotting`), effect line in `Select.ts`. Old roll tests rewritten (buildings, seasons,
  upgrades). 215 tests (`tests/sim/hunting.test.ts`, 10 new) and `npm run e2e` (11) pass; uncommitted. Animals are **not drawn**
  until G12, so in the live game hunters chase unseen game.
  G11 done 2026-11-20: arrows. `src/render/arrows.ts` (`ArrowsView`, drawn only, nothing in state): a shot is seen as a bow-holder's
  `cooldown` going up, the target is the hunter's animal or the ordered / nearest wolf, a hit is seen as the target's hp dropping (or the
  wolf gone); a hit arrow flies 170 ms and vanishes, a miss lands beside the target and sticks for 1.4 s. `hasBow` and a placeholder bow
  in `render/people.ts` (hunters, archers, anyone hunting). Checked in a browser with a throwaway script (arrow at a wolf by screenshot;
  arrow at a deer by sampling the arrow list each frame, since the deer is not drawn yet); 215 tests and `npm run e2e` (11) pass;
  uncommitted; not checked by hand. **Next: G12** (Sonnet).
  G20-G24 queued 2026-11-20 (villager panel builds, names off the map; spec `DESIGN-hunting.md`
  `## Villager panel and building`); they run after G15 unless the user reorders.
  G12 done 2026-11-20: wild game is drawn and orderable. `EnemiesView.syncAnimals` (`render/enemies.ts`, placeholders drawn in code: tan
  deer, big dark bison, a hurt one with a health bar, a carcass lying flat that shrinks with its meat); a hunter with a load of meat has a
  bundle on the back (`hasHuntLoad`, `drawLoad` in `render/people.ts`); `Select.ts`: right-click a live animal gives `hunt` (gold ring,
  the animal pulses), right-click a carcass fetches its next load, refusals reuse `workRefusal`, a left-click selects an animal or carcass
  (ring, panel `Deer` / `Bison carcass` with health or meat left; `camp.selectAnimal`). 215 tests and `npm run e2e` (12 tests) pass; a
  new e2e case 11 and screenshots `g12-*.png`; uncommitted; not checked by hand. **Next: G13** (music; Sonnet).
  G13 done 2026-11-20: music. `src/audio/theory.ts` (pure: D minor pentatonic, `nextNote` melody walk, `AMBIENT_BEAT` / `WAR_BEAT`,
  `nextMode` with a 50-tick hold) and `src/audio/music.ts` (Web Audio: flute, heartbeat and wind; war drum and drone; two buses
  crossfading over about 2 s; starts on the first click or key press; on/off and volume kept in `localStorage` `survival.music`).
  `Game.ts` calls `music.update(wolves, tick)` each frame and `music.reset()` on a new run and on leaving; the HUD menu panel has
  `Music: on/off` and `- 60% +`; `camp.music()` is the debug hook. 220 tests (`tests/music.test.ts`, 5 new) and `npm run e2e` (13
  tests) pass; checked by screenshot (the menu panel); **not listened to** (no one can hear it in a test run), so the user's G15
  listen is the first check. The CULTURE.md music wording is drafted under *Needs review* for the user. Uncommitted.
  **Next: G14** (the remaining e2e cases, docs; Sonnet), then G15 (the user plays).
  G14 done 2026-11-20: the menu controls text mentions hunting a deer or bison and the Menu button's music toggle; the e2e cases the spec
  asked for already existed (store open view, pings, hunt order, music, plus berry and plaza cases). The music case was flaky (about 1 run in 4:
  it sat on the 50-tick edge, `step(49)` then `step(2)`); it now steps 40 then 12. 220 tests and `npm run e2e` (13 tests, 3 runs; the music case
  15 repeats) pass; uncommitted. **Next: G15** (the user plays a hunt to the store, a bison over three trips, the plaza, the feedback and the music).
  G20 done 2026-11-20 (the user said "Continua"; G15 is still the user's to play): the names under selected people are gone from the map (`Select.ts`: the label pool and `placeLabel` removed), rings stay; 220 tests and `npm run e2e` (13 tests) pass; not checked by screenshot; uncommitted. **Next: G21** (Sonnet), then G22-G23; G15 and G24 are the user's playtests.
  G21 done 2026-11-20: the panel title is 20 px bold serif in gold with a thin rule under it, and a person's family line is its own text in the family colour (`Select.ts`: `family`, `TITLE_GOLD`; `panelText()` still returns the same detail text). 220 tests and `npm run e2e` (13 tests) pass; checked by screenshot (person, group, building); not screenshotted: the berry patch and the animal panels. Uncommitted. **Next: G22** (Opus: builders on `place`, barricade lines).
  G22 done 2026-11-20: the `place` order takes `builders` (the selection) and `line` (further segments after `at`). Up to 3 able
  people (adults, not drafted), nearest the site first, build the first site at once; the rest keep their jobs; toast
  `3 of 5 joined the build`. Line segments share `lineId` (the first segment's id, not saved); a builder whose segment is done
  goes on to the first unfinished segment with room (`nextLineSite`), else is free. `tests/sim/placebuild.test.ts` (6 tests);
  226 tests pass; e2e not run (sim only; `Game.ts` still sends one `place` per segment with no builders until G23). Uncommitted.
  **Next: G23** (Sonnet: the panel build cards; send `builders` and `line` from `Game.ts`).
  G23 done 2026-11-20: the building cards. The selection panel is 1280 px wide and the cards (`Build.ts`) fill its right part, shown only while a selected adult who is not drafted can build; the corner `Build (B)` button and the standalone menu are gone. B arms the cards (gold border), the next 1-7 picks one (1-3 set speed when not armed), clicking a card always works, Tab pages Camp / Societies, Esc disarms or cancels placing; clearing the selection (or losing every builder) cancels placing. Picking snapshots the selection into `GameScene.placers`; `place` sends it as `builders`, and a dragged barricade line is now one `place` order (`at` + `line`), so the builders go on along it. The stance buttons moved under Draft; scene drawing order is now Select, Build, Hud (`main.ts`). 226 tests and `npm run e2e` (14 tests) pass; a new e2e case 13; checked by screenshot (cards, drafted selection, the 7-card Societies page, armed border) and a scripted barricade drag (3 sites, shared `lineId`, `3 of 6 joined the build`); uncommitted; not checked by hand. G24 passed 2026-11-20: the user built from the panel by hand and marked G23 and G24 tested and done (no fix list). G15 passed 2026-11-20: the user played the hunting and camp life work (hunt to the store, bison trips, plaza, feedback, music) and said it is tested (no fix list). The hunting and camp life item (G1-G24) is finished; the music levels were judged by ear and left as they are. Next Phase D item: the user picks.
  Next item chosen 2026-11-20: **bigger map (96 x 96) and a minimap**. Grilled Q1-Q9; spec settled in
  [DESIGN-map.md](DESIGN-map.md), plan rows M1-M6 in [PLAN.md](PLAN.md). **Next: M1** (Sonnet: map data
  and generation).
  M1 done 2026-11-20: `map.json` is 96 x 96 (river 4 wide, clamp 10..32, fords of 4 tiles on rows 16-35 and 60-79, 28 forest
  clusters, `berry.outer` 9 more patches 15-44 out, fire `[46, 46]`, tipis `[42, 46]` / `[52, 46]`, store `[46, 41]`, pan 900 px/s);
  `animals.json` (`outerHerds` 6 deer + 3 bison 23-44 out, `cap` 48); `generateMap` runs the near berry ring then the outer ring;
  `spawnStartHerds` does the near then the outer herds; the path cap is 16000 nodes. `tests/iso.test.ts` (new map tests) and the
  start-herds test pass; **about 35 other unit tests fail on purpose until M2** (they hard-code 48-size tile positions: store,
  fire, edges, fords). The code is not usable in the browser until M2 (waves and the stampede still use 48 / 24). Uncommitted.
  **Next: M2** (Sonnet: every hard-coded 48 / 47 / 24 reads `map.size`, the 48-tile stampede, tests made layout-proof).
  M2 done 2026-11-20: the code and tests no longer assume 48. `render/iso.ts` defaults to `map.json` `size`; the stampede
  (`bisonLane` in `effects.ts`; `startBefore` 24 and `run` 48 in `enemies.json`) starts 24 tiles before the point (clamped in the
  map) and runs 48 tiles, and the aiming lane in `Game.ts` draws the same stretch; waves already read `map.size`. Unit tests
  shifted with `o(n)` in `tests/sim/helpers.ts` (old 48-map tile numbers moved to the new camp) or read the camp centre / map size;
  the smoke test reads `map.size` and the fire. 228 tests and `npm run e2e` (14 tests) pass. Checked by screenshot (the start camp
  at the map centre, zoomed out to 0.5) and a throwaway run: a wave-1 wolf spawns on the east edge (90, 46) and reaches the fire.
  Uncommitted. **Next: M3** (Sonnet: measure fps at zoom 0.5, chunk the ground only if under 55).
  M3 done 2026-11-20: fps measured on the 96 x 96 map with a throwaway Playwright script (headless Chromium on the GPU, WebGL, 4 s of frames each): 60.1 fps at zoom 1, 60.0 at zoom 0.5, 60.1 at zoom 2, no console errors, so the ground stays one image per tile (no chunking, no code change). Measured on the start camp at rest (20 people, no wave), capped by vsync at 60. Uncommitted. **Next: M4** (Sonnet: the minimap maths and drawing).
  M4 done 2026-11-20: the minimap. `src/render/minimap.ts` (pure: 1/32 scale so a 96 x 96 map is 192 x 96 px, `tileToMini`, `miniToTile`, `viewRect`, `terrainPixels`), `tests/minimap.test.ts` (6 tests; every tile round-trips), `src/scenes/MinimapView.ts` (drawn by `Hud.ts`: a 208 x 112 panel at x 1064, y 36 under the speed buttons; terrain on a canvas texture redrawn when `mapVersion` changes, cream buildings with an orange fire dot, people in the family colour (drafted red), brown herds, wolves as red 3 px dots in a dark halo, a white camera outline every frame; dots every 6 frames). `window.camp.minimap()` gives `rect`, `view` and `counts`. 234 tests and `npm run e2e` (14 tests) pass; checked by zoomed screenshots at the start and with a wolf out; uncommitted; no mouse yet. **Next: M5** (Sonnet: clicks, e2e, docs).
  M5 done 2026-11-20: the minimap takes the mouse. `MinimapView.setupMouse` (an interactive zone over the panel): left-click or drag centres the camera (`GameScene.centerOnWorld`, clamped to the map; a drag keeps following outside the panel until the button is released), right-click sends the selection a `move` (`SelectScene.moveSelectionTo`, the same order and ping as ground; nothing while placing or aiming, nothing in the empty corners); `HudScene.overMinimap` feeds `SelectScene.overUi`, so no click reaches the world (no select, no box, no placement, no cast). The Menu controls text has a minimap line. 234 tests and `npm run e2e` (15 tests; the new case 14 stable over 3 repeats) pass; checked by screenshot (`m5-minimap.png`); uncommitted; not checked by hand. **Next: M6** (the user plays a run on the big map with the minimap; balance is judged there).
  Art spec settled 2026-11-20 (grilled with the user): [DESIGN-art.md](DESIGN-art.md), the bible
  [art/STYLE.md](art/STYLE.md), [art/SPEC.md](art/SPEC.md), [art/PIPELINE.md](art/PIPELINE.md),
  [art/BATCHES.md](art/BATCHES.md); rows AC1-AC9 (Claude, code only) and AB0-AB23 (Codex) in
  [PLAN.md](PLAN.md) *Phase D: art*. **Codex draws, Claude never does.** Land: the eastern Dakota
  homeland (tallgrass prairie, lakes, woodland; user). Docs only, uncommitted.
  AC1 done 2026-11-20 (the user said to install `pngjs` 7.0.0, a dev dependency, for the validator): `art/manifest.json` is
  manifest v2 (125 keys: every SPEC key plus the legacy `person_adult`, `person_elder`, `object_tree` the code still draws;
  status kept, existing placeholder size and anchor moved into a `placeholder` block); `src/render/manifest.ts` has the types,
  `anchorOf(key)`, `FACINGS`, `SEASONS`; `Boot.ts` no longer loads anything (AC3 adds the atlas loader); `ensureTextures` skips
  keys with no placeholder; `scripts/art/lib.mjs` (`expectedFrames`, `validateManifest`, `validateInbox`), `validate.mjs`
  (`npm run art:validate [-- --inbox ABn]`), `tests/art/validate.test.ts` (11 tests: the real manifest, frame names, a good
  and six broken sample inboxes). 245 tests and `npm run e2e` (15 tests) pass; the game looks as before (no art change).
  Uncommitted. M6 (the user's big-map playtest) stays open; AB0 for Codex waits for the user's go.
  AC2 done 2026-11-20 (the user approved `maxrects-packer` 3.0.0, MIT, dev dependency): `npm run art:standins` writes grey
  stand-ins for all 7,168 frames of the 125 keys into git-ignored `art/standins/` and packs them into `art/standins/atlas/`
  (13 pages, 2.2 MB, budget 16); `npm run art:pack -- ABn` installs a batch into `art/atlas/` (whole group repacked);
  `scripts/art/{font,standin-lib,pack-lib,standins,pack}.mjs`, `tests/art/pack.test.ts` (6 tests). The validator no longer
  checks the ground point on `cloth` layers. 251 tests pass; e2e not run (no scene changed); uncommitted. **Next:** AC3 (Sonnet).
  AC3 done 2026-11-20: art loading. `src/render/atlases.ts` (Boot `preload` queues every `art/atlas/*.json` multiatlas with its page URLs resolved by Vite, plus a loading bar; `?standins` on the dev server loads `art/standins/atlas/` instead, and `vite.config.ts` swaps `standinFiles.ts` for an empty module in a build, so the published game never carries them), `src/render/art.ts` (`spriteFor`, `applyArt`, `fromAtlas`: a final key, or any key with a stand-in under `?standins`, is drawn from its atlas frame at scale 0.5 with the manifest anchor, else from its code placeholder), `src/render/frames.ts` (`defaultFrame`), and the draw sites (ground, trees, buildings, ghost, open store and items, build cards, HUD icons) now go through them; people still use the legacy keys until AC4. 253 tests (`tests/art/frames.test.ts`) and `npm run e2e` (16 tests, a new `?standins` case) pass; checked by screenshot (normal unchanged; `?standins` grey boxes, no console errors); a build contains no stand-in pages. Uncommitted. **Next:** AC4 (Opus: people).
  M6 passed 2026-11-20: the user played the big map with the minimap and said it is tested (no fix list; balance stands as it is). The bigger map item (M1-M6) is finished. Next: AC4 (Opus: people) unless the user picks another item.
  AC4 done 2026-11-20: people art support. `Person.sex` from the id (`sexForId`, `sexOf` for older saves; no save code), `src/render/personArt.ts` (model key, 8-sector facing from screen-space movement, the state/job-to-animation map, frame timing), `PeopleView` draws a base and a family-tinted cloth sprite from the atlas (else the old placeholder drawings, now under the new keys), a death noted in `GameState.fallen` plays `die` and fades (a child only fades); `person_adult` and `person_elder` retired from the manifest. 259 tests and `npm run e2e` (16 tests) pass; checked by screenshot with `?standins` (labels in both tints, a held death); uncommitted; not checked by hand. **Next:** AC5 (Sonnet: ground, banks, trees).
  AC5 done 2026-11-20: terrain art. `src/render/terrain.ts` (pure: bank masks NE 1 / SE 2 / SW 4 / NW 8, spill edges, 4 seeded ground variants, tree species by distance to water, bush, rock and tuft picks) and `src/render/terrainView.ts` (draws the ground, banks, spills, trees, stumps, bushes and props; every season change re-skins them; a felled tree leaves a stump and the tile and its neighbours are redrawn; a new building clears the props under it); `Game.ts` no longer draws the map itself. `object_tree` is gone from the manifest: the four `tree_*` keys carry its code drawing as their placeholder, so the game looks as before without art. 271 tests (`tests/terrain.test.ts`, 12 new) and `npm run e2e` (18 tests, two new) pass; checked by screenshot with `?standins` (bank masks along the river, spills, summer frames); not checked by hand. Uncommitted. **Next:** AC6 (Sonnet: buildings by stage, winter, barricade masks, flames).
  AC6 done 2026-11-20: building art. `src/render/buildingArt.ts` (pure: `buildingState` stage1 <34% / stage2 <67% / stage3 / finished / winter, `barricadeMask` NE 1 SE 2 SW 4 NW 8, `buildingFrame`, `flameFrame`, `loopFrame`); `Game.syncBuildings(time)` sets the frame only when it changes (the open store is left to `StoreHover`, which now runs first), a finished fire and fire pit carry an `fx_flame` sprite (fire pit at half scale) only when that key has art or a stand-in; without art a site still fades in as before. 276 unit tests (`tests/art/buildingArt.test.ts`) and `npm run e2e` (20 tests, two new) pass; checked by screenshot with `?standins` (`ac6-standins.png`); not checked by hand. Uncommitted. **Next:** AC7 (Opus: wolves, animals, horses, riders, arrows, effects), AC8 (Sonnet: UI), AC9.
  AC8 done 2026-11-20 (the user chose `@fontsource/alegreya`, OFL, a dev dependency): interface art support. `src/render/ui.ts` (`makeSurface`: the rectangle a scene already uses stays the hit area, and a NineSlice from `ui_panel` / `ui_button` (normal, hover, pressed, disabled; `active` reads as pressed) / `ui_bar_frame` follows it each frame when that key has art or a stand-in, else the rectangle keeps its fill; `setLook`, `textButton`, `showIcon` / `addIcon`, `palette`: dark text on the hide art, light on the dark fallback; pure `uiLogic.ts`), `src/render/fonts.ts` (Alegreya 400 and 700, Latin and Latin Extended, loaded before the game starts; every `sans-serif` is now `UI_FONT`), `src/render/cursors.ts` (+ pure `cursorLogic.ts`: five CSS cursors cut from the `ui` atlas as `image-set` 1x / 2x with the manifest hotspot, picked each frame by `Select.updateCursor`: move with a selection, attack with drafted people over a wolf or aiming, build / invalid while placing via `GameScene.ghostOk`; the browser's own cursors without art), `src/render/title.ts` (`art/title.jpg` behind the menu when it exists, with the code-drawn title, `ui_emblem` and a panel for the controls). Icons by key where there is a place for them: speed pictures, power and upgrade-row icons, order icons on Draft / Cancel (icon only on the stance buttons, label as hover), the upgrade bar fill; each shows only when it has art, else the word as before. 280 unit tests and `npm run e2e` (22 tests, two new) pass; checked by screenshot plain and with `?standins` (menu, game, a building's upgrades, the HUD menu) and with a throwaway title picture; a build bundles the four font files. Not checked by hand: the look on the user's screen with Alegreya; cursors with real art; the hide palette on real art. Uncommitted. **Next:** AC7 (Opus), AC9 (Sonnet).
  AC7 done 2026-11-21: creature and effect art support. `src/render/creatureArt.ts` (pure: wolf run / walk / attack / idle, pack leader 1.4x darker and guardian pale with a glow, game run / walk / graze / idle, rider gallop / thrust, carcass stage whole / half / bones, corral spots, stampede spots, one-shot frames); `enemies.ts` draws each kind with art as a sprite per creature (smoothed, facing from movement, a killed wolf plays `die` then lies as `carcass_wolf` and fades, a dying deer or bison plays `die` then shows its carcass stage, emptied carcasses leave bones a while; storm and stampede sprites; free horses in finished corrals), else the old code drawings; `people.ts` draws a mounted lancer as `person_rider` when it has art; `arrows.ts` uses `fx_arrow` / `fx_arrow_stuck`; new `src/render/fx.ts` (hit dust on any hp drop, foot dust behind runners, a sparkle when a building finishes, a fish now and then in the river in view). No sim change. 290 unit tests (`tests/art/creatureArt.test.ts`, 10 new) and `npm run e2e` (24 tests, two new, stable over 3 repeats) pass; checked by screenshot with `?standins` (`ac7-standins.png`); not checked by hand. Uncommitted. **Next:** AC9 (Sonnet: the fps check); AB18-AB22 can follow once AB0 runs.
  AC9 done 2026-11-21: the performance check found 17 fps at every zoom on the 96 x 96 map with the stand-in atlases (the M3 figure of 60 came before the terrain
  became sprites). Fixed: the ground is baked into 36 chunk textures (16 x 16 tiles), off-screen terrain is hidden each frame (`TerrainView.cull`), `standinsOn()`
  is read once, hidden tool overlays on art-drawn people. Now 60 fps with 20 people and, with 200 walking people, 59 / 57 / about 48 fps at zoom 2 / 1 / 0.5:
  the 55 fps target at zoom 0.5 is **not met** (the cause left is draw calls and a 5 ms sim tick at 200 people); the 1.5x fallback would not help, so the proposal to
  the user is to leave it (details in the AC9 note in [from-claude](handoff/from-claude.md)). 290 unit tests and `npm run e2e` (24 tests) pass; checked by
  screenshot; uncommitted. **Next:** the user decides on the zoom 0.5 figure.
  2026-11-22: AB0 revision 1 approved and installed locally (15 frames); AB12's figure look is user-approved. Claude completed C2-C11/C13: AB1, AB6, AB7 and AB8 approved; AB2/AB5/AB9 need small fixes; AB3/AB10/AB11/AB13 need revisions. Family cloth greys stay as approved in AB12. AC9 is closed: user accepts about 48 fps with 200 people at zoom 0.5. AB4 waits for AB3 installation.
  AB1 revision 1 installed 2026-11-22 (Claude C2): panels/buttons unchanged from AB0, carved Wotakuye frame and tinted fill, menu emblem. UI atlas: six final keys, nine frames, one page. Approved delivery archived at `art/inbox/done/AB1-r1/`; manifest and ASSETS updated. The frame is visible over the fill at 0/60/100, both resolutions, without a runtime fix. Menu/panels/cards/minimap and three zooms captured at 1280/2560 with no browser errors. Manifest validation, typecheck, 293 unit tests and 24 e2e tests pass. `main` / `b456e1a`, dirty; earlier work retained. Claims released; no published rebuild, commit or push. Saving parked. Next: AB6/AB8 are approved for installation (AB7 installed below); revision work follows Claude's verdicts, including AB13 before further figure variants.
  AB7 revision 1 installed 2026-11-22 (Claude C5): approved title copied unchanged to `art/title.jpg`; existing AB1 emblem and atlas retained. Delivery archived at `art/inbox/done/AB7-r1/`; ASSETS and CHANGELOG updated. Menu captures at 1280x720 and 2560x1440 visually checked: readable title and controls, no browser errors. JPEG hash, dimensions and size budget verified; inbox/manifest validation, typecheck, 293 unit tests and 24 e2e tests pass. `main` / `b456e1a`, dirty; changed title, asset register, archive, changelog and Codex handoff; earlier work retained. Claims released; no published rebuild, commit or push. Saving parked. Next: approved AB8 installation (AB6 installed below).
  AB6 revision 1 installed 2026-11-22 (Claude C7): eight effects keys / 38 unchanged frames in one FX atlas page; manifest/ASSETS updated, approved delivery archived at `art/inbox/done/AB6-r1/`. Static placeholder flames are suppressed under animated fire; tests and TESTING updated for installed effects and an explicit invalid-provenance fixture. Installed-art checks at 1280/2560 and zoom 0.5/1/2 verify arrows, spirit, storm, flame, hit/dust/build effects, loop advancement and absence of old static flames; representative captures visually checked, no browser errors. Validation, typecheck, 293 unit tests and all 24 e2e tests pass after correcting stale test assumptions. `main` / `b456e1a`, dirty; affected FX atlas, manifest, asset register, placeholders, tests, TESTING, install-check script, archive, changelog and Codex handoff; prior work retained. Claims released; no published rebuild, commit or push. Saving parked. Next: approved AB8 installation.
