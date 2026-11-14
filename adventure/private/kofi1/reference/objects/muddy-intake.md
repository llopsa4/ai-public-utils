# Muddy river intake

<!-- GENERATED: edit the authoritative source, then run npm run art:briefs -- --private-spec private/kofi1/spec.json. -->

Authoring reference; may contain chapter spoilers. Runtime implementation is separate.

ID: `muddy-intake` · object · **target**

## Description

Near channel edge with cloudy shallow water over dark mud.

## What the game does with it

Look; rejected direct fill/drink

## Placement and layers

- [Riverbank / Amaneti](../rooms/riverbank.md): anchor (140,548) art px / (70,274) logical; ground; all bank periods.

## States, visibility and transitions

- **idle** — Stirred brown water. When: Always inspectable; never used as finished drinking collection point..

Overlay on bare shore; river in distant background is not this target.

## Asset contract

- Canvas: **170×84 art px**. Bottom-centre anchor; preserve dimensions and registration across states.
- Files: `kofi1-muddy-intake-idle.png`.

## Sources

[STORY.md · kofi1-scene-04](../../../../STORY.md#kofi1-scene-04) · [private/kofi1/spec.json](../../spec.json) · [art/STYLE.md](../../../../art/STYLE.md) · [Chapter index](../INDEX.md)

Shared guides: [art/PIPELINE.md](../../../../art/PIPELINE.md) · [art/STYLE.md](../../../../art/STYLE.md) · [art/LAYERED-RIG.md](../../../../art/LAYERED-RIG.md) · [WORKFLOW.md](../../../../WORKFLOW.md) · [Chapter rules](../DRAWING-RULES.md)
