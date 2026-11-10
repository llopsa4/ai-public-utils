# Codex tasks

Remove each section once it is done; leave unfinished ones in place.

## 1. The cell door, open: a clean painting

The open frame of `art/src/intro/objects/cell-gate.png` (the right half, 160×344 at x 160) looks
cut out by hand: hard edges, a flat panel. Repaint the open door properly:

- **Swing:** hinged on the **left** jamb, swung **into the cell** (towards the viewer and left),
  seen at an angle, so the bars foreshorten.
- **Finish:** clean shaded edges, the hinges and lock plate matching the closed frame, and a soft
  contact shadow on the floor under the door's foot.
- **Silhouette:** no stray background pixels, transparent everywhere else.
- **Don't touch:** the closed frame (the left half) stays exactly as it is.
- **Canvas:** the same 320×344 sheet, both halves, as `art/inbox/cell-door-open/cell-gate.png`.

In the game the door is drawn over Silas, who passes behind it as he walks out.

## 2. The cell with and without the cloak

The cloak on the corridor wall is a cut-out over a patched wall, and its background looks wrong.
Instead, paint the cell room twice:

- **`cell-cloak.png`:** `art/src/intro/rooms/cell.png` (1280×720) with Silas's hooded cloak
  hanging on its nail on the corridor wall, where the cut-out hangs now (about x 916–1006,
  y 190–404 in the painting).
- **`cell-bare.png`:** the same picture without the cloak. Only the nail is left, and the stones
  behind are painted as one continuous wall.
- **Everything else** must be pixel-identical between the two.
- **Save** both in `art/inbox/cell-cloak/`.

The game switches the room picture when Silas takes the cloak, and the cut-out object is retired.

## 3. A candle stub on the cell window's ledge

The mask's material is now candle wax instead of plaster from the wall.

- **The stub** (`window-stub.png`): a short stub of pale tallow candle, unlit, standing on the
  ledge of the barred window. It should catch the moonlight and read clearly at game size.
  - Transparent PNG, about 12×16 art pixels at the painting's 2× scale (24×32 px).
  - Its foot sits on the ledge at about x 372, y 254 in `cell.png`.
- **The satchel icon** (`wax.png`): a softened lump of the same tallow, 64×64 and transparent,
  in the style of the other intro items.
- **Save** both in `art/inbox/candle-stub/`.

Claude's placeholders (`art/src/intro/objects/window-stub.png`, `art/src/intro/items/wax.png`)
stand in until then.

The clay patch painted on the cell wall (about x 488–536, y 244–290 in `cell.png`) no longer
means anything. When you repaint the cell for task 2, paint it out in both pictures.
