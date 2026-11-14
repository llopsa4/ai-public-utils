# Clay load

<!-- GENERATED: edit the authoritative source, then run npm run art:briefs -- --private-spec private/kofi1/spec.json. -->

Authoring reference; may contain chapter spoilers. Runtime implementation is separate.

ID: `clay-load` · object · **target**

## Description

Lumpy damp ochre clay in a woven carrying tray.

## What the game does with it

Load; Unload; Use water; Apply daub

## Placement and layers

- [Riverbank / Amaneti](../rooms/riverbank.md): anchor (750,540) art px / (375,270) logical; world; on loaded sledge. Attached to goat-sledge-riverbank-0, offset (20,-50).
- [Riverbank / Amaneti](../rooms/riverbank.md): anchor (675,520) art px / (337.5,260) logical; world; mixing hollow. Attached to mixing-hollow-riverbank-0, offset (0,-35).

## States, visibility and transitions

- **dry** — Firm clay lumps. When: After collection and unloading..
- **wet** — Smooth wet daub mound, same tray extent. When: Washing water added; hides when applied to wall..

Icon is required for wet daub use; clay collection/loading remains scene action. No additional unapproved recipe.

## Technical

- Canvas: **95×42 art px**. Bottom-centre anchor; preserve dimensions and registration across states.
- Existing palette and world pixel grid; inventory icons use 64×64 transparent tiles.
- Files: `kofi1-clay-load-dry.png`, `kofi1-clay-load-wet.png`.

## Prompt for Codex

Lumpy damp ochre clay in a woven carrying tray. Match the exact frame, state descriptions and attachment registration above. Follow the existing style reference. Preserve separate props and actors; no lettering, baked light pools or background in transparent object assets. This reference does not request new art.

## Attach / references

[STORY.md · kofi1-scene-05](../../../../STORY.md#kofi1-scene-05) · [private/kofi1/spec.json](../../spec.json) · [art/STYLE.md](../../../../art/STYLE.md) · [Chapter index](../INDEX.md)

Style attachments: [art/STYLE.md](../../../../art/STYLE.md) · [art/style/palette.png](../../../../art/style/palette.png) · [art/style/scale.png](../../../../art/style/scale.png) · [tent-reference.png](../../../../tent-reference.png)
