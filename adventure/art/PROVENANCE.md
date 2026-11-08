# Art provenance

The Chapter 1 regulator close-up housing, locking ring, outer bolt and bleed-valve wheel, Ashways pressure-cell states and disabled sweeper were generated with built-in OpenAI ImageGen on 2026-11-06. The Gallery painting supplied the ceramic/brass material reference; the existing Ash Sweeper image supplied machine identity. Each was imported through the palette/grid pipeline, preserving separate interactive layers. Briefs record the prompts and `art/inbox/chapter1-improvements/` holds the raw generation record and local review artifacts. The gauge needle and mechanical feedback are runtime graphics.


The medium-armour gear picture (`kc/equipment/layered-armor.webp`) and blank wood, iron and shield sign faces (`props/sign-*.png`) were generated with OpenAI ImageGen on 2026-11-06. Medium Mara's standing art, the existing light-armour icon and the approved tent image provided equipment and style references. The existing importer normalizes the deliveries; sign lettering and suspension remain runtime graphics. Prompts and in-game review screenshots are recorded under `art/inbox/art-completion-review/`.

The base gear-screen pictures for Heavy Gauntlet, Balanced Gauntlet and Insulated Kit (`kc/equipment/heavy-gauntlet.webp`, `balanced-gauntlet.webp`, `insulated-kit.webp`) reuse the corresponding already-published originals in `FFCardGame/assets/equipment/runtime/`. `art/kc.mjs` resizes them to 320×320 and re-encodes them as WebP, while preserving all imported final equipment art, including medium armour. These are placeholders for dedicated Cinderfold illustrations; no new image generation was used to fill these missing base pictures.

Tobi's original character source (`sources/characters/char-tobi/body.png`) was generated with OpenAI ImageGen on 2026-11-05, using Pip's existing source only as a style reference. His curly hair, teal tunic and chalk identify him separately from Pip and Bea. The source alpha is hardened for the game pipeline; `node art/rig.mjs tobi` builds his 140-pixel character sheet and neutral/worried talking portraits. No third-party character image is used for Tobi.

All runtime art in `art/src` is derived from **Kiln Courier**'s illustrations in the same repository (`FFCardGame/assets`, already published there). Only the derived files are committed here. The scripts that regenerate them read the originals from `../FFCardGame/assets`.

| Output | Source (FFCardGame/assets) | Script | Processing |
| --- | --- | --- | --- |
| `rooms/tent.png` (Mara's tent), `foreground/tent-stool.png` | `adventure/tent-reference.png` (supplied by the author; the style master for the Codex art) | `tent-reference.mjs` | re-gridded to 640×360 by sampling each cell's centre, snapped to the master palette (itself derived from this picture), shown 2× with hard edges; the open notebook and the charging cradle painted out of the bench (the game draws them as objects); the stool cut out from the room's own pixels. Final art. |
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

All outputs are palette-indexed PNGs (`art/png.mjs`, upng-js). Characters are built by the rig on the same 2-pixel grid as the rooms (`art/rig.mjs`, GRID). The master palette (`art/style/palette.json`) is derived from the tent reference (`art/derive-palette.mjs`).
Room backgrounds, foreground cut-outs, props and the background people's sheets are also written as WebP (`art/webp.mjs`, sharp 0.35, which bundles libvips under the LGPL-3.0); the game loads the WebP copies.

Chapter 2's art (placeholders, `art/src/ch2/` and two fight pictures in `art/src/kc/`):
- `ch2/rooms/workshop.png` comes from `FFCardGame/assets/opening/tempering-house.png` (`art/ch2.mjs`: fitted to 1280×720, 96 colours).
- `ch2/rooms/road.png`, `ch2/rooms/backroom.png` and the three tunnels (`ch2/rooms/tunnel-*.png`) are painted from scratch as SVG scenes (`art/ch2.mjs`), as are the tunnels' object sheets (`ch2/objects/`: grate, steam, bridge, basket) and the four tunnel creatures (`ch2/creatures/`: a fight picture and a small room sprite each).
- `ch2/characters/bryn.*` and `ch2/portraits/bryn.png` are Iven's illustration (`opening/iven.png`) recoloured and re-dressed: a dark red kerchief, red-brown clothes, leather plates. It is rigged like Nell (`art/rig.mjs`, `RIGS.bryn` with a `variant`).
- `kc/tempering-house.webp` (the sparring backdrop) and `kc/ash-sweeper.webp` (the training rig) are `opening/tempering-house.png` and `opening/ash-sweeper.png` (`art/kc.mjs`).

The interface font is Zilla Slab (Mozilla / Typotheque), SIL Open Font License 1.1, bundled from `@fontsource/zilla-slab` (Latin subset). The fight and gear screens use Cinzel and Cormorant Garamond (SIL Open Font License 1.1, from `@fontsource`), the same families as Kiln Courier.

The fight and gear screens' code is Kiln Courier's (`FFCardGame/client/src`, same repository), imported directly rather than copied; the battle art they show is the WebPs in `art/src/kc` made by `art/kc.mjs` from `FFCardGame/assets`, except the fight backdrop `art/src/kc/regulator-gallery.webp` (also behind the gear screen): a picture of the regulator gallery generated with Google Gemini and supplied by the author, brought in with `npm run art:import` (fitted to 1280×720, snapped to the master palette with dithering) and marked final in `art/status.json`, so `art/kc.mjs` no longer overwrites it. The interface frames, rivets, toggles and icons are drawn in CSS and inline SVG. The room name boards are painted at runtime on a canvas (`src/game/sign.ts`).
