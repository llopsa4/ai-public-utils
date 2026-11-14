# Arrow with light cord

<!-- GENERATED: edit the authoritative source, then run npm run art:briefs -- --private-spec private/kofi1/spec.json. -->

Authoring reference; may contain chapter spoilers. Runtime implementation is separate.

ID: `line-arrow` · object · **target**

## Description

Ordinary wooden arrow with fine cord tied behind its nock.

## What the game does with it

Combine; Use on high fork

## Placement and layers

- [Woodland clearing](../rooms/woodland-clearing.md): anchor (1010,610) art px / (505,305) logical; world; shot landing area.

## States, visibility and transitions

- **tied** — Arrow and short trailing cord only. When: Combination appears in inventory; flight is movement/actor reference; show at landing after shot, then recover arrow while line stays over branch..

No special head. Long hanging cord is rig-line sprite, not painted into arrow image.

Introduced at camp as an everyday line carrier. The woodland-clearing shot requires the carried bow to be unfolded and returns the ordinary shaft while leaving the cord over the fork.

## Technical

- Canvas: **100×24 art px**. Bottom-centre anchor; preserve dimensions and registration across states.
- Existing palette and world pixel grid; inventory icons use 64×64 transparent tiles.
- Files: `kofi1-line-arrow-tied.png`.

## Prompt for Codex

Ordinary wooden arrow with fine cord tied behind its nock. Match the exact frame, state descriptions and attachment registration above. Follow the existing style reference. Preserve separate props and actors; no lettering, baked light pools or background in transparent object assets. This reference does not request new art.

## Attach / references

[STORY.md · kofi1-scene-05](../../../../STORY.md#kofi1-scene-05) · [private/kofi1/spec.json](../../spec.json) · [art/STYLE.md](../../../../art/STYLE.md) · [Chapter index](../INDEX.md)

Style attachments: [art/STYLE.md](../../../../art/STYLE.md) · [art/style/palette.png](../../../../art/style/palette.png) · [art/style/scale.png](../../../../art/style/scale.png) · [tent-reference.png](../../../../tent-reference.png)
