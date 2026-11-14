# Settlement doorway lamps

<!-- GENERATED: edit the authoritative source, then run npm run art:briefs -- --private-spec private/kofi1/spec.json. -->

Authoring reference; may contain chapter spoilers. Runtime implementation is separate.

ID: `settlement-lantern` · object · **visual**

## Description

Small plain covered clay oil lamp in a protective woven hanger, unlettered and soot-marked.

## What the game does with it

Visual layer only; no additional interaction is introduced.

## Placement and layers

- [Riverbank / Amaneti](../rooms/riverbank.md): anchor (1070,390) art px / (535,195) logical; world; rite and months, doorway hanger.
- [Riverbank / Amaneti](../rooms/riverbank.md): anchor (805,390) art px / (402.5,195) logical; world; months, second ground home.

## States, visibility and transitions

- **lit** — Small flame at a plain clay wick opening; no glow pool. When: First lamp appears when ground shelter is finished for the rite; second lamp months later. Runtime light warms evening only..
- **unlit** — Same lamp with no flame. When: Daytime months/afternoon; leave lamp fixture visible..

Reusable appearance for two separate household lamps. Never bake lamp or glow into a hut or background. The view from the clearing can refer to these lamps below without creating another room or a new camera close-up.

## Asset contract

- Canvas: **26×38 art px**. Bottom-centre anchor; preserve dimensions and registration across states.
- Files: `kofi1-settlement-lantern-lit.png`, `kofi1-settlement-lantern-unlit.png`.

## Sources

[STORY.md · kofi1-scene-06](../../../../STORY.md#kofi1-scene-06) · [STORY.md · kofi1-scene-07](../../../../STORY.md#kofi1-scene-07) · [private/kofi1/spec.json](../../spec.json) · [art/STYLE.md](../../../../art/STYLE.md) · [Chapter index](../INDEX.md)

Shared guides: [art/PIPELINE.md](../../../../art/PIPELINE.md) · [art/STYLE.md](../../../../art/STYLE.md) · [art/LAYERED-RIG.md](../../../../art/LAYERED-RIG.md) · [WORKFLOW.md](../../../../WORKFLOW.md) · [Chapter rules](../DRAWING-RULES.md)
