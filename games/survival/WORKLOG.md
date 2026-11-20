# Survival current status

Updated 2026-11-19. Shared procedure: [WORKFLOW.md](../WORKFLOW.md).
Per-agent activity and requests: [from Claude](handoff/from-claude.md), [from Codex](handoff/from-codex.md).
Finished tasks and their details are in Git history (`git log -- games/survival`).

## Mode
- **Claude only (Codex paused)** since 2026-11-19. The user works only with Claude for now; Codex
  joins later to generate art. Image generation is queued as requests for Codex in
  [handoff/from-claude.md](handoff/from-claude.md).

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

