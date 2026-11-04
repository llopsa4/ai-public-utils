# extra-merchant

Status: **placeholder** · extra · chapter ch1 · in the game as `art/src/characters/extra-merchant.png`

## What the game does with it

A background person in: ashways (walks about, works, now and then says a line).
In the game 214 art pixels tall (107 pixels on the people's 2-pixel grid; the face is only a dozen pixels): design for that size, with a clear silhouette, a distinctive head and colours that tell them apart from everyone else in the cast.

## Technical

- Folder: `art/inbox/extra-merchant/` with `body.png` (everything but the working arm) and `arm.png` (the working arm, a little overlap at the shoulder), transparent (or flat magenta), both 1024×1536 on the same canvas; optional `back.png`, `sit.png`, `lie.png`.
- Pose: full body facing right in a slight three-quarter turn, upright, arms relaxed, feet apart and both visible, feet on y ≈ 1500, head top at y ≈ 40. Face lit, eyes open, mouth closed, neutral.

## Prompt for Codex

```text
Draw for the game Cinderfold: Corvin, the travelling peddler, about 50: lanky, of middling height, stooping a little under his load. Olive skin, a long black beard streaked with grey. A deep plum-brown hooded coat with many patch pockets, a wooden backpack frame hung with small corked bottles of ember-orange Kiln Tonic that clink, fingerless gloves.
Style: detailed pixel art matching tent-reference.png (attached): hand-placed pixels, clean readable shapes, crisp edges (no blur or anti-aliased haze), worn lived-in materials (patched canvas, scuffed wood with iron corner plates, brass, glazed clay, soot and ash). It is reduced to a 4-pixel grid on import, so use big clear shapes and flat colour areas.
World: an industrial-fantasy village inside an old kiln and the ash country around it: fired clay, cream ceramic plates, iron, brass, soot, ochre cloth, ember light. Everything used and repaired, nothing shiny or new, no modern objects.
Colour: keep to the attached master palette (art/style/palette.png, 160 colours: ochre, rust, brass, ember orange, clay, warm browns; soot greys and iron blue-greys). Every pixel is snapped to it on import.
Never: text or letters in the picture, people in rooms, perspective, lens effects, neon, painted glow pools, light shafts, haze or particles (the game adds light and effects).
Proportions: true to the cast (art/style/scale.png): Mara is 232 px, a doorway about 328, a table top 104, a chair seat 48.
Light: evenly lit with soft form shading and no strong cast light (the game lights it to match the room).
Facing right in a slight three-quarter turn (the game mirrors it to face left).
Folder: art/inbox/extra-merchant/ with body.png (everything but the working arm) and arm.png (the working arm, a little overlap at the shoulder), transparent (or flat magenta), both 1024×1536 on the same canvas; optional back.png, sit.png, lie.png.
Pose: full body facing right in a slight three-quarter turn, upright, arms relaxed, feet apart and both visible, feet on y ≈ 1500, head top at y ≈ 40. Face lit, eyes open, mouth closed, neutral.
```

## Attach

- `tent-reference.png` (the look to match), `art/STYLE.md`, `art/style/palette.png`, `art/style/scale.png`

## Then

`npm run art:import`, look at `art/inbox/preview/extra-merchant.png`, `npm run art:check`.

After import its layers are in `art/sources/characters/`: the joints and face are measured once in `art/manifest.mjs` (RIGS), then `npm run rig` (this step is for Claude, not Codex).
