# Changelog

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
