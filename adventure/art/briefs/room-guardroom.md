# Room: Guardroom

<!-- GENERATED: edit the authoritative source, then run npm run art:briefs -- --chapter intro. -->

Reference for the implemented chapter; existing artwork is preserved.

## Description

The guardroom above the prison cells: the return stairway at the left edge, an empty shelf for the separately drawn red tally ledger, a black iron stove in the middle, Kell’s desk left of the stove, and the iron grate at the right edge opening onto the snowy night. The clerk’s hood is not on a peg. Three wall torches and their runtime flames light the room; the ledger disappears when collected.

## What the game does with it

- **reference** — All implemented conditional placements; each target and sprite lists its own flag conditions.

Source: [src/chapters/intro/rooms.ts · L134](../../src/chapters/intro/rooms.ts#L134)

## Fixed background

The guardroom above the prison cells: the return stairway at the left edge, an empty shelf for the separately drawn red tally ledger, a black iron stove in the middle, Kell’s desk left of the stove, and the iron grate at the right edge opening onto the snowy night. The clerk’s hood is not on a peg. Three wall torches and their runtime flames light the room; the ledger disappears when collected.

## Interactive targets — puzzle order

- **Tally ledger** (ledger): look, take, open. Bounds (392,392), 80×36 art px. When: [{"notFlag":"tookLedger"}]. [guardroom-ledger](guardroom-ledger.md).
- **Iron grate** (grate): look, open, go, use. Bounds (1120,220), 152×304 art px. When: Always.
- **Stairs down** (downStairs): look, go. Bounds (0,300), 80×224 art px. When: Always.
- **Stove** (stove): look, use. Bounds (600,360), 120×164 art px. When: Always.

## Sprites used by targets

- [guardroom-ledger](guardroom-ledger.md) — 88×40 art px. Anchor (432,426), world; [{"notFlag":"tookLedger"}].

## Separate visual-only objects and changing scenery

- [guardroom-torch](guardroom-torch.md) — 14×90 art px. Anchor (82,104), world; Always. Anchor (958,102), world; Always. Anchor (821,262), world; Always.

## Foreground layers

None.

## Walking space, exits and staging

Primary background: room-guardroom. Existing painting: art/src/intro/rooms/guardroom.png.

Actor target guard: look, talk, read; visibility [{"flag":"guardGone"}]. Actor scale and placement are listed separately; no new actor artwork is requested.

Actor target warden: look, talk, read; visibility [{"notFlag":"wardenBusy"}]. Actor scale and placement are listed separately; no new actor artwork is requested.

Sprite dimensions are read from each existing atlas sourceSize, preserving transparent frame registration. The room diagram uses those dimensions rather than old manifest guesses.

- **Iron grate** at (1180,592): Target grate; Always.
- **Stairs down** at (60,600): Target downStairs; Always.

- Silas: fromCell: feet (100,600) art px; reference only.
- Benn: feet (764,612) art px; reference only.
- Kell: feet (544,608) art px; reference only.

## Asset contract

1280×720 room frame. [Annotated layout](../spec/guardroom.svg). Preserve the scoped exceptions in this room's description.

## Sources

[src/chapters/intro/rooms.ts · L134](../../src/chapters/intro/rooms.ts#L134) · [Chapter index](INDEX-intro.md)

Shared guides: [art/PIPELINE.md](../PIPELINE.md) · [art/STYLE.md](../STYLE.md) · [art/LAYERED-RIG.md](../LAYERED-RIG.md) · [WORKFLOW.md](../../WORKFLOW.md) · [Chapter rules](RULES-intro.md)
