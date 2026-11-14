# Robot hiding stool

<!-- GENERATED: edit the authoritative source, then run npm run art:briefs -- --private-spec private/kofi1/spec.json. -->

Authoring reference; may contain chapter spoilers. Runtime implementation is separate.

ID: `hut-stool` · object · **target**

## Description

Low three-legged wooden stool with open space beneath and broad stable feet.

## What the game does with it

Look

## Placement and layers

- [Kofi’s hut](../rooms/kofi-hut.md): anchor (1090,610) art px / (545,305) logical; world; all hut phases.

## States, visibility and transitions

- **idle** — Empty stool, no creature. When: Always; actor may hide underneath after approach..

Draw rear legs in world layer and thin front legs as foreground cut named stool-front. Actor goes between them; same frame/anchor for both pieces.

## Technical

- Canvas: **100×100 art px**. Bottom-centre anchor; preserve dimensions and registration across states.
- Existing palette and world pixel grid; inventory icons use 64×64 transparent tiles.
- Files: `kofi1-hut-stool-idle.png`.

## Prompt for Codex

Low three-legged wooden stool with open space beneath and broad stable feet. Match the exact frame, state descriptions and attachment registration above. Follow the existing style reference. Preserve separate props and actors; no lettering, baked light pools or background in transparent object assets. This reference does not request new art.

## Attach / references

[STORY.md · kofi1-scene-09](../../../../STORY.md#kofi1-scene-09) · [private/kofi1/spec.json](../../spec.json) · [art/STYLE.md](../../../../art/STYLE.md) · [Chapter index](../INDEX.md)

Style attachments: [art/STYLE.md](../../../../art/STYLE.md) · [art/style/palette.png](../../../../art/style/palette.png) · [art/style/scale.png](../../../../art/style/scale.png) · [tent-reference.png](../../../../tent-reference.png)
