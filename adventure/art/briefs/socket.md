# socket

Status: **placeholder** · object · chapter ch1 · in the game as `art/src/objects/socket.png`

## Prompt for Codex

```text
Draw for the game Cinderfold: The regulator ring in its socket (installed; removed: an empty hollow).
Style: painterly pixel art. Painted forms, worn materials and soft light falloff, finished as pixel art with crisp edges (no blur or haze around shapes) and a limited palette.
World: an industrial-fantasy village inside an old kiln: fired clay, ceramic plates, iron, brass, soot, ash, ochre cloth, ember light. Lived-in and repaired.
Colour: keep to the attached master palette (art/style/palette.png, 160 colours: ochres, rust, brass, ember orange, clay; soot greys and iron blue-greys). Every pixel is snapped to it on import.
Do not paint glows, haze, light shafts, particles or text: the game adds them. No photographic detail, lens effects, neon or modern objects.
Light: evenly lit with soft form shading and no strong cast light (the game lights it to match each room). Facing right in three-quarter view unless it is a flat icon.
Deliver one image per state, each a transparent PNG standing on its bottom edge: art/inbox/socket-installed.png, art/inbox/socket-removed.png.
Same size, position and framing in every state; only what changes between states differs.
```

## Attach

- `art/STYLE.md` (the style bible) and `art/style/palette.png`
- The current placeholder for reference: `art/src/objects/socket.png`

Then: `npm run art:import`, check `art/inbox/preview/socket.png`, `npm run art:check`, and look at it in the game.
