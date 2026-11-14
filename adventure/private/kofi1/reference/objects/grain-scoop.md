# Ahyeli’s grain scoop

<!-- GENERATED: edit the authoritative source, then run npm run art:briefs -- --private-spec private/kofi1/spec.json. -->

Authoring reference; may contain chapter spoilers. Runtime implementation is separate.

ID: `grain-scoop` · object · **target**

## Description

Small wooden scoop with pale grain, short handle.

## What the game does with it

Take with permission; Use on coop

## Placement and layers

- [Tsalohi at evening](../rooms/tsalohi.md): anchor (1160,420) art px / (580,210) logical; world; on coop hook.

## States, visibility and transitions

- **filled** — A small heap of grain. When: Hanging until borrowed; hidden while carried; returned to same hook after coop closed..



## Technical

- Canvas: **38×36 art px**. Bottom-centre anchor; preserve dimensions and registration across states.
- Existing palette and world pixel grid; inventory icons use 64×64 transparent tiles.
- Files: `kofi1-grain-scoop-filled.png`.

## Prompt for Codex

Small wooden scoop with pale grain, short handle. Match the exact frame, state descriptions and attachment registration above. Follow the existing style reference. Preserve separate props and actors; no lettering, baked light pools or background in transparent object assets. This reference does not request new art.

## Attach / references

[STORY.md · kofi1-scene-01](../../../../STORY.md#kofi1-scene-01) · [private/kofi1/spec.json](../../spec.json) · [art/STYLE.md](../../../../art/STYLE.md) · [Chapter index](../INDEX.md)

Style attachments: [art/STYLE.md](../../../../art/STYLE.md) · [art/style/palette.png](../../../../art/style/palette.png) · [art/style/scale.png](../../../../art/style/scale.png) · [tent-reference.png](../../../../tent-reference.png)
