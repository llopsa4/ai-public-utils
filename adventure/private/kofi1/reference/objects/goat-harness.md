# Padded nanny harness

<!-- GENERATED: edit the authoritative source, then run npm run art:briefs -- --private-spec private/kofi1/spec.json. -->

Authoring reference; may contain chapter spoilers. Runtime implementation is separate.

ID: `goat-harness` · object · **target**

## Description

Broad soft leather breast strap with woven pad and a rear trace loop.

## What the game does with it

Look; ask Tohani to fit

## Placement and layers

- [Riverbank / Amaneti](../rooms/riverbank.md): anchor (755,530) art px / (377.5,265) logical; world; beside sledge before fitting.

## States, visibility and transitions

- **laid** — Loose folded harness. When: At sledge before Tohani agrees..
- **fitted** — Harness laid out for actor attachment reference. When: Tohani fits it to nanny for haul; remove after arrival and return to storage..

No new goat body or animation. Same canvas for loose/fitted prop, actor attachment documented only.

## Asset contract

- Canvas: **70×66 art px**. Bottom-centre anchor; preserve dimensions and registration across states.
- Files: `kofi1-goat-harness-laid.png`, `kofi1-goat-harness-fitted.png`.

## Sources

[STORY.md · kofi1-scene-05](../../../../STORY.md#kofi1-scene-05) · [private/kofi1/spec.json](../../spec.json) · [art/STYLE.md](../../../../art/STYLE.md) · [Chapter index](../INDEX.md)

Shared guides: [art/PIPELINE.md](../../../../art/PIPELINE.md) · [art/STYLE.md](../../../../art/STYLE.md) · [art/LAYERED-RIG.md](../../../../art/LAYERED-RIG.md) · [WORKFLOW.md](../../../../WORKFLOW.md) · [Chapter rules](../DRAWING-RULES.md)
