# silas-cloak-kneel

Status: **final** · pack · chapter intro · kept in `art/sources/characters/silas-cloak-layered/kneel.png`

## What the game does with it

Phase 2 of Silas's articulated pack (art/LAYERED-RIG.md), made from the approved Phase 1 master: the game rigs his walk, kneeling and lying from these pieces (as for Mara), and draws his masks over him in every pose.

## Technical

- File: `art/inbox/silas-cloak-layered/kneel.png`.
- On a 1024x1536 transparent canvas (or flat magenta), the same scale as master.png, knee and foot on y 1500.
- Match art/sources/characters/mara-casual-layered/kneel.png.

## Prompt for Codex

```text
Draw for the game The Rift: Ashlands: Silas, the con man (he/him), about 30, a bit mad and very eccentric: medium height (a little shorter than Mara), slim and loose-limbed, a performer's posture, restless hands. Pale olive skin, a narrow clever face, sharp cheekbones, quick dark eyes that are a touch too bright, a wide lopsided grin always halfway to a joke, short black hair sticking up in odd tufts after a night in a cell, a few days' stubble. A once-fine charcoal waistcoat with tarnished buttons over a grubby cream shirt, its sleeves rolled, a loose dark-red neckcloth; dark trousers, scuffed soft boots. Under his face (when a mask is on) Nessa's mask frame: a thin articulated brass frame of ribs and tiny hinges at the jaw. Here in his own travelling cloak: a long, dark, worn wool cloak with a deep hood, the hood UP and framing his face like a cowl, the whole face clearly visible and lit (no shadow over the eyes), the cloak open at the front over his waistcoat and shirt, falling to mid-calf. The whole figure down on one knee, facing right, the cloak pooled on the floor, looking at something low on the ground.
Style: detailed pixel art matching tent-reference.png (attached): hand-placed pixels, clean readable shapes, crisp edges (no blur or anti-aliased haze), worn lived-in materials (patched canvas, scuffed wood with iron corner plates, brass, glazed clay, soot and ash). It is reduced to a 2-pixel grid on import (a room becomes 640×360 pixels), so use clear shapes and flat colour areas.
World: the Ashlands, an industrial-fantasy land: kiln villages of fired clay and cream ceramic plates in the ash country, and Ironhaven, a hard city of iron, stone and snow; brass, soot, ochre cloth, ember light. Everything used and repaired, nothing shiny or new, no modern objects.
Colour: keep to the attached master palette (art/style/palette.png, 160 colours: ochre, rust, brass, ember orange, clay, warm browns; soot greys and iron blue-greys). Every pixel is snapped to it on import.
Never: text or letters in the picture, people in rooms, perspective, lens effects, neon, painted glow pools, light shafts, haze or particles (the game adds light and effects).
Proportions: true to the cast (art/style/scale.png): Mara is 232 px, a doorway about 328, a table top 104, a chair seat 48.
Light: evenly lit with soft form shading and no strong cast light (the game lights it to match the room).
Facing right (the game mirrors it to face left). Same look as Mara's pack: the same line, shading, pixel density and palette.
File: art/inbox/silas-cloak-layered/kneel.png.
On a 1024x1536 transparent canvas (or flat magenta), the same scale as master.png, knee and foot on y 1500.
Match art/sources/characters/mara-casual-layered/kneel.png.
```

## Attach

- `tent-reference.png` (the look to match), `art/STYLE.md`, `art/style/palette.png`, `art/style/scale.png`
- `art/sources/characters/mara-casual-layered/` (Mara's pack: the format to match, piece by piece) and `art/LAYERED-RIG.md` (the pack contract)
- the approved Phase 1 pictures: `art/inbox/silas-cloak-layered/master.png` and `idle.png`

## Then

Save it as `art/inbox/silas-cloak-layered/kneel.png`. Do **not** run `npm run art:import` for this folder: Claude brings it into `art/sources/characters/silas-cloak-layered/`, measures its joints (rig.json) and rigs it. Report which pieces are in.
