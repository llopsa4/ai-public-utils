# room-tunnel-mouth

Status: **placeholder** · room · chapter ch2 · in the game as `art/src/ch2/rooms/tunnel-mouth.png`

## Prompt for Codex

```text
Draw for the game Cinderfold: The mouth of the service tunnels at dawn, chapter 2's calm start: the ash road behind and a pale pink-gold dawn sky (left), a long pipe lying along the ground that makes a bench (centre), the brick arch of service line 4 with an iron name plate above and a lit lamp beside it (right), dark inside.
Lighting: Soft dawn light from the left; the lamp by the arch warm; the arch itself black.
Style: painterly pixel art. Painted forms, worn materials and soft light falloff, finished as pixel art with crisp edges (no blur or haze around shapes) and a limited palette.
World: an industrial-fantasy village inside an old kiln: fired clay, ceramic plates, iron, brass, soot, ash, ochre cloth, ember light. Lived-in and repaired.
Colour: keep to the attached master palette (art/style/palette.png, 160 colours: ochres, rust, brass, ember orange, clay; soot greys and iron blue-greys). Every pixel is snapped to it on import.
Do not paint glows, haze, light shafts, particles or text: the game adds them. No photographic detail, lens effects, neon or modern objects.
Light: warm key light from the fire named above, cool dim fill from the opposite side. Camera at eye level, stage-like three-quarter view; floor in the lower third to two-fifths.
Deliver: art/inbox/room-tunnel-mouth.png, 1280×720 (or larger at 16:9), opaque, no people in it.
Composition: keep the layout of art/spec/ch2/tunnel-mouth.jpg (attached): the walkable floor (green), the doorways and every outlined thing must stay where it is shown.
```

## Attach

- `art/STYLE.md` (the style bible) and `art/style/palette.png`
- `art/spec/ch2/tunnel-mouth.jpg` (layout to keep)
- The current placeholder for reference: `art/src/ch2/rooms/tunnel-mouth.png`

Then: `npm run art:import`, check `art/inbox/preview/room-tunnel-mouth.png`, `npm run art:check`, and look at it in the game.
