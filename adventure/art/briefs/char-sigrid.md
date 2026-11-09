# char-sigrid

Status: **placeholder** · character · chapter intro · in the game as `art/src/intro/characters/sigrid.png`

## What the game does with it

Appears in: outerDoor.
In the game 226 art pixels tall (113 pixels on the 2-pixel grid; the face is only a couple of dozen pixels): design for that size, with a clear silhouette, a distinctive head and colours that tell them apart from everyone else in the cast.

## Technical

- Folder: `art/inbox/char-sigrid/` with four required pictures, transparent (or flat magenta): `body.png` (standing, everything but the working arm) and `arm.png` (the working arm, a little overlap at the shoulder), both 1024×1536 on the same canvas; `kneel.png` (the whole figure down on one knee, facing right, as when looking at something low; 1024×1536, the same scale, knee and foot on y ≈ 1500); `lie.png` (the whole figure lying on the back, head to the right, eyes closed; 1536×1024 landscape, the same scale, lying on y ≈ 990).
- Pose: full body facing right in a slight three-quarter turn, upright, arms relaxed, feet apart and both visible, feet on y ≈ 1500, head top at y ≈ 40. Face lit, eyes open, mouth closed, neutral.

## Prompt for Codex

```text
Draw for the game Cinderfold: Captain Sigrid of Ironhaven (she/her), about 35: tall, straight-backed, composed. Fair skin reddened by the cold, pale blonde hair in a tight braid coiled at the nape, grey watchful eyes, a thin scar along her jaw. A long dark-blue officer's greatcoat with brass buttons and a fur collar dusted with snow, black gloves, a sabre at her hip, tall black boots.
Style: detailed pixel art matching tent-reference.png (attached): hand-placed pixels, clean readable shapes, crisp edges (no blur or anti-aliased haze), worn lived-in materials (patched canvas, scuffed wood with iron corner plates, brass, glazed clay, soot and ash). It is reduced to a 2-pixel grid on import (a room becomes 640×360 pixels), so use clear shapes and flat colour areas.
World: an industrial-fantasy village inside an old kiln and the ash country around it: fired clay, cream ceramic plates, iron, brass, soot, ochre cloth, ember light. Everything used and repaired, nothing shiny or new, no modern objects.
Colour: keep to the attached master palette (art/style/palette.png, 160 colours: ochre, rust, brass, ember orange, clay, warm browns; soot greys and iron blue-greys). Every pixel is snapped to it on import.
Never: text or letters in the picture, people in rooms, perspective, lens effects, neon, painted glow pools, light shafts, haze or particles (the game adds light and effects).
Proportions: true to the cast (art/style/scale.png): Mara is 232 px, a doorway about 328, a table top 104, a chair seat 48.
Light: evenly lit with soft form shading and no strong cast light (the game lights it to match the room).
Facing right in a slight three-quarter turn (the game mirrors it to face left).
Folder: art/inbox/char-sigrid/ with four required pictures, transparent (or flat magenta): body.png (standing, everything but the working arm) and arm.png (the working arm, a little overlap at the shoulder), both 1024×1536 on the same canvas; kneel.png (the whole figure down on one knee, facing right, as when looking at something low; 1024×1536, the same scale, knee and foot on y ≈ 1500); lie.png (the whole figure lying on the back, head to the right, eyes closed; 1536×1024 landscape, the same scale, lying on y ≈ 990).
Pose: full body facing right in a slight three-quarter turn, upright, arms relaxed, feet apart and both visible, feet on y ≈ 1500, head top at y ≈ 40. Face lit, eyes open, mouth closed, neutral.
```

## Attach

- `tent-reference.png` (the look to match), `art/STYLE.md`, `art/style/palette.png`, `art/style/scale.png`

## Then

`npm run art:import`, look at `art/inbox/preview/char-sigrid.png`, `npm run art:check`.

After import its layers are in `art/sources/characters/`: the joints and face are measured once in `art/manifest.mjs` (RIGS), then `npm run rig` (this step is for Claude, not Codex).
