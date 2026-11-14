# Tall-tree offering branch

<!-- GENERATED: edit the authoritative source, then run npm run art:briefs -- --private-spec private/kofi1/spec.json. -->

Authoring reference; may contain chapter spoilers. Runtime implementation is separate.

ID: `rite-branch` · object · **target**

## Description

Loose dry side shoot with one small fork, no fresh cut or green leaves.

## What the game does with it

Take from platform; Use on tree space

## Placement and layers

- [Woodland clearing](../rooms/woodland-clearing.md): anchor (835,300) art px / (417.5,150) logical; world; rite platform source.
- [Riverbank / Amaneti](../rooms/riverbank.md): anchor (675,578) art px / (337.5,289) logical; world; rite tree space. Attached to rite-circle-riverbank-0, offset (-25,-22).

## States, visibility and transitions

- **idle** — Loose dead branch. When: Visible on low platform only after construction; hide on Take; show once in circle; stored at months jump..

No second bow shot; no branch left attached after pickup. Small residual broken socket belongs to separate target-branch scenery if needed.

## Technical

- Canvas: **88×26 art px**. Bottom-centre anchor; preserve dimensions and registration across states.
- Existing palette and world pixel grid; inventory icons use 64×64 transparent tiles.
- Files: `kofi1-rite-branch-idle.png`.

## Prompt for Codex

Loose dry side shoot with one small fork, no fresh cut or green leaves. Match the exact frame, state descriptions and attachment registration above. Follow the existing style reference. Preserve separate props and actors; no lettering, baked light pools or background in transparent object assets. This reference does not request new art.

## Attach / references

[STORY.md · kofi1-scene-06](../../../../STORY.md#kofi1-scene-06) · [private/kofi1/spec.json](../../spec.json) · [art/STYLE.md](../../../../art/STYLE.md) · [Chapter index](../INDEX.md)

Style attachments: [art/STYLE.md](../../../../art/STYLE.md) · [art/style/palette.png](../../../../art/style/palette.png) · [art/style/scale.png](../../../../art/style/scale.png) · [tent-reference.png](../../../../tent-reference.png)
