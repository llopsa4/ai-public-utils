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

## Asset contract

- Canvas: **300×96 art px**. Bottom-centre anchor; preserve dimensions and registration across states.
- Files: `kofi1-beam-sill-idle.png`.

## Sources

[STORY.md · kofi1-scene-09](../../../../STORY.md#kofi1-scene-09) · [private/kofi1/spec.json](../../spec.json) · [art/STYLE.md](../../../../art/STYLE.md) · [Chapter index](../INDEX.md)

Shared guides: [art/PIPELINE.md](../../../../art/PIPELINE.md) · [art/STYLE.md](../../../../art/STYLE.md) · [art/LAYERED-RIG.md](../../../../art/LAYERED-RIG.md) · [../WORKFLOW.md](../../../../../WORKFLOW.md) · [Chapter rules](../DRAWING-RULES.md)
