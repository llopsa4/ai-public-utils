# room-mara

Status: **placeholder** · room · chapter ch1 · in the game as `art/src/rooms/mara-room.png`

## Prompt for Codex

```text
Draw for the game Cinderfold: The kiln hall: a vast vaulted hall built inside an old kiln, the glowing kiln mouths across the back, a pulley hoist (left), storage jars, an ash cart, the curtain to the firing house (right), and the spot where Mara's tent stands.
Lighting: Key light from the three kiln mouths at the back (orange); cool dim fill from the left; the vault fades to darkness above.
Style: painterly pixel art. Painted forms, worn materials and soft light falloff, finished as pixel art with crisp edges (no blur or haze around shapes) and a limited palette.
World: an industrial-fantasy village inside an old kiln: fired clay, ceramic plates, iron, brass, soot, ash, ochre cloth, ember light. Lived-in and repaired.
Colour: keep to the attached master palette (art/style/palette.png, 160 colours: ochres, rust, brass, ember orange, clay; soot greys and iron blue-greys). Every pixel is snapped to it on import.
Do not paint glows, haze, light shafts, particles or text: the game adds them. No photographic detail, lens effects, neon or modern objects.
Light: warm key light from the fire named above, cool dim fill from the opposite side. Camera at eye level, stage-like three-quarter view; floor in the lower third to two-fifths.
Deliver: art/inbox/room-mara.png, 1280×720 (or larger at 16:9), opaque, no people in it.
Composition: keep the layout of art/spec/mara-room.jpg (attached): the walkable floor (green), the doorways and every outlined thing must stay where it is shown.
```

## Attach

- `art/STYLE.md` (the style bible) and `art/style/palette.png`
- `art/spec/mara-room.jpg` (layout to keep)
- The current placeholder for reference: `art/src/rooms/mara-room.png`

Then: `npm run art:import`, check `art/inbox/preview/room-mara.png`, `npm run art:check`, and look at it in the game.
