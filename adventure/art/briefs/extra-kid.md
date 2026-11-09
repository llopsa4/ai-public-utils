# extra-kid

Status: **placeholder** · extra · chapter ch1 · in the game as `art/src/characters/extra-kid.png`

## What the game does with it

A background person in: firingHouse (walks about, works, now and then says a line).
In the game 146 art pixels tall (73 pixels on the 2-pixel grid; the face is only a couple of dozen pixels): design for that size, with a clear silhouette, a distinctive head and colours that tell them apart from everyone else in the cast.

## Technical

- Folder: `art/inbox/extra-kid/` with four required pictures, transparent (or flat magenta): `body.png` (standing, everything but the working arm) and `arm.png` (the working arm, a little overlap at the shoulder), both 1024×1536 on the same canvas; `kneel.png` (the whole figure down on one knee, facing right, as when looking at something low; 1024×1536, the same scale, knee and foot on y ≈ 1500); `lie.png` (the whole figure lying on the back, head to the right, eyes closed; 1536×1024 landscape, the same scale, lying on y ≈ 990); and `sit.png` if they sit at work (the same canvas as body.png).
- Pose: full body facing right in a slight three-quarter turn, upright, arms relaxed, feet apart and both visible, feet on y ≈ 1500 (a child: about 63% of an adult's height on the same feet line). Face lit, eyes open, mouth closed, neutral.

## Prompt for Codex

```text
Draw for the game The Rift: Ashlands: Bea, a little girl of about 8 (a little shorter than Pip): round face, dark skin, her hair in two puffy buns. An oversized cream knitted cardigan over a red smock, bare knees, sandals. She carries a wooden board as a toy shield, painted with a kiln sun.
Style: detailed pixel art matching tent-reference.png (attached): hand-placed pixels, clean readable shapes, crisp edges (no blur or anti-aliased haze), worn lived-in materials (patched canvas, scuffed wood with iron corner plates, brass, glazed clay, soot and ash). It is reduced to a 2-pixel grid on import (a room becomes 640×360 pixels), so use clear shapes and flat colour areas.
World: the Ashlands, an industrial-fantasy land: kiln villages of fired clay and cream ceramic plates in the ash country, and Ironhaven, a hard city of iron, stone and snow; brass, soot, ochre cloth, ember light. Everything used and repaired, nothing shiny or new, no modern objects.
Colour: keep to the attached master palette (art/style/palette.png, 160 colours: ochre, rust, brass, ember orange, clay, warm browns; soot greys and iron blue-greys). Every pixel is snapped to it on import.
Never: text or letters in the picture, people in rooms, perspective, lens effects, neon, painted glow pools, light shafts, haze or particles (the game adds light and effects).
Proportions: true to the cast (art/style/scale.png): Mara is 232 px, a doorway about 328, a table top 104, a chair seat 48.
Light: evenly lit with soft form shading and no strong cast light (the game lights it to match the room).
Facing right in a slight three-quarter turn (the game mirrors it to face left).
Folder: art/inbox/extra-kid/ with four required pictures, transparent (or flat magenta): body.png (standing, everything but the working arm) and arm.png (the working arm, a little overlap at the shoulder), both 1024×1536 on the same canvas; kneel.png (the whole figure down on one knee, facing right, as when looking at something low; 1024×1536, the same scale, knee and foot on y ≈ 1500); lie.png (the whole figure lying on the back, head to the right, eyes closed; 1536×1024 landscape, the same scale, lying on y ≈ 990); and sit.png if they sit at work (the same canvas as body.png).
Pose: full body facing right in a slight three-quarter turn, upright, arms relaxed, feet apart and both visible, feet on y ≈ 1500 (a child: about 63% of an adult's height on the same feet line). Face lit, eyes open, mouth closed, neutral.
```

## Attach

- `tent-reference.png` (the look to match), `art/STYLE.md`, `art/style/palette.png`, `art/style/scale.png`

## Then

`npm run art:import`, look at `art/inbox/preview/extra-kid.png`, `npm run art:check`.

After import its layers are in `art/sources/characters/`: the joints and face are measured once in `art/manifest.mjs` (RIGS), then `npm run rig` (this step is for Claude, not Codex).
