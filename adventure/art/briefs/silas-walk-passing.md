# silas-walk-passing

Status: **requested** · pack · chapter intro · kept in `art/sources/characters/silas-layered/walk-passing.png`

## What the game does with it

Phase 2 of Silas's articulated pack (art/LAYERED-RIG.md), made from the approved Phase 1 master: the game rigs his walk, kneeling and lying from these pieces (as for Mara), and draws his masks over him in every pose.

## Technical

- File: `art/inbox/silas-layered/walk-passing.png`.
- On a 1024x1536 transparent canvas (or flat magenta #FF00FF), exactly the canvas, scale and position of the approved master.png (soles on y 1500).
- Drawn from the approved master; it guides the rig, it is not shown in the game.
- Match art/sources/characters/mara-casual-layered/walk-passing.png.

## Prompt for Codex

```text
Draw for the game Cinderfold: Silas, the con man (he/him), about 30, a bit mad and very eccentric: medium height (a little shorter than Mara), slim and loose-limbed, a performer's posture, restless hands. Pale olive skin, a narrow clever face, sharp cheekbones, quick dark eyes that are a touch too bright, a wide lopsided grin always halfway to a joke, short black hair sticking up in odd tufts after a night in a cell, a few days' stubble. A once-fine charcoal waistcoat with tarnished buttons over a grubby cream shirt, its sleeves rolled, a loose dark-red neckcloth; dark trousers, scuffed soft boots. Under his face (when a mask is on) Nessa's mask frame: a thin articulated brass frame of ribs and tiny hinges at the jaw. A walk reference, the passing pose: one leg straight under the body, the other passing it with the knee bent and the foot lifted. His walk: light, loose and theatrical, a bit mad: a springy stride with a hint of a skip, the hips swinging, arms loose and swinging a little too freely, the chin up, as if he were walking onto a stage to applause only he can hear. (Mara walks like a courier on a job; Silas walks like a man about to talk his way past you, humming.)
Style: detailed pixel art matching tent-reference.png (attached): hand-placed pixels, clean readable shapes, crisp edges (no blur or anti-aliased haze), worn lived-in materials (patched canvas, scuffed wood with iron corner plates, brass, glazed clay, soot and ash). It is reduced to a 2-pixel grid on import (a room becomes 640×360 pixels), so use clear shapes and flat colour areas.
World: an industrial-fantasy village inside an old kiln and the ash country around it: fired clay, cream ceramic plates, iron, brass, soot, ochre cloth, ember light. Everything used and repaired, nothing shiny or new, no modern objects.
Colour: keep to the attached master palette (art/style/palette.png, 160 colours: ochre, rust, brass, ember orange, clay, warm browns; soot greys and iron blue-greys). Every pixel is snapped to it on import.
Never: text or letters in the picture, people in rooms, perspective, lens effects, neon, painted glow pools, light shafts, haze or particles (the game adds light and effects).
Proportions: true to the cast (art/style/scale.png): Mara is 232 px, a doorway about 328, a table top 104, a chair seat 48.
Light: evenly lit with soft form shading and no strong cast light (the game lights it to match the room).
Facing right (the game mirrors it to face left). Same look as Mara's pack: the same line, shading, pixel density and palette.
File: art/inbox/silas-layered/walk-passing.png.
On a 1024x1536 transparent canvas (or flat magenta #FF00FF), exactly the canvas, scale and position of the approved master.png (soles on y 1500).
Drawn from the approved master; it guides the rig, it is not shown in the game.
Match art/sources/characters/mara-casual-layered/walk-passing.png.
```

## Attach

- `tent-reference.png` (the look to match), `art/STYLE.md`, `art/style/palette.png`, `art/style/scale.png`
- `art/sources/characters/mara-casual-layered/` (Mara's pack: the format to match, piece by piece) and `art/LAYERED-RIG.md` (the pack contract)
- the approved Phase 1 pictures: `art/inbox/silas-layered/master.png` and `idle.png`

## Then

Save it as `art/inbox/silas-layered/walk-passing.png`. Do **not** run `npm run art:import` for this folder: Claude brings the whole pack into `art/sources/characters/silas-layered/`, measures its joints (rig.json) and rigs it. Report which pieces are in.
