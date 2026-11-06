# Testing Adventure

Use the smallest checks that exercise the changed behavior. Ordinary edits do not require full browser playthroughs. A publishing request or a shared runtime behavior change does.

## Commands

- `npm test`: typecheck and fast Node tests. No browser, production build, image generation, or tracked output changes. The target is roughly 30 seconds; printed timings are informational, not a pass/fail threshold.
- `npm run test:feature -- story saves`: typecheck and the union of selected Node suites, without duplicates. Supported features: `story`, `saves`, `crowd`, `input`, `art`, `runtime`. A feature suite includes its exhaustive checks, so it can be slower than the default.
- `npm run test:browser -- story`: one fresh production build and the selected **focused** browser checks. This does not run full journeys. It updates the local published `index.html` and `build/` files, just like `npm run build`.
- `npm run test:all`: typecheck and every Node test, including bitmap rendering/import, interaction goldens and exhaustive story exploration.
- `npm run test:release`: validate the entire inventory, typecheck once, run every Node test, build and verify once, then run every desktop/phone browser check and full journey against that artifact.
- `npm run test:inventory`: audit and summarize Node and browser classification without launching a browser or building the site.

Add `--list` to any test selection to see its files or browser cases without executing tests, typechecking or building: `npm run test:browser -- crowd --list`. Unknown features and unclassified tests fail instead of silently selecting nothing.

Existing commands remain available: `npm run check` runs all Node tests plus a verified build; `npm run e2e` builds once and runs every browser check; `npm run build` typechecks and builds without tests. Prefer `test:release` to `check` followed by `e2e`, which would build twice across separate invocations.

Example local measurements after restructuring (including typechecking): fast **100 tests in 4.6 seconds**, crowd Node checks **25 tests in 3.5 seconds**, and story/save Node checks **58 tests in 7.5 seconds**. A combined story/input/crowd browser selection ran **15 checks with one build in 134 seconds**, excluding all seven long journeys. Machine load affects these numbers. The fast-run validation also confirmed that tracked changes and the published page were unchanged.

## Selecting checks

Start with `npm test`, then add the relevant feature suites:

- **Story, dialogue, objectives, rewards:** `test:feature -- story`. This includes exhaustive chapter reachability and interaction goldens. Add focused story browser checks for new actors, portraits or other scene/UI wiring.
- **Saves and migrations:** `test:feature -- saves` and `test:browser -- saves` for real persistence/import/reload wiring. Shared serialization/state behavior also needs release verification.
- **Crowd routines:** `test:feature -- crowd` checks seeded schedules, timing ranges, path geometry, spacing and shutdown behavior. Use `test:browser -- crowd` when changing pose, placement, hit targets or renderer wiring. Complete work cycles and animated departures remain release journeys.
- **Input:** `test:feature -- input` covers movement, bounds and settings contracts; it does **not** claim to model mouse/touch gesture ordering. Changes to gestures, focus, dragging or keys require `test:browser -- input`.
- **Art/animation:** `test:feature -- art` covers metadata and expensive pixel/rig/import checks. Use `test:browser -- art` and inspect relevant images/screenshots for appearance, depth and animation. Browser assertions do not replace visual inspection.
- **Shared scene, command runner, state/effects, chapter transitions, registry or build behavior:** use the relevant suites while iterating, then `test:release` before finishing. Evaluate behavior impact rather than choosing solely by filename.
- **Before publishing:** `test:release`. This is validation, not authorization to commit or push.

For a Tobi-style NPC addition: fast tests, story/saves/art feature checks as applicable, and focused story browser checks. A change to shared runtime support for that NPC requires release verification. For a Hollis-style schedule-only adjustment: fast tests and the crowd Node suite; add the short crowd browser suite if its placement or presentation changes.

## What the layers prove

The fast tests cover rules, known story paths, inventory, rewards, saves, movement, crowd schedules, objectives, strings and cheap art contracts. Expensive tests live in separate files so excluded tests cannot still load image packs at import time.

`tests/support/story-driver.ts` executes logical commands without Phaser, DOM, images or real timers. The driver uses production dialogue state effects, but expected rewards and outcomes are independently asserted. Room/chapter/end commands terminate their original scripts; entry scripts run on arrival. Dialogue choices, fights and blocking screens require explicit fixtures. Unknown commands throw.

The story graph is a reachability model assuming successful fights and dismissed screens. It enumerates dialogue branches; it does not prove combat mechanics, exact rendering, gesture behavior or every equipment state. Dedicated tests cover those contracts.

Focused Playwright tests cover the actual browser/Phaser connections: draw the actor, load a portrait, hit the right target, deliver input, persist a save, or propagate a mood. Full journeys retain complete chapter chains, combat lessons and timed crowd cycles. All browser checks use the verified production build, including the reduced Phaser bundle, relative-URL and size checks. Standalone browser commands rebuild; there is no stale-build cache.

## Adding tests

Node tests are discovered recursively under `tests/` using `.test.ts`, `.test.mjs` and the corresponding JS/TS module extensions. Register each file in `scripts/test-suites.mjs`, choosing whether it is fast and assigning one or more features. The all-tests command discovers files independently of this catalog; the audit rejects missing or stale classifications. Helpers live under `tests/support/` without a test suffix.

Every Playwright test needs exactly one tier tag, `@focused` or `@journey`, and at least one feature tag, for example `{ tag: ['@focused', '@story', '@saves'] }`. Add `@phone` for phone cases. Classification is per test, since short and long checks can share a spec file. Desktop and phone projects discover all specs and divide them by the phone tag; no filename allowlist excludes a chapter. Inventory auditing checks omitted files, tag spelling, device assignment and explicitly skipped coverage.

Keep scenes deterministic for isolated input tests: load the relevant state, hold unrelated moving actors, and choose a verified empty floor point for floor gestures. Poll the condition being tested instead of sleeping through an unrelated routine. Keep real timing waits only when timing itself is the subject.

Do not loosen assertions, auto-update goldens, skip failures or remove production coverage to meet a timing target. Report the checks actually run and any remaining limitation.
