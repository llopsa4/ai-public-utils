# Art provenance

All runtime art in `art/src` is derived from **Kiln Courier**'s illustrations in the same repository (`FFCardGame/assets`, already published there). Only the derived files are committed here. The scripts that regenerate them read the originals from `../FFCardGame/assets`.

| Output | Source (FFCardGame/assets) | Script | Processing |
| --- | --- | --- | --- |
| `rooms/tent.png` (Mara's tent), `foreground/tent-stool.png` | — (original) | `tent.mjs`, `tent-pixels.mjs`, `pixel.mjs` | hand-made pixel art drawn pixel by pixel in code on a 320×180 grid, seen side-on: canvas walls with folds, seams and patches, poles, a brass lantern, the workbench with its tool board, tool roll, candle and glazed jar, the brush drum on its trestle, a coat, a camp cot with a wool blanket, boots, Tobi's drawing, a rug, the door flap; one palette of hand-picked hue-shifted ramps, selective outlines, contact shadows, and one lighting pass (lantern falloff, the door's glow) moving each pixel along its ramp with narrow dithered seams; shown 4× with hard edges; the stool cut-out takes the room's own pixels inside the stool's shape |
| `objects/tent.*` (the tent seen in the kiln hall) | `opening/tempering-house.png` (cloth over the workbench) | `pixelate.mjs` | the painted cloth mapped onto a tent silhouette (mirrored on the far slope, shaded by side), dark entrance and pole drawn |
| `rooms/mara-room.png` (kiln hall) | `kiln-hall.png` | `pixelate.mjs` | 1280×720 area downscale, light grade, 96-colour palette |
| `rooms/firing-house.png` | `opening/cinderfold.png` | `pixelate.mjs` | as above |
| `rooms/gallery.png` | `opening/regulator-gallery.png` | `pixelate.mjs` | as above |
| `rooms/ashways.png` | `opening/ashways.png` | `pixelate.mjs` | crop 140,120 1392×783 (removes corner artifacts), as above |
| `objects/sweeper.*` | `opening/ash-sweeper.png` | `pixelate.mjs` | 240 px wide, halo removed, 48 colours, outline, bob frames |
| `objects/notebook.*`, `items/notebook.png` | `opening/regulator-gallery.png` (open notebook on the bench) | `pixelate.mjs` | polygon mask, downscale |
| `objects/socket.*` | `opening/regulator-gallery.png` (regulator ring) | `pixelate.mjs` | circular mask; the empty hollow is painted |
| `objects/pantry-door.*` | `card-atlas.png` (door tile) | `pixelate.mjs` | arch mask, downscale; latch drawn on top |
| `objects/valve.*` | `card-atlas.png` (valve wheel and steam-stack tiles) | `pixelate.mjs` | circular mask on the wheel, stack crop as the pipe; steam drawn |
| `objects/rack.*` (charging cradle) | `opening/regulator-gallery.png` (lantern) | `pixelate.mjs` | lantern mask; the empty frame has the glow dimmed |
| `props/gauge-face.png` | `rooms/gallery.png` (the gauge dial) | `pixelate.mjs` | disc cut-out; the painted needle is refilled from the dial at the same radius (the game draws a live needle) |
| `props/pulley.png` | `rooms/mara-room.png` (hoist chains and pot) | `pixelate.mjs` | polygon cut-out, swung by the game |
| `foreground/*.png` | the rendered rooms above | `pixelate.mjs` | polygon cut-outs of the same pixels (kiln-hall rubble, gallery railing) |
| `items/gauntlet.png` | `equipment/courier-gauntlet.png` | `pixelate.mjs` | 64×64 icon |
| `items/regulator.png` | `opening/regulator-gallery.png` | `pixelate.mjs` | circular mask, 64×64 |
| `items/bread.png` | `opening/cinderfold.png` (bread basket) | `pixelate.mjs` | mask, 64×64 |
| `items/scarf.png` | `opening/iven.png` (orange scarf) | `pixelate.mjs` | colour mask, 64×64 |
| `characters/mara-gauntlet.*`, `portraits/mara.png` | `hero.png` | `rig.mjs` | cutout rig (hips and knees: six-frame walk, crouch, lie down), painted blink, 112 colours; portrait strip of 6 frames (neutral, worried, angry, each with the mouth closed and painted open; moods are brow warps) |
| `characters/mara.*` | `hero.png` | `rig.mjs` | as above with the gauntlet's ember glow painted dark (unpowered) |
| `characters/oren.*`, `portraits/oren.png` | `opening/oren.png` | `rig.mjs` | cutout rig, painted blink, fidget (gauge lifted); 6-frame portrait strip as for Mara |
| `characters/nell.*`, `portraits/nell.png` | `opening/iven.png` (used for the neighbour Nell) | `rig.mjs` | cutout rig, painted blink; the shield moves with the upper body; 2-frame portrait strip (mouth closed and open, no moods) |
| `characters/extra-*.png/.json/.webp` (background people in the kiln hall and firing house, placeholders) | `hero.png`, `opening/oren.png`, `opening/iven.png` | `rig.mjs` (`EXTRAS`) | the same cutout rig with every frame walking; clothes hue-rotated and desaturated, pale plates turned to leather, skin tone scaled, painted cap / hood / kerchief, Mara's gauntlet arm removed; 13 frames, 64 colours; WebP copy is what ships |
| `icons/*.png` | — | `icons.mjs` | drawn 24×24 action-ring icons |

All outputs are palette-indexed PNGs (`art/png.mjs`, upng-js).
Room backgrounds, foreground cut-outs, props and the background people's sheets are also written as WebP (`art/webp.mjs`, sharp 0.35, which bundles libvips under the LGPL-3.0); the game loads the WebP copies.

Chapter 2's art (placeholders, `art/src/ch2/` and two fight pictures in `art/src/kc/`):
- `ch2/rooms/workshop.png` comes from `FFCardGame/assets/opening/tempering-house.png` (`art/ch2.mjs`: fitted to 1280×720, 96 colours).
- `ch2/rooms/road.png`, `ch2/rooms/backroom.png` and the three tunnels (`ch2/rooms/tunnel-*.png`) are painted from scratch as SVG scenes (`art/ch2.mjs`), as are the tunnels' object sheets (`ch2/objects/`: grate, steam, bridge, basket) and the four tunnel creatures (`ch2/creatures/`: a fight picture and a small room sprite each).
- `ch2/characters/bryn.*` and `ch2/portraits/bryn.png` are Iven's illustration (`opening/iven.png`) recoloured and re-dressed: a dark red kerchief, red-brown clothes, leather plates. It is rigged like Nell (`art/rig.mjs`, `RIGS.bryn` with a `variant`).
- `kc/tempering-house.webp` (the sparring backdrop) and `kc/ash-sweeper.webp` (the training rig) are `opening/tempering-house.png` and `opening/ash-sweeper.png` (`art/kc.mjs`).

The interface font is Zilla Slab (Mozilla / Typotheque), SIL Open Font License 1.1, bundled from `@fontsource/zilla-slab` (Latin subset). The fight and gear screens use Cinzel and Cormorant Garamond (SIL Open Font License 1.1, from `@fontsource`), the same families as Kiln Courier.

The fight and gear screens' code is Kiln Courier's (`FFCardGame/client/src`, same repository), imported directly rather than copied; the battle art they show is the WebPs in `art/src/kc` made by `art/kc.mjs` from `FFCardGame/assets`, except the fight backdrop `art/src/kc/regulator-gallery.webp` (also behind the gear screen): a picture of the regulator gallery generated with Google Gemini and supplied by the author, brought in with `npm run art:import` (fitted to 1280×720, snapped to the master palette with dithering) and marked final in `art/status.json`, so `art/kc.mjs` no longer overwrites it. The interface frames, rivets, toggles and icons are drawn in CSS and inline SVG. The room name boards are painted at runtime on a canvas (`src/game/sign.ts`).
