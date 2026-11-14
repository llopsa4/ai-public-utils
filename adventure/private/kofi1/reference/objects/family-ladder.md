# Family hut ladder

<!-- GENERATED: edit the authoritative source, then run npm run art:briefs -- --private-spec private/kofi1/spec.json. -->

Authoring reference; may contain chapter spoilers. Runtime implementation is separate.

ID: `family-ladder` · object · **target**

## Description

Straight lashed wooden ladder from ground shelf toward low platform.

## What the game does with it

Look; staged climb; assisted practice

## Placement and layers

- [Woodland clearing](../rooms/woodland-clearing.md): anchor (820,590) art px / (410,295) logical; world; rite and months.

## States, visibility and transitions

- **idle** — Sound ladder with broad visible rungs. When: Appears with secured platform; hand-rope added separately months later..

Frame remains behind practice actors. Hand-rope is a separate one-time attachment, not baked into ladder.

## Technical

- Canvas: **66×250 art px**. Bottom-centre anchor; preserve dimensions and registration across states.
- Existing palette and world pixel grid; inventory icons use 64×64 transparent tiles.
- Files: `kofi1-family-ladder-idle.png`.

## Prompt for Codex

Straight lashed wooden ladder from ground shelf toward low platform. Match the exact frame, state descriptions and attachment registration above. Follow the existing style reference. Preserve separate props and actors; no lettering, baked light pools or background in transparent object assets. This reference does not request new art.

## Attach / references

[STORY.md · kofi1-scene-05](../../../../STORY.md#kofi1-scene-05) · [STORY.md · kofi1-scene-06](../../../../STORY.md#kofi1-scene-06) · [STORY.md · kofi1-scene-07](../../../../STORY.md#kofi1-scene-07) · [private/kofi1/spec.json](../../spec.json) · [art/STYLE.md](../../../../art/STYLE.md) · [Chapter index](../INDEX.md)

Style attachments: [art/STYLE.md](../../../../art/STYLE.md) · [art/style/palette.png](../../../../art/style/palette.png) · [art/style/scale.png](../../../../art/style/scale.png) · [tent-reference.png](../../../../tent-reference.png)
