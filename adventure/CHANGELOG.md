# Changelog

## Unreleased: background people and room names

- Every room has its name on a board hanging from a rope (an iron shield-plate in the regulator gallery). The boards sway, jolt when the kiln groans, and take the room's light.
- Four workers in the kiln hall: Hollis the stoker, Wren the hoist hand, Dace the clay hauler and old Ansel the tally-keeper. Each walks a routine of stations with random waits and detours, and works there with a pose, a held thing (shovel, slate, sack) and a small effect: sparks at the kiln mouths, the pulley swinging, chalk taps, scraping. Dace and Ansel leave and come back now and then.
- Two kids in the firing house, Pip and Bea (Bea carries a board as a toy shield): they play tag, chalk on the floor, peek into the soup and sit by the hearth. When the alarm goes up they run to Nell and stay by her; once the kiln is cold they huddle by the dead hearth.
- Everyone waits if Mara stands in their way, and steps aside when she heads to where they are.
- Look at them or talk to them: they stop, turn to Mara and say one of a few lines, which change with the alarm and the cold. Nothing they say changes the story or the save.
- They chat now and then in speech bubbles, which are hidden during conversations and kept out of the history.
- When the kiln goes cold in front of them, the workers stop and stare at it, then change routine; Dace and Ansel leave for good.
- Placeholder art: recoloured, re-heighted variants of Mara, Oren and Nell with painted headgear, built by `art/rig.mjs` and loaded in the background once play starts (WebP, about 320 KB). The total size budget is now 3.6 MB.
- Fix: coming back to a room on High quality showed only a small crop of its background over black (the heat-haze frame had become the image's default frame).
- Fix: very quiet sounds no longer throw an audio error (a distant footstep could stop a room change).

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
