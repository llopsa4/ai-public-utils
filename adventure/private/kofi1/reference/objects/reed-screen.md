# Loose reed grit screen

<!-- GENERATED: edit the authoritative source, then run npm run art:briefs -- --private-spec private/kofi1/spec.json. -->

Authoring reference; may contain chapter spoilers. Runtime implementation is separate.

ID: `reed-screen` · object · **target**

## Description

Small open weave of pale reed strips, coarse enough to read as grit screen.

## What the game does with it

Take; Use on trough

## Placement and layers

- [Riverbank / Amaneti](../rooms/riverbank.md): anchor (825,510) art px / (412.5,255) logical; world; water-a bundle.
- [Riverbank / Amaneti](../rooms/riverbank.md): anchor (360,445) art px / (180,222.5) logical; world; on installed trough. Attached to trough-riverbank-1, offset (0,-55).
- [Riverbank / Amaneti](../rooms/riverbank.md): anchor (805,485) art px / (402.5,242.5) logical; world; Deyu survives; screen already attached to the supplied trough. Attached to trough-riverbank-0, offset (0,-55).

## States, visibility and transitions

- **idle** — Flat small mesh panel. When: Enali route loose until taken; hides from bundle when fitted. Deyu route fitted from start..

Draw separate from trough so route A can visibly add it; no claim that this makes water safe.

## Asset contract

- Canvas: **90×32 art px**. Bottom-centre anchor; preserve dimensions and registration across states.
- Files: `kofi1-reed-screen-idle.png`.

## Sources

[STORY.md · kofi1-scene-04](../../../../STORY.md#kofi1-scene-04) · [private/kofi1/spec.json](../../spec.json) · [art/STYLE.md](../../../../art/STYLE.md) · [Chapter index](../INDEX.md)

Shared guides: [art/PIPELINE.md](../../../../art/PIPELINE.md) · [art/STYLE.md](../../../../art/STYLE.md) · [art/LAYERED-RIG.md](../../../../art/LAYERED-RIG.md) · [../process/WORKFLOW.md](../../../../../process/WORKFLOW.md) · [Chapter rules](../DRAWING-RULES.md)
