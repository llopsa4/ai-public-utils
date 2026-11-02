# battle-hero

Status: **placeholder** · battle-portrait · chapter game · in the game as `art/src/kc/hero.webp`

## Prompt for Codex

```text
Draw for the game Cinderfold: Mara, full body, standing ready to fight (the fight screen's hero art, larger than the room sprite).
Style: painterly pixel art. Painted forms, worn materials and soft light falloff, finished as pixel art with crisp edges (no blur or haze around shapes) and a limited palette.
World: an industrial-fantasy village inside an old kiln: fired clay, ceramic plates, iron, brass, soot, ash, ochre cloth, ember light. Lived-in and repaired.
Colour: keep to the attached master palette (art/style/palette.png, 160 colours: ochres, rust, brass, ember orange, clay; soot greys and iron blue-greys). Every pixel is snapped to it on import.
Do not paint glows, haze, light shafts, particles or text: the game adds them. No photographic detail, lens effects, neon or modern objects.
Light: evenly lit with soft form shading and no strong cast light (the game lights it to match each room). Facing right in three-quarter view unless it is a flat icon.
Deliver: art/inbox/battle-hero.png, transparent, standing on the bottom edge, about 512 px wide.
```

## Attach

- `art/STYLE.md` (the style bible) and `art/style/palette.png`
- The current placeholder for reference: `art/src/kc/hero.webp`

Then: `npm run art:import`, check `art/inbox/preview/battle-hero.png`, `npm run art:check`, and look at it in the game.
