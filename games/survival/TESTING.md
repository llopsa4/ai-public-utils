# Survival testing

What is tested and how. Test list and rules: [DESIGN-slice.md](DESIGN-slice.md) `## Tests`; commands:
[DEVELOPMENT.md](DEVELOPMENT.md).

## Before finishing a task

`npm run typecheck && npm test`. Add `npm run e2e` when a scene, the HUD or the page changed.

## Simulation tests (`npm test`)

Node's test runner via tsx, `tests/**/*.test.ts`, no Phaser and no browser. They cover the map, people,
buildings, economy, orders, combat and waves. A test builds a state with `newGame(seed)` (helpers in
`tests/sim/helpers.ts`), calls `step(state, n)` and checks `state`. A fixed seed makes every run
identical, so a failing test can be replayed exactly. New rules get a test here, never in the browser.

## Browser smoke test (`npm run e2e`)

`tests/smoke.spec.ts`, Playwright 1.64 with desktop Chromium, configured in `playwright.config.ts`.
It starts its own Vite dev server on port 5184 (not the dev port 5174, so a running `npm run dev`
does not get in the way). It:

Five tests. All open `/?debug` (the hooks `window.camp` in a run and `window.menu` on the menu: button
centres by name such as `slot1.new`, and the card texts; the canvas is scaled to fit, so clicks are
computed from the canvas box) and fail on any `pageerror` or console error.

1. **Menu to a run:** clicks **New camp** on slot 1, checks 20 people, runs `window.camp.step(3300)`
   and waits until the HUD shows the scouts' warning (`window.camp.banner()`, set by `Hud.ts`).
2. **Season:** the HUD text reads `Spring, day 1` and `Pemmican 0 / 100` at the start, and
   `Winter, day 1` after the test sets `window.camp.state.tick = 10800` (stepping that far would starve the camp).
3. **Saves:** new camp in slot 1, `step(1200)`, waits for `campfire.slot.1` in localStorage, reloads,
   checks the card shows `Day 2`, clicks **Continue**, checks the run is paused with 20 people.
4. **Upgrades:** the HUD reads `Gift 0`; key U opens the panel (`window.camp.upgradesOpen()`), the dogs
   card says `Missing: gift 4` (`window.camp.upgradeCard('dogs')`); the test sets `state.gift = 5`, queues a
   `buy` order and sees `Bought`, `upgrades = ['dogs']` and `Gift 1`.
5. **Wotakuye tooltip:** pauses with Space, hovers the Wotakuye bar and reads `window.camp.wotakuyeTip()`
   (`no bed`, `Gift tomorrow`, `Full meal`); moving away makes it `null`.

On Windows the config passes ANGLE/Direct3D flags so headless Chromium uses the GPU; elsewhere the
defaults apply. The first run may need `npx playwright install chromium`.

## Checking by hand

Not covered by tests, so check in the browser (`npm run dev`) when touching them: mouse-edge and WASD
pan, shift-click, Delete on a site, 1-3 and Space, the pause / speed buttons, wolves and fighting, the
end screen and **Play again** (returns to the menu), and the file pickers: **Export** and **Import** on
the slot cards (downloads and the picker are not in the smoke test), the HUD **Menu** panel, the **Upgrades** panel's real Buy button, placing a healers' lodge and watching a healer treat someone, and **Delete**'s
Yes / No. A throwaway Playwright script with `acceptDownloads` and `filechooser` checked these on 2026-11-19.

## Publish check

`npm run publish` builds and writes `index.html` and `build/` in this folder. Check that both exist
and that the page loads from a static server. Commit them only when the user asks, and never push
without an explicit request (the site deploys when `main` is pushed).
