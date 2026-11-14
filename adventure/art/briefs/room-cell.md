# Room: Cell

<!-- GENERATED: edit the authoritative source, then run npm run art:briefs -- --chapter intro. -->

Reference for the implemented chapter; existing artwork is preserved.

## Description

Ironhaven’s prison cell at night in its approved gentle three-quarter cage view: a cot and ragged blanket, high barred window, bucket and plate inside the cage; the small gate opens in the front bars, with the cage’s right side receding toward the back wall. Beyond it stand the guard’s table, candle, cup and Harrow portrait; Silas’s hooded cloak hangs on its nail. The table stub, fallen floor tallow, mask frame, plate placements, cage and gate are separate layers. The stairwell itself is offscreen to the right; only its doorway light lies on the floor. Preserve the approved painting and cage perspective.

## What the game does with it

- **reference** — All implemented conditional placements; each target and sprite lists its own flag conditions.

Source: [src/chapters/intro/rooms.ts · L60](../../src/chapters/intro/rooms.ts#L60)

## Fixed background

Ironhaven’s prison cell at night in its approved gentle three-quarter cage view: a cot and ragged blanket, high barred window, bucket and plate inside the cage; the small gate opens in the front bars, with the cage’s right side receding toward the back wall. Beyond it stand the guard’s table, candle, cup and Harrow portrait; Silas’s hooded cloak hangs on its nail. The table stub, fallen floor tallow, mask frame, plate placements, cage and gate are separate layers. The stairwell itself is offscreen to the right; only its doorway light lies on the floor. Preserve the approved painting and cage perspective.

## Interactive targets — puzzle order

- **Tin plate** (plate): look, take. Bounds (316,600), 60×28 art px. When: [{"notFlag":"tookPlate"}]. [floor-plate](floor-plate.md).
- **Mask frame** (frame): look, take. Bounds (968,532), 44×24 art px. When: [{"flag":"cellLit"},{"notFlag":"gotFrame"}]. [table-frame](table-frame.md).
- **Harrow's portrait** (roster): look. Bounds (1054,230), 76×100 art px. When: [{"flag":"cellLit"}].
- **Hooded cloak** (cloak): look, take. Bounds (914,190), 92×224 art px. When: [{"flag":"cellLit"},{"notFlag":"tookCloak"}].
- **Candle** (candle): look, take. Bounds (932,492), 28×68 art px. When: Always.
- **Barred window** (window): look, use. Bounds (280,124), 120×124 art px. When: Always.
- **Spilt tallow** (floorWax): look, take. Bounds (780,620), 48×28 art px. When: [{"flag":"cellLit"},{"notFlag":"tookWax"}]. [floor-wax](floor-wax.md).
- **Candle stub** (tableStub): look, take. Bounds (880,524), 32×40 art px. When: [{"flag":"cellLit"}]. [table-stub](table-stub.md).
- **Guard's table** (table): look, take. Bounds (874,544), 212×110 art px. When: Always.
- **Grey blanket** (blanket): look, take, use. Bounds (96,472), 208×92 art px. When: Always.
- **Straw cot** (cot): look, use, take. Bounds (50,470), 280×114 art px. When: Always.
- **Bucket** (bucket): look, use, take. Bounds (594,510), 68×76 art px. When: [{"flag":"cellLit"}].
- **Cell door** (cellDoor): look, open, use. Bounds (350,348), 100×320 art px. When: [{"notFlag":"cellOpen"}]. [cell-gate](cell-gate.md).
- **Stairs up** (cellStairs): look, go. Bounds (1108,644), 172×48 art px. When: Always. [stairs-light](stairs-light.md).

## Conditional background variants

- [room-cell-bare](room-cell-bare.md): [{"flag":"tookCloak"}]

## Sprites used by targets

- [floor-plate](floor-plate.md) — 60×24 art px. Anchor (346,624), world; [{"notFlag":"tookPlate"}].
- [table-frame](table-frame.md) — 44×24 art px. Anchor (990,556), world; [{"flag":"cellLit"},{"notFlag":"gotFrame"}].
- [floor-wax](floor-wax.md) — 28×10 art px. Anchor (804,640), world; [{"flag":"cellLit"},{"notFlag":"tookWax"}].
- [table-stub](table-stub.md) — 28×36 art px. Anchor (896,562), world; Always.
- [cell-gate](cell-gate.md) — 176×324 art px. Anchor (366,676), world; Always; cellOpen: closed -> open.
- [stairs-light](stairs-light.md) — 200×52 art px. Anchor (1180,694), world; Always.

## Separate visual-only objects and changing scenery

- [window-plate](window-plate.md) — 44×28 art px. Anchor (340,246), world; [{"flag":"cellLit"}].

## Foreground layers

- [cell-cage](cell-cage.md) — 1280×720 art px. Anchor (0,0), foreground; Always.

## Walking space, exits and staging

Primary background: room-cell. Existing painting: art/src/intro/rooms/cell.png.

Actor target guard: look, talk, read; visibility [{"notFlag":"guardGone"}]. Actor scale and placement are listed separately; no new actor artwork is requested.

Alternate background room-cell-bare: [{"flag":"tookCloak"}]. Keep this implemented background switch; do not invent a removable cloak sprite.

Changed walking area: [{"flag":"cellOpen"}]; outer=[[32,536],[788,536],[744,656],[448,656],[448,680],[772,680],[820,600],[872,600],[872,668],[1272,668],[1272,704],[356,704],[356,656],[32,656]].

Sprite dimensions are read from each existing atlas sourceSize, preserving transparent frame registration. The room diagram uses those dimensions rather than old manifest guesses.

- **Stairs up** at (1228,672): Target cellStairs; Always.

- Silas: start: feet (200,610) art px; reference only.
- Silas: fromGuardroom: feet (1224,672) art px; reference only.
- Benn: feet (1140,652) art px; reference only.

## Asset contract

1280×720 room frame. [Annotated layout](../spec/cell.svg). Preserve the scoped exceptions in this room's description.

## Sources

[src/chapters/intro/rooms.ts · L60](../../src/chapters/intro/rooms.ts#L60) · [Chapter index](INDEX-intro.md)

Shared guides: [art/PIPELINE.md](../PIPELINE.md) · [art/STYLE.md](../STYLE.md) · [art/LAYERED-RIG.md](../LAYERED-RIG.md) · [WORKFLOW.md](../../WORKFLOW.md) · [Chapter rules](RULES-intro.md)
