# mara-light-left-farBoot

Status: **requested** · pack · chapter game · kept in `art/sources/characters/mara-light-layered/left/farBoot.png`

## What the game does with it

Phase 2 of Silas's articulated pack (art/LAYERED-RIG.md), made from the approved Phase 1 master: the game rigs his walk, kneeling and lying from these pieces (as for Mara), and draws his masks over him in every pose.

## Technical

- File: `art/inbox/mara-light-layered/left/farBoot.png`.
- On a 1024x1536 transparent canvas (or flat magenta #FF00FF), the same scale, height and soles line (y 1500) as this pack's right-facing master.png, and exactly the canvas and position of the approved left/master.png.
- Draw it FACING LEFT as its own drawing: never a horizontal mirror of the right-facing picture. Whatever he wears on one side of his body stays on that side of his body (the prompt says which side each thing is on).
- Stacked in the usual order (farUpperArm, farForearm, farThigh, farShin, farBoot, nearThigh, nearShin, nearBoot, torso, nearUpperArm, nearForearm) the eleven left-facing layers must reproduce left/master.png pixel for pixel; extend each piece about 25 px past its joints under the neighbouring layer, as in the right-facing set.
- Save it in the pack's left/ folder: art/inbox/mara-light-layered/left/farBoot.png. Sigrid's two-sided pack (art/inbox/done/sigrid-layered/ and its left/ folder) shows the format.

## Prompt for Codex

```text
Draw for the game The Rift: Ashlands: Mara, the courier (he/him), about 22: the tallest of the cast but lean and long-limbed, a runner's build. Warm brown skin, short dark-brown hair swept back and a little unruly, a light stubble, hazel eyes, a determined, slightly tired face. An ochre wool scarf wrapped twice round his neck, its long end thrown over his left shoulder like a short cloak. Cream-white fired-ceramic armour plates (chest, shoulders, forearms, shins), chipped and patched, laced over dark brown leather. A worn leather satchel on his left hip. Dark work trousers with ceramic knee plates, patched at the knees; brown leather courier boots with brass buckles. His mother's pressure gauntlet on his right forearm and hand, oversized: a clenched fist of massive cream-ceramic knuckles, thick riveted brass reinforcements, a broad cuff and a pressure pipe along the forearm, the fist reaching down towards his knee; a round ember-cell housing on the back of the hand (unlit: dull dark red glass). Keep to Codex's pilot design (art/inbox/reference/gauntlet-closed-v2/mara-master.png). In his light armour (exactly the outfit of this pack's right-facing master.png), now drawn FACING LEFT. The far boot, ankle to toe, cut from the approved left/master.png. "Near" is now the side nearest the viewer when facing left (Mara's own LEFT side); "far" is his right side. His mother's pressure gauntlet is on his RIGHT forearm and hand, so facing left it is on the FAR side: behind his body, the big ceramic fist partly hidden by his torso and hips, swinging behind him as he walks (in the walk it belongs to the far forearm layer). His near (left) forearm is his own: the ceramic forearm plate over leather, a bare hand. The ochre scarf's long end, thrown over his LEFT shoulder, is now on the NEAR side, hanging down over his near shoulder and back; the satchel on his LEFT hip is on the NEAR side, in front of the near hip (part of the torso layer: keep it above mid-thigh so the near leg can swing under it). The ember cell glass on the back of the gauntlet's hand faces away from us on this side: show it only where it would truly be seen.
Style: detailed pixel art matching tent-reference.png (attached): hand-placed pixels, clean readable shapes, crisp edges (no blur or anti-aliased haze), worn lived-in materials (patched canvas, scuffed wood with iron corner plates, brass, glazed clay, soot and ash). It is reduced to a 2-pixel grid on import (a room becomes 640×360 pixels), so use clear shapes and flat colour areas.
World: the Ashlands, an industrial-fantasy land: kiln villages of fired clay and cream ceramic plates in the ash country, and Ironhaven, a hard city of iron, stone and snow; brass, soot, ochre cloth, ember light. Everything used and repaired, nothing shiny or new, no modern objects.
Colour: keep to the attached master palette (art/style/palette.png, 160 colours: ochre, rust, brass, ember orange, clay, warm browns; soot greys and iron blue-greys). Every pixel is snapped to it on import.
Never: text or letters in the picture, people in rooms, perspective, lens effects, neon, painted glow pools, light shafts, haze or particles (the game adds light and effects).
Proportions: true to the cast (art/style/scale.png): Mara is 232 px, a doorway about 328, a table top 104, a chair seat 48.
Light: evenly lit with soft form shading and no strong cast light (the game lights it to match the room).
Facing right (the game mirrors it to face left). Same look as Mara's pack: the same line, shading, pixel density and palette.
File: art/inbox/mara-light-layered/left/farBoot.png.
On a 1024x1536 transparent canvas (or flat magenta #FF00FF), the same scale, height and soles line (y 1500) as this pack's right-facing master.png, and exactly the canvas and position of the approved left/master.png.
Draw it FACING LEFT as its own drawing: never a horizontal mirror of the right-facing picture. Whatever he wears on one side of his body stays on that side of his body (the prompt says which side each thing is on).
Stacked in the usual order (farUpperArm, farForearm, farThigh, farShin, farBoot, nearThigh, nearShin, nearBoot, torso, nearUpperArm, nearForearm) the eleven left-facing layers must reproduce left/master.png pixel for pixel; extend each piece about 25 px past its joints under the neighbouring layer, as in the right-facing set.
Save it in the pack's left/ folder: art/inbox/mara-light-layered/left/farBoot.png. Sigrid's two-sided pack (art/inbox/done/sigrid-layered/ and its left/ folder) shows the format.
```

## Attach

- `tent-reference.png` (the look to match), `art/STYLE.md`, `art/style/palette.png`, `art/style/scale.png`
- `art/sources/characters/mara-casual-layered/` (Mara's pack: the format to match, piece by piece) and `art/LAYERED-RIG.md` (the pack contract)
- `art/sources/characters/mara-light-layered/` (this outfit facing right: the look to match, piece by piece) and `art/inbox/done/sigrid-layered/` with its `left/` folder (a two-sided pack: the format)
- the approved `art/sources/characters/mara-light-layered/left/master.png` and `idle.png` (approved by the user on 2026-11-09: keep the fuller waist and lower torso exactly)

## Then

Save it as `art/inbox/mara-light-layered/left/farBoot.png`. Do **not** run `npm run art:import` for this folder: Claude brings it into `art/sources/characters/mara-light-layered/`, measures its joints (rig.json) and rigs it. Report which pieces are in.
