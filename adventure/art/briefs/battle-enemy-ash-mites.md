# battle-enemy-ash-mites

Status: **placeholder** · battle-portrait · chapter ch2 · in the game as `art/src/ch2/creatures/ash-mites.webp`

## Prompt for Codex

```text
Draw for the game Cinderfold: Ash Mite Swarm: a cluster of grey, spiny, six-legged mites the size of fists, ember-orange eyes, half sunk in ash. For the fight screen: facing left, a picture 768 tall with the creature exactly 60% of that height, standing 4% above the bottom edge, as wide as it needs, transparent background.
Style: painterly pixel art. Painted forms, worn materials and soft light falloff, finished as pixel art with crisp edges (no blur or haze around shapes) and a limited palette.
World: an industrial-fantasy village inside an old kiln: fired clay, ceramic plates, iron, brass, soot, ash, ochre cloth, ember light. Lived-in and repaired.
Colour: keep to the attached master palette (art/style/palette.png, 160 colours: ochres, rust, brass, ember orange, clay; soot greys and iron blue-greys). Every pixel is snapped to it on import.
Do not paint glows, haze, light shafts, particles or text: the game adds them. No photographic detail, lens effects, neon or modern objects.
Light: evenly lit with soft form shading and no strong cast light (the game lights it to match each room). Facing right in three-quarter view unless it is a flat icon.
Deliver: art/inbox/battle-enemy-ash-mites.png, transparent, standing on the bottom edge, about undefined px wide.
```

## Attach

- `art/STYLE.md` (the style bible) and `art/style/palette.png`
- The current placeholder for reference: `art/src/ch2/creatures/ash-mites.webp`

Then: `npm run art:import`, check `art/inbox/preview/battle-enemy-ash-mites.png`, `npm run art:check`, and look at it in the game.
