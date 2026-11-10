# Claude in the adventure

Start every session by reading, in order:
1. `AGENTS.md`: the rules shared with Codex (pushing, testing, the queues).
2. `WORKLOG.md`: where things stand.
3. `CLAUDE-INBOX.md`: your queue.

Before stopping, update your sections of `WORKLOG.md`. Write new tasks for Codex in `art/CODEX.md`
only.

## Working with the user
- On big requests, grill first (`/grill-me` rounds), then plan the items easiest first and build
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
- **Screenshots:** build (`npm run build`), then use the preview from `node scripts/serve.mjs` at
  `http://127.0.0.1:4173/adventure/`.
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
