# Deyu’s gate cross-pin

<!-- GENERATED: edit the authoritative source, then run npm run art:briefs -- --private-spec private/kofi1/spec.json. -->

Authoring reference; may contain chapter spoilers. Runtime implementation is separate.

ID: `cross-pin` · object · **target**

## Description

Smooth short wooden cross-pin with thumb-polished end.

## What the game does with it

Take through Deyu; Use on pen gate

## Placement and layers

- [Tsalohi at evening](../rooms/tsalohi.md): anchor (754,470) art px / (377,235) logical; world; before borrowing.
- [Tsalohi at evening](../rooms/tsalohi.md): anchor (260,520) art px / (130,260) logical; world; installed at gate. Attached to pen-gate-tsalohi-0, offset (10,-80).

## States, visibility and transitions

- **idle** — One plain pin. When: At trestle until handed over, hidden while carried, shown once at gate after use; lost with gate..

Not the later garden pin; never restore this instance in Amaneti.

## Asset contract

- Canvas: **32×16 art px**. Bottom-centre anchor; preserve dimensions and registration across states.
- Files: `kofi1-cross-pin-idle.png`.

## Sources

[STORY.md · kofi1-scene-01](../../../../STORY.md#kofi1-scene-01) · [private/kofi1/spec.json](../../spec.json) · [art/STYLE.md](../../../../art/STYLE.md) · [Chapter index](../INDEX.md)

Shared guides: [art/PIPELINE.md](../../../../art/PIPELINE.md) · [art/STYLE.md](../../../../art/STYLE.md) · [art/LAYERED-RIG.md](../../../../art/LAYERED-RIG.md) · [../WORKFLOW.md](../../../../../WORKFLOW.md) · [Chapter rules](../DRAWING-RULES.md)
