# Art provenance

All runtime art in `art/src` is derived from **Kiln Courier**'s illustrations in the same repository (`FFCardGame/assets`, already published there). Only the derived files are committed here. The scripts that regenerate them read the originals from `../FFCardGame/assets`.

| Output | Source (FFCardGame/assets) | Script | Processing |
| --- | --- | --- | --- |
| `rooms/mara-room.png` (kiln hall, Mara's workbench) | `kiln-hall.png` | `pixelate.mjs` | 1280×720 area downscale, light grade, 128-colour palette |
| `rooms/firing-house.png` | `opening/cinderfold.png` | `pixelate.mjs` | as above |
| `rooms/gallery.png` | `opening/regulator-gallery.png` | `pixelate.mjs` | as above |
| `rooms/ashways.png` | `opening/ashways.png` | `pixelate.mjs` | crop 140,120 1392×783 (removes corner artifacts), as above |
| `objects/sweeper.*` | `opening/ash-sweeper.png` | `pixelate.mjs` | 240 px wide, halo removed, 48 colours, outline, bob frames |
| `objects/notebook.*`, `items/notebook.png` | `opening/regulator-gallery.png` (open notebook on the bench) | `pixelate.mjs` | polygon mask, downscale |
| `objects/socket.*` | `opening/regulator-gallery.png` (regulator ring) | `pixelate.mjs` | circular mask; the empty hollow is painted |
| `objects/pantry-door.*` | `card-atlas.png` (door tile) | `pixelate.mjs` | arch mask, downscale; latch drawn on top |
| `objects/valve.*` | `card-atlas.png` (valve wheel tile) | `pixelate.mjs` | circular mask; pipe stub and steam drawn |
| `objects/rack.*` | — | `pixelate.mjs` | drawn (charging rack with ember cell) |
| `items/gauntlet.png` | `equipment/courier-gauntlet.png` | `pixelate.mjs` | 64×64 icon |
| `items/regulator.png` | `opening/regulator-gallery.png` | `pixelate.mjs` | circular mask, 64×64 |
| `items/bread.png`, `items/scarf.png` | `opening/cinderfold.png` (bread basket, hanging cloth) | `pixelate.mjs` | masks, 64×64 |
| `characters/mara-gauntlet.*`, `portraits/mara.png` | `hero.png` | `rig.mjs` | cutout rig (walk, crouch, lie down), painted blink, 112 colours |
| `characters/mara.*` | `hero.png` | `rig.mjs` | as above with the gauntlet's ember glow painted dark (unpowered) |
| `characters/oren.*`, `portraits/oren.png` | `opening/oren.png` | `rig.mjs` | cutout rig, painted blink |
| `characters/nell.*`, `portraits/nell.png` | `opening/iven.png` (used for the neighbour Nell) | `rig.mjs` | cutout rig, painted blink; the shield moves with the upper body |
| `icons/*.png` | — | `icons.mjs` | drawn 24×24 action-ring icons |
