# Survival testing

What is tested and how. Test list and rules: [DESIGN-slice.md](DESIGN-slice.md) `## Tests`; commands:
[DEVELOPMENT.md](DEVELOPMENT.md).

## Before finishing a task

`npm run typecheck && npm test`. Add `npm run e2e` when a scene, the HUD or the page changed.

## Simulation tests (`npm test`)

Node's test runner via tsx, `tests/**/*.test.ts`, no Phaser and no browser. They cover the map, people,
buildings, economy, orders, combat and waves; `tests/sim/occupancy.test.ts` checks that no two people stand
still on one tile (builders, deliverers, fleeing, group moves, drafts, woodcutters, a 3000-tick run). A test builds a state with `newGame(seed)` (helpers in
`tests/sim/helpers.ts`), calls `step(state, n)` and checks `state`. A fixed seed makes every run
identical, so a failing test can be replayed exactly. New rules get a test here, never in the browser.

## Browser smoke test (`npm run e2e`)

`tests/smoke.spec.ts`, Playwright 1.64 with desktop Chromium, configured in `playwright.config.ts`.
It starts its own Vite dev server on port 5184 (not the dev port 5174, so a running `npm run dev`
does not get in the way). It:

Eight tests. All open `/?debug` (the hooks `window.camp` in a run and `window.menu` on the menu: button
centres by name such as `slot1.new`, and the card texts; the canvas is scaled to fit, so clicks are
computed from the canvas box) and fail on any `pageerror` or console error.

1. **Menu to a run:** clicks **New camp** on slot 1, checks 20 people, runs `window.camp.step(3300)`
   and waits until the HUD shows the scouts' warning (`window.camp.banner()`, set by `Hud.ts`).
2. **Season:** the HUD text reads `Spring, day 1` and `Pemmican 0 / 100` at the start, and
   `Winter, day 1` after the test sets `window.camp.state.tick = 10800` (stepping that far would starve the camp).
3. **Saves:** new camp in slot 1, `step(1200)`, waits for `campfire.slot.1` in localStorage, reloads,
   checks the card shows `Day 2`, clicks **Continue**, checks the run is paused with 20 people.
4. **Upgrades in a building's panel:** the HUD reads `Gift 0`; `window.camp.selectBuilding(1)` (the council
   fire) lists `healers, warriors, builders, tools` (`window.camp.upgradeRows()`); the test adds a finished
   hunting lodge, selects it and sees `dogs, bows, scouts`, the dogs row saying `Missing: gift 4` and the
   scouts row `Needs Hunting dogs`; it sets `state.gift = 5`, clicks the real **Buy** button (position from
   `window.camp.upgradeBuy('dogs')`) and sees `Owned`, `upgrades = ['dogs']` and `Gift 1`.
5. **Tier 2 upgrades:** with a rich camp (`state.gift`, wood, hides set by the test) a `buy` order for
   `scouts` is refused and its row in the lodge's panel says `Needs Hunting dogs`; after `dogs` it is bought. The Build menu
   (`window.camp.buildMenu()`: `open`, `page`, `shown`) opens on `camp`, Tab switches to `societies`
   showing only `scouts_lodge`, Tab again returns. It saves two screenshots to `test-results/`.
6. **Wotakuye tooltip:** pauses with Space, hovers the Wotakuye bar and reads `window.camp.wotakuyeTip()`
   (`no bed`, `Gift tomorrow`, `Full meal`); moving away makes it `null`.
7. **Power bar:** F1 casts the spirit warriors, a click on the storm button starts aiming, a map click casts it
   and Esc cancels aiming (`window.camp.powers()`, `powerButton()`, `hoverTip()`).
8. **Resource icons and the open store:** `window.camp.hudBar()` lists the bar's parts: the first five lead
   with `icon_food`, `icon_wood`, `icon_hides`, `icon_pemmican`, `icon_gift`, then `icon_people` with the head count, and the bar ends before x 745.
   The pointer goes on the start store; `window.camp.storeOpen()` names it and how many items of each
   resource show (0, 20 and 40 each) for the store filled 0, half and full; moving away makes it `null`. Screenshots
   `r1-resource-bar.png` and `r2-store-*.png` go to `test-results/`.
9. **Right-click pings:** the sim is paused; `window.camp.lastPing()` (`kind`, `target`, running `count`) reads
   `move` on open ground, `work` on a tree, `refuse` for a child told to chop (toast `Nobody can chop there.`),
   `refuse` for an undrafted person told to attack a wolf (`Nobody is drafted.`), then `attack` once drafted.
   With nobody selected there is no ping. Screenshots `g5-ping-*.png` go to `test-results/`.
10. **Berry patch panel:** the sim is paused; a left-click on a berry bush makes `window.camp.panelText()` read
   `Berry patch` / `17 of 40 fruit left` (the bush is set to 17.6); Esc empties the panel's title.


On Windows the config passes ANGLE/Direct3D flags so headless Chromium uses the GPU; elsewhere the
defaults apply. The first run may need `npx playwright install chromium`.

## Checking by hand

Not covered by tests, so check in the browser (`npm run dev`) when touching them: mouse-edge and WASD
pan, shift-click, Delete on a site, 1-3 and Space, the pause / speed buttons, wolves and fighting, the
end screen and **Play again** (returns to the menu), and the file pickers: **Export** and **Import** on
the slot cards (downloads and the picker are not in the smoke test), the HUD **Menu** panel, the **Upgrades** panel's real Buy button, placing a healers' lodge and watching a healer treat someone, placing a trap or fire pit by hand and watching wolves meet it, a scout staffing the lodge for the early warning, a lancer or archer drafted from their lodge, a horse corral breeding, a rider, the bison lane's reticle and a real cast of each power with wolves about, wolves meeting a barricade line, and **Delete**'s
Yes / No. A throwaway Playwright script with `acceptDownloads` and `filechooser` checked these on 2026-11-19.

## Publish check

`npm run publish` builds and writes `index.html` and `build/` in this folder. Check that both exist
and that the page loads from a static server. Commit them only when the user asks, and never push
without an explicit request (the site deploys when `main` is pushed).
