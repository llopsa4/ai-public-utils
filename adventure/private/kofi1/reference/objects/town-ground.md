# Square floor overlay

<!-- GENERATED: edit the authoritative source, then run npm run art:briefs -- --private-spec private/kofi1/spec.json. -->

Authoring reference; may contain chapter spoilers. Runtime implementation is separate.

ID: `town-ground` · object · **visual**

## Description

Rough packed earth and broad repaired stone patches; no props.

## What the game does with it

Visual layer only; no additional interaction is introduced.

## Placement and layers

- [Tsalohi at evening](../rooms/tsalohi.md): anchor (640,720) art px / (320,360) logical; ground; evening to collapse.

## States, visibility and transitions

- **intact** — Unbroken supporting ground. When: Evening..
- **split** — Narrow fissure divides stone patches but stable inland path remains. When: Warning and coop escape; hide at rescue staging..

Full-width overlay on plain Rift backing. Central footing and ledges replace this layer during rescue, not on top of a permanently painted solid floor.

## Technical

- Canvas: **1280×196 art px**. Bottom-centre anchor; preserve dimensions and registration across states.
- Existing palette and world pixel grid; inventory icons use 64×64 transparent tiles.
- Files: `kofi1-town-ground-intact.png`, `kofi1-town-ground-split.png`.

## Prompt for Codex

Rough packed earth and broad repaired stone patches; no props. Match the exact frame, state descriptions and attachment registration above. Follow the existing style reference. Preserve separate props and actors; no lettering, baked light pools or background in transparent object assets. This reference does not request new art.

## Attach / references

[STORY.md · kofi1-scene-01](../../../../STORY.md#kofi1-scene-01) · [STORY.md · kofi1-scene-02](../../../../STORY.md#kofi1-scene-02) · [private/kofi1/spec.json](../../spec.json) · [art/STYLE.md](../../../../art/STYLE.md) · [Chapter index](../INDEX.md)

Style attachments: [art/STYLE.md](../../../../art/STYLE.md) · [art/style/palette.png](../../../../art/style/palette.png) · [art/style/scale.png](../../../../art/style/scale.png) · [tent-reference.png](../../../../tent-reference.png)
