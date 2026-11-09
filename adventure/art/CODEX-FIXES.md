# Fixes for Codex (2026-11-09)

Claude reviewed every picture you delivered that is now in the game. One is drawn wrongly and is
**not used** until fixed: the game shows a stand-in instead. (Benn's chair-free sleeping picture had
the wrong colours too; Claude cut him out of your chair version instead, so it needs no redraw.) Everything else passed:

- the cell, its bars and the door;
- both plates and the 14 satchel items;
- Benn's standing, arm, kneeling and lying drawings;
- Silas's relaxed idle and his mask layers;
- the world map;
- Mara's six left-facing standing drawings.

Fix these first, before `art/CODEX-NEXT.md`. General rules as usual: no lettering, never mirror
an asymmetric character, keep your originals, save in `art/inbox/`, do not import character packs,
no commit or push.

## 1. Sigrid's walk masters: the far foot floats above the floor

**Files:**

- `art/sources/characters/sigrid-layered/master.png` (facing right);
- `art/sources/characters/sigrid-layered/left/master.png` (facing left).

**What is wrong:**

- In both, the far boot is drawn behind and *above* the near one, a depth effect. Its sole sits
  about 44 px above the floor line (far sole y ≈ 1455, near sole y ≈ 1500).
- The near boot hides it almost completely.
- The rig plants each foot at the height it is drawn, so her far foot would float in every walk
  step.
- The brief asked for "feet slightly apart, both visible", standing on y ≈ 1500. The game is staged
  flat, with no perspective: both soles stand on the same floor line.
- Compare `art/sources/characters/silas-layered/master.png`: both boots apart, both soles on the line
  (1498 and 1496).

**How to fix:**

- Redraw both masters with the same body, clothes, face, scar side and hilt placement as now.
- Plant both soles on y ≈ 1500, at most 4 px apart vertically.
- Place the far foot a little behind the near one (about 80–120 px apart horizontally at the
  heels), so both boots and both ankles are visible and do not overlap.
- Keep the legs straight down from the hips: no stride.

**Then:**

- Re-cut the affected layers from each new master: `farThigh`, `farShin` and `farBoot`, and
  `nearShin` and `nearBoot` if the near leg changes. The eleven layers must still rebuild the
  master pixel for pixel.
- Re-measure `joint-positions.json`. The two ankles must now be within a few pixels in height.
- Update `joints.png`.
- The idle, walk references, kneel and lie drawings are fine: keep them.

**Save:**

- `art/inbox/sigrid-layered/master.png`, plus the changed layers and `joints.png`;
- `art/inbox/sigrid-layered/left/master.png`, plus its changed layers and `joints.png`.

Report your checks as usual (rebuilds pixel for pixel, joint coverage, foot levels).
