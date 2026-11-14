# Amaneti garden latch pin

<!-- GENERATED: edit the authoritative source, then run npm run art:briefs -- --private-spec private/kofi1/spec.json. -->

Authoring reference; may contain chapter spoilers. Runtime implementation is separate.

ID: `garden-pin` · object · **target**

## Description

New plain wooden pin, clearly functional rather than ornamental.

## What the game does with it

Take; Use as garden latch

## Placement and layers

- [Riverbank / Amaneti](../rooms/riverbank.md): anchor (1170,470) art px / (585,235) logical; world; months rack.
- [Riverbank / Amaneti](../rooms/riverbank.md): anchor (1070,540) art px / (535,270) logical; world; installed garden panel. Attached to garden-panel-riverbank-1, offset (35,-70).

## States, visibility and transitions

- **idle** — One new latch pin. When: Remove from rack on Take; hide while carried; show installed after use..

Distinct identity from Tsalohi cross-pin, which was lost.

## Technical

- Canvas: **30×14 art px**. Bottom-centre anchor; preserve dimensions and registration across states.
- Existing palette and world pixel grid; inventory icons use 64×64 transparent tiles.
- Files: `kofi1-garden-pin-idle.png`.

## Prompt for Codex

New plain wooden pin, clearly functional rather than ornamental. Match the exact frame, state descriptions and attachment registration above. Follow the existing style reference. Preserve separate props and actors; no lettering, baked light pools or background in transparent object assets. This reference does not request new art.

## Attach / references

[STORY.md · kofi1-scene-07](../../../../STORY.md#kofi1-scene-07) · [private/kofi1/spec.json](../../spec.json) · [art/STYLE.md](../../../../art/STYLE.md) · [Chapter index](../INDEX.md)

Style attachments: [art/STYLE.md](../../../../art/STYLE.md) · [art/style/palette.png](../../../../art/style/palette.png) · [art/style/scale.png](../../../../art/style/scale.png) · [tent-reference.png](../../../../tent-reference.png)
