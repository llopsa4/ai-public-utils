# Dedicated ground-door braces

<!-- GENERATED: edit the authoritative source, then run npm run art:briefs -- --private-spec private/kofi1/spec.json. -->

Authoring reference; may contain chapter spoilers. Runtime implementation is separate.

ID: `door-braces` · object · **target**

## Description

Two plain stout timber bars, no metal hardware required.

## What the game does with it

Take; Use on marked doors

## Placement and layers

- [Riverbank / Amaneti](../rooms/riverbank.md): anchor (1130,480) art px / (565,240) logical; world; months rack.
- [Riverbank / Amaneti](../rooms/riverbank.md): anchor (1000,460) art px / (500,230) logical; world; Oweli door installed. Attached to ground-door-riverbank-0, offset (0,-64).
- [Riverbank / Amaneti](../rooms/riverbank.md): anchor (745,460) art px / (372.5,230) logical; world; Saluna door installed. Attached to ground-door-riverbank-1, offset (0,-64).

## States, visibility and transitions

- **idle** — One bar drawing reused twice. When: Two available at rack; one hides per installation, one appears on each door when fitted..

Inventory may represent pair with count two; no infinite duplication. Both installations required; no visible double bar on same door.

## Asset contract

- Canvas: **74×20 art px**. Bottom-centre anchor; preserve dimensions and registration across states.
- Files: `kofi1-door-braces-idle.png`.

## Sources

[STORY.md · kofi1-scene-07](../../../../STORY.md#kofi1-scene-07) · [private/kofi1/spec.json](../../spec.json) · [art/STYLE.md](../../../../art/STYLE.md) · [Chapter index](../INDEX.md)

Shared guides: [art/PIPELINE.md](../../../../art/PIPELINE.md) · [art/STYLE.md](../../../../art/STYLE.md) · [art/LAYERED-RIG.md](../../../../art/LAYERED-RIG.md) · [WORKFLOW.md](../../../../WORKFLOW.md) · [Chapter rules](../DRAWING-RULES.md)
