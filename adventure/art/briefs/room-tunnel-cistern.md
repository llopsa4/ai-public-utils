# room-tunnel-cistern

Status: **placeholder** · room · chapter ch2 · in the game as `art/src/ch2/rooms/tunnel-cistern.png`

## Prompt for Codex

```text
Draw for the game Cinderfold: An ash cistern: a dark pit across the floor (centre), a far ledge (right) with grey daylight from the road beyond, a pulley over the pit with the counterweight rope running down to a cleat on the near side (left of the pit). The drawbridge and the nest basket are drawn separately (objects bridge, basket).
Lighting: Very dark on the near side (one lamp, left, and Mara's glow); pale daylight on the far ledge.
Style: painterly pixel art. Painted forms, worn materials and soft light falloff, finished as pixel art with crisp edges (no blur or haze around shapes) and a limited palette.
World: an industrial-fantasy village inside an old kiln: fired clay, ceramic plates, iron, brass, soot, ash, ochre cloth, ember light. Lived-in and repaired.
Colour: keep to the attached master palette (art/style/palette.png, 160 colours: ochres, rust, brass, ember orange, clay; soot greys and iron blue-greys). Every pixel is snapped to it on import.
Do not paint glows, haze, light shafts, particles or text: the game adds them. No photographic detail, lens effects, neon or modern objects.
Light: warm key light from the fire named above, cool dim fill from the opposite side. Camera at eye level, stage-like three-quarter view; floor in the lower third to two-fifths.
Deliver: art/inbox/room-tunnel-cistern.png, 1280×720 (or larger at 16:9), opaque, no people in it.
Composition: keep the layout of art/spec/ch2/tunnel-cistern.jpg (attached): the walkable floor (green), the doorways and every outlined thing must stay where it is shown.
```

## Attach

- `art/STYLE.md` (the style bible) and `art/style/palette.png`
- `art/spec/ch2/tunnel-cistern.jpg` (layout to keep)
- The current placeholder for reference: `art/src/ch2/rooms/tunnel-cistern.png`

Then: `npm run art:import`, check `art/inbox/preview/room-tunnel-cistern.png`, `npm run art:check`, and look at it in the game.
