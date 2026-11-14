# First / family tree hut

<!-- GENERATED: edit the authoritative source, then run npm run art:briefs -- --private-spec private/kofi1/spec.json. -->

Authoring reference; may contain chapter spoilers. Runtime implementation is separate.

ID: `family-tree-hut` · object · **target**

## Description

Small light reed-and-thatch shelter with a clear low doorway, platform separate.

## What the game does with it

Look; discuss housing

## Placement and layers

- [Woodland clearing](../rooms/woodland-clearing.md): anchor (855,310) art px / (427.5,155) logical; rear; rite and months. Attached to tree-platform-woodland-clearing-0, offset (0,-30).

## States, visibility and transitions

- **built** — Finished small tree shelter. When: Appears during construction montage; household allocation changes dialogue, not paint..

No people inside painting; no extra state for accepting Ahyeli’s request, because physical building does not change.

## Technical

- Canvas: **190×190 art px**. Bottom-centre anchor; preserve dimensions and registration across states.
- Existing palette and world pixel grid; inventory icons use 64×64 transparent tiles.
- Files: `kofi1-family-tree-hut-built.png`.

## Prompt for Codex

Small light reed-and-thatch shelter with a clear low doorway, platform separate. Match the exact frame, state descriptions and attachment registration above. Follow the existing style reference. Preserve separate props and actors; no lettering, baked light pools or background in transparent object assets. This reference does not request new art.

## Attach / references

[STORY.md · kofi1-scene-05](../../../../STORY.md#kofi1-scene-05) · [STORY.md · kofi1-scene-07](../../../../STORY.md#kofi1-scene-07) · [private/kofi1/spec.json](../../spec.json) · [art/STYLE.md](../../../../art/STYLE.md) · [Chapter index](../INDEX.md)

Style attachments: [art/STYLE.md](../../../../art/STYLE.md) · [art/style/palette.png](../../../../art/style/palette.png) · [art/style/scale.png](../../../../art/style/scale.png) · [tent-reference.png](../../../../tent-reference.png)
