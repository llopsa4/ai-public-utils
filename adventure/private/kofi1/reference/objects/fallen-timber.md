# Storm-fallen timber stock

<!-- GENERATED: edit the authoritative source, then run npm run art:briefs -- --private-spec private/kofi1/spec.json. -->

Authoring reference; may contain chapter spoilers. Runtime implementation is separate.

ID: `fallen-timber` · object · **target**

## Description

Naturally fallen dry trunk sections with loose bark and a clear broken end.

## What the game does with it

Look; select sound pieces

## Placement and layers

- [Woodland clearing](../rooms/woodland-clearing.md): anchor (200,560) art px / (100,280) logical; rear; building onwards.

## States, visibility and transitions

- **stock** — Several sound lengths available. When: Building entry..
- **used** — A shorter residual pile and scattered shavings. When: After preparing beam lift; no total bare disappearance of large natural trunk..

Timber body is separate from removable bark and prepared beam. No living tree felling puzzle.

## Asset contract

- Canvas: **260×130 art px**. Bottom-centre anchor; preserve dimensions and registration across states.
- Files: `kofi1-fallen-timber-stock.png`, `kofi1-fallen-timber-used.png`.

## Sources

[STORY.md · kofi1-scene-05](../../../../STORY.md#kofi1-scene-05) · [private/kofi1/spec.json](../../spec.json) · [art/STYLE.md](../../../../art/STYLE.md) · [Chapter index](../INDEX.md)

Shared guides: [art/PIPELINE.md](../../../../art/PIPELINE.md) · [art/STYLE.md](../../../../art/STYLE.md) · [art/LAYERED-RIG.md](../../../../art/LAYERED-RIG.md) · [WORKFLOW.md](../../../../WORKFLOW.md) · [Chapter rules](../DRAWING-RULES.md)
