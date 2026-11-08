# Changelog

## Unreleased

- Chapter 1 has a forgiving mechanical regulator close-up, flexible morning errands, first-concern callbacks and a shared optional farewell through Nell or Tobi.
- Corvin's Ashways salvage accident now triggers a 52-HP sweeper boss, followed by a brief aftermath. Defeat retries restore health and MP, resources carry onward, and rewards/checkpoints are single-use.
- Version 10 saves retain puzzle and finale progress and migrate earlier chapter progress without rewinding it.
- Wooden room names are knife-scratched; metal room names use rough chalk strokes.

- Combat adapts to short and narrow landscape screens: smaller health panels and cards, a horizontal hand, and on-screen controls with 44-pixel action targets. Resizing keeps the active battle.

- Combat now uses the approved lower fighting stance, raised guard during a 200 ms approach, and a punch held for 500 ms before returning. Damage appears at contact; input and victory wait for the full attack to finish.

- G toggles unlocked Gear, N the Notebook, and M the Menu during exploration. Shortcuts respect dialogue, combat, text entry and modal focus; opening a screen cancels movement and pending inventory gestures.
- After reading the shutdown procedure, Mara must speak to Oren about protection and complete a guided Gear visit before releasing the regulator. Oren equips medium armour once; post-fight spares and shelter advice remain, without a second tutorial. Version 9 saves preserve older progress and chosen equipment.
- Testing now separates fast Node contracts, feature suites, focused browser checks and full release journeys. `npm test` skips expensive image rendering and browsers; `test:release` validates everything with one production build. Story integration shares production dialogue rewards, and chapter-two browser checks are included in discovery.
- Tobi now appears by the firing-house hearth with his own art, portrait and conversation. He speaks during the scarf farewell; older saves gain him through a version 8 migration.
- Hollis kneels at the fire, making short trips to empty ash into the cart. Dace stays by the broken jars, sorting pottery for reuse. Both keep their reactions when the kiln goes cold.
- The debug panel now toggles with comma (`,`); `?debug=panel` still opens it directly on the published site.
- Mara's morning starts in everyday clothes: help Wren with the hoist and bring Nell a loaf for her soup, then dress at the tent's clothes crate and power the gauntlet. Dressing fades through black with cloth and buckle sounds. Existing saves with the gauntlet skip these errands.
- Hover highlight: a soft gold outline on what the pointer is over (a ring at the feet for people).
- Background people glance at Mara as she walks by, step round Nell and Oren, and the kids sometimes tag along a few steps ("Where are you going? Can I come?"). Ansel announces his soup breaks on the way out.
- Nell and Oren look about when Mara isn't near: at the kids, the room, the door.
- The kiln hall and firing house sound inhabited: a murmur of voices and the odd distant clank, quieter once the kiln is cold.
- An optional count in the notebook of the people of Cinderfold Mara has talked to (six), with a note each time she meets someone new.
- Settings show a sample line at the chosen text size and contrast.

## 0.5.0: a lived-in Cinderfold, still scene 1

