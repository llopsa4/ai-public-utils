# rack

Status: **final** · object · chapter ch1 · in the game as `art/src/objects/rack.png`

## What the game does with it

Stands in the room `tent` on its foot point (344, 394) (bottom centre of the picture); it shows "empty" or "full" as the story moves on.
States: full, empty: one picture each, identical framing; only what changes between states differs.

## Technical

- Files: `art/inbox/rack-full.png`, `art/inbox/rack-empty.png`: transparent (or on flat magenta #FF00FF), the thing standing on the bottom edge.
- Fitted into a 56×72 art-pixel frame (true proportion to Mara at 232), reduced to the 4-pixel grid, outlined.

## Prompt for Codex

```text
Draw for the game Cinderfold: The charging cradle on Mara's workbench: a small brass frame like a lantern without glass, on a square wooden base, that holds the gauntlet's ember cell. full: a round ember cell of dark glass in the frame, glowing orange; empty: the frame alone, its clips open.
Style: detailed pixel art matching tent-reference.png (attached): hand-placed pixels, clean readable shapes, crisp edges (no blur or anti-aliased haze), worn lived-in materials (patched canvas, scuffed wood with iron corner plates, brass, glazed clay, soot and ash). It is reduced to a 4-pixel grid on import, so use big clear shapes and flat colour areas.
World: an industrial-fantasy village inside an old kiln and the ash country around it: fired clay, cream ceramic plates, iron, brass, soot, ochre cloth, ember light. Everything used and repaired, nothing shiny or new, no modern objects.
Colour: keep to the attached master palette (art/style/palette.png, 160 colours: ochre, rust, brass, ember orange, clay, warm browns; soot greys and iron blue-greys). Every pixel is snapped to it on import.
Never: text or letters in the picture, people in rooms, perspective, lens effects, neon, painted glow pools, light shafts, haze or particles (the game adds light and effects).
Proportions: true to the cast (art/style/scale.png): Mara is 232 px, a doorway about 328, a table top 104, a chair seat 48.
Light: evenly lit with soft form shading and no strong cast light (the game lights it to match the room).
Files: art/inbox/rack-full.png, art/inbox/rack-empty.png: transparent (or on flat magenta #FF00FF), the thing standing on the bottom edge.
Fitted into a 56×72 art-pixel frame (true proportion to Mara at 232), reduced to the 4-pixel grid, outlined.
```

## Attach

- `tent-reference.png` (the look to match), `art/STYLE.md`, `art/style/palette.png`, `art/style/scale.png`

## Then

`npm run art:import`, look at `art/inbox/preview/rack.png`, `npm run art:check`.
