# portrait-silas-cloak-clerk

<!-- GENERATED: edit the authoritative source, then run npm run art:briefs -- --chapter intro. -->

Reference for the implemented chapter; existing artwork is preserved.

ID: `portrait-silas-cloak-clerk` · portrait · **visual** · final

## Description

Silas — cloaked clerk's approved standing-based dialogue portrait.

## What the game does with it

Visual layer only; no additional interaction is introduced.

## Placement and layers

Inventory, character or shared reference; no freestanding room instance.

## States, visibility and transitions

- **idle** — Silas — cloaked clerk's approved standing-based dialogue portrait. When: Existing idle frame; placement flag conditions above determine when it is used..

Existing file: art/src/intro/portraits/silas-cloak-clerk.png. Status: final. No new artwork is produced by reference generation.

Derived from silas-cloak-layered; do not draw this derived sheet separately.

256×256 transparent frames; each mood has a closed-mouth frame followed by a speaking frame. Keep the same crop and silhouette throughout.

Standing source: adventure\art\sources\dialogue-portraits\silas-cloak-clerk-generated.png.

User-approved revision r2, 2026-11-15. Preserve the installed final PNG; walking-rig rebuilds must not replace it.

Installed with nearest master-palette normalization only; approved frame geometry, alpha and speaking registration are unchanged.

Exact approved hashes, crop coordinates and speaking-lip registration: art/sources/dialogue-portraits/approved-r2.json.

## Asset contract

- Canvas: **512×256 art px**. Image tile anchor; preserve dimensions and registration across states.
- Files: `art/inbox/portrait-silas-cloak-clerk.png`.

## Sources

[art/manifest.mjs](../manifest.mjs) · [src/chapters/intro/rooms.ts](../../src/chapters/intro/rooms.ts) · [src/chapters/intro/interactions.ts](../../src/chapters/intro/interactions.ts) · [Chapter index](INDEX-intro.md)

Shared guides: [art/PIPELINE.md](../PIPELINE.md) · [art/STYLE.md](../STYLE.md) · [art/LAYERED-RIG.md](../LAYERED-RIG.md) · [../WORKFLOW.md](../../../WORKFLOW.md) · [Chapter rules](RULES-intro.md)
