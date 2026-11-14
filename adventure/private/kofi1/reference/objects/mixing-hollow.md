# Clay mixing hollow

<!-- GENERATED: edit the authoritative source, then run npm run art:briefs -- --private-spec private/kofi1/spec.json. -->

Authoring reference; may contain chapter spoilers. Runtime implementation is separate.

ID: `mixing-hollow` · object · **target**

## Description

Low shallow earth basin with a rough wooden rim, clean inside before clay arrives.

## What the game does with it

Look; Use washing water

## Placement and layers

- [Riverbank / Amaneti](../rooms/riverbank.md): anchor (675,555) art px / (337.5,277.5) logical; ground; building.

## States, visibility and transitions

- **idle** — Empty hollow. When: Visible in building stage; clay-load overlays it; retain empty after wall finished, retire to settlement ground after time jump..



## Technical

- Canvas: **130×42 art px**. Bottom-centre anchor; preserve dimensions and registration across states.
- Existing palette and world pixel grid; inventory icons use 64×64 transparent tiles.
- Files: `kofi1-mixing-hollow-idle.png`.

## Prompt for Codex

Low shallow earth basin with a rough wooden rim, clean inside before clay arrives. Match the exact frame, state descriptions and attachment registration above. Follow the existing style reference. Preserve separate props and actors; no lettering, baked light pools or background in transparent object assets. This reference does not request new art.

## Attach / references

[STORY.md · kofi1-scene-05](../../../../STORY.md#kofi1-scene-05) · [private/kofi1/spec.json](../../spec.json) · [art/STYLE.md](../../../../art/STYLE.md) · [Chapter index](../INDEX.md)

Style attachments: [art/STYLE.md](../../../../art/STYLE.md) · [art/style/palette.png](../../../../art/style/palette.png) · [art/style/scale.png](../../../../art/style/scale.png) · [tent-reference.png](../../../../tent-reference.png)
