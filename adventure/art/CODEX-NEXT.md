# Next for Codex (2026-11-09)

**First do `art/CODEX-FIXES.md`** (Sigrid's two standing masters to redraw), then
continue here.

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

## 5. Silas reaching through the bars (`silas-layered/reach.png`)

In the cell, Silas lifts Benn's keys: Benn stands outside the bars saluting, and Silas reaches
through to clap his shoulder and slip the key ring off his belt. The game shows this now with a
stand-in: the pack's near arm swung forward, straight and stiff. Draw the real pose.

**What to draw:**

- Silas standing, facing right, in his casual outfit (match `art/sources/characters/silas-layered/master.png`
  and `idle.png`: same body, clothes, face and proportions, 220 art px tall).
- The **near arm** reaches forward at about shoulder height, slightly bent, the hand open and turned
  palm-down as if to clap someone's shoulder. The shoulder leans a little into the reach; the other
  arm hangs relaxed.
- The feet stay planted on the floor line (both soles on y ≈ 1498, as in `master.png`).
- Same canvas and placement as the pack's other pieces: 1024×1536, transparent background.

**Save** as `art/inbox/silas-layered/reach.png`. Do not import it: Claude brings it in, adds the
Harrow and clerk mask layers for it (`mask-harrow-reach.png`, `mask-clerk-hood-reach.png`, made the
way you made the stand versions), and swaps it for the stand-in.

**Optional:** `art/inbox/silas-layered/reach-keys.png`, the same pose with the key ring hanging from
his fingers (the ring is drawn on Benn's belt in `art/sources/characters/char-guard/body.png`: match it).

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
