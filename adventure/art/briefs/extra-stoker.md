# extra-stoker

Status: **placeholder** · extra · chapter ch1 · in the game as `art/src/characters/extra-stoker.png`

## Prompt for Codex

```text
Draw for the game Cinderfold: Hollis, the stoker: an older, broad worker with a cap and a shovel.
Style: painterly pixel art. Painted forms, worn materials and soft light falloff, finished as pixel art with crisp edges (no blur or haze around shapes) and a limited palette.
World: an industrial-fantasy village inside an old kiln: fired clay, ceramic plates, iron, brass, soot, ash, ochre cloth, ember light. Lived-in and repaired.
Colour: keep to the attached master palette (art/style/palette.png, 160 colours: ochres, rust, brass, ember orange, clay; soot greys and iron blue-greys). Every pixel is snapped to it on import.
Do not paint glows, haze, light shafts, particles or text: the game adds them. No photographic detail, lens effects, neon or modern objects.
Light: evenly lit with soft form shading and no strong cast light (the game lights it to match each room). Facing right in three-quarter view unless it is a flat icon.
Deliver a folder art/inbox/extra-stoker/ with layers as transparent PNGs on a 1024×1536 canvas: body.png (everything but the working arm) and arm.png (the working arm, a little overlap at the shoulder). Optional extra views: back.png, sit.png, lie.png.
Pose: full body, three-quarter view facing right, upright, arms relaxed, feet apart and both visible, feet on y ≈ 1500, head top at y ≈ 40. Face clearly lit, eyes open, mouth closed, neutral expression.
Scale in the game: 218 px tall at the front of a room (see art/style/scale.png).
```

## Attach

- `art/STYLE.md` (the style bible) and `art/style/palette.png`
- `art/style/scale.png` (heights)
- The current placeholder for reference: `art/src/characters/extra-stoker.png`

Then: `npm run art:import`, check `art/inbox/preview/extra-stoker.png`, `npm run art:check`, and look at it in the game.
