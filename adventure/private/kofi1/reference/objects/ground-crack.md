# Opening ground crack

<!-- GENERATED: edit the authoritative source, then run npm run art:briefs -- --private-spec private/kofi1/spec.json. -->

Authoring reference; may contain chapter spoilers. Runtime implementation is separate.

ID: `ground-crack` · object · **visual**

## Description

Jagged dark fissure with dislodged clay edges, transparent outside the crack.

## What the game does with it

Visual layer only; no additional interaction is introduced.

## Placement and layers

- [Tsalohi at evening](../rooms/tsalohi.md): anchor (640,640) art px / (320,320) logical; ground; warning and collapse.

## States, visibility and transitions

- **hairline** — Thin visible dark seam. When: Cup rattles and animals react..
- **open** — Wide split with broken edges. When: First tremor; hide when town-ground is replaced by ledges..

No crack before warning. Disappearance is hiding, not an empty sprite. Do not use this decorative strip to imply a safe crossing during rescue.

## Technical

- Canvas: **1100×120 art px**. Bottom-centre anchor; preserve dimensions and registration across states.
- Existing palette and world pixel grid; inventory icons use 64×64 transparent tiles.
- Files: `kofi1-ground-crack-hairline.png`, `kofi1-ground-crack-open.png`.

## Prompt for Codex

Jagged dark fissure with dislodged clay edges, transparent outside the crack. Match the exact frame, state descriptions and attachment registration above. Follow the existing style reference. Preserve separate props and actors; no lettering, baked light pools or background in transparent object assets. This reference does not request new art.

## Attach / references

[STORY.md · kofi1-scene-02](../../../../STORY.md#kofi1-scene-02) · [private/kofi1/spec.json](../../spec.json) · [art/STYLE.md](../../../../art/STYLE.md) · [Chapter index](../INDEX.md)

Style attachments: [art/STYLE.md](../../../../art/STYLE.md) · [art/style/palette.png](../../../../art/style/palette.png) · [art/style/scale.png](../../../../art/style/scale.png) · [tent-reference.png](../../../../tent-reference.png)
