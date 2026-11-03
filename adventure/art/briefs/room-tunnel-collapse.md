# room-tunnel-collapse

Status: **placeholder** · room · chapter ch2 · in the game as `art/src/ch2/rooms/tunnel-collapse.png`

## Prompt for Codex

```text
Draw for the game Cinderfold: A collapsed service tunnel under the ashways: a brick vault with pipes along the ceiling, a heap of fallen rubble filling the way back (left), wet stone floor with puddles, a dark opening at the far end (centre right) where a rusted grate stands (drawn separately, object grate).
Lighting: Very dark; one failing lamp (centre top) and the warm glow Mara carries; cold, damp shadows.
Style: painterly pixel art. Painted forms, worn materials and soft light falloff, finished as pixel art with crisp edges (no blur or haze around shapes) and a limited palette.
World: an industrial-fantasy village inside an old kiln: fired clay, ceramic plates, iron, brass, soot, ash, ochre cloth, ember light. Lived-in and repaired.
Colour: keep to the attached master palette (art/style/palette.png, 160 colours: ochres, rust, brass, ember orange, clay; soot greys and iron blue-greys). Every pixel is snapped to it on import.
Do not paint glows, haze, light shafts, particles or text: the game adds them. No photographic detail, lens effects, neon or modern objects.
Light: warm key light from the fire named above, cool dim fill from the opposite side. Camera at eye level, stage-like three-quarter view; floor in the lower third to two-fifths.
Deliver: art/inbox/room-tunnel-collapse.png, 1280×720 (or larger at 16:9), opaque, no people in it.
Composition: keep the layout of art/spec/ch2/tunnel-collapse.jpg (attached): the walkable floor (green), the doorways and every outlined thing must stay where it is shown.
```

## Attach

- `art/STYLE.md` (the style bible) and `art/style/palette.png`
- `art/spec/ch2/tunnel-collapse.jpg` (layout to keep)
- The current placeholder for reference: `art/src/ch2/rooms/tunnel-collapse.png`

Then: `npm run art:import`, check `art/inbox/preview/room-tunnel-collapse.png`, `npm run art:check`, and look at it in the game.
