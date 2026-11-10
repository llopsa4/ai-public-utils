# silas-cloak-master

Status: **final** · pack · chapter intro · kept in `art/sources/characters/silas-cloak-layered/master.png`

## What the game does with it

Phase 1 of Silas's articulated pack (art/LAYERED-RIG.md): the standing figure every other piece is cut from. The user approves it before anything of Phase 2 is made.

## Technical

- File: `art/inbox/silas-cloak-layered/master.png`.
- On a 1024x1536 transparent canvas (or flat magenta #FF00FF): soles on y 1500, about 1409 px from head to sole (head top near y 91), horizontally centred, the same scale as Mara's master.png. In the game he stands 220 art px (Mara is 232).
- This drawing is the anatomy every later piece is cut from and must recompose exactly: draw clean, separate limbs (nothing overlapping that would be hard to split at the shoulders, elbows, hips, knees and ankles).
- The cloak belongs to the torso layer down to mid-thigh; below that, draw its lower part as separate back and front panels on the far and near thigh layers, so it swings with the stride and never hides a leg completely.
- Also deliver, in the same folder, the clerk guise as mask layers over this pack (like silas-layered/mask-clerk-*): mask-clerk-hood-stand.png, mask-clerk-hood-kneel.png, mask-clerk-hood-lie.png (the hood pulled lower over the brow, the face still visible from the eyes down) and mask-clerk-ledger.png (the ledger held to the chest by the near forearm).
- Match the format of Mara's: art/sources/characters/mara-casual-layered/master.png.

## Prompt for Codex

```text
Draw for the game The Rift: Ashlands: Silas, the con man (he/him), about 30, a bit mad and very eccentric: medium height (a little shorter than Mara), slim and loose-limbed, a performer's posture, restless hands. Pale olive skin, a narrow clever face, sharp cheekbones, quick dark eyes that are a touch too bright, a wide lopsided grin always halfway to a joke, short black hair sticking up in odd tufts after a night in a cell, a few days' stubble. A once-fine charcoal waistcoat with tarnished buttons over a grubby cream shirt, its sleeves rolled, a loose dark-red neckcloth; dark trousers, scuffed soft boots. Under his face (when a mask is on) Nessa's mask frame: a thin articulated brass frame of ribs and tiny hinges at the jaw. Here in his own travelling cloak: a long, dark, worn wool cloak with a deep hood, the hood UP and framing his face like a cowl, the whole face clearly visible and lit (no shadow over the eyes), the cloak open at the front over his waistcoat and shirt, falling to mid-calf. The walk master: standing in profile facing right, in the neutral stance the walk cycle starts from (feet slightly apart, both visible, arms hanging relaxed and a little away from the body so no arm hides the torso or the other arm). Only one eye shows (profile).
Style: detailed pixel art matching tent-reference.png (attached): hand-placed pixels, clean readable shapes, crisp edges (no blur or anti-aliased haze), worn lived-in materials (patched canvas, scuffed wood with iron corner plates, brass, glazed clay, soot and ash). It is reduced to a 2-pixel grid on import (a room becomes 640×360 pixels), so use clear shapes and flat colour areas.
World: the Ashlands, an industrial-fantasy land: kiln villages of fired clay and cream ceramic plates in the ash country, and Ironhaven, a hard city of iron, stone and snow; brass, soot, ochre cloth, ember light. Everything used and repaired, nothing shiny or new, no modern objects.
Colour: keep to the attached master palette (art/style/palette.png, 160 colours: ochre, rust, brass, ember orange, clay, warm browns; soot greys and iron blue-greys). Every pixel is snapped to it on import.
Never: text or letters in the picture, people in rooms, perspective, lens effects, neon, painted glow pools, light shafts, haze or particles (the game adds light and effects).
Proportions: true to the cast (art/style/scale.png): Mara is 232 px, a doorway about 328, a table top 104, a chair seat 48.
Light: evenly lit with soft form shading and no strong cast light (the game lights it to match the room).
Facing right (the game mirrors it to face left). Same look as Mara's pack: the same line, shading, pixel density and palette.
File: art/inbox/silas-cloak-layered/master.png.
On a 1024x1536 transparent canvas (or flat magenta #FF00FF): soles on y 1500, about 1409 px from head to sole (head top near y 91), horizontally centred, the same scale as Mara's master.png. In the game he stands 220 art px (Mara is 232).
This drawing is the anatomy every later piece is cut from and must recompose exactly: draw clean, separate limbs (nothing overlapping that would be hard to split at the shoulders, elbows, hips, knees and ankles).
The cloak belongs to the torso layer down to mid-thigh; below that, draw its lower part as separate back and front panels on the far and near thigh layers, so it swings with the stride and never hides a leg completely.
Also deliver, in the same folder, the clerk guise as mask layers over this pack (like silas-layered/mask-clerk-*): mask-clerk-hood-stand.png, mask-clerk-hood-kneel.png, mask-clerk-hood-lie.png (the hood pulled lower over the brow, the face still visible from the eyes down) and mask-clerk-ledger.png (the ledger held to the chest by the near forearm).
Match the format of Mara's: art/sources/characters/mara-casual-layered/master.png.
```

## Attach

- `tent-reference.png` (the look to match), `art/STYLE.md`, `art/style/palette.png`, `art/style/scale.png`
- `art/sources/characters/mara-casual-layered/` (Mara's pack: the format to match, piece by piece) and `art/LAYERED-RIG.md` (the pack contract)

## Then

Save it as `art/inbox/silas-cloak-layered/master.png`. Do **not** run `npm run art:import` for this folder: Claude brings it into `art/sources/characters/silas-cloak-layered/`, measures its joints (rig.json) and rigs it. Report which pieces are in.
