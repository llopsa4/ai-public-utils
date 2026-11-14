# Two remembered cups

<!-- GENERATED: edit the authoritative source, then run npm run art:briefs -- --private-spec private/kofi1/spec.json. -->

Authoring reference; may contain chapter spoilers. Runtime implementation is separate.

ID: `cups` · object · **visual**

## Description

Plain small clay cups, one chipped and one with a repaired handle.

## What the game does with it

Visual layer only; no additional interaction is introduced.

## Placement and layers

- [Woodland clearing](../rooms/woodland-clearing.md): anchor (470,460) art px / (235,230) logical; world; construction grief beat. Attached to work-board-woodland-clearing-0, offset (-20,-110).
- [Woodland clearing](../rooms/woodland-clearing.md): anchor (510,460) art px / (255,230) logical; world; construction grief beat. Attached to work-board-woodland-clearing-0, offset (20,-110).
- [Riverbank / Amaneti](../rooms/riverbank.md): anchor (840,540) art px / (420,270) logical; world; after grief beat, Deyu died only; chipped cup by communal tools.
- [Riverbank / Amaneti](../rooms/riverbank.md): anchor (580,530) art px / (290,265) logical; world; after grief beat, Enali died only; repaired cup beside water pot.

## States, visibility and transitions

- **chipped** — Chipped cup associated with Deyu. When: At board during grief beat; if Deyu died, Kofi sets this cup by communal tools at bank..
- **repaired** — Cup with repaired handle associated with Enali. When: At board during grief beat; if Enali died, Kofi sets this cup beside communal water pot at bank..

Both cups were carried in communal bundles. Two instances with fixed identities, not a random survivor indicator. Living person’s cup remains in use. No text or portrait on cups. Each PNG depicts ONE cup: chipped for Deyu, repaired for Enali. Both are present at the clearing board before the grief beat; only the dead neighbour’s cup moves to the specified bank destination. The living neighbour’s cup returns to ordinary personal use offstage.

Draw one cup per variant, never two cups in one 28x32 image. The two individual cup identities use different branch destinations.

## Asset contract

- Canvas: **28×32 art px**. Bottom-centre anchor; preserve dimensions and registration across states.
- Files: `kofi1-cups-chipped.png`, `kofi1-cups-repaired.png`.

## Sources

[STORY.md · kofi1-scene-05](../../../../STORY.md#kofi1-scene-05) · [private/kofi1/spec.json](../../spec.json) · [art/STYLE.md](../../../../art/STYLE.md) · [Chapter index](../INDEX.md)

Shared guides: [art/PIPELINE.md](../../../../art/PIPELINE.md) · [art/STYLE.md](../../../../art/STYLE.md) · [art/LAYERED-RIG.md](../../../../art/LAYERED-RIG.md) · [WORKFLOW.md](../../../../WORKFLOW.md) · [Chapter rules](../DRAWING-RULES.md)
