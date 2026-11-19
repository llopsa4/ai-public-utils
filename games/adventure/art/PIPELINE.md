# Adventure art procedure

How Adventure artwork is specified, generated, delivered and installed. Ownership, assignment
handoffs and approval are in the repository [workflow](../../WORKFLOW.md).
[REFERENCES.md](REFERENCES.md) identifies authoritative inputs and reference-generation commands;
[STYLE.md](STYLE.md) owns the look and every number (main characters and heights, proportions, pixel
grid, palette, staging). A generated brief is not a task.

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

- Create the fixed scenery as an opaque background. Every depicted object the player can interact
  with is a separate image with transparency, composited over that background; do not paint a
  duplicate of it into the background.
- Keep complete, clean scenery behind every overlay, so removing or moving an object reveals the
  correct background. Non-interactive decoration may stay in the background if it never changes;
  changing scenery is separate too. Fixed exits (arches, doorways, stairs) may stay in the
  background.
- Characters and foreground occluders are separate layers; their draw order allows the intended
  overlaps and depth. State variants keep the same canvas and anchor registration.
- Clickable targets are geometry, distinct from the artwork. One object's image can support several
  actions; it needs no separate image per verb and no empty image when hidden.
- **Scale:** everything in a scene, painted or overlaid, is sized against the scene's main
  character, using the heights in [STYLE.md, proportions](STYLE.md#proportions) (Silas in the
  intro, Mara in his chapters, Kofi in his). A book, glove, chair or tool must make sense in that
  character's hands or beside them; an oversized or toy-sized prop is a defect to report, not a
  style choice.

Apply this contract when creating or replacing scene artwork. It does not authorise regenerating
existing art or resuming paused production.

## Generation prompts

The writer named by the [workflow](../../WORKFLOW.md#modes-and-ownership) puts the prompt in
the assignment's `art/inbox/<assignment>/<revision>/PROMPTS.md` before generation; the generator
records any deviation there. Working examples: the C7 room prompts, for instance
`art/inbox/done/scene-redraw-tent-r2/PROMPTS.md`. A prompt states, in this order:

1. **Use case and novelty:** new asset, matching state of an existing asset, or precise edit.
2. **Canvas:** exact size, transparency, and padding that must stay empty.
3. **Scale:** for every room, object or prop, the exact size in canvas pixels of each depicted thing
   with a real-world size (a book, glove, chair, table, door, tool), stated against the scene's main
   character (name, height and the body part it is compared with, for example "a ledger about a hand
   span wide, roughly one eighth of the hero's height; a stool seat at the knee"). Check each figure
   against the [proportions table](STYLE.md#proportions); a prompt without these sizes is incomplete.
4. **Geometry:** key corners, edges and anchors in canvas coordinates; what continues off-canvas.
5. **Each reference image and its only role** (geometry, style, identity); never copy pixels.
6. **Material and style:** stroke widths, spacing, palette notes and the pixel definition from
   [STYLE.md](STYLE.md).
7. **Exclusions:** room, floor, shadows, people, props, matte, text, checkerboard, panels.
8. **Priority:** which property wins on conflict (usually geometry and continuity over detail).

For a matching state (open/closed, lit/dark), say that it is the identical design and describe the
projected silhouette with coordinates. One asset per prompt; no comparison sheets. Work out the
numeric layout first and check that every number fits with the others before generation.

## Produce a delivery

1. Check available image-generation tools before promising generated work. If unavailable, report
   the limitation and continue independent preparation/validation; do not silently substitute a
   provider or claim generation occurred.
2. Work inside `art/inbox/<assignment>/<revision>/`. Preserve originals separately from processed
   candidates and previews. Preparation scripts target the revision, not installed artwork, shared
   rigs, registration or status. Inspect importer/generator write paths before use.
3. Follow the asset's exact dimensions, transparency, anchor, state/frame ordering and identity.
   Leave clean backing beneath removable parts. Follow the source-pack contract rather than a
   universal layer count, walk cadence or mirroring rule.
4. Before generating, check whether approved art already fits: reuse an approved pose or drawing
   for technical preparation (alignment, transparency cleanup, layer splitting) instead of
   generating a new one, and keep a one-scene action variant separate from the general-use pose.
   After generating, compare the actual generation calls and the candidates' geometry and content
   with the **latest** `PROMPTS.md`; reading a revised prompt does not prove a candidate follows it.
5. Reject candidates with incorrect anatomy, identity or composition. Inspect final-size and
   enlarged previews for seams, underpainting, clipping, alpha edges, contact points, state
   registration and motion. Measure candidates without installing them; runtime art checks do not
   validate an uninstalled candidate, so keep that evidence distinct.
6. Put the assignment/revision, exact files, input references, measured contract, reproducible
   processing, provenance, checks actually run and limitations in the revision's `HANDOFF.md`. Mark
   it ready for review in your handoff file with its exact path. A changed candidate gets a new
   revision rather than overwriting the handed-off one.

## Install an approved revision

1. Verify the approval and scope under the [workflow](../../WORKFLOW.md#approval) before
   importing. Preserve existing pauses and review-only candidates recorded in the work log and
   handoff files.
2. Import only the intended files, with the scoped tools below; coordinate the scope of any tool
   that touches shared outputs before running it. `art/import.mjs` normalizes assets; rig generation
   and `art/webp.mjs` may affect shared outputs. Use the smaller appropriate WebP encoding,
   following the existing encoder.
3. Register installed art and status in the manifest and `src/content/art.ts`, with loading and
   rendering wiring in `src/game/assets.ts` where needed. Chapter object states live in the chapter's
   `rooms.ts`. Keep object states, foreground cuts, walk geometry and the installed background
   consistent. Actor geometry and portrait moods follow current profiles and metadata, not obsolete
   universal constants.
4. Update the central [provenance](PROVENANCE.md) from the delivery record. Run the art and relevant
   checks ([TESTING.md](../TESTING.md)), then inspect scale, depth, portraits and motion in a scratch
   preview. Record unverified behavior rather than substituting an old published preview.
5. After installation and verification, move the installed revision under `art/inbox/done/` and
   mark the request done in your handoff file. Preserve uninstalled alternatives and original
   evidence.

## Tool selection

Run only the scoped tool needed: `art/pixelate.mjs` for legacy derivatives, `art/rig.mjs <id>` for
the selected character, `art/icons.mjs` for procedural icons, and `art/webp.mjs` for encoding. Read
each tool's scope before use. [REPLACING.md](REPLACING.md) is a generated asset-contract inventory;
it does not replace this procedure. Reference generation is documented in REFERENCES.md and never
installs art.

After replacing a room painting, `npm run art:outlines` uses Python/OpenCV and NumPy to extract
painted hotspot outlines. Inspect `art/inbox/preview/outlines-<room>.png`; correct missed cuts
through `art/outlines.json` before regeneration. The normal scope and approval rules still apply.
