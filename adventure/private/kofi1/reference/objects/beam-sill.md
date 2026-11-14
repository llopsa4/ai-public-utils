# Beam’s stone sill

<!-- GENERATED: edit the authoritative source, then run npm run art:briefs -- --private-spec private/kofi1/spec.json. -->

Authoring reference; may contain chapter spoilers. Runtime implementation is separate.

ID: `beam-sill` · object · **target**

## Description

A broad low masonry sill with a stepped cap: a raised right shoulder supports the far beam end; the lower left cap receives the wedge beneath the lifted end.

## What the game does with it

Look; pole leverage reference

## Placement and layers

- [Kofi’s hut](../rooms/kofi-hut.md): anchor (900,526) art px / (450,263) logical; rear; all hut phases.

## States, visibility and transitions

- **idle** — Plain stone with clear contact top. When: Always; pole uses this fixed support..

Canvas 300x96, anchor (900,526): world x=750..1050. Lower cap runs at world y=450 from x=750..980; right shoulder rises to y=430 at x=980..1050. Wedge base at (800,450) rests on this cap, never on unsupported net or empty air. Far beam contact is (1000,430).

## Technical

- Canvas: **300×96 art px**. Bottom-centre anchor; preserve dimensions and registration across states.
- Existing palette and world pixel grid; inventory icons use 64×64 transparent tiles.
- Files: `kofi1-beam-sill-idle.png`.

## Prompt for Codex

A broad low masonry sill with a stepped cap: a raised right shoulder supports the far beam end; the lower left cap receives the wedge beneath the lifted end. Match the exact frame, state descriptions and attachment registration above. Follow the existing style reference. Preserve separate props and actors; no lettering, baked light pools or background in transparent object assets. This reference does not request new art.

## Attach / references

[STORY.md · kofi1-scene-09](../../../../STORY.md#kofi1-scene-09) · [private/kofi1/spec.json](../../spec.json) · [art/STYLE.md](../../../../art/STYLE.md) · [Chapter index](../INDEX.md)

Style attachments: [art/STYLE.md](../../../../art/STYLE.md) · [art/style/palette.png](../../../../art/style/palette.png) · [art/style/scale.png](../../../../art/style/scale.png) · [tent-reference.png](../../../../tent-reference.png)
