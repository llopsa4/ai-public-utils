# sigrid-lie

Status: **requested** · pack · chapter intro · kept in `art/sources/characters/sigrid-layered/lie.png`

## What the game does with it

Phase 2 of Silas's articulated pack (art/LAYERED-RIG.md), made from the approved Phase 1 master: the game rigs his walk, kneeling and lying from these pieces (as for Mara), and draws his masks over him in every pose.

## Technical

- File: `art/inbox/sigrid-layered/lie.png`.
- On a 1536x1024 landscape transparent canvas (or flat magenta), the same scale as the master, lying on y 990.
- Match art/sources/characters/mara-casual-layered/lie.png.

## Prompt for Codex

```text
Draw for the game The Rift: Ashlands: Captain Sigrid of Ironhaven (she/her), about 35, a main character: tall (nearly Mara's height) and fit, an athletic soldier's build like Mara's but a woman's: strong shoulders and arms, a lean waist, powerful legs, upright and balanced like a fencer. Long, loose, untied brunette hair; a healed diagonal scar on her right cheek only (seen when she faces right, hidden when she faces left); grey watchful eyes, a composed, assessing face. A dark-blue winter officer's coat with brass buttons and a short snowy fur collar, with chipped, repaired ivory ceramic protection worked into it (shoulder, chest and ribs, forearms). Her artifact is Nessa's mechanically extendable sword: while she walks or stands only its compact hilt shows, clipped to her belt at the rear hip, with no blade and no scabbard (leather grip, ceramic pommel, a folded brass heat-sink guard, a ceramic chamber with a copper coil, an activation button, a flush emitter collar); at the press of the button physical blade sections extend and lock together, with ceramic channels and copper joints (a mechanical blade, never an energy blade). No shield, no other weapon. Dark breeches, tall black boots. The whole figure lying on her back on the floor, head to the right, eyes closed, the sword still in its scabbard at her side.
Style: detailed pixel art matching tent-reference.png (attached): hand-placed pixels, clean readable shapes, crisp edges (no blur or anti-aliased haze), worn lived-in materials (patched canvas, scuffed wood with iron corner plates, brass, glazed clay, soot and ash). It is reduced to a 2-pixel grid on import (a room becomes 640×360 pixels), so use clear shapes and flat colour areas.
World: the Ashlands, an industrial-fantasy land: kiln villages of fired clay and cream ceramic plates in the ash country, and Ironhaven, a hard city of iron, stone and snow; brass, soot, ochre cloth, ember light. Everything used and repaired, nothing shiny or new, no modern objects.
Colour: keep to the attached master palette (art/style/palette.png, 160 colours: ochre, rust, brass, ember orange, clay, warm browns; soot greys and iron blue-greys). Every pixel is snapped to it on import.
Never: text or letters in the picture, people in rooms, perspective, lens effects, neon, painted glow pools, light shafts, haze or particles (the game adds light and effects).
Proportions: true to the cast (art/style/scale.png): Mara is 232 px, a doorway about 328, a table top 104, a chair seat 48.
Light: evenly lit with soft form shading and no strong cast light (the game lights it to match the room).
Facing right (the game mirrors it to face left). Same look as Mara's pack: the same line, shading, pixel density and palette.
File: art/inbox/sigrid-layered/lie.png.
On a 1536x1024 landscape transparent canvas (or flat magenta), the same scale as the master, lying on y 990.
Match art/sources/characters/mara-casual-layered/lie.png.
```

## Attach

- `tent-reference.png` (the look to match), `art/STYLE.md`, `art/style/palette.png`, `art/style/scale.png`
- `art/sources/characters/mara-casual-layered/` (Mara's pack: the format to match, piece by piece) and `art/LAYERED-RIG.md` (the pack contract)
- the approved Phase 1 pictures: `art/inbox/sigrid-layered/master.png` and `idle.png`

## Then

Save it as `art/inbox/sigrid-layered/lie.png`. Do **not** run `npm run art:import` for this folder: Claude brings it into `art/sources/characters/sigrid-layered/`, measures its joints (rig.json) and rigs it. Report which pieces are in.
