# Near timber-and-stone houses

<!-- GENERATED: edit the authoritative source, then run npm run art:briefs -- --private-spec private/kofi1/spec.json. -->

Authoring reference; may contain chapter spoilers. Runtime implementation is separate.

ID: `town-buildings` · object · **visual**

## Description

Patched ochre timber fronts on low stone footings, woven awnings; no readable signs.

## What the game does with it

Visual layer only; no additional interaction is introduced.

## Placement and layers

- [Tsalohi at evening](../rooms/tsalohi.md): anchor (640,524) art px / (320,262) logical; rear; evening to collapse.

## States, visibility and transitions

- **standing** — Sound lived-in facades. When: Visible before tremor..
- **leaning** — Same facades with broken supports and shifted roof edges. When: First collapse; hide fully when the square falls..

A single rear composite for noninteractive near houses only. All listed props and actors remain independent. Hide this layer for final fall; do not paint a destroyed town into the base.

## Asset contract

- Canvas: **1180×430 art px**. Bottom-centre anchor; preserve dimensions and registration across states.
- Files: `kofi1-town-buildings-standing.png`, `kofi1-town-buildings-leaning.png`.

## Sources

[STORY.md · kofi1-scene-01](../../../../STORY.md#kofi1-scene-01) · [STORY.md · kofi1-scene-02](../../../../STORY.md#kofi1-scene-02) · [private/kofi1/spec.json](../../spec.json) · [art/STYLE.md](../../../../art/STYLE.md) · [Chapter index](../INDEX.md)

Shared guides: [art/PIPELINE.md](../../../../art/PIPELINE.md) · [art/STYLE.md](../../../../art/STYLE.md) · [art/LAYERED-RIG.md](../../../../art/LAYERED-RIG.md) · [WORKFLOW.md](../../../../WORKFLOW.md) · [Chapter rules](../DRAWING-RULES.md)
