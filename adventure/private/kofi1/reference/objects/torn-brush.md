# Broken forest brush

<!-- GENERATED: edit the authoritative source, then run npm run art:briefs -- --private-spec private/kofi1/spec.json. -->

Authoring reference; may contain chapter spoilers. Runtime implementation is separate.

ID: `torn-brush` · object · **target**

## Description

Snapped fern stems and bent undergrowth, torn face toward trail.

## What the game does with it

Look

## Placement and layers

- [Deep forest](../rooms/deep-forest.md): anchor (940,540) art px / (470,270) logical; rear; all forest phases.

## States, visibility and transitions

- **idle** — Clearly disturbed plants. When: Inspectable warning before encounter; remains after either outcome..



## Technical

- Canvas: **150×120 art px**. Bottom-centre anchor; preserve dimensions and registration across states.
- Existing palette and world pixel grid; inventory icons use 64×64 transparent tiles.
- Files: `kofi1-torn-brush-idle.png`.

## Prompt for Codex

Snapped fern stems and bent undergrowth, torn face toward trail. Match the exact frame, state descriptions and attachment registration above. Follow the existing style reference. Preserve separate props and actors; no lettering, baked light pools or background in transparent object assets. This reference does not request new art.

## Attach / references

[STORY.md · kofi1-scene-08](../../../../STORY.md#kofi1-scene-08) · [private/kofi1/spec.json](../../spec.json) · [art/STYLE.md](../../../../art/STYLE.md) · [Chapter index](../INDEX.md)

Style attachments: [art/STYLE.md](../../../../art/STYLE.md) · [art/style/palette.png](../../../../art/style/palette.png) · [art/style/scale.png](../../../../art/style/scale.png) · [tent-reference.png](../../../../tent-reference.png)
