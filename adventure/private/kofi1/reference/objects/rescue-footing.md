# Central rescue footing

<!-- GENERATED: edit the authoritative source, then run npm run art:briefs -- --private-spec private/kofi1/spec.json. -->

Authoring reference; may contain chapter spoilers. Runtime implementation is separate.

ID: `rescue-footing` · object · **visual**

## Description

Narrow supported tongue of earth leading toward Kofi, rough broken forward edge.

## What the game does with it

Visual layer only; no additional interaction is introduced.

## Placement and layers

- [Tsalohi at evening](../rooms/tsalohi.md): anchor (640,690) art px / (320,345) logical; ground; rescue.

## States, visibility and transitions

- **stable** — Only remaining central support. When: Both rescue candidates visible; remains until Kofi escapes..

Show no route connecting the far ends of both ledges. At departure hide after actors clear it.

## Technical

- Canvas: **180×150 art px**. Bottom-centre anchor; preserve dimensions and registration across states.
- Existing palette and world pixel grid; inventory icons use 64×64 transparent tiles.
- Files: `kofi1-rescue-footing-stable.png`.

## Prompt for Codex

Narrow supported tongue of earth leading toward Kofi, rough broken forward edge. Match the exact frame, state descriptions and attachment registration above. Follow the existing style reference. Preserve separate props and actors; no lettering, baked light pools or background in transparent object assets. This reference does not request new art.

## Attach / references

[STORY.md · kofi1-scene-02](../../../../STORY.md#kofi1-scene-02) · [private/kofi1/spec.json](../../spec.json) · [art/STYLE.md](../../../../art/STYLE.md) · [Chapter index](../INDEX.md)

Style attachments: [art/STYLE.md](../../../../art/STYLE.md) · [art/style/palette.png](../../../../art/style/palette.png) · [art/style/scale.png](../../../../art/style/scale.png) · [tent-reference.png](../../../../tent-reference.png)
