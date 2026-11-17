# Room: Regulator Gallery

<!-- GENERATED: edit the authoritative source, then run npm run art:briefs -- --chapter ch1. -->

Reference for the implemented chapter; existing artwork is preserved.

## Description

The regulator gallery, high in the kiln, seen flat-on: an iron-plated walkway along great ceramic pipes. Left wall: an iron hook with a lantern hanging on it. Left: Oren's small writing desk with an open logbook and an inkpot. Centre-left: the regulator housing, a tall ceramic and iron machine where the great pipes meet, with a round ring socket in its middle (the ring itself is an object drawn separately: leave its round recess empty) and a large pressure gauge dial on top (the gauge face is a separate prop). Behind the walkway: an iron railing with names scratched into its top bar, and below it a glimpse of the drop into the dark kiln. Right edge: iron stairs going down to the firing house. Riveted iron floor plates, slightly wet.

## What the game does with it

- **reference** — All implemented conditional placements; each target and sprite lists its own flag conditions.

Source: [src/chapters/ch1/rooms.ts · L237](../../src/chapters/ch1/rooms.ts#L237)

## Fixed background

The regulator gallery, high in the kiln, seen flat-on: an iron-plated walkway along great ceramic pipes. Left wall: an iron hook with a lantern hanging on it. Left: Oren's small writing desk with an open logbook and an inkpot. Centre-left: the regulator housing, a tall ceramic and iron machine where the great pipes meet, with a round ring socket in its middle (the ring itself is an object drawn separately: leave its round recess empty) and a large pressure gauge dial on top (the gauge face is a separate prop). Behind the walkway: an iron railing with names scratched into its top bar, and below it a glimpse of the drop into the dark kiln. Right edge: iron stairs going down to the firing house. Riveted iron floor plates, slightly wet.

## Interactive targets — puzzle order

- **scratched railing** (railNames): look. Bounds (448,424), 132×84 art px. When: Always. [gallery-names](gallery-names.md).
- **pressure gauge** (gauge): look, use. Bounds (760,42), 88×88 art px. When: Always.
- **regulator** (regulator): look, use, take, open. Bounds (640,128), 320×400 art px. When: Always. [gallery-regulator](gallery-regulator.md).
- **Oren's logbook** (logbook): look, take. Bounds (1062,380), 96×44 art px. When: Always. [gallery-logbook](gallery-logbook.md).
- **lantern** (lantern): look, take. Bounds (1200,292), 48×64 art px. When: Always. [gallery-lantern](gallery-lantern.md).
- **way to the firing house** (galleryStairs): look, go. Bounds (0,424), 176×200 art px. When: Always.

## Sprites used by targets

- [gallery-names](gallery-names.md) — 132×80 art px. Anchor (514,508), world; Always.
- [gallery-regulator](gallery-regulator.md) — 384×412 art px. Anchor (806,528), world; Always; patchFailed: cracked -> ringCracked.
- [gallery-logbook](gallery-logbook.md) — 80×32 art px. Anchor (1110,418), world; Always.
- [gallery-lantern](gallery-lantern.md) — 24×44 art px. Anchor (1224,350), world; Always.
- [socket](socket.md) — 160×160 art px. Anchor (800,460), world; Always; kilnCold: installed -> removed.

## Separate visual-only objects and changing scenery

None.

## Foreground layers

None.

## Walking space, exits and staging

Primary background: room-gallery. Existing painting: art/src/rooms/gallery.png.

Actor target oren: look, talk, crouch, lie, stand; visibility Always. Actor scale and placement are listed separately; no new actor artwork is requested.

Sprite dimensions are read from each existing atlas sourceSize, preserving transparent frame registration. The room diagram uses those dimensions rather than old manifest guesses.

- **way to the firing house** at (204,572): Target galleryStairs; Always.

- speaker.mara: fromFiringHouse: feet (204,572) art px; reference only.
- Oren: feet (320,592) art px; reference only.

## Asset contract

1280×720 room frame. [Annotated layout](../spec/gallery.svg). Preserve the scoped exceptions in this room's description.

## Sources

[src/chapters/ch1/rooms.ts · L237](../../src/chapters/ch1/rooms.ts#L237) · [Chapter index](INDEX-ch1.md)

Shared guides: [art/PIPELINE.md](../PIPELINE.md) · [art/STYLE.md](../STYLE.md) · [art/LAYERED-RIG.md](../LAYERED-RIG.md) · [../process/WORKFLOW.md](../../../process/WORKFLOW.md) · [Chapter rules](RULES-ch1.md)
