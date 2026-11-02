# Changelog

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
