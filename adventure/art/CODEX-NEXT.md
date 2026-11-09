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
