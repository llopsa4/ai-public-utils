# room-tent

Status: **placeholder** · room · chapter ch1 · in the game as `art/src/rooms/tent.png`

## Prompt for Codex

```text
Draw for the game Cinderfold: Mara's tent from inside, pixel art, seen side-on with very little perspective and believable proportions: a canvas back wall sagging between two poles under a ridge pole, seams and patches (a FINEST flour sack); his workbench along the left (tools on a board above it: wrench, handsaw, pliers, claw hammer, file; a tool roll, a candle, gloves, a glazed water jar; the charging cradle and the notebook stand on it), a crate and rope under it, a stool in front; the old brush drum, smaller, on a trestle against the back wall (centre, chalked PARTS); a coat on a hook on the right pole; a low cot with a blanket and laced boots along the right, Tobi's drawing pinned above; the door flap at the right edge open on the kiln hall's warm light; a striped rug on packed earth.
Lighting: Warm hanging lantern (centre top) as the main light, falling off into dark corners, soft cast shadows under everything; warm light from the door flap (right) across the floor.
Style: painterly pixel art. Painted forms, worn materials and soft light falloff, finished as pixel art with crisp edges (no blur or haze around shapes) and a limited palette.
World: an industrial-fantasy village inside an old kiln: fired clay, ceramic plates, iron, brass, soot, ash, ochre cloth, ember light. Lived-in and repaired.
Colour: keep to the attached master palette (art/style/palette.png, 160 colours: ochres, rust, brass, ember orange, clay; soot greys and iron blue-greys). Every pixel is snapped to it on import.
Do not paint glows, haze, light shafts, particles or text: the game adds them. No photographic detail, lens effects, neon or modern objects.
Light: warm key light from the fire named above, cool dim fill from the opposite side. Camera at eye level, stage-like three-quarter view; floor in the lower third to two-fifths.
Deliver: art/inbox/room-tent.png, 1280×720 (or larger at 16:9), opaque, no people in it.
Composition: keep the layout of art/spec/tent.jpg (attached): the walkable floor (green), the doorways and every outlined thing must stay where it is shown.
```

## Attach

- `art/STYLE.md` (the style bible) and `art/style/palette.png`
- `art/spec/tent.jpg` (layout to keep)
- The current placeholder for reference: `art/src/rooms/tent.png`

Then: `npm run art:import`, check `art/inbox/preview/room-tent.png`, `npm run art:check`, and look at it in the game.
