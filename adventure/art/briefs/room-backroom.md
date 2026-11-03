# room-backroom

Status: **placeholder** · room · chapter ch2 · in the game as `art/src/ch2/rooms/backroom.png`

## Prompt for Codex

```text
Draw for the game Cinderfold: Bryn's back room: a stone hearth with a pot on the fire (left), a shelf of supply crates and jars, a table with a bowl and bread, a map pinned on the wall above it, a cot under a blanket (right), a courier's pouch on a peg by the far door (right), the curtain back to the workshop (left edge).
Lighting: Warm key light from the hearth (left); soft lamplight over the table; the far door side darker.
Style: painterly pixel art. Painted forms, worn materials and soft light falloff, finished as pixel art with crisp edges (no blur or haze around shapes) and a limited palette.
World: an industrial-fantasy village inside an old kiln: fired clay, ceramic plates, iron, brass, soot, ash, ochre cloth, ember light. Lived-in and repaired.
Colour: keep to the attached master palette (art/style/palette.png, 160 colours: ochres, rust, brass, ember orange, clay; soot greys and iron blue-greys). Every pixel is snapped to it on import.
Do not paint glows, haze, light shafts, particles or text: the game adds them. No photographic detail, lens effects, neon or modern objects.
Light: warm key light from the fire named above, cool dim fill from the opposite side. Camera at eye level, stage-like three-quarter view; floor in the lower third to two-fifths.
Deliver: art/inbox/room-backroom.png, 1280×720 (or larger at 16:9), opaque, no people in it.
Composition: keep the layout of art/spec/ch2/backroom.jpg (attached): the walkable floor (green), the doorways and every outlined thing must stay where it is shown.
```

## Attach

- `art/STYLE.md` (the style bible) and `art/style/palette.png`
- `art/spec/ch2/backroom.jpg` (layout to keep)
- The current placeholder for reference: `art/src/ch2/rooms/backroom.png`

Then: `npm run art:import`, check `art/inbox/preview/room-backroom.png`, `npm run art:check`, and look at it in the game.
