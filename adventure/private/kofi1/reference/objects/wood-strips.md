# Crossed foot strips

<!-- GENERATED: edit the authoritative source, then run npm run art:briefs -- --private-spec private/kofi1/spec.json. -->

Authoring reference; may contain chapter spoilers. Runtime implementation is separate.

ID: `wood-strips` · object · **target**

## Description

Two short matching wooden strips with half-depth crossed slots.

## What the game does with it

Take; Use on trough

## Placement and layers

- [Riverbank / Amaneti](../rooms/riverbank.md): anchor (865,525) art px / (432.5,262.5) logical; world; water-a after trough inspection.

## States, visibility and transitions

- **loose** — Both strips side by side. When: Enali route only; revealed by trough inspection, removed on Take..
- **crossed** — Joined pair. When: Use both on trough; individual strip sprite hides and trough assembled state appears..

One brief/icon for the required pair. No untracked third piece, and no loose strips in Deyu route.

## Asset contract

- Canvas: **96×28 art px**. Bottom-centre anchor; preserve dimensions and registration across states.
- Files: `kofi1-wood-strips-loose.png`, `kofi1-wood-strips-crossed.png`.

## Sources

[STORY.md · kofi1-scene-04](../../../../STORY.md#kofi1-scene-04) · [private/kofi1/spec.json](../../spec.json) · [art/STYLE.md](../../../../art/STYLE.md) · [Chapter index](../INDEX.md)

Shared guides: [art/PIPELINE.md](../../../../art/PIPELINE.md) · [art/STYLE.md](../../../../art/STYLE.md) · [art/LAYERED-RIG.md](../../../../art/LAYERED-RIG.md) · [../process/WORKFLOW.md](../../../../../process/WORKFLOW.md) · [Chapter rules](../DRAWING-RULES.md)
