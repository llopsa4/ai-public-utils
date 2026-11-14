# Saluna’s axe sheath

<!-- GENERATED: edit the authoritative source, then run npm run art:briefs -- --private-spec private/kofi1/spec.json. -->

Authoring reference; may contain chapter spoilers. Runtime implementation is separate.

ID: `axe-sheath` · object · **target**

## Description

Empty worn hide axe-head sheath with a short carrying loop.

## What the game does with it

Take; Use on Huska for scent

## Placement and layers

- [Riverbank / Amaneti](../rooms/riverbank.md): anchor (900,530) art px / (450,265) logical; world; building bundle.

## States, visibility and transitions

- **idle** — Empty sheath with no axe. When: Available with Saluna’s permission; Take hides bundle sprite; scent action leaves sheath carried until axe found, then return to communal tools..



## Asset contract

- Canvas: **50×60 art px**. Bottom-centre anchor; preserve dimensions and registration across states.
- Files: `kofi1-axe-sheath-idle.png`.

## Sources

[STORY.md · kofi1-scene-05](../../../../STORY.md#kofi1-scene-05) · [private/kofi1/spec.json](../../spec.json) · [art/STYLE.md](../../../../art/STYLE.md) · [Chapter index](../INDEX.md)

Shared guides: [art/PIPELINE.md](../../../../art/PIPELINE.md) · [art/STYLE.md](../../../../art/STYLE.md) · [art/LAYERED-RIG.md](../../../../art/LAYERED-RIG.md) · [WORKFLOW.md](../../../../WORKFLOW.md) · [Chapter rules](../DRAWING-RULES.md)
