# room-road

Status: **placeholder** · room · chapter ch2 · in the game as `art/src/ch2/rooms/road.png`

## Prompt for Codex

```text
Draw for the game Cinderfold: The road to Bryn's tempering house, at the edge of the ashways at dusk: a stone house (right) with a heavy wooden door, a lit window and a bell on a bracket, a lantern by the door, a chimney breathing steam; the ash road and a signpost back towards Cinderfold (left), great pipes in the haze behind.
Lighting: Warm key light from the window and the door lantern (right); cool blue-grey dusk from the sky (left).
Style: painterly pixel art. Painted forms, worn materials and soft light falloff, finished as pixel art with crisp edges (no blur or haze around shapes) and a limited palette.
World: an industrial-fantasy village inside an old kiln: fired clay, ceramic plates, iron, brass, soot, ash, ochre cloth, ember light. Lived-in and repaired.
Colour: keep to the attached master palette (art/style/palette.png, 160 colours: ochres, rust, brass, ember orange, clay; soot greys and iron blue-greys). Every pixel is snapped to it on import.
Do not paint glows, haze, light shafts, particles or text: the game adds them. No photographic detail, lens effects, neon or modern objects.
Light: warm key light from the fire named above, cool dim fill from the opposite side. Camera at eye level, stage-like three-quarter view; floor in the lower third to two-fifths.
Deliver: art/inbox/room-road.png, 1280×720 (or larger at 16:9), opaque, no people in it.
Composition: keep the layout of art/spec/ch2/road.jpg (attached): the walkable floor (green), the doorways and every outlined thing must stay where it is shown.
```

## Attach

- `art/STYLE.md` (the style bible) and `art/style/palette.png`
- `art/spec/ch2/road.jpg` (layout to keep)
- The current placeholder for reference: `art/src/ch2/rooms/road.png`

Then: `npm run art:import`, check `art/inbox/preview/room-road.png`, `npm run art:check`, and look at it in the game.
