# Low arrow shelf

<!-- GENERATED: edit the authoritative source, then run npm run art:briefs -- --private-spec private/kofi1/spec.json. -->

Authoring reference; may contain chapter spoilers. Runtime implementation is separate.

ID: `arrow-shelf` · object · **target**

## Description

Narrow wood ledge with no arrows painted on it.

## What the game does with it

Look; return recovered arrow

## Placement and layers

- [Kofi’s hut](../rooms/kofi-hut.md): anchor (660,450) art px / (330,225) logical; rear; all hut phases.

## States, visibility and transitions

- **idle** — Empty shelf and two small wall pegs. When: Always; remaining arrows overlaid individually..

Low enough for emerging robot to brush it in staged action. No wall lettering.

## Technical

- Canvas: **140×36 art px**. Bottom-centre anchor; preserve dimensions and registration across states.
- Existing palette and world pixel grid; inventory icons use 64×64 transparent tiles.
- Files: `kofi1-arrow-shelf-idle.png`.

## Prompt for Codex

Narrow wood ledge with no arrows painted on it. Match the exact frame, state descriptions and attachment registration above. Follow the existing style reference. Preserve separate props and actors; no lettering, baked light pools or background in transparent object assets. This reference does not request new art.

## Attach / references

[STORY.md · kofi1-scene-09](../../../../STORY.md#kofi1-scene-09) · [private/kofi1/spec.json](../../spec.json) · [art/STYLE.md](../../../../art/STYLE.md) · [Chapter index](../INDEX.md)

Style attachments: [art/STYLE.md](../../../../art/STYLE.md) · [art/style/palette.png](../../../../art/style/palette.png) · [art/style/scale.png](../../../../art/style/scale.png) · [tent-reference.png](../../../../tent-reference.png)
