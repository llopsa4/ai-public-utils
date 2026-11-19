# Near forest leaf cut

<!-- GENERATED: edit the authoritative source, then run npm run art:briefs -- --private-spec private/kofi1/spec.json. -->

Authoring reference; may contain chapter spoilers. Runtime implementation is separate.

ID: `forest-foreground` · foreground · **foreground**

## Description

Dark but readable fern edge and slender near trunk, no interactive targets.

## What the game does with it

Visual layer only; no additional interaction is introduced.

## Placement and layers

- [Deep forest](../rooms/deep-forest.md): anchor (1200,590) art px / (600,295) logical; foreground; all forest phases.

## States, visibility and transitions

- **idle** — Near-edge foliage. When: Always; draw in front only at far-right frame edge..

Keep bear, log, vine and retreat lane uncovered. Transparent foreground overlay; no blur.

## Asset contract

- Canvas: **140×250 art px**. Bottom-centre anchor; preserve dimensions and registration across states.
- Files: `kofi1-forest-foreground-idle.png`.

## Sources

[STORY.md · kofi1-scene-08](../../../../STORY.md#kofi1-scene-08) · [private/kofi1/spec.json](../../spec.json) · [art/STYLE.md](../../../../art/STYLE.md) · [Chapter index](../INDEX.md)

Shared guides: [art/PIPELINE.md](../../../../art/PIPELINE.md) · [art/STYLE.md](../../../../art/STYLE.md) · [art/LAYERED-RIG.md](../../../../art/LAYERED-RIG.md) · [../WORKFLOW.md](../../../../../WORKFLOW.md) · [Chapter rules](../DRAWING-RULES.md)
