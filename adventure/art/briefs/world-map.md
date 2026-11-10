# world-map

Status: **final** · map · chapter game · in the game as `art/src/ui/world-map.png`

## What the game does with it

The world map in the notebook's Map tab, shown about 480 px wide. The game writes each known place's name next to its mark and pins where the character is, so the painting has no lettering at all.

## Technical

- File: `art/inbox/world-map.png`, 1000×700 (or larger at the same 10:7), opaque parchment. No text.
- Layout to follow: `art/spec/world-map.png` (every place where its mark is; the names there are only for you).

## Prompt for Codex

```text
Draw for the game The Rift: Ashlands: A coloured engraved atlas (Codex, 2026-11-10, chosen over moonlit and grey-engraved versions: warm brown land, Ironhaven on a snowy mountain, a blue river, dark forests, copper roofs; same places), of an invented world map: one continent split north to south by the Rift, a deep jagged chasm crossed by a single bridge (Spanwick) at its middle; west of it the grey ash plains around Cinderfold, low foundry hills, and a snowy north with a walled town (Ironhaven); east of it a river with waterwheels (Alderweir), a forest in the south-east, a large old hearth-works further east (the First Hearth), and mountains in the north-east with a lone hut. A dotted road runs from Cinderfold east over the bridge. Follow the layout image exactly: every place sits where its mark is. No words, letters or labels anywhere (the game writes them).
Style: detailed pixel art matching tent-reference.png (attached): hand-placed pixels, clean readable shapes, crisp edges (no blur or anti-aliased haze), worn lived-in materials (patched canvas, scuffed wood with iron corner plates, brass, glazed clay, soot and ash). It is reduced to a 2-pixel grid on import (a room becomes 640×360 pixels), so use clear shapes and flat colour areas.
World: the Ashlands, an industrial-fantasy land: kiln villages of fired clay and cream ceramic plates in the ash country, and Ironhaven, a hard city of iron, stone and snow; brass, soot, ochre cloth, ember light. Everything used and repaired, nothing shiny or new, no modern objects.
Colour: keep to the attached master palette (art/style/palette.png, 160 colours: ochre, rust, brass, ember orange, clay, warm browns; soot greys and iron blue-greys). Every pixel is snapped to it on import.
Never: text or letters in the picture, people in rooms, perspective, lens effects, neon, painted glow pools, light shafts, haze or particles (the game adds light and effects).
Proportions: true to the cast (art/style/scale.png): Mara is 232 px, a doorway about 328, a table top 104, a chair seat 48.
Light: evenly lit with soft form shading and no strong cast light (the game lights it to match the room).
File: art/inbox/world-map.png, 1000×700 (or larger at the same 10:7), opaque parchment. No text.
Layout to follow: art/spec/world-map.png (every place where its mark is; the names there are only for you).
```

## Attach

- `tent-reference.png` (the look to match), `art/STYLE.md`, `art/style/palette.png`, `art/style/scale.png`
- `art/spec/world-map.png` (the layout to follow)

## Then

`npm run art:import`, look at `art/inbox/preview/world-map.png`, `npm run art:check`.
