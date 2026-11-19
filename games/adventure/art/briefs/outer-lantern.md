# outer-lantern

<!-- GENERATED: edit the authoritative source, then run npm run art:briefs -- --chapter intro. -->

Reference for the implemented chapter; existing artwork is preserved.

ID: `outer-lantern` · object · **visual** · final

## Description

User-approved C7 r1 small iron wall lantern on its bracket, one drawing reused twice. Body 18 by 32 art pixels against Silas's 220px height; glass centre at canvas (20,28), bottom-centre anchor (20,44).

## What the game does with it

Visual layer only; no additional interaction is introduced.

## Placement and layers

- [Outer Door](room-prison-door.md): anchor (284,260) art px / (142,130) logical; world; Always.
- [Outer Door](room-prison-door.md): anchor (660,260) art px / (330,130) logical; world; Always.

## States, visibility and transitions

- **idle** — User-approved C7 r1 small iron wall lantern on its bracket, one drawing reused twice. Body 18 by 32 art pixels against Silas's 220px height; glass centre at canvas (20,28), bottom-centre anchor (20,44). When: Existing idle frame; placement flag conditions above determine when it is used..

Existing file: art/src/intro/objects/outer-lantern.png. Status: final. No new artwork is produced by reference generation.

## Asset contract

- Canvas: **40×44 art px**. Bottom-centre anchor; preserve dimensions and registration across states.
- Files: `art/inbox/outer-lantern-idle.png`.

## Sources

[art/manifest.mjs · L475](../manifest.mjs#L475) · [src/chapters/intro/rooms.ts](../../src/chapters/intro/rooms.ts) · [src/chapters/intro/interactions.ts](../../src/chapters/intro/interactions.ts) · [Chapter index](INDEX-intro.md)

Shared guides: [art/PIPELINE.md](../PIPELINE.md) · [art/STYLE.md](../STYLE.md) · [art/LAYERED-RIG.md](../LAYERED-RIG.md) · [../WORKFLOW.md](../../../WORKFLOW.md) · [Chapter rules](RULES-intro.md)
