# Room: Cell

<!-- GENERATED: edit the authoritative source, then run npm run art:briefs -- --chapter intro. -->

Reference for the implemented chapter; existing artwork is preserved.

## Description

The user-approved C7 r1 prison cell at Silas's 1px detail: clean stone architecture, barred window, wall plates, bare cloak nail and fixed guard chair. Cot, blanket, bucket, roster, table with cup, candles, cloak, floor wax, mask frame and plate states are independent overlays over complete backing. The stairs remain offscreen; only their doorway light reaches the floor. Approved cage and gate r4 retain their registration. Floor seam y477; true Silas-relative proportions and approved 34px blanket.

## What the game does with it

- **reference** — All implemented conditional placements; each target and sprite lists its own flag conditions.

Source: [src/chapters/intro/rooms.ts · L60](../../src/chapters/intro/rooms.ts#L60)

## Fixed background

The user-approved C7 r1 prison cell at Silas's 1px detail: clean stone architecture, barred window, wall plates, bare cloak nail and fixed guard chair. Cot, blanket, bucket, roster, table with cup, candles, cloak, floor wax, mask frame and plate states are independent overlays over complete backing. The stairs remain offscreen; only their doorway light reaches the floor. Approved cage and gate r4 retain their registration. Floor seam y477; true Silas-relative proportions and approved 34px blanket.

## Interactive targets — puzzle order

- **Tin plate** (plate): look, take. Bounds (206,612), 60×18 art px. When: [{"notFlag":"tookPlate"}]. [floor-plate](floor-plate.md).
- **Mask frame** (frame): look, take. Bounds (968,536), 44×24 art px. When: [{"flag":"cellLit"},{"notFlag":"gotFrame"}]. [table-frame](table-frame.md).
- **Harrow's portrait** (roster): look. Bounds (1070,254), 44×56 art px. When: [{"flag":"cellLit"}]. [cell-roster](cell-roster.md).
- **Hooded cloak** (cloak): look, take. Bounds (918,188), 88×156 art px. When: [{"flag":"cellLit"},{"notFlag":"tookCloak"}]. [cell-cloak](cell-cloak.md).
- **Candle** (candle): look, take. Bounds (938,530), 16×32 art px. When: Always. [cell-candle](cell-candle.md).
- **Barred window** (window): look, use. Bounds (280,124), 120×124 art px. When: Always.
- **Spilt tallow** (floorWax): look, take. Bounds (780,620), 48×28 art px. When: [{"flag":"cellLit"},{"notFlag":"tookWax"}]. [floor-wax](floor-wax.md).
- **Candle stub** (tableStub): look, take. Bounds (888,548), 16×16 art px. When: [{"flag":"cellLit"}]. [table-stub](table-stub.md).
- **Guard's table** (table): look, take. Bounds (874,548), 212×104 art px. When: Always. [cell-table](cell-table.md).
- **Grey blanket** (blanket): look, take, use. Bounds (86,532), 208×34 art px. When: Always. [cell-blanket](cell-blanket.md).
- **Straw cot** (cot): look, use, take. Bounds (70,516), 240×62 art px. When: Always. [cell-cot](cell-cot.md).
- **Bucket** (bucket): look, use, take. Bounds (602,528), 52×58 art px. When: [{"flag":"cellLit"}]. [cell-bucket](cell-bucket.md).
- **Cell door** (cellDoor): look, open, use. Bounds (350,348), 100×320 art px. When: [{"notFlag":"cellOpen"}]. [cell-gate](cell-gate.md).
- **Stairs up** (cellStairs): look, go. Bounds (1108,644), 172×48 art px. When: Always. [stairs-light](stairs-light.md).

## Sprites used by targets

- [floor-plate](floor-plate.md) — 36×18 art px. Anchor (236,626), world; [{"notFlag":"tookPlate"}].
- [table-frame](table-frame.md) — 44×24 art px. Anchor (990,560), world; [{"flag":"cellLit"},{"notFlag":"gotFrame"}].
- [cell-roster](cell-roster.md) — 52×64 art px. Anchor (1092,308), world; Always.
- [cell-cloak](cell-cloak.md) — 96×160 art px. Anchor (962,346), world; [{"notFlag":"tookCloak"}].
- [cell-candle](cell-candle.md) — 16×40 art px. Anchor (946,560), world; Always.
- [floor-wax](floor-wax.md) — 28×10 art px. Anchor (804,640), world; [{"flag":"cellLit"},{"notFlag":"tookWax"}].
- [table-stub](table-stub.md) — 16×16 art px. Anchor (896,560), world; Always.
- [cell-table](cell-table.md) — 224×108 art px. Anchor (980,652), world; Always.
- [cell-blanket](cell-blanket.md) — 216×48 art px. Anchor (190,566), world; Always.
- [cell-cot](cell-cot.md) — 256×72 art px. Anchor (190,578), world; Always.
- [cell-bucket](cell-bucket.md) — 64×64 art px. Anchor (628,586), world; Always.
- [cell-gate](cell-gate.md) — 176×324 art px. Anchor (366,676), world; Always; cellOpen: closed -> open.
- [stairs-light](stairs-light.md) — 200×52 art px. Anchor (1180,694), world; Always.

## Separate visual-only objects and changing scenery

- [window-plate](window-plate.md) — 36×24 art px. Anchor (340,246), world; [{"flag":"cellLit"}].

## Foreground layers

- [cell-cage](cell-cage.md) — 1280×720 art px. Anchor (0,0), foreground; Always.

## Walking space, exits and staging

Primary background: room-cell. Existing painting: art/src/intro/rooms/cell.png.

Actor target guard: look, talk, read; visibility [{"notFlag":"guardGone"}]. Actor scale and placement are listed separately; no new actor artwork is requested.

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
