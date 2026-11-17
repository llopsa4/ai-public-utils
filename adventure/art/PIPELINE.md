# Adventure art procedure

The shared [art process](../../process/ART.md) covers scene construction, generation prompts,
deliveries and integration for every game; ownership and approval are in the shared
[workflow](../../process/WORKFLOW.md). This file adds only what is particular to Adventure.
[REFERENCES.md](REFERENCES.md) identifies authoritative inputs and reference-generation commands;
[STYLE.md](STYLE.md) owns the look and every number. A generated brief is not a task.

## Contracts and inputs

- Read the assignment's chapter/room/object briefs (`art/briefs/`) and measured states/anchors.
- [STYLE.md](STYLE.md) owns visual conventions, palette, grid, proportions and approved exceptions.
  The manifest (`art/manifest.mjs`) and current atlas metadata own installed dimensions/tags; source
  `rig.json` and [LAYERED-RIG.md](LAYERED-RIG.md) own articulated anatomy, timing and facing
  contracts.
- Keep source-only studies distinct from runtime art. Preserve approved rigs, source anatomy,
  registration and independently drawn directions; do not replace them with generated strips.
- Record actual originals, prompts, references, licensing and processing. The central
  [provenance record](PROVENANCE.md) identifies historical sources; it is not a production recipe.

## Scene construction

Shared rules: [ART.md, scene construction](../../process/ART.md#scene-construction). The main
characters and their heights for the scale rule are in [STYLE.md, proportions](STYLE.md#proportions)
(Silas in the intro, Mara in his chapters, Kofi in his).

## Generation prompts

Shared format: [ART.md, generation prompts](../../process/ART.md#generation-prompts). Working
examples: the C7 room prompts, for instance `art/inbox/done/scene-redraw-tent-r2/PROMPTS.md`.

## Install an approved revision in Adventure

Follow [ART.md, integrate](../../process/ART.md#integrate-an-approved-revision), with these tools and
files:

- `art/import.mjs` normalizes assets; rig generation and `art/webp.mjs` may affect shared outputs,
  so coordinate their scope first. Use the smaller appropriate WebP encoding, following the existing
  encoder.
- Register installed art and status in the manifest and `src/content/art.ts`, with loading and
  rendering wiring in `src/game/assets.ts` where needed. Chapter object states live in the chapter's
  `rooms.ts`. Actor geometry and portrait moods follow current profiles and metadata, not obsolete
  universal constants.
- Checks and scratch previews: [TESTING.md](../TESTING.md).

## Tool selection

Run only the scoped tool needed: `art/pixelate.mjs` for legacy derivatives, `art/rig.mjs <id>` for
the selected character, `art/icons.mjs` for procedural icons, and `art/webp.mjs` for encoding. Read
each tool's scope before use. [REPLACING.md](REPLACING.md) is a generated asset-contract inventory;
it does not replace this procedure. Reference generation is documented in REFERENCES.md and never
installs art.

After replacing a room painting, `npm run art:outlines` uses Python/OpenCV and NumPy to extract
painted hotspot outlines. Inspect `art/inbox/preview/outlines-<room>.png`; correct missed cuts
through `art/outlines.json` before regeneration. The normal scope and approval rules still apply.
