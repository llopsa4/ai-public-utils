# mara-medium-left-joints

Status: **requested** · pack · chapter game · kept in `art/sources/characters/mara-medium-layered/left/joints.png`

## What the game does with it

Phase 2 of Silas's articulated pack (art/LAYERED-RIG.md), made from the approved Phase 1 master: the game rigs his walk, kneeling and lying from these pieces (as for Mara), and draws his masks over him in every pose.

## Technical

- File: `art/inbox/mara-medium-layered/left/joints.png`.
- On a 1024x1536 transparent canvas (or flat magenta #FF00FF), the same scale, height and soles line (y 1500) as this pack's right-facing master.png, and exactly the canvas and position of the approved left/master.png.
- Draw it FACING LEFT as its own drawing: never a horizontal mirror of the right-facing picture. Whatever he wears on one side of his body stays on that side of his body (the prompt says which side each thing is on).
- Save it in the pack's left/ folder: art/inbox/mara-medium-layered/left/joints.png. Sigrid's two-sided pack (art/inbox/sigrid-layered/ and its left/ folder) shows the format.

## Prompt for Codex

```text
Draw for the game The Rift: Ashlands: Mara, the courier (he/him), about 22: the tallest of the cast but lean and long-limbed, a runner's build. Warm brown skin, short dark-brown hair swept back and a little unruly, a light stubble, hazel eyes, a determined, slightly tired face. An ochre wool scarf wrapped twice round his neck, its long end thrown over his left shoulder like a short cloak. Cream-white fired-ceramic armour plates (chest, shoulders, forearms, shins), chipped and patched, laced over dark brown leather. A worn leather satchel on his left hip. Dark work trousers with ceramic knee plates, patched at the knees; brown leather courier boots with brass buckles. His mother's pressure gauntlet on his right forearm and hand, oversized: a clenched fist of massive cream-ceramic knuckles, thick riveted brass reinforcements, a broad cuff and a pressure pipe along the forearm, the fist reaching down towards his knee; a round ember-cell housing on the back of the hand (unlit: dull dark red glass). Keep to Codex's pilot design (art/inbox/reference/gauntlet-closed-v2/mara-master.png). In his medium armour (exactly the outfit of this pack's right-facing master.png), now drawn FACING LEFT. The joint map of left/master.png: a small solid dot of a fixed colour at the centre of each joint (near and far shoulder, elbow, hip, knee and ankle), near and far as seen facing left. The same rules as the light armour, in the medium (layered ceramic) armour of this pack's master.png: the gauntlet on his RIGHT arm is on the FAR side, behind his body; the scarf end over his LEFT shoulder and the satchel on his LEFT hip are on the NEAR side (the satchel part of the torso layer, above mid-thigh).
Style: detailed pixel art matching tent-reference.png (attached): hand-placed pixels, clean readable shapes, crisp edges (no blur or anti-aliased haze), worn lived-in materials (patched canvas, scuffed wood with iron corner plates, brass, glazed clay, soot and ash). It is reduced to a 2-pixel grid on import (a room becomes 640×360 pixels), so use clear shapes and flat colour areas.
World: the Ashlands, an industrial-fantasy land: kiln villages of fired clay and cream ceramic plates in the ash country, and Ironhaven, a hard city of iron, stone and snow; brass, soot, ochre cloth, ember light. Everything used and repaired, nothing shiny or new, no modern objects.
Colour: keep to the attached master palette (art/style/palette.png, 160 colours: ochre, rust, brass, ember orange, clay, warm browns; soot greys and iron blue-greys). Every pixel is snapped to it on import.
Never: text or letters in the picture, people in rooms, perspective, lens effects, neon, painted glow pools, light shafts, haze or particles (the game adds light and effects).
Proportions: true to the cast (art/style/scale.png): Mara is 232 px, a doorway about 328, a table top 104, a chair seat 48.
Light: evenly lit with soft form shading and no strong cast light (the game lights it to match the room).
Facing right (the game mirrors it to face left). Same look as Mara's pack: the same line, shading, pixel density and palette.
File: art/inbox/mara-medium-layered/left/joints.png.
On a 1024x1536 transparent canvas (or flat magenta #FF00FF), the same scale, height and soles line (y 1500) as this pack's right-facing master.png, and exactly the canvas and position of the approved left/master.png.
Draw it FACING LEFT as its own drawing: never a horizontal mirror of the right-facing picture. Whatever he wears on one side of his body stays on that side of his body (the prompt says which side each thing is on).
Save it in the pack's left/ folder: art/inbox/mara-medium-layered/left/joints.png. Sigrid's two-sided pack (art/inbox/sigrid-layered/ and its left/ folder) shows the format.
```

## Attach

- `tent-reference.png` (the look to match), `art/STYLE.md`, `art/style/palette.png`, `art/style/scale.png`
- `art/sources/characters/mara-casual-layered/` (Mara's pack: the format to match, piece by piece) and `art/LAYERED-RIG.md` (the pack contract)
- `art/sources/characters/mara-medium-layered/` (this outfit facing right: the look to match, piece by piece) and `art/inbox/sigrid-layered/` with its `left/` folder (a two-sided pack: the format)
- the approved `art/sources/characters/mara-medium-layered/left/master.png` and `idle.png` (approved by the user on 2026-11-09: keep the fuller waist and lower torso exactly)

## Then

Save it as `art/inbox/mara-medium-layered/left/joints.png`. Do **not** run `npm run art:import` for this folder: Claude brings it into `art/sources/characters/mara-medium-layered/`, measures its joints (rig.json) and rigs it. Report which pieces are in.
