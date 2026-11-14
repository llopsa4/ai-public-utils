# Reed garden gate panel

<!-- GENERATED: edit the authoritative source, then run npm run art:briefs -- --private-spec private/kofi1/spec.json. -->

Authoring reference; may contain chapter spoilers. Runtime implementation is separate.

ID: `garden-panel` · object · **target**

## Description

Woven reed panel on two straight sticks, enough space for watering path.

## What the game does with it

Take; Bind; Open; Close

## Placement and layers

- [Riverbank / Amaneti](../rooms/riverbank.md): anchor (1125,510) art px / (562.5,255) logical; world; months supply rack.
- [Riverbank / Amaneti](../rooms/riverbank.md): anchor (1035,610) art px / (517.5,305) logical; world; garden path gap.

## States, visibility and transitions

- **loose** — Panel leaning beside rack. When: Before taken..
- **fixed** — Panel bound across gap; blocks path. When: First fence attempt; reversible..
- **closed** — Hinged panel with latch hole, watering path accessible when opened. When: Cord fitted and pin installed..
- **open** — Panel swung toward rear, same full canvas. When: Test gate once; returns closed after test..

One panel moves rack to gap. All swings contained in the same 104x124 canvas. Watering path is never permanently painted shut.

## Technical

- Canvas: **104×124 art px**. Bottom-centre anchor; preserve dimensions and registration across states.
- Existing palette and world pixel grid; inventory icons use 64×64 transparent tiles.
- Files: `kofi1-garden-panel-loose.png`, `kofi1-garden-panel-fixed.png`, `kofi1-garden-panel-closed.png`, `kofi1-garden-panel-open.png`.

## Prompt for Codex

Woven reed panel on two straight sticks, enough space for watering path. Match the exact frame, state descriptions and attachment registration above. Follow the existing style reference. Preserve separate props and actors; no lettering, baked light pools or background in transparent object assets. This reference does not request new art.

## Attach / references

[STORY.md · kofi1-scene-07](../../../../STORY.md#kofi1-scene-07) · [private/kofi1/spec.json](../../spec.json) · [art/STYLE.md](../../../../art/STYLE.md) · [Chapter index](../INDEX.md)

Style attachments: [art/STYLE.md](../../../../art/STYLE.md) · [art/style/palette.png](../../../../art/style/palette.png) · [art/style/scale.png](../../../../art/style/scale.png) · [tent-reference.png](../../../../tent-reference.png)
