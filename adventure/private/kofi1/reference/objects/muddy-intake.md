# Muddy river intake

<!-- GENERATED: edit the authoritative source, then run npm run art:briefs -- --private-spec private/kofi1/spec.json. -->

Authoring reference; may contain chapter spoilers. Runtime implementation is separate.

ID: `muddy-intake` · object · **target**

## Description

Near channel edge with cloudy shallow water over dark mud.

## What the game does with it

Look; rejected direct fill/drink

## Placement and layers

- [Riverbank / Amaneti](../rooms/riverbank.md): anchor (140,548) art px / (70,274) logical; ground; all bank periods.

## States, visibility and transitions

- **idle** — Stirred brown water. When: Always inspectable; never used as finished drinking collection point..

Overlay on bare shore; river in distant background is not this target.

## Technical

- Canvas: **170×84 art px**. Bottom-centre anchor; preserve dimensions and registration across states.
- Existing palette and world pixel grid; inventory icons use 64×64 transparent tiles.
- Files: `kofi1-muddy-intake-idle.png`.

## Prompt for Codex

Near channel edge with cloudy shallow water over dark mud. Match the exact frame, state descriptions and attachment registration above. Follow the existing style reference. Preserve separate props and actors; no lettering, baked light pools or background in transparent object assets. This reference does not request new art.

## Attach / references

[STORY.md · kofi1-scene-04](../../../../STORY.md#kofi1-scene-04) · [private/kofi1/spec.json](../../spec.json) · [art/STYLE.md](../../../../art/STYLE.md) · [Chapter index](../INDEX.md)

Style attachments: [art/STYLE.md](../../../../art/STYLE.md) · [art/style/palette.png](../../../../art/style/palette.png) · [art/style/scale.png](../../../../art/style/scale.png) · [tent-reference.png](../../../../tent-reference.png)
