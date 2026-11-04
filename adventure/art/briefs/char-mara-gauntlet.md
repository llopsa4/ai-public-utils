# char-mara-gauntlet

Status: **placeholder** · character · chapter game · in the game as `art/src/characters/mara-gauntlet.png`

## What the game does with it

Mara is the player's character: he walks every room, crouches, lies down, talks (the rig animates this one drawing).
In the game 232 art pixels tall (116 pixels on the people's 2-pixel grid; the face is only a dozen pixels): design for that size, with a clear silhouette, a distinctive head and colours that tell them apart from everyone else in the cast.

## Technical

- Folder: `art/inbox/char-mara-gauntlet/` with `body.png` (everything but the working arm) and `arm.png` (the working arm, a little overlap at the shoulder), transparent (or flat magenta), both 1024×1536 on the same canvas; optional `back.png`, `sit.png`, `lie.png`.
- Pose: full body facing right in a slight three-quarter turn, upright, arms relaxed, feet apart and both visible, feet on y ≈ 1500, head top at y ≈ 40. Face lit, eyes open, mouth closed, neutral.

## Prompt for Codex

```text
Draw for the game Cinderfold: Mara, the courier (he/him), about 22: the tallest of the cast but lean and long-limbed, a runner's build. Warm brown skin, short dark-brown hair swept back and a little unruly, a light stubble, hazel eyes, a determined, slightly tired face. An ochre wool scarf wrapped twice round his neck, its long end thrown over his left shoulder like a short cloak. Cream-white fired-ceramic armour plates (chest, shoulders, forearms, shins), chipped and patched, laced over dark brown leather. A worn leather satchel on his left hip. Dark work trousers with ceramic knee plates, patched at the knees; brown leather courier boots with brass buckles. His mother's pressure gauntlet on his right forearm and hand, oversized: a clenched fist of massive cream-ceramic knuckles, thick riveted brass reinforcements, a broad cuff and a pressure pipe along the forearm, the fist reaching down towards his knee; a round ember-cell housing on the back of the hand (unlit: dull dark red glass). Keep to Codex's pilot design (art/inbox/reference/gauntlet-closed-v2/mara-master.png). The same Mara (identical drawing), with the gauntlet's ember cell lit: the glass on the back of the hand glowing orange, the seams of the gauntlet faintly warm.
Style: detailed pixel art matching tent-reference.png (attached): hand-placed pixels, clean readable shapes, crisp edges (no blur or anti-aliased haze), worn lived-in materials (patched canvas, scuffed wood with iron corner plates, brass, glazed clay, soot and ash). It is reduced to a 4-pixel grid on import, so use big clear shapes and flat colour areas.
World: an industrial-fantasy village inside an old kiln and the ash country around it: fired clay, cream ceramic plates, iron, brass, soot, ochre cloth, ember light. Everything used and repaired, nothing shiny or new, no modern objects.
Colour: keep to the attached master palette (art/style/palette.png, 160 colours: ochre, rust, brass, ember orange, clay, warm browns; soot greys and iron blue-greys). Every pixel is snapped to it on import.
Never: text or letters in the picture, people in rooms, perspective, lens effects, neon, painted glow pools, light shafts, haze or particles (the game adds light and effects).
Proportions: true to the cast (art/style/scale.png): Mara is 232 px, a doorway about 328, a table top 104, a chair seat 48.
Light: evenly lit with soft form shading and no strong cast light (the game lights it to match the room).
Facing right in a slight three-quarter turn (the game mirrors it to face left).
Folder: art/inbox/char-mara-gauntlet/ with body.png (everything but the working arm) and arm.png (the working arm, a little overlap at the shoulder), transparent (or flat magenta), both 1024×1536 on the same canvas; optional back.png, sit.png, lie.png.
Pose: full body facing right in a slight three-quarter turn, upright, arms relaxed, feet apart and both visible, feet on y ≈ 1500, head top at y ≈ 40. Face lit, eyes open, mouth closed, neutral.
```

## Attach

- `tent-reference.png` (the look to match), `art/STYLE.md`, `art/style/palette.png`, `art/style/scale.png`

## Then

`npm run art:import`, look at `art/inbox/preview/char-mara-gauntlet.png`, `npm run art:check`.

After import its layers are in `art/sources/characters/`: the joints and face are measured once in `art/manifest.mjs` (RIGS), then `npm run rig` (this step is for Claude, not Codex).
