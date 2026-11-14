# Kofi’s cold hearth

<!-- GENERATED: edit the authoritative source, then run npm run art:briefs -- --private-spec private/kofi1/spec.json. -->

Authoring reference; may contain chapter spoilers. Runtime implementation is separate.

ID: `cold-hearth` · object · **target**

## Description

Low stone ring with cold ash, a stable flat edge above a narrow dry gap.

## What the game does with it

Look

## Placement and layers

- [Kofi’s hut](../rooms/kofi-hut.md): anchor (660,590) art px / (330,295) logical; rear; all hut phases.

## States, visibility and transitions

- **cold** — Cold stones and ash, no flame. When: Entire scene..

No embers or hidden heat hazard. Hearth gap and arrow separate. Gap lies outside cold firebox.

## Technical

- Canvas: **170×95 art px**. Bottom-centre anchor; preserve dimensions and registration across states.
- Existing palette and world pixel grid; inventory icons use 64×64 transparent tiles.
- Files: `kofi1-cold-hearth-cold.png`.

## Prompt for Codex

Low stone ring with cold ash, a stable flat edge above a narrow dry gap. Match the exact frame, state descriptions and attachment registration above. Follow the existing style reference. Preserve separate props and actors; no lettering, baked light pools or background in transparent object assets. This reference does not request new art.

## Attach / references

[STORY.md · kofi1-scene-09](../../../../STORY.md#kofi1-scene-09) · [private/kofi1/spec.json](../../spec.json) · [art/STYLE.md](../../../../art/STYLE.md) · [Chapter index](../INDEX.md)

Style attachments: [art/STYLE.md](../../../../art/STYLE.md) · [art/style/palette.png](../../../../art/style/palette.png) · [art/style/scale.png](../../../../art/style/scale.png) · [tent-reference.png](../../../../tent-reference.png)
