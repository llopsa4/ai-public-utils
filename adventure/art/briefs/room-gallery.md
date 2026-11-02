# room-gallery

Status: **placeholder** · room · chapter ch1 · in the game as `art/src/rooms/gallery.png`

## Prompt for Codex

```text
Draw for the game Cinderfold: The regulator gallery: huge ceramic pipes, the regulator housing with its ring in the middle, a pressure gauge, a lantern and a workbench with an open notebook; a railing and a wet metal floor on the right where people stand.
Lighting: Warm key light from the lantern (left) and the regulator's glow; cool, darker right side.
Style: painterly pixel art. Painted forms, worn materials and soft light falloff, finished as pixel art with crisp edges (no blur or haze around shapes) and a limited palette.
World: an industrial-fantasy village inside an old kiln: fired clay, ceramic plates, iron, brass, soot, ash, ochre cloth, ember light. Lived-in and repaired.
Colour: keep to the attached master palette (art/style/palette.png, 160 colours: ochres, rust, brass, ember orange, clay; soot greys and iron blue-greys). Every pixel is snapped to it on import.
Do not paint glows, haze, light shafts, particles or text: the game adds them. No photographic detail, lens effects, neon or modern objects.
Light: warm key light from the fire named above, cool dim fill from the opposite side. Camera at eye level, stage-like three-quarter view; floor in the lower third to two-fifths.
Deliver: art/inbox/room-gallery.png, 1280×720 (or larger at 16:9), opaque, no people in it.
Composition: keep the layout of art/spec/gallery.jpg (attached): the walkable floor (green), the doorways and every outlined thing must stay where it is shown.
```

## Attach

- `art/STYLE.md` (the style bible) and `art/style/palette.png`
- `art/spec/gallery.jpg` (layout to keep)
- The current placeholder for reference: `art/src/rooms/gallery.png`

Then: `npm run art:import`, check `art/inbox/preview/room-gallery.png`, `npm run art:check`, and look at it in the game.
