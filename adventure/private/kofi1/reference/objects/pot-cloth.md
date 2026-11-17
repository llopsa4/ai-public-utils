# Enali’s pot cloth

<!-- GENERATED: edit the authoritative source, then run npm run art:briefs -- --private-spec private/kofi1/spec.json. -->

Authoring reference; may contain chapter spoilers. Runtime implementation is separate.

ID: `pot-cloth` · object · **target**

## Description

Folded coarse cream cloth, soot only at the working edge.

## What the game does with it

Take with permission; Use on hot pot

## Placement and layers

- [Tsalohi at evening](../rooms/tsalohi.md): anchor (820,452) art px / (410,226) logical; world; before and after pot errand. Attached to tsalohi-trestle-tsalohi-0, offset (70,-122).

## States, visibility and transitions

- **folded** — Folded pad. When: Visible before permission; hidden while carried or in hand; returned to trestle after pot placed..

Hand-held cloth uses same material identity; no extra dirty-state puzzle. Lost in collapse.

## Asset contract

- Canvas: **48×22 art px**. Bottom-centre anchor; preserve dimensions and registration across states.
- Files: `kofi1-pot-cloth-folded.png`.

## Sources

[STORY.md · kofi1-scene-01](../../../../STORY.md#kofi1-scene-01) · [private/kofi1/spec.json](../../spec.json) · [art/STYLE.md](../../../../art/STYLE.md) · [Chapter index](../INDEX.md)

Shared guides: [art/PIPELINE.md](../../../../art/PIPELINE.md) · [art/STYLE.md](../../../../art/STYLE.md) · [art/LAYERED-RIG.md](../../../../art/LAYERED-RIG.md) · [../process/WORKFLOW.md](../../../../../process/WORKFLOW.md) · [Chapter rules](../DRAWING-RULES.md)
