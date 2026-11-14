# Covered fire carrier

<!-- GENERATED: edit the authoritative source, then run npm run art:briefs -- --private-spec private/kofi1/spec.json. -->

Authoring reference; may contain chapter spoilers. Runtime implementation is separate.

ID: `fire-carrier` · object · **visual**

## Description

Small covered earthen container with secure handle and modest ember vent.

## What the game does with it

Visual layer only; no additional interaction is introduced.

## Placement and layers

- [Riverbank / Amaneti](../rooms/riverbank.md): anchor (1190,485) art px / (595,242.5) logical; world; months rack.
- [Kofi’s hut](../rooms/kofi-hut.md): anchor (200,510) art px / (100,255) logical; world; hut rack.

## States, visibility and transitions

- **closed** — Lid secured; faint dark ember vent. When: Collected at hunt departure and stowed at hut..
- **open** — Lid raised, empty upper opening around stored brand. When: Fire-brand action reference, not a new exploration puzzle..

No painted orange glow pool; no actual fire generation or game equipment changes in this pack.

## Technical

- Canvas: **48×68 art px**. Bottom-centre anchor; preserve dimensions and registration across states.
- Existing palette and world pixel grid; inventory icons use 64×64 transparent tiles.
- Files: `kofi1-fire-carrier-closed.png`, `kofi1-fire-carrier-open.png`.

## Prompt for Codex

Small covered earthen container with secure handle and modest ember vent. Match the exact frame, state descriptions and attachment registration above. Follow the existing style reference. Preserve separate props and actors; no lettering, baked light pools or background in transparent object assets. This reference does not request new art.

## Attach / references

[STORY.md · kofi1-scene-08](../../../../STORY.md#kofi1-scene-08) · [STORY.md · kofi1-scene-09](../../../../STORY.md#kofi1-scene-09) · [private/kofi1/spec.json](../../spec.json) · [art/STYLE.md](../../../../art/STYLE.md) · [Chapter index](../INDEX.md)

Style attachments: [art/STYLE.md](../../../../art/STYLE.md) · [art/style/palette.png](../../../../art/style/palette.png) · [art/style/scale.png](../../../../art/style/scale.png) · [tent-reference.png](../../../../tent-reference.png)
