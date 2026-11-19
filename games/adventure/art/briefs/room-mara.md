# Room: The Kiln Hall

<!-- GENERATED: edit the authoritative source, then run npm run art:briefs -- --chapter ch1. -->

Reference for the implemented chapter; existing artwork is preserved.

## Description

The kiln hall, the heart of Cinderfold: a vast hall built inside an old brick kiln, seen flat-on. The back wall is the kiln's curved inner brickwork, soot-blackened above and warm-coloured below, rising into a vault that fades to darkness at the top. Across the middle of the back wall, a row of three great arched kiln mouths with heavy iron doors standing open, coals visible inside (the clickable 'niche'). Far left: a section of plastered wall covered in rows of tally scratches and chalk marks. Left: a pulley hoist hanging from a beam in the vault, chains and a big clay pot (the hoist itself is drawn separately as a prop; paint only the beam it hangs from). Left of centre on the floor: a cluster of tall storage jars, and Mara's canvas tent pitched on the stone floor (the tent is drawn separately as an object; leave that floor spot plain). Right: an iron ash cart on small wheels with a shovel in it. Right edge: a heavy patched curtain hung in a brick archway, the way to the firing house. Stone flags on the floor, scattered clinker and ash; in the front corners of the floor a little rubble and broken pots (they are cut out to walk behind).

## What the game does with it

- **reference** — All implemented conditional placements; each target and sprite lists its own flag conditions.

Source: [src/chapters/ch1/rooms.ts · L138](../../src/chapters/ch1/rooms.ts#L138)

## Fixed background

The kiln hall, the heart of Cinderfold: a vast hall built inside an old brick kiln, seen flat-on. The back wall is the kiln's curved inner brickwork, soot-blackened above and warm-coloured below, rising into a vault that fades to darkness at the top. Across the middle of the back wall, a row of three great arched kiln mouths with heavy iron doors standing open, coals visible inside (the clickable 'niche'). Far left: a section of plastered wall covered in rows of tally scratches and chalk marks. Left: a pulley hoist hanging from a beam in the vault, chains and a big clay pot (the hoist itself is drawn separately as a prop; paint only the beam it hangs from). Left of centre on the floor: a cluster of tall storage jars, and Mara's canvas tent pitched on the stone floor (the tent is drawn separately as an object; leave that floor spot plain). Right: an iron ash cart on small wheels with a shovel in it. Right edge: a heavy patched curtain hung in a brick archway, the way to the firing house. Stone flags on the floor, scattered clinker and ash; in the front corners of the floor a little rubble and broken pots (they are cut out to walk behind).

## Interactive targets — puzzle order

- **scratches on the pillar** (tally): look. Bounds (6,276), 92×228 art px. When: Always. [hall-tally](hall-tally.md).
- **Mara's tent** (toTent): look, go. Bounds (384,248), 224×280 art px. When: Always. [tent](tent.md).
- **kiln mouths** (niche): look, use. Bounds (640,240), 360×240 art px. When: Always.
- **pulley hoist** (pulleys): look, use. Bounds (108,38), 176×360 art px. When: Always. [hall-hoist](hall-hoist.md).
- **storage jars** (jars): look, take. Bounds (258,440), 120×64 art px. When: Always. [hall-jars](hall-jars.md).
- **ash cart** (cart): look, use. Bounds (1008,376), 144×128 art px. When: Always. [hall-cart](hall-cart.md).
- **way to the firing house** (roomCurtain): look, go. Bounds (1184,208), 96×320 art px. When: Always.

## Sprites used by targets

- [hall-tally](hall-tally.md) — 96×232 art px. Anchor (53,504), world; Always.
- [tent](tent.md) — 224×280 art px. Anchor (496,528), world; Always.
- [hall-hoist](hall-hoist.md) — 176×360 art px. Anchor (196,398), world; Always.
- [hall-jars](hall-jars.md) — 120×64 art px. Anchor (318,504), world; Always.
- [hall-cart](hall-cart.md) — 144×128 art px. Anchor (1080,504), world; Always.

## Separate visual-only objects and changing scenery

- [kiln-fire](kiln-fire.md) — 56×44 art px. Anchor (680,442), world; Always; kilnCold: lit -> cold. Anchor (805,442), world; Always; kilnCold: lit -> cold. Anchor (930,442), world; Always; kilnCold: lit -> cold.

## Foreground layers

- [hall-crate](hall-crate.md) — 68×58 art px. Anchor (196,622), foreground; Always.
- [hall-left](hall-left.md) — 178×104 art px. Anchor (0,616), foreground; Always.
- [hall-right](hall-right.md) — 166×92 art px. Anchor (1114,628), foreground; Always.

## Walking space, exits and staging

Primary background: room-mara. Existing painting: art/src/rooms/mara-room.png.

Sprite dimensions are read from each existing atlas sourceSize, preserving transparent frame registration. The room diagram uses those dimensions rather than old manifest guesses.

- **Mara's tent** at (496,560): Target toTent; Always.
- **way to the firing house** at (1232,580): Target roomCurtain; Always.

- speaker.mara: fromTent: feet (496,584) art px; reference only.
- speaker.mara: fromFiringHouse: feet (1200,592) art px; reference only.

## Asset contract

1280×720 room frame. [Annotated layout](../spec/maraRoom.svg). Preserve the scoped exceptions in this room's description.

## Sources

[src/chapters/ch1/rooms.ts · L138](../../src/chapters/ch1/rooms.ts#L138) · [Chapter index](INDEX-ch1.md)

Shared guides: [art/PIPELINE.md](../PIPELINE.md) · [art/STYLE.md](../STYLE.md) · [art/LAYERED-RIG.md](../LAYERED-RIG.md) · [../WORKFLOW.md](../../../WORKFLOW.md) · [Chapter rules](RULES-ch1.md)
