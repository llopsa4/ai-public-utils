# room-workshop

Status: **placeholder** · room · chapter ch2 · in the game as `art/src/ch2/rooms/workshop.png`

## Prompt for Codex

```text
Draw for the game Cinderfold: Bryn's workshop inside the tempering house: a great ceramic return pipe across the top with a glowing flange (the reading valve), her bench with a glove and tools (left), a stool, a caged training rig in the middle, a coal crate, the open side on the right looking out over the valley, a curtain to the back room (left).
Lighting: Warm daylight from the open side (right); the pipe flanges glow orange; cooler shadow on the left under the bench.
Style: painterly pixel art. Painted forms, worn materials and soft light falloff, finished as pixel art with crisp edges (no blur or haze around shapes) and a limited palette.
World: an industrial-fantasy village inside an old kiln: fired clay, ceramic plates, iron, brass, soot, ash, ochre cloth, ember light. Lived-in and repaired.
Colour: keep to the attached master palette (art/style/palette.png, 160 colours: ochres, rust, brass, ember orange, clay; soot greys and iron blue-greys). Every pixel is snapped to it on import.
Do not paint glows, haze, light shafts, particles or text: the game adds them. No photographic detail, lens effects, neon or modern objects.
Light: warm key light from the fire named above, cool dim fill from the opposite side. Camera at eye level, stage-like three-quarter view; floor in the lower third to two-fifths.
Deliver: art/inbox/room-workshop.png, 1280×720 (or larger at 16:9), opaque, no people in it.
Composition: keep the layout of art/spec/ch2/workshop.jpg (attached): the walkable floor (green), the doorways and every outlined thing must stay where it is shown.
```

## Attach

- `art/STYLE.md` (the style bible) and `art/style/palette.png`
- `art/spec/ch2/workshop.jpg` (layout to keep)
- The current placeholder for reference: `art/src/ch2/rooms/workshop.png`

Then: `npm run art:import`, check `art/inbox/preview/room-workshop.png`, `npm run art:check`, and look at it in the game.
