# silas-mask-harrow-stand

Status: **requested** · pack · chapter intro · kept in `art/sources/characters/silas-layered/mask-harrow-stand.png`

## What the game does with it

Phase 2 of Silas's articulated pack (art/LAYERED-RIG.md), made from the approved Phase 1 master: the game rigs his walk, kneeling and lying from these pieces (as for Mara), and draws his masks over him in every pose.

## Technical

- File: `art/inbox/silas-layered/mask-harrow-stand.png`.
- On the 1024x1536 canvas of master.png, exactly over his face there.
- Transparent everywhere else: the game draws it on top of Silas in this pose.

## Prompt for Codex

```text
Draw for the game The Rift: Ashlands: Silas wearing the Harrow mask: the same body, but his face is covered by a crude moulded mask of grey plaster-and-bread, Sergeant Harrow's face (heavy jaw, pouched eyes, a bristling broom moustache made of Silas's own hair), with brass frame rivets showing at the temples. A borrowed dark sergeant's air in the posture. Only the mask itself, on its own layer: the grey plaster-and-bread face with Harrow's heavy jaw, pouched eyes and broom moustache of Silas's hair, the brass frame's rivets at the temples; nothing else of Silas.
Style: detailed pixel art matching tent-reference.png (attached): hand-placed pixels, clean readable shapes, crisp edges (no blur or anti-aliased haze), worn lived-in materials (patched canvas, scuffed wood with iron corner plates, brass, glazed clay, soot and ash). It is reduced to a 2-pixel grid on import (a room becomes 640×360 pixels), so use clear shapes and flat colour areas.
World: the Ashlands, an industrial-fantasy land: kiln villages of fired clay and cream ceramic plates in the ash country, and Ironhaven, a hard city of iron, stone and snow; brass, soot, ochre cloth, ember light. Everything used and repaired, nothing shiny or new, no modern objects.
Colour: keep to the attached master palette (art/style/palette.png, 160 colours: ochre, rust, brass, ember orange, clay, warm browns; soot greys and iron blue-greys). Every pixel is snapped to it on import.
Never: text or letters in the picture, people in rooms, perspective, lens effects, neon, painted glow pools, light shafts, haze or particles (the game adds light and effects).
Proportions: true to the cast (art/style/scale.png): Mara is 232 px, a doorway about 328, a table top 104, a chair seat 48.
Light: evenly lit with soft form shading and no strong cast light (the game lights it to match the room).
Facing right (the game mirrors it to face left). Same look as Mara's pack: the same line, shading, pixel density and palette.
File: art/inbox/silas-layered/mask-harrow-stand.png.
On the 1024x1536 canvas of master.png, exactly over his face there.
Transparent everywhere else: the game draws it on top of Silas in this pose.
```

## Attach

- `tent-reference.png` (the look to match), `art/STYLE.md`, `art/style/palette.png`, `art/style/scale.png`
- `art/sources/characters/mara-casual-layered/` (Mara's pack: the format to match, piece by piece) and `art/LAYERED-RIG.md` (the pack contract)
- the approved Phase 1 pictures: `art/inbox/silas-layered/master.png` and `idle.png`

## Then

Save it as `art/inbox/silas-layered/mask-harrow-stand.png`. Do **not** run `npm run art:import` for this folder: Claude brings it into `art/sources/characters/silas-layered/`, measures its joints (rig.json) and rigs it. Report which pieces are in.
