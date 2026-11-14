# Inland town gate

<!-- GENERATED: edit the authoritative source, then run npm run art:briefs -- --private-spec private/kofi1/spec.json. -->

Authoring reference; may contain chapter spoilers. Runtime implementation is separate.

ID: `inland-gate` · object · **target**

## Description

Simple open timber arch, rough stone jamb at inland edge.

## What the game does with it

Look; exit when story permits

## Placement and layers

- [Tsalohi at evening](../rooms/tsalohi.md): anchor (1196,620) art px / (598,310) logical; rear; evening through departure.

## States, visibility and transitions

- **open** — Unobstructed path inland. When: Visible throughout town sequence; remains stable until escape fade..

Stage gateway, distinct from goat gate and coop. Do not obscure right-edge exit with collapse masks.

## Technical

- Canvas: **130×330 art px**. Bottom-centre anchor; preserve dimensions and registration across states.
- Existing palette and world pixel grid; inventory icons use 64×64 transparent tiles.
- Files: `kofi1-inland-gate-open.png`.

## Prompt for Codex

Simple open timber arch, rough stone jamb at inland edge. Match the exact frame, state descriptions and attachment registration above. Follow the existing style reference. Preserve separate props and actors; no lettering, baked light pools or background in transparent object assets. This reference does not request new art.

## Attach / references

[STORY.md · kofi1-scene-01](../../../../STORY.md#kofi1-scene-01) · [STORY.md · kofi1-scene-02](../../../../STORY.md#kofi1-scene-02) · [private/kofi1/spec.json](../../spec.json) · [art/STYLE.md](../../../../art/STYLE.md) · [Chapter index](../INDEX.md)

Style attachments: [art/STYLE.md](../../../../art/STYLE.md) · [art/style/palette.png](../../../../art/style/palette.png) · [art/style/scale.png](../../../../art/style/scale.png) · [tent-reference.png](../../../../tent-reference.png)
