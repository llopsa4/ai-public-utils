# Room: Mara's Tent

<!-- GENERATED: edit the authoritative source, then run npm run art:briefs -- --chapter ch1. -->

Reference for the implemented chapter; existing artwork is preserved.

## Description

C7 r2 clean tent backing: patched canvas, warm small lantern, new tinkerer tool board, coat, cot and boots, striped rug and kiln-hall doorway. The workbench, notebook, water jug, charging cradle, courier crate, drum, stove and stool are separate drawings; no painted duplicates.

## What the game does with it

- **reference** — All implemented conditional placements; each target and sprite lists its own flag conditions.

Source: [src/chapters/ch1/rooms.ts · L94](../../src/chapters/ch1/rooms.ts#L94)

## Fixed background

C7 r2 clean tent backing: patched canvas, warm small lantern, new tinkerer tool board, coat, cot and boots, striped rug and kiln-hall doorway. The workbench, notebook, water jug, charging cradle, courier crate, drum, stove and stool are separate drawings; no painted duplicates.

## Interactive targets — puzzle order

- **mother's notebook** (notebook): look, take, open. Bounds (80,400), 40×20 art px. When: [{"notFlag":"hasNotebook"}]. [notebook](notebook.md).
- **charging rack** (rack): look, take, use. Bounds (310,364), 40×52 art px. When: Always. [rack](rack.md).
- **water jar** (jar): look, take. Bounds (208,360), 48×56 art px. When: Always. [tent-jar](tent-jar.md).
- **clothes crate** (chest): look, open, use. Bounds (70,448), 72×52 art px. When: Always. [tent-chest](tent-chest.md).
- **stool** (stool): look, use. Bounds (196,496), 64×52 art px. When: Always.
- **workbench** (workbench): look, use. Bounds (28,372), 360×148 art px. When: Always. [tent-workbench](tent-workbench.md).
- **old brush drum** (drum): look, use. Bounds (484,388), 188×132 art px. When: Always. [tent-drum](tent-drum.md).
- **clay stove** (stove): look, use, open. Bounds (732,412), 76×96 art px. When: Always. [tent-stove](tent-stove.md).
- **tent flap** (tentFlap): look, go, open. Bounds (1132,168), 148×372 art px. When: Always.

## Sprites used by targets

- [notebook](notebook.md) — 40×14 art px. Anchor (100,416), world; [{"notFlag":"hasNotebook"}].
- [rack](rack.md) — 40×52 art px. Anchor (330,416), world; Always; hasGauntlet: full -> empty.
- [tent-jar](tent-jar.md) — 48×56 art px. Anchor (232,416), world; Always.
- [tent-chest](tent-chest.md) — 72×52 art px. Anchor (106,500), world; Always.
- [tent-workbench](tent-workbench.md) — 360×148 art px. Anchor (208,520), world; Always.
- [tent-drum](tent-drum.md) — 192×132 art px. Anchor (578,518), world; Always.
- [tent-stove](tent-stove.md) — 80×108 art px. Anchor (770,516), world; Always.

## Separate visual-only objects and changing scenery

None.

## Foreground layers

- [tent-stool](tent-stool.md) — 72×56 art px. Anchor (192,492), foreground; Always.

## Walking space, exits and staging

Primary background: room-tent. Existing painting: art/src/rooms/tent.png.

Sprite dimensions are read from each existing atlas sourceSize, preserving transparent frame registration. The room diagram uses those dimensions rather than old manifest guesses.

- **tent flap** at (1212,568): Target tentFlap; Always.

- speaker.mara: start: feet (640,600) art px; reference only.
- speaker.mara: fromKilnHall: feet (1192,584) art px; reference only.

## Asset contract

1280×720 room frame. [Annotated layout](../spec/tent.svg). Preserve the scoped exceptions in this room's description.

## Sources

[src/chapters/ch1/rooms.ts · L94](../../src/chapters/ch1/rooms.ts#L94) · [Chapter index](INDEX-ch1.md)

Shared guides: [art/PIPELINE.md](../PIPELINE.md) · [art/STYLE.md](../STYLE.md) · [art/LAYERED-RIG.md](../LAYERED-RIG.md) · [WORKFLOW.md](../../WORKFLOW.md) · [Chapter rules](RULES-ch1.md)
