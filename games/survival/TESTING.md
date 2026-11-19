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

1. opens `/?debug` (the debug hook `window.camp`) and waits for the canvas;
2. clicks **Start** on the menu (the canvas is scaled to fit, so the click is computed from the
   canvas box);
3. checks `window.camp.state.people.length === 20`;
4. runs `window.camp.step(3300)` and waits until the HUD shows the scouts' warning
   (`window.camp.banner()`, set by `Hud.ts`);
5. fails on any `pageerror` or console error.

On Windows the config passes ANGLE/Direct3D flags so headless Chromium uses the GPU; elsewhere the
defaults apply. The first run may need `npx playwright install chromium`.

## Checking by hand

Not covered by tests, so check in the browser (`npm run dev`) when touching them: mouse-edge and WASD
pan, shift-click, Delete on a site, 1-3 and Space, the pause / speed buttons, wolves and fighting, the
end screen and **Play again** (returns to the menu).

## Publish check

`npm run publish` builds and writes `index.html` and `build/` in this folder. Check that both exist
and that the page loads from a static server. Commit them only when the user asks, and never push
without an explicit request (the site deploys when `main` is pushed).
