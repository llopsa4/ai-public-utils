# Bowl of roots

<!-- GENERATED: edit the authoritative source, then run npm run art:briefs -- --private-spec private/kofi1/spec.json. -->

Authoring reference; may contain chapter spoilers. Runtime implementation is separate.

ID: `meal-bowl` · object · **visual**

## Description

Shallow clay bowl holding cooked pale roots.

## What the game does with it

Visual layer only; no additional interaction is introduced.

## Placement and layers

- [Riverbank / Amaneti](../rooms/riverbank.md): anchor (570,550) art px / (285,275) logical; world; post-hunt return only.

## States, visibility and transitions

- **served** — Plain roots, no bear meat reward. When: Saluna hands bowl in either bear outcome; hides as Kofi takes supper home..

Dialogue prop only, not a new satchel recipe or branch resource.

## Technical

- Canvas: **58×28 art px**. Bottom-centre anchor; preserve dimensions and registration across states.
- Existing palette and world pixel grid; inventory icons use 64×64 transparent tiles.
- Files: `kofi1-meal-bowl-served.png`.

## Prompt for Codex

Shallow clay bowl holding cooked pale roots. Match the exact frame, state descriptions and attachment registration above. Follow the existing style reference. Preserve separate props and actors; no lettering, baked light pools or background in transparent object assets. This reference does not request new art.

## Attach / references

[STORY.md · kofi1-scene-08](../../../../STORY.md#kofi1-scene-08) · [private/kofi1/spec.json](../../spec.json) · [art/STYLE.md](../../../../art/STYLE.md) · [Chapter index](../INDEX.md)

Style attachments: [art/STYLE.md](../../../../art/STYLE.md) · [art/style/palette.png](../../../../art/style/palette.png) · [art/style/scale.png](../../../../art/style/scale.png) · [tent-reference.png](../../../../tent-reference.png)
