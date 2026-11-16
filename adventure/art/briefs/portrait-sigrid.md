# portrait-sigrid

<!-- GENERATED: edit the authoritative source, then run npm run art:briefs -- --chapter intro. -->

Reference for the implemented chapter; existing artwork is preserved.

ID: `portrait-sigrid` · portrait · **visual** · final

## Description

Sigrid's approved standing-based dialogue portrait.

## What the game does with it

Visual layer only; no additional interaction is introduced.

## Placement and layers

Inventory, character or shared reference; no freestanding room instance.

## States, visibility and transitions

- **idle** — Sigrid's approved standing-based dialogue portrait. When: Existing idle frame; placement flag conditions above determine when it is used..

Existing file: art/src/intro/portraits/sigrid.png. Status: final. No new artwork is produced by reference generation.

Derived from sigrid-layered; do not draw this derived sheet separately.

256×256 transparent frames; each mood has a closed-mouth frame followed by a speaking frame. Keep the same crop and silhouette throughout.

Standing source: art/sources/characters/sigrid-layered/idle.png.

User-approved revision r2, 2026-11-15. Preserve the installed final PNG; walking-rig rebuilds must not replace it.

Exact approved hashes, crop coordinates and speaking-lip registration: art/sources/dialogue-portraits/approved-r2.json.

C6 r1 skin recolour approved 2026-11-16; frame geometry, alpha, moods and mouth registration unchanged. Reproduction and approval: art/sources/characters/sigrid-colour-c6/.

## Asset contract

- Canvas: **1536×256 art px**. Image tile anchor; preserve dimensions and registration across states.
- Files: `art/inbox/portrait-sigrid.png`.

## Sources

[art/manifest.mjs · L704](../manifest.mjs#L704) · [src/chapters/intro/rooms.ts](../../src/chapters/intro/rooms.ts) · [src/chapters/intro/interactions.ts](../../src/chapters/intro/interactions.ts) · [Chapter index](INDEX-intro.md)

Shared guides: [art/PIPELINE.md](../PIPELINE.md) · [art/STYLE.md](../STYLE.md) · [art/LAYERED-RIG.md](../LAYERED-RIG.md) · [WORKFLOW.md](../../WORKFLOW.md) · [Chapter rules](RULES-intro.md)
