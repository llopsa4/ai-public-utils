# Claude in the adventure

Start every session by reading, in order:
1. `AGENTS.md`: the rules shared with Codex (pushing, testing, the queues).
2. `WORKLOG.md`: where things stand.
3. `CLAUDE-INBOX.md`: your queue.

Codex may be working in this folder at the same time:
- Before editing, check the Lanes and "Working on" claims in `WORKLOG.md`. Edit only your own lane;
  outside it, claim the file first.
- Commit only your own paths, never `git add -A`.
- Don't run `npm run build` unless publishing. For screenshots, build to a scratch folder:
  `npx vite build --outDir <job tmp>/scratch/adventure`, then
  `node scripts/serve.mjs --dir <job tmp>/scratch --port 4174`.
- The shared memory is `.agents/memory/` at the repo root (git-ignored, this PC only; your memory path links to it). Codex reads and writes it too.

Before stopping, update your sections of `WORKLOG.md`. Write new tasks for Codex in `art/CODEX.md`
only.

## Working with the user
- On big requests, grill first (`/grill-me`, one question at a time), then plan the items easiest first and build
  them in that order.
- Unit tests only (`npm test`, `npm run test:feature -- <suites>`). Check visuals with screenshots.
  See `TESTING.md`.
- Commit only when asked. Push only when asked, and ask which branch first, since `main` deploys
  GitHub Pages.

## Gotchas
- **Phaser** is a custom build with no `add.text` and no `add.rectangle`. Draw canvas textures
  (`textures.createCanvas`) or use images.
- **The fight screen** is Kiln Courier's React from `../FFCardGame`, replaced file by file through
  `KC_OVERRIDES` in `vite.config.ts`, with the overrides in `src/kc/`.
  - `src/kc/kc.css` is generated (`scripts/kc-css.mjs`), so styles go in `src/kc/kc-local.css`.
  - The plugin can load a module twice. Pass state through arguments, not module globals.
  - Fights play over the room (`src/game/room/fightBridge.ts`, `fightStage()`, `#kc-root.in-room`).
- **Rooms** live in `src/chapters/<chapter>/rooms.ts` and rules in `interactions.ts`.
  - Don't import one from the other (a loading cycle); put shared scripts in their own file
    (`intro/kellSees.ts`).
  - Every story flag needs a room: add it to the chapter's `flagRooms` if no rule names one.
- **Screenshots:** use a scratch build (above) on `:4174`. `:4173` serves the published `build/`.
  - `window.adventure` only exists with `?debug=1`.
  - Lines wait for a click, so scripts must call `adventure.session.ui.skip()` until
    `session.scene.isBusy()` is false.
  - Run actions with `adventure.interact(state, verb, target)` and `session.scene.runScript(...)`.
  - Keep scripts and shots in the job's tmp folder, not in the repo.
- **Art:**
  - Every file is listed in `art/manifest.mjs`, and `npm run art:check` must pass.
  - Final art snaps to the master palette (`snapToPalette`, `art/normalize.mjs`). A soft light or
    glow can't, so mark it `status: 'placeholder'` with a note.
  - WebP: keep the smaller of the lossy and lossless encodings (`art/webp.mjs`).
  - Portraits come from `art/rig.mjs` (`node art/rig.mjs <character>`). Drawn mood faces come from
    `drawnFaces` in the manifest.
- **The build** is checked by `scripts/verify-build.mjs`, which sets the doubled size budgets.
- **The headless story driver** (`tests/`) fails on unknown commands; never fake a win.
- **The inbox:** `art/inbox/` is git-ignored. Move installed deliveries to `art/inbox/done/`.
