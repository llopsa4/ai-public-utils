# Near timber-and-stone houses

<!-- GENERATED: edit the authoritative source, then run npm run art:briefs -- --private-spec private/kofi1/spec.json. -->

Authoring reference; may contain chapter spoilers. Runtime implementation is separate.

ID: `town-buildings` · object · **visual**

## Description

Patched ochre timber fronts on low stone footings, woven awnings; no readable signs.

## What the game does with it

Visual layer only; no additional interaction is introduced.

## Placement and layers

- [Tsalohi at evening](../rooms/tsalohi.md): anchor (640,524) art px / (320,262) logical; rear; evening to collapse.

## States, visibility and transitions

- **standing** — Sound lived-in facades. When: Visible before tremor..
- **leaning** — Same facades with broken supports and shifted roof edges. When: First collapse; hide fully when the square falls..

A single rear composite for noninteractive near houses only. All listed props and actors remain independent. Hide this layer for final fall; do not paint a destroyed town into the base.

## Technical

- Canvas: **1180×430 art px**. Bottom-centre anchor; preserve dimensions and registration across states.
- Existing palette and world pixel grid; inventory icons use 64×64 transparent tiles.
- Files: `kofi1-town-buildings-standing.png`, `kofi1-town-buildings-leaning.png`.

## Prompt for Codex

Patched ochre timber fronts on low stone footings, woven awnings; no readable signs. Match the exact frame, state descriptions and attachment registration above. Follow the existing style reference. Preserve separate props and actors; no lettering, baked light pools or background in transparent object assets. This reference does not request new art.

## Attach / references

[STORY.md · kofi1-scene-01](../../../../STORY.md#kofi1-scene-01) · [STORY.md · kofi1-scene-02](../../../../STORY.md#kofi1-scene-02) · [private/kofi1/spec.json](../../spec.json) · [art/STYLE.md](../../../../art/STYLE.md) · [Chapter index](../INDEX.md)

Style attachments: [art/STYLE.md](../../../../art/STYLE.md) · [art/style/palette.png](../../../../art/style/palette.png) · [art/style/scale.png](../../../../art/style/scale.png) · [tent-reference.png](../../../../tent-reference.png)
