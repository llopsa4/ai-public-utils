# silas-nearBoot

Status: **requested** · pack · chapter intro · kept in `art/sources/characters/silas-layered/nearBoot.png`

## What the game does with it

Phase 2 of Silas's articulated pack (art/LAYERED-RIG.md), made from the approved Phase 1 master: the game rigs his walk, kneeling and lying from these pieces (as for Mara), and draws his masks over him in every pose.

## Technical

- File: `art/inbox/silas-layered/nearBoot.png`.
- On a 1024x1536 transparent canvas (or flat magenta #FF00FF), exactly the canvas, scale and position of the approved master.png (soles on y 1500).
- Exactly where it sits in master.png (same coordinates). Layer order, back to front: farUpperArm, farForearm, farThigh, farShin, farBoot, nearThigh, nearShin, nearBoot, torso, nearUpperArm, nearForearm. Stacked in that order on a neutral background the eleven layers must reproduce master.png pixel for pixel.
- Extend the piece about 25 px past each joint with a rounded end drawn as the hidden part would look (cloth folding round an elbow or knee), lying under the neighbouring layer so the stack still matches master.png exactly, and the joint never shows a gap when it bends.
- Match Mara's layers: art/sources/characters/mara-casual-layered/nearBoot.png.

## Prompt for Codex

```text
Draw for the game The Rift: Ashlands: Silas's the near boot, ankle to toe, cut from the approved master.png.
Style: detailed pixel art matching tent-reference.png (attached): hand-placed pixels, clean readable shapes, crisp edges (no blur or anti-aliased haze), worn lived-in materials (patched canvas, scuffed wood with iron corner plates, brass, glazed clay, soot and ash). It is reduced to a 2-pixel grid on import (a room becomes 640×360 pixels), so use clear shapes and flat colour areas.
World: the Ashlands, an industrial-fantasy land: kiln villages of fired clay and cream ceramic plates in the ash country, and Ironhaven, a hard city of iron, stone and snow; brass, soot, ochre cloth, ember light. Everything used and repaired, nothing shiny or new, no modern objects.
Colour: keep to the attached master palette (art/style/palette.png, 160 colours: ochre, rust, brass, ember orange, clay, warm browns; soot greys and iron blue-greys). Every pixel is snapped to it on import.
Never: text or letters in the picture, people in rooms, perspective, lens effects, neon, painted glow pools, light shafts, haze or particles (the game adds light and effects).
Proportions: true to the cast (art/style/scale.png): Mara is 232 px, a doorway about 328, a table top 104, a chair seat 48.
Light: evenly lit with soft form shading and no strong cast light (the game lights it to match the room).
Facing right (the game mirrors it to face left). Same look as Mara's pack: the same line, shading, pixel density and palette.
File: art/inbox/silas-layered/nearBoot.png.
On a 1024x1536 transparent canvas (or flat magenta #FF00FF), exactly the canvas, scale and position of the approved master.png (soles on y 1500).
Exactly where it sits in master.png (same coordinates). Layer order, back to front: farUpperArm, farForearm, farThigh, farShin, farBoot, nearThigh, nearShin, nearBoot, torso, nearUpperArm, nearForearm. Stacked in that order on a neutral background the eleven layers must reproduce master.png pixel for pixel.
Extend the piece about 25 px past each joint with a rounded end drawn as the hidden part would look (cloth folding round an elbow or knee), lying under the neighbouring layer so the stack still matches master.png exactly, and the joint never shows a gap when it bends.
Match Mara's layers: art/sources/characters/mara-casual-layered/nearBoot.png.
```

## Attach

- `tent-reference.png` (the look to match), `art/STYLE.md`, `art/style/palette.png`, `art/style/scale.png`
- `art/sources/characters/mara-casual-layered/` (Mara's pack: the format to match, piece by piece) and `art/LAYERED-RIG.md` (the pack contract)
- the approved Phase 1 pictures: `art/inbox/silas-layered/master.png` and `idle.png`

## Then

Save it as `art/inbox/silas-layered/nearBoot.png`. Do **not** run `npm run art:import` for this folder: Claude brings it into `art/sources/characters/silas-layered/`, measures its joints (rig.json) and rigs it. Report which pieces are in.
