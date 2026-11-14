# Tohani’s faulty gate

<!-- GENERATED: edit the authoritative source, then run npm run art:briefs -- --private-spec private/kofi1/spec.json. -->

Authoring reference; may contain chapter spoilers. Runtime implementation is separate.

ID: `pen-gate` · object · **target**

## Description

Narrow hinged slat gate, worn pin hole visible.

## What the game does with it

Look; use cross-pin; Open by story

## Placement and layers

- [Tsalohi at evening](../rooms/tsalohi.md): anchor (250,600) art px / (125,300) logical; world; evening and escape.

## States, visibility and transitions

- **loose** — Closed but sagging slightly. When: Before cross-pin fitted..
- **latched** — Straight closed gate. When: Cross-pin installed..
- **open** — Gate swung clear to rear, same frame extent. When: Tohani leads herd out; hides with pen at collapse..

Cross-pin is a separate overlay. Keep repaired and open positions inside one frame.

## Technical

- Canvas: **110×140 art px**. Bottom-centre anchor; preserve dimensions and registration across states.
- Existing palette and world pixel grid; inventory icons use 64×64 transparent tiles.
- Files: `kofi1-pen-gate-loose.png`, `kofi1-pen-gate-latched.png`, `kofi1-pen-gate-open.png`.

## Prompt for Codex

Narrow hinged slat gate, worn pin hole visible. Match the exact frame, state descriptions and attachment registration above. Follow the existing style reference. Preserve separate props and actors; no lettering, baked light pools or background in transparent object assets. This reference does not request new art.

## Attach / references

[STORY.md · kofi1-scene-01](../../../../STORY.md#kofi1-scene-01) · [private/kofi1/spec.json](../../spec.json) · [art/STYLE.md](../../../../art/STYLE.md) · [Chapter index](../INDEX.md)

Style attachments: [art/STYLE.md](../../../../art/STYLE.md) · [art/style/palette.png](../../../../art/style/palette.png) · [art/style/scale.png](../../../../art/style/scale.png) · [tent-reference.png](../../../../tent-reference.png)
