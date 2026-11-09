---
name: adventure-content
description: Add or change content in the Cinderfold adventure (adventure/): rooms, hotspots, objects, interactions, puzzles, items, flags, dialogue, characters or translated text. Use whenever a request touches what the player can see, click, say or carry in the adventure game.
---

# Adding content to the Cinderfold adventure

The game is data-driven. Logic in `src/engine/` is pure and Phaser-free. Content lives in `src/content/`. Phaser only renders it (`src/game/`), and the DOM draws the interface (`src/ui/`). Keep that split: never put game rules in a scene or UI file.

## Where things go

| To add | Edit |
| --- | --- |
| Room | a 1280×720 background via `art/pixelate.mjs` + `art/webp.mjs`, its `.webp` registered in `ROOM_IMAGES` in `src/game/assets.ts`, plus a `RoomDef` in `src/content/rooms.ts` (world coordinates are 640×360; optional `surface`, `music`, `coldTint`) |
| Hotspot | `hotspots` of its room: `id`, `name` (string key), polygon, `verbs`, `walkTo` + `face`, optional `visibleIf`, `secret` (hidden from labels and Tab) |
| Repeat look lines | `<key>.2` and `<key>.3` strings plus the key in `VARIED_LOOKS` (`interactions.ts`) |
| Secret | a `secret` hotspot, an entry in `SECRETS` (`interactions.ts`) and its flag in `SECRET_FLAGS` / `FLAGS` (`state.ts`) |
| Portrait mood for a line | `LINE_MOODS` in `src/content/moods.ts` (worried / angry; Nell has only neutral) |
| Notebook goal | `STEPS` in `src/content/objectives.ts`, with `obj.*` text and two hints `hint.<id>.1` / `.2` |
| Object with states | the room's `objects` (sheet, x/y = foot point, `flag` + `whenTrue`/`whenFalse` tags, optional `depth`, `visibleIf`, `shadow` width for floor props), plus its sheet in `SHEETS` |
| What a verb does | a `case` in `interact()` in `src/content/interactions.ts`, and every new `line.*` key added to `INTERACTION_KEYS` |
| Flag or item | the `FLAGS` / `ITEMS` lists in `src/engine/state.ts`. Saves reject anything not listed. Items also need `art/src/items/<id>.png` (64×64; picked up automatically) |
| Dialogue | a tree in `src/content/dialogue.ts`, started by a `{ type: 'dialogue', id }` command |
| Character | a rig entry in `art/rig.mjs` (sheet + portrait strip with `face`), `SHEETS`/`NPC_SHEETS` (+ `LAZY_SHEETS` and `PORTRAIT_MOODS`), `NPC_IDS` in `types.ts`, `ACTOR_VERBS`/`TALK_SPOTS`, a room `actors` entry, `newGame`, a speech colour in `ui.ts` and a `speaker.<id>` string |
| Background person (not saved, no story effect) | an `EXTRAS` entry in `art/rig.mjs` (base body, height, recolour, headgear), its `extra-<id>` sheet in `SHEETS` in `assets.ts` (lazy automatically) and `scripts/verify-build.mjs`, an `ExtraDef` in its room's entry in `CROWDS` (`src/content/crowd.ts`: routines per mood (warm, optional alarm, cold) over that room's stations, optional exit, held thing, colour, line counts) and its `name.` / `speaker.` / `line.<id>.*` strings (`crowdKeys()` lists them). Stations must stay 24 units from every `walkTo`, entry and story character (`tests/crowd.test.ts`) |
| Room name board | `sign` on the room (hook x/y, rope `drop`, board `w`/`h`, `wood` or `iron`) and a `room.<id>` string |
| Text | `src/content/strings/en.json` (English only for now; the tests check every used key exists) |

## Every chapter's shape

Check every new or changed chapter against all five. If one is missing, propose how to add it before building:
1. **A soft, comfortable start** that continues smoothly from the chapter before.
2. **A dramatic milestone** after it that raises the sense of hurry or urgency.
3. **Solo puzzles:** Mara alone, working something out.
4. **Social interaction that moves the story forward:** conversations with consequences, not just flavour.
5. **Fighting.**

## Rules

- **Interactions return commands. They never mutate state.** Available commands: `walk`, `face`, `say`, `pose`, `setFlag`, `addItem`, `removeItem`, `wait`, `shake`, `moveObject`, `looked`, `dialogue`, `room` (always last: it restarts the scene), `end`. Begin physical actions with `...approach(state, id)` so the hero walks to the hotspot's `walkTo` first.
- **Reuse the shared generic lines** (`line.cannot`, `line.useFails`, `line.useFails.<item>`, …) instead of duplicating them.
- **Hotspot order matters.** The first visible match wins, so list small things (the notebook on its block) before large ones.
- **Walkable areas** are an outer polygon plus obstacle `holes` under furniture and standing characters. Every `walkTo` and every entry must be inside the walkable area. The pathfinding test checks this.
- **Depth:** sprites sort by their foot y. Set `depth` only for things that sit *inside* another object.
- **Coordinates** are logical 640×360 pixels with the origin at the top left. Objects and actors are anchored at the bottom centre.
- **Story:** follow Kiln Courier's `STORY.md` guardrails: needs and feelings without formula speech, no villains, everyday warmth and humour. Mara is he/him. Publish only what the user has cleared (currently scene 1 and its two mysteries). Keep lines short: speech wraps at 60% of the screen width.
- **No backend:** no fetch to servers. Progress persists in one localStorage autosave slot and through save export/import. A new flag or item changes the save format: bump `SAVE_VERSION` in `saveFile.ts` and keep older versions loading where possible.

## Finish every change with

1. Add or extend the relevant tests. Use `tests/support/story-driver.ts` for headless story integration, with explicit dialogue choices and fight/screen fixtures. Classify new files/tags as described in `adventure/TESTING.md`.
2. Run `npm test` and the relevant `npm run test:feature -- story` (or other feature suites). These cover logic without browser journeys.
3. Run unit tests only (`npm test`, the matching `test:feature` suites; `npm run test:all` for shared runtime/scene/state/command-runner/chapter/build changes and before publishing). No browser suites unless the user asks. Inspect changed visuals through `npm run preview` → `http://127.0.0.1:4173/adventure/?debug`. See `adventure/AGENTS.md` and `TESTING.md` for the complete selection rules.
4. Keep regenerated `index.html` + `build/` with source changes when a build was needed. Commit or push only when explicitly requested (see the repository's AGENTS.md).
5. Add a CHANGELOG entry and update the README if controls or limits changed.
