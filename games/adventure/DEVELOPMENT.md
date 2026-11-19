# Adventure development

See the [README layout](README.md#layout) for architecture and source ownership, the
[shared workflow](../WORKFLOW.md) for assignments, and [TESTING.md](TESTING.md) for validation
and scratch previews. Paths below are relative to `games/adventure/`.

Adventure targets desktop computer browsers with mouse, trackpad and keyboard. Phone/tablet
layouts, touch-only controls and mobile device testing are outside the game's scope. Preserve
desktop window resizing, browser zoom, keyboard access, fullscreen and reduced motion.

FFCardGame is a subgame in Adventure's service. When shared code, rules or styles conflict,
resolve them in Adventure's favor, changing shared FFCardGame source when that is the cleaner
fix. FFCardGame remains a standalone published game: keep it working and run its relevant
checks; its own device support stays. Its versioning and release rules apply only when the
user asks for a push.

## Authoring chapter content

- Use the chapter's `rooms.ts`, `interactions.ts`, `dialogue.ts`, `flags.ts`, `strings.en.json`
  and its objectives/moods/story modules. Its `index.ts` exposes the chapter definition; use a
  nearby implemented chapter as the registration example.
- Interactions return commands without mutating state. Use chapter `approach` helpers for
  physical actions. Consult the command union in `src/engine/types.ts`; room/chapter/end commands
  terminate the old script. Rooms and interactions must not import each other: put shared scripts
  in their own module (for example `intro/kellSees.ts`).
- Hotspot matching is ordered: small targets precede overlapping larger targets. Approaches and
  entries must be inside the walkable polygon and outside obstacle holes. Objects/actors normally
  use a bottom-centre foot anchor; preserve explicit atlas registration and foot-y depth.
- Flags/items belong in chapter declarations and definitions. Associate flags with rooms through
  `flagRooms` when no rule supplies one. Update strings, objectives, hints, dialogue/mood references
  and diary as applicable. Save migrations/version handling live in `src/engine/migrations.ts`;
  extend compatibility when needed rather than only changing a version constant.
- For NPCs, check actor IDs/types, chapter verbs/approach spots, room actors, speech colours/names,
  art registration, lazy loading and portrait moods. Crowd routines live with chapter content;
  maintain station/approach spacing and existing sheet contracts.
- Reuse generic failure lines. Speech remains short and click-advanced, without continuation
  hints. Mara uses he/him. Source story decisions through the shared workflow.
- Every chapter needs a comfortable opening, an urgency milestone, solo puzzles for its viewpoint
  character, consequential social scenes and fighting. Identify missing beats before building.
- Keep shared game rules in the engine and chapter definitions rather than scenes or UI modules.
  The game remains static, with localStorage and save import/export; no runtime backend.

## Runtime and integration gotchas

- Development uses full Phaser, but production aliases `src/phaser-custom.cjs`, omitting text,
  rectangles, physics and other modules. Use canvas textures or images for unsupported graphics.
  A successful dev preview does not prove production compatibility.
- Battle screens share `../FFCardGame/client/src` through `KC_OVERRIDES` in `vite.config.ts`.
  The resolver may load modules twice: pass state through arguments, not module globals.
  Fights use `src/game/room/fightBridge.ts` and `#kc-root.in-room`.
- `src/kc/kc.css` is generated; edit `src/kc/kc-local.css` for Adventure-specific styles.
  Shared battle changes also need the sibling project's relevant checks.
- `window.adventure` requires debug mode. For scripted screenshots, call
  `adventure.session.ui.skip()` until `adventure.session.scene.isBusy()` is false, then use
  `adventure.interact(...)` and `session.scene.runScript(...)`. Keep capture scripts in temporary
  storage; see the README for debug-panel controls.
- Use `tests/support/story-driver.ts` for headless integration, with explicit dialogue choices
  and blocking fight/screen outcomes. Its limits and test registration are in TESTING.md.
- Request art through the shared workflow. Temporary test grids do not replace approved visual
  composition; the [reference map](art/REFERENCES.md) identifies the relevant authority.

## Helper scripts

- `scripts/probe.mjs`: screenshots any room at any point of the story from the built game (run
  `npm run build` first); options are in the script header. Output goes to `shots/`, which is not
  committed.
- `art/palette_png.py`: Python helper that saves a sprite with the master palette
  (`art/style/palette.json`). `art/menu-flame.py` imports it; it needs Pillow.
