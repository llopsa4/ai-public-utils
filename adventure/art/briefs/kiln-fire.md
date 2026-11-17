# kiln-fire

<!-- GENERATED: edit the authoritative source, then run npm run art:briefs -- --chapter ch1. -->

Reference for the implemented chapter; existing artwork is preserved.

ID: `kiln-fire` · object · **visual** · final

## Description

C7 separate kiln hall kiln-fire, transparent clean backing.

## What the game does with it

Visual layer only; no additional interaction is introduced.

## Placement and layers

- [The Kiln Hall](room-mara.md): anchor (680,442) art px / (340,221) logical; world; Always; kilnCold: lit -> cold.
- [The Kiln Hall](room-mara.md): anchor (805,442) art px / (402.5,221) logical; world; Always; kilnCold: lit -> cold.
- [The Kiln Hall](room-mara.md): anchor (930,442) art px / (465,221) logical; world; Always; kilnCold: lit -> cold.

## States, visibility and transitions

- **lit** — C7 separate kiln hall kiln-fire, transparent clean backing. When: Existing lit frame; placement flag conditions above determine when it is used..
- **cold** — C7 separate kiln hall kiln-fire, transparent clean backing. When: Existing cold frame; placement flag conditions above determine when it is used..

Existing file: art/src/objects/kiln-fire.png. Status: final. No new artwork is produced by reference generation.

## Asset contract

- Canvas: **56×44 art px**. Bottom-centre anchor; preserve dimensions and registration across states.
- Files: `art/inbox/kiln-fire-lit.png`, `art/inbox/kiln-fire-cold.png`.

## Sources

[art/manifest.mjs · L274](../manifest.mjs#L274) · [src/chapters/ch1/rooms.ts](../../src/chapters/ch1/rooms.ts) · [src/chapters/ch1/interactions.ts](../../src/chapters/ch1/interactions.ts) · [Chapter index](INDEX-ch1.md)

Shared guides: [art/PIPELINE.md](../PIPELINE.md) · [art/STYLE.md](../STYLE.md) · [art/LAYERED-RIG.md](../LAYERED-RIG.md) · [WORKFLOW.md](../../WORKFLOW.md) · [Chapter rules](RULES-ch1.md)
