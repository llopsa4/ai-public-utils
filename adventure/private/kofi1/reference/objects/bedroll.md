# Kofi’s bedroll

<!-- GENERATED: edit the authoritative source, then run npm run art:briefs -- --private-spec private/kofi1/spec.json. -->

Authoring reference; may contain chapter spoilers. Runtime implementation is separate.

ID: `bedroll` · object · **target**

## Description

Worn hide and woven mat, one small dry corner without a pillow.

## What the game does with it

Look; Wait back; Sit back; Lie

## Placement and layers

- [Kofi’s hut](../rooms/kofi-hut.md): anchor (390,610) art px / (195,305) logical; ground; all hut phases.

## States, visibility and transitions

- **laid** — Mat laid flat. When: Entry onward..
- **corner-clear** — Small corner folded back, clean dry patch available. When: After arrow shelved; creature settles beside it, not painted onto it..

No Kofi or robot in bedroll frame. Same frame and anchor in both states.

## Technical

- Canvas: **210×65 art px**. Bottom-centre anchor; preserve dimensions and registration across states.
- Existing palette and world pixel grid; inventory icons use 64×64 transparent tiles.
- Files: `kofi1-bedroll-laid.png`, `kofi1-bedroll-corner-clear.png`.

## Prompt for Codex

Worn hide and woven mat, one small dry corner without a pillow. Match the exact frame, state descriptions and attachment registration above. Follow the existing style reference. Preserve separate props and actors; no lettering, baked light pools or background in transparent object assets. This reference does not request new art.

## Attach / references

[STORY.md · kofi1-scene-09](../../../../STORY.md#kofi1-scene-09) · [private/kofi1/spec.json](../../spec.json) · [art/STYLE.md](../../../../art/STYLE.md) · [Chapter index](../INDEX.md)

Style attachments: [art/STYLE.md](../../../../art/STYLE.md) · [art/style/palette.png](../../../../art/style/palette.png) · [art/style/scale.png](../../../../art/style/scale.png) · [tent-reference.png](../../../../tent-reference.png)
