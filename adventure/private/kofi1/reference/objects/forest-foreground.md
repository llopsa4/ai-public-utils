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

## Technical

- Canvas: **140×250 art px**. Bottom-centre anchor; preserve dimensions and registration across states.
- Existing palette and world pixel grid; inventory icons use 64×64 transparent tiles.
- Files: `kofi1-forest-foreground-idle.png`.

## Prompt for Codex

Dark but readable fern edge and slender near trunk, no interactive targets. Match the exact frame, state descriptions and attachment registration above. Follow the existing style reference. Preserve separate props and actors; no lettering, baked light pools or background in transparent object assets. This reference does not request new art.

## Attach / references

[STORY.md · kofi1-scene-08](../../../../STORY.md#kofi1-scene-08) · [private/kofi1/spec.json](../../spec.json) · [art/STYLE.md](../../../../art/STYLE.md) · [Chapter index](../INDEX.md)

Style attachments: [art/STYLE.md](../../../../art/STYLE.md) · [art/style/palette.png](../../../../art/style/palette.png) · [art/style/scale.png](../../../../art/style/scale.png) · [tent-reference.png](../../../../tent-reference.png)
