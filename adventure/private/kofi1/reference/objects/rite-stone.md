# Smooth river offering stone

<!-- GENERATED: edit the authoritative source, then run npm run art:briefs -- --private-spec private/kofi1/spec.json. -->

Authoring reference; may contain chapter spoilers. Runtime implementation is separate.

ID: `rite-stone` · object · **target**

## Description

Round water-smoothed grey stone, distinct from flat shim and upright markers.

## What the game does with it

Take; Use on river offering space

## Placement and layers

- [Riverbank / Amaneti](../rooms/riverbank.md): anchor (130,570) art px / (65,285) logical; world; rite shore source.
- [Riverbank / Amaneti](../rooms/riverbank.md): anchor (620,578) art px / (310,289) logical; world; rite river space. Attached to rite-circle-riverbank-0, offset (-80,-22).

## States, visibility and transitions

- **idle** — One round shore stone. When: Take one renewable shore stone; hide pickup while carried; show in circle once placed. Retire to memorial storage at months jump..



## Technical

- Canvas: **40×30 art px**. Bottom-centre anchor; preserve dimensions and registration across states.
- Existing palette and world pixel grid; inventory icons use 64×64 transparent tiles.
- Files: `kofi1-rite-stone-idle.png`.

## Prompt for Codex

Round water-smoothed grey stone, distinct from flat shim and upright markers. Match the exact frame, state descriptions and attachment registration above. Follow the existing style reference. Preserve separate props and actors; no lettering, baked light pools or background in transparent object assets. This reference does not request new art.

## Attach / references

[STORY.md · kofi1-scene-06](../../../../STORY.md#kofi1-scene-06) · [private/kofi1/spec.json](../../spec.json) · [art/STYLE.md](../../../../art/STYLE.md) · [Chapter index](../INDEX.md)

Style attachments: [art/STYLE.md](../../../../art/STYLE.md) · [art/style/palette.png](../../../../art/style/palette.png) · [art/style/scale.png](../../../../art/style/scale.png) · [tent-reference.png](../../../../tent-reference.png)
