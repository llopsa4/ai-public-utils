# Ground-home doors

<!-- GENERATED: edit the authoritative source, then run npm run art:briefs -- --private-spec private/kofi1/spec.json. -->

Authoring reference; may contain chapter spoilers. Runtime implementation is separate.

ID: `ground-door` · object · **target**

## Description

Simple slatted wooden door with an inside bar loop; front-on.

## What the game does with it

Look; Use brace; test with resident

## Placement and layers

- [Riverbank / Amaneti](../rooms/riverbank.md): anchor (1000,524) art px / (500,262) logical; world; finished primary home.
- [Riverbank / Amaneti](../rooms/riverbank.md): anchor (745,524) art px / (372.5,262) logical; world; months second home.

## States, visibility and transitions

- **unbraced** — Closed plain door with empty interior bar loops. When: Before household safety improvements..
- **open** — Door ajar toward rear, same frame. When: Occupant tests from inside; brace attachment can remain local overlay..

Two instances, for Oweli and Saluna. Their bars and braces are separate; open-state schematic interior reference shows empty hinge clearance, not a third room.

## Asset contract

- Canvas: **66×132 art px**. Bottom-centre anchor; preserve dimensions and registration across states.
- Files: `kofi1-ground-door-unbraced.png`, `kofi1-ground-door-open.png`.

## Sources

[STORY.md · kofi1-scene-07](../../../../STORY.md#kofi1-scene-07) · [private/kofi1/spec.json](../../spec.json) · [art/STYLE.md](../../../../art/STYLE.md) · [Chapter index](../INDEX.md)

Shared guides: [art/PIPELINE.md](../../../../art/PIPELINE.md) · [art/STYLE.md](../../../../art/STYLE.md) · [art/LAYERED-RIG.md](../../../../art/LAYERED-RIG.md) · [WORKFLOW.md](../../../../WORKFLOW.md) · [Chapter rules](../DRAWING-RULES.md)
