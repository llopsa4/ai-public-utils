# Enali’s pot cloth

<!-- GENERATED: edit the authoritative source, then run npm run art:briefs -- --private-spec private/kofi1/spec.json. -->

Authoring reference; may contain chapter spoilers. Runtime implementation is separate.

ID: `pot-cloth` · object · **target**

## Description

Folded coarse cream cloth, soot only at the working edge.

## What the game does with it

Take with permission; Use on hot pot

## Placement and layers

- [Tsalohi at evening](../rooms/tsalohi.md): anchor (820,452) art px / (410,226) logical; world; before and after pot errand. Attached to tsalohi-trestle-tsalohi-0, offset (70,-122).

## States, visibility and transitions

- **folded** — Folded pad. When: Visible before permission; hidden while carried or in hand; returned to trestle after pot placed..

Hand-held cloth uses same material identity; no extra dirty-state puzzle. Lost in collapse.

## Technical

- Canvas: **48×22 art px**. Bottom-centre anchor; preserve dimensions and registration across states.
- Existing palette and world pixel grid; inventory icons use 64×64 transparent tiles.
- Files: `kofi1-pot-cloth-folded.png`.

## Prompt for Codex

Folded coarse cream cloth, soot only at the working edge. Match the exact frame, state descriptions and attachment registration above. Follow the existing style reference. Preserve separate props and actors; no lettering, baked light pools or background in transparent object assets. This reference does not request new art.

## Attach / references

[STORY.md · kofi1-scene-01](../../../../STORY.md#kofi1-scene-01) · [private/kofi1/spec.json](../../spec.json) · [art/STYLE.md](../../../../art/STYLE.md) · [Chapter index](../INDEX.md)

Style attachments: [art/STYLE.md](../../../../art/STYLE.md) · [art/style/palette.png](../../../../art/style/palette.png) · [art/style/scale.png](../../../../art/style/scale.png) · [tent-reference.png](../../../../tent-reference.png)
