# Next for Codex (2026-11-09)

Read this first, then `art/CODEX.md` (the full checklist and the briefs it links). Work in this
order and **stop after each numbered step** so the user can review it.

General rules for every step: no lettering in any picture, never mirror an asymmetric character,
keep your generated originals, save everything in `art/inbox/` as described, do not run
`npm run art:import` on character packs, and no commit or push.

## 1. Mara facing left: the rest of the set

`art/CODEX.md`, section "Changes to delivered characters", "Then: walking, kneeling and lying
facing left".

The user approved your six left-facing standing drawings on 2026-11-09. They are now in
`art/sources/characters/mara-{light,medium,casual}-layered/left/` (`master.png`, `idle.png`).

For each of the three outfits, make the 16 remaining pieces from that approved master:

- the eleven layers (`farUpperArm` … `nearForearm`);
- `joints.png` (with `joint-colours.json`);
- `walk-contact.png` and `walk-passing.png`;
- `kneel.png` (facing LEFT) and `lie.png` (head to the LEFT).

Rules:

- **The waist:** keep the fuller waist and lower torso exactly, as the user asked (your
  `art/inbox/mara-left-review/HANDOFF.md`). Never slim it in the layers.
- **No mirroring:** never mirror the right-facing art.
  - The gauntlet stays on his RIGHT arm, which is the far side when he faces left.
  - The scarf end and the satchel are on the NEAR side.
  - In the casual outfit, the cord bracelet is on the far wrist.
- **The layers:** the eleven layers must rebuild `left/master.png` pixel for pixel, with about
  25 px rounded joint overlaps under the neighbouring layer, as in your Sigrid pack.
- **Where to save:** `art/inbox/<pack>/left/`, with the same file names. Do NOT import: Claude
  brings them in and rigs them.
- **Report:** your checks, as you did for Sigrid.

## 2. Kell, the guardroom guard (`char-warden`)

- **Files:** `body.png`, `arm.png`, `kneel.png` and `lie.png`, in `art/inbox/char-warden/`.
- **Brief:** `art/briefs/char-warden.md`.
- **Look:** a grey quilted gambeson with Ironhaven's badge and a short club at the belt. **No
  shield.** Match the style and scale of your Benn pack (`art/inbox/char-guard/`).

## 3. The other two intro rooms

Paint them in the style of your new cell (`art/inbox/cell-layers/`).

- **`room-guardroom`:** follow its layout image `art/spec/guardroom.jpg`:
  - the stairs down at the left edge;
  - the clerk's hood on a peg;
  - the tally ledger on a shelf;
  - the stove;
  - Kell's desk;
  - the iron grate out, at the right edge.
- **`room-prison-door`:** follow `art/spec/prison-door.jpg`: the yard outside at night, snow, and
  the door Silas comes out of.

Deliver each room as three kinds of file:

1. A clean background.
2. A separate transparent foreground layer for anything a person walks behind, as you did for
   the cell's bars.
3. A small transparent layer of its own for each thing the player takes (the hood, the ledger),
   so it can vanish when taken.

Do not change `room-cell`.

## 4. The extras

- **`icon-read`:** 48×48 in the action-ring icons' style, readable at about 18 px.
- **`ui-suspicion-eye`:** a 192×48 strip with four states: calm, narrowing, narrow, red.
- **`item-frame`:** Nessa's mask frame, 64×64.
- **The frame on the table:** a small picture of the frame lying on the guard's table, so the
  game can show it there until Silas fishes it out.

## 5. Silas reaching through the bars: withdrawn

The user dropped this pose. Nothing to draw; the game keeps its stand-in reach.

## 6. The Ashlands from afar (`reveal-sky`, `reveal-mountains`, `reveal-plains`, `reveal-ridge`)

When Silas's intro ends, the camera pulls back from Ironhaven over the whole Ashlands while the
title "The Rift" and then "Ashlands" appear (the game adds the lettering: none in the pictures).
The game shows stand-ins drawn in code now; paint the real view.

**The view:** high and far off, at night under a moon. Ironhaven, the city of iron and snow, on its
cliff in the lower left; the ash plains rolling away below it; the Rift's dark jagged crack running
through the plains into the distance; the kilns glowing orange far off on the right; mountain
ranges along the horizon. The mood is vast, cold and quiet, a little ominous. Same painted pixel
style as the cell and the world map.

**Four separate layers**, each 1280×720, painted to line up when stacked (sky at the back). The game
moves them apart as the camera pulls back, so every layer but the sky is **transparent above its
own land**, and each extends fully to the left, right and bottom edges:

1. `reveal-sky`: the sky only, opaque over the whole frame.
2. `reveal-mountains`: the far ranges along the horizon.
3. `reveal-plains`: the ash plains, the Rift's crack and the kilns' glow.
4. `reveal-ridge`: the near ridge and Ironhaven on it. Keep Ironhaven around x 330, y 270 (the
   camera starts close on it, so give its towers and lit windows some detail).

Each layer's line in `art/CODEX.md` has its description. **Save** as
`art/inbox/reveal-sky.webp` (and the other three); WebP or PNG are both fine.

## 7. Silas in his cloak (`silas-cloak-layered`)

In the cell's corridor Silas takes back his own cloak from the wall and wears it from then on (the
guardroom, the outer door, Sigrid). Draw him in it as a full articulated pack, the same format as
his casual pack (`art/sources/characters/silas-layered/`, `art/LAYERED-RIG.md`), one piece list per
line in `art/CODEX.md` (ids `silas-cloak-*`).

- **The look:** a long, dark, worn wool travelling cloak with a deep hood. **The hood is up, framing
  his face like a cowl, and the whole face stays visible and lit: no shadow over the eyes.** The
  cloak is open at the front over his waistcoat and shirt and falls to mid-calf. It is the cloak
  painted on the cell wall (see `art/src/intro/objects/cell-cloak.png`): match its colour and wear.
- **Same Silas:** face, build, height (220 art px, about 1409 px head to sole on the canvas) and
  proportions as `silas-layered/master.png` and `idle.png`.
- **The pieces, in two phases as before:** first `master.png` and `idle.png` (stop for review), then
  the eleven layers, `joints.png`, `walk-contact.png`, `walk-passing.png`, `kneel.png`, `lie.png`.
  The cloak's lower part is drawn on the thigh layers as back and front panels, so it swings with
  the stride.
- **The clerk guise:** in the same folder, mask layers over this pack like `silas-layered/mask-clerk-*`:
  `mask-clerk-hood-stand.png`, `mask-clerk-hood-kneel.png`, `mask-clerk-hood-lie.png` (the hood pulled
  lower over the brow, the face still visible from the eyes down) and `mask-clerk-ledger.png` (the
  red-brown ledger held to his chest by the near forearm).

**Save** everything in `art/inbox/silas-cloak-layered/` and do not import it: Claude brings it in,
rigs `silas-cloak` and `silas-cloak-clerk`, and switches the game to them.

**Phase 1 approved (2026-11-10).** Claude reviewed `master.png` and `idle.png` (and the face
crops) and approves both as they are: the hood up framing a fully visible, lit face, the same Silas,
the cloak matching the cell wall's, both soles on y 1500. **Go on with phase 2:** the eleven layers
cut from the approved `master.png` (the cloak's lower part as back and front panels on the far and
near thigh layers, so it swings with the stride; the arms stay in front of the cloak), `joints.png`,
`walk-contact.png`, `walk-passing.png`, `kneel.png`, `lie.png`, then the clerk mask layers. Same
checks as before: the layers rebuild `master.png` pixel for pixel, joint coverage, soles on the line.
