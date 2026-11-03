# battle-backdrop-workshop

Status: **placeholder** · battle-backdrop · chapter ch2 · in the game as `art/src/kc/tempering-house.webp`

## Prompt for Codex

```text
Draw for the game Cinderfold: Bryn's workshop as the sparring backdrop (same place as room-workshop, the floor clear in the lower third).
Style: painterly pixel art. Painted forms, worn materials and soft light falloff, finished as pixel art with crisp edges (no blur or haze around shapes) and a limited palette.
World: an industrial-fantasy village inside an old kiln: fired clay, ceramic plates, iron, brass, soot, ash, ochre cloth, ember light. Lived-in and repaired.
Colour: keep to the attached master palette (art/style/palette.png, 160 colours: ochres, rust, brass, ember orange, clay; soot greys and iron blue-greys). Every pixel is snapped to it on import.
Do not paint glows, haze, light shafts, particles or text: the game adds them. No photographic detail, lens effects, neon or modern objects.
Light: warm key light from the fire named above, cool dim fill from the opposite side. Camera at eye level, stage-like three-quarter view; floor in the lower third to two-fifths.
Deliver: art/inbox/battle-backdrop-workshop.png, 1280×720, opaque; the floor clear in the lower third (the fighters stand there).
```

## Attach

- `art/STYLE.md` (the style bible) and `art/style/palette.png`
- The current placeholder for reference: `art/src/kc/tempering-house.webp`

Then: `npm run art:import`, check `art/inbox/preview/battle-backdrop-workshop.png`, `npm run art:check`, and look at it in the game.
