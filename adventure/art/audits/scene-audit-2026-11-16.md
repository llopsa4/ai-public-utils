# Scene audit: intro and Chapter 1 (2026-11-16)

Findings only; nothing was changed. Rules checked:

- **Separation** ([PIPELINE.md, scene construction](../PIPELINE.md#scene-construction)): every
  interactable object is a separate transparent image over a clean background, and anything
  that changes is separate too.
- **Scale** ([STYLE.md, proportions](../STYLE.md#proportions)): every depicted object is sized
  against the scene's main character: Silas (220 art px) in the intro, Mara (232 art px) in
  Chapter 1. Reference sizes: table top ≈104, chair or stool seat 48–52, crate ≈48, water jar
  ≈56, lantern ≈32, cot mattress ≈44 art px.
- **Pixel definition** ([STYLE.md, pixel grid](../STYLE.md#the-pixel-grid)): scene art at
  Silas's detail (1-art-pixel grid).

How it was checked: each background was rendered at 1280×720 with its overlays, its hotspot
rectangles and the hero composited at true size, and inspected by eye; sizes are read off those
renders (±10 px). Pixel definition was measured as the share of 2×2 blocks that are one flat
colour (≈1.0 = 2-pixel grid, ≈0.1 = 1-pixel detail). State changes come from the chapter
interaction rules. Not checked in a running game.

## Summary

| Room | Separation | Scale | Pixel definition |
| --- | --- | --- | --- |
| Intro: cell | Fails: cloak, cot/blanket, roster, candle, bucket painted; cloak handled by swapping the whole background | Fails: cot, tin plate, candle; cloak long | 2 px (0.97) |
| Intro: guardroom | Fails: grate (opens, painted, no open state), stove | Fails: ledger | 2 px (1.00) |
| Intro: outer door | Passes (only the wall is clickable) | Minor: lanterns | 2 px (1.00) |
| Ch1: tent | Fails: workbench, jar, chest, drum, stove, tent flap painted | Fails: stool, boots, hanging lantern | 2 px (1.00) |
| Ch1: kiln hall | Fails: tally pillar, hoist frame, jars, cart, kiln mouths, curtain painted | Fails: jars | 2 px (1.00) |
| Ch1: firing house | Fails: shoes, bell, chalk, hearth, soup pot, stairs, bread basket, kiln gate, doorway painted | Fails: shoes | 2 px (1.00) |
| Ch1: gallery | Fails: regulator body, gauge ring, lantern, logbook, rail names, stairs painted | Fails: lantern, logbook and quill | 2 px (1.00) |
| Ch1: ashways | Partly: valve, sweeper, pressure cell separate; pipes and both exits painted | Fails: crate, jar | 2 px (1.00) |

No room follows all three rules. Every room background and every scene object is on the
2-pixel grid (0.92–1.00); only the characters (Silas 0.11, Mara 0.15) and Silas's kneeling-reach
pose are at 1-pixel detail. Soft light overlays (`stairs-light`) are exempt.

## Intro (main character Silas, 220 art px)

### Cell (`room-cell`, `room-cell-bare`)

- Separate already: tin plate, window plate, candle stub, floor wax, mask frame, cell door,
  cage bars (foreground), stairs light.
- Painted interactables:
  - `cloak` changes state, but this is done by swapping to a second full background
    (`cell-bare`) instead of a cloak overlay.
  - Also painted: `roster` portrait, `candle`, `table`, `cot`, `blanket`, `bucket`, `window`
    frame.
- Scale:
  - The cot frame stands ≈115 px high, about 2.5× a cot (≈44); its top is at Silas's hip.
  - The tin plate is ≈60 px wide, about 2× a plate in his hand.
  - The candle is ≈60 px tall, about 2×.
  - The cloak is ≈215 px long, nearly Silas's full height.
  - In proportion: table ≈95, chair seat ≈60, cell door ≈320.

### Guardroom (`room-guardroom`)

- Separate already: ledger, three torches.
- Painted interactables:
  - `grate` opens (`grateOpen`), but there is no open-grate image.
  - Also painted: `stove`, and the `downStairs` exit.
- Scale:
  - The ledger is 88×40 art px, about three quarters of the shelf and taller than Silas's
    head. You decided on 2026-11-16 to leave it unchanged.
  - In proportion: table ≈115, Benn's stool ≈60, stove, grate ≈300.

### Outer door (`room-prison-door`)

- Only `walls` (look) is clickable; the second lantern is an overlay. Passes.
- Scale: the wall lanterns are ≈60 px, about 2× a lantern (≈32). The door is ≈330, about 1.5×
  Silas: fine.

## Chapter 1 (main character Mara, 232 art px)

### Tent (`room-tent`)

- Separate already: rack and cell, notebook, stool cut-out (foreground).
- Painted interactables: `workbench`, `jar`, `chest`, `stool` (the painted copy behind the
  cut-out), `drum`, `stove`, `tentFlap` exit.
- Scale:
  - The stool seat is ≈85 px high, about 1.7× a stool (48–52).
  - The boots by the cot are ≈45 px tall, about 1.5× Mara's own boots.
  - The hanging lantern is ≈60 px, about 2×.
  - In proportion: workbench top ≈120, crate, jar, cot.

### Kiln hall (`room-mara`)

- Separate already: Mara's tent, hoist pulley, name sign, the crate and side cut-outs.
- Painted interactables:
  - The fires inside the kiln mouths are painted, although the kiln goes cold. The game
    recolours the room, but the fire is still drawn in the painting.
  - Also painted: `tally` pillar, `pulleys` (hoist frame), `jars`, `cart`, `niche` (kiln
    mouths), `roomCurtain` exit.
- Scale:
  - The tall jars are ≈95 px, about 1.7× a water jar (≈56).
  - In proportion: cart, kiln doors, curtain doorway ≈320.

### Firing house (`room-firing-house`)

- Separate already: pantry door.
- Painted interactables:
  - The hearth fire is painted, although the kiln goes cold.
  - Also painted: `shoes`, `sign` (bell), `chalk`, `hearth`, `soup` pot, `stairs`,
    `breadBasket`, `kilnGate`, `toRoom` doorway.
- Scale:
  - The shoes on the rack are ≈50 px tall each, about 1.6× Mara's boots.
  - In proportion: table ≈100, stool, stairs, kiln gate ≈335.

### Regulator gallery (`room-gallery`)

- Separate already: regulator socket, gauge face, close-up parts.
- Painted interactables: `regulator` body, `gauge` ring, `lantern`, `logbook`, `railNames`,
  `galleryStairs`.
- Scale:
  - The wall lantern is ≈110 px tall, about 3× a lantern (≈32).
  - The open logbook is ≈80 px wide, wider than Mara's shoulders, and the quill is ≈40 px.
  - The writing desk is low (top ≈75).
  - In proportion: the railing ≈85 and the machine.

### Ashways (`room-ashways`)

- Separate already: valve, sweeper (both states), pressure cell (both states).
- Painted interactables: `pipes`, the `passage` and `wayBack` exits. The crate, jar, banner and
  sign are decoration only.
- Scale:
  - The crate is ≈90 px tall, about 1.9× a crate (≈48).
  - The jar is ≈85 px, about 1.5×.
  - In proportion: valve, sweeper, archway.

## What fixing would take (not authorised)

Each item needs new or replaced art from Codex under the prompt rules:
- a clean background without the interactable objects
- separate overlays sized against the character
- 1-pixel detail

Per the scene rules this audit does not authorise regenerating anything. Static exits (doorways,
stairs) are interactable but never change, so they are the lowest priority.
