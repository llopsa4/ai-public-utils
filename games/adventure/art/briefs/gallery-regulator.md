# gallery-regulator

<!-- GENERATED: edit the authoritative source, then run npm run art:briefs -- --chapter ch1. -->

Reference for the implemented chapter; existing artwork is preserved.

ID: `gallery-regulator` · object · **target** · final

## Description

C7 separate regulator body with valves and gauge stem (cracked; crack reaching the locking ring).

## What the game does with it

look; use; take; open

## Placement and layers

- [Regulator Gallery](room-gallery.md): anchor (806,528) art px / (403,264) logical; world; Always; patchFailed: cracked -> ringCracked.

## States, visibility and transitions

- **cracked** — C7 separate regulator body with valves and gauge stem (cracked; crack reaching the locking ring). When: Existing cracked frame; placement flag conditions above determine when it is used..
- **ringCracked** — C7 separate regulator body with valves and gauge stem (cracked; crack reaching the locking ring). When: Existing ringCracked frame; placement flag conditions above determine when it is used..

Existing file: art/src/objects/gallery-regulator.png. Status: final. No new artwork is produced by reference generation.

## Asset contract

- Canvas: **384×412 art px**. Bottom-centre anchor; preserve dimensions and registration across states.
- Files: `art/inbox/gallery-regulator-cracked.png`, `art/inbox/gallery-regulator-ringCracked.png`.

## Sources

[art/manifest.mjs · L284](../manifest.mjs#L284) · [src/chapters/ch1/rooms.ts](../../src/chapters/ch1/rooms.ts) · [src/chapters/ch1/interactions.ts](../../src/chapters/ch1/interactions.ts) · [Chapter index](INDEX-ch1.md)

Shared guides: [art/PIPELINE.md](../PIPELINE.md) · [art/STYLE.md](../STYLE.md) · [art/LAYERED-RIG.md](../LAYERED-RIG.md) · [../WORKFLOW.md](../../../WORKFLOW.md) · [Chapter rules](RULES-ch1.md)