**Opening and rooms**
- A new story opens with a slow fade to black and four lines of context (a world of ash and wind, people holding on, Cinderfold inside its kiln, Mara's ordinary morning), one after another: click, Enter or Space for the next, Skip or Esc for all. The tent then fades in slowly.
- Mara's tent is repainted from scratch (`art/tent.mjs`): canvas walls and ridge pole, a hanging lantern, the workbench and tools, the water jar, the old brush drum, a cot, a rug and the door flap. The puzzle spots are where they were.
- Every room has its name on a board hanging from a rope (an iron shield-plate in the regulator gallery). The boards sway, jolt when the kiln groans, and take the room's light.

**Background people**
- Four workers in the kiln hall: Hollis the stoker, Wren the hoist hand, Dace the clay hauler and old Ansel the tally-keeper. Each walks a routine of stations with random waits and detours, and works there with a pose, a held thing (shovel, slate, sack) and a small effect: sparks at the kiln mouths, the pulley swinging, chalk taps, scraping. Dace and Ansel leave and come back now and then.
- Two kids in the firing house, Pip and Bea (Bea carries a board as a toy shield): they play tag, chalk on the floor, peek into the soup and sit by the hearth. When the alarm goes up they run to Nell and stay by her; once the kiln is cold they huddle by the dead hearth.
- They don't walk through each other or into Mara: whoever is in the way makes them pause and step round. They make way when Mara walks through, and step aside when she heads to where they work.
- Look at them or talk to them: they stop, turn to Mara and say one of a few lines, which change with the alarm and the cold. Nothing they say changes the story or the save.
- They chat now and then in speech bubbles, which are hidden during conversations and kept out of the history.
- When the kiln goes cold in front of them, the workers stop and stare at it, then change routine; Dace and Ansel leave for good.
- Placeholder art: recoloured, re-heighted variants of Mara, Oren and Nell with painted headgear, built by `art/rig.mjs` and loaded in the background once play starts.

**Light and effects** (with a Visual quality setting: High, or Low for phones and older machines)
- Colour grading per room, which shifts to a cold grade over three seconds when the kiln dies in front of you; glows fade out instead of switching off.
- Heat haze over kiln mouths, the hearth and hot pipes; drifting light shafts; a vignette and soft halos around glows.
- Characters are lit warmer near kiln mouths, hearths and lanterns; faint reflections on the gallery's wet floor.
- Textured smoke, steam and ash; ember streaks; sparks from the kiln when it groans; dust from footsteps (different on stone, ash and metal).
- A live gauge needle that drops when the kiln is shut down, soup bubbles, a swinging hoist that swings harder when used, lantern flames.

**Interface**
- Game-style menus: a pause screen, Mara's notebook as a parchment page, drawn settings controls (segmented choices, switches, sliders), How to play, and an in-game confirmation instead of the browser's pop-up.
- The Zilla Slab font throughout; drawn icons on the bar; numbered replies in conversations.

**For artists**
- `art/REPLACING.md` (generated by `npm run art:guide`): every image the game loads, its size, frames, tags and anchor, and for each room a reference image with the clickable areas, walk area and anchor points drawn on.
- `npm run art:check` (also part of `npm test`): checks the art files against what the code expects.

**Fixes**
- Coming back to a room on High quality showed only a small crop of its background over black.
- Very quiet sounds no longer throw an audio error (a distant footstep could stop a room change).
- A background sheet still loading when you left a room no longer reports a duplicate texture.

Size: 3.20 MB in total (budget 3.6 MB); 1.62 MB counted before the title screen.

## 0.4.0: more polish, still no new story

- Title screen over the kiln hall, with Continue, New game, Import and Settings. Menu → Title screen.
- Autosave in this browser (one slot, same validation as exported saves); a damaged slot is ignored with a notice.
- The cursor shows what it is over and what a click will do (look, handle, talk, leave).
- Two-stage hints for the current goal in the notebook.
- Looking again often gets a second or third line; each item has its own reply when used on the wrong thing.
- Talking portraits: the mouth moves while a line is shown, and Mara and Oren show worried or angry faces on some lines.
- Four optional secrets (tally marks, Tobi's chalk drawings, Nell's old sign, names on the gallery rail), counted in the notebook.
- The kiln hall's tent is painted cloth from the Kiln art; the tent room's canvas no longer bands; the cold firing house is lighter.
- Contact shadows under characters and the ash sweeper.
- A generative synthesized score per room mood, with its own volume; footsteps sound different on stone, metal grating and ash.
- Accessibility: text size, high-contrast panels, keyboard play (Tab between things in the room, Enter for the action ring).
- Mobile: larger tap targets, press-and-hold labels, a fullscreen button.
- Smaller download: a custom Phaser build (1.32 MB → 0.77 MB of JavaScript), WebP rooms, characters loaded per room. 2.75 MB in total; 0.96 MB before the title screen as GitHub Pages serves it.
- Browser tests (Playwright): the full scene from the title screen to the end card, autosave and Continue, keyboard play, a phone in both orientations.
- Save format version 4 (look counters, secrets); version 3 saves still load.

## 0.3.0: polish, no new story

- Mara's tent is the new starting room (tempering-house painting under a canvas ceiling). He fits the ember cell before leaving; the kiln hall now has his tent in it.
- Dialogue panel: a small portrait with the speaker's name and line, Mara on the left and others on the right.
- Hold Space or press the eye button to label everything you can interact with.
- Mara's notebook lists finished goals and the current one, without spoilers.
- Dialogue history and a settings panel (text speed, volume, mute, auto-advance, reduced motion), saved as preferences.
- Walk-behind layers (tent stool, kiln-hall rubble, gallery railing) and per-room character lighting with depth dimming.
- The charging rack, valve pipe and scarf icon now come from Kiln art.
- Ambient life: embers, steam, dust, ash and flickering light pools that go out with the kiln.
- The rig bends the knees for a six-frame stepping walk, and frames follow distance so feet don't slide. NPCs turn toward Mara and fidget.
- Mara walks out through doorways and in on arrival. Double-click an exit to go straight through.
- Synthesized sound (kiln hum, crackles, wind, footsteps, latch, rumble, steam, brushes, UI blips) with a mute button.
- Palette-indexed PNGs and per-room loading: 14 MB down to 4.4 MB, 2.7 MB before the first room (the JavaScript is gzipped by GitHub Pages).
- Save format version 3.

## 0.2.0: Cinderfold, scene 1

- Replaced the hotel pilot with Kiln Courier's first scene: Mara's workbench in the kiln hall, the firing house, the regulator gallery and the ashways.
- All art now comes from Kiln Courier's illustrations at 1280×720: pixelated rooms, items, objects and the ash sweeper, plus rigged and animated Mara, Oren and Nell (walk sway, crouch, lie down, painted blink).
- Dialogue portraits show the speaker's Kiln illustration on the side away from them.
- Puzzle chain: ember cell → Nell's latch → the alarm → the failed patch → the conversation with Oren (his reluctance is heard, then he decides) → mother's notebook → shutdown → goodbyes with bread and Tobi's scarf → the steam valve distracts the ash sweeper → "To be continued".
- Cold-kiln tint after the shutdown. Camera shake for the kiln's groans.
- English only for now. The language switcher hides itself when there is a single language.
- Save format version 2; version 1 (pilot) saves are rejected with a message.
- `?debug` overlay showing walk areas, hotspots, approach points and entries.

## 0.1.0: pilot

- Phaser 3 + TypeScript engine at 640×360, served as static files from GitHub Pages.
- Two rooms, a hero and an NPC, action ring, inventory, suitcase → key → door puzzle, branching dialogue, EN/CA/ES, save export/import.
