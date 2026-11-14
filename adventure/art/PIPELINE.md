# Art production and integration

Follow the [shared workflow](../WORKFLOW.md) for ownership, assignment fields, approval and
revision coordination. [REFERENCES.md](REFERENCES.md) identifies authoritative inputs and
reference-generation commands. This procedure covers artwork; a generated brief is not a task.

## Contracts and inputs

- Read the assignment's chapter/room/object briefs and measured states/anchors.
- [STYLE.md](STYLE.md) owns visual conventions, palette, grid and approved exceptions.
  The manifest and current atlas metadata own installed dimensions/tags; source `rig.json` and
  [LAYERED-RIG.md](LAYERED-RIG.md) own articulated anatomy, timing and facing contracts.
- Keep source-only studies distinct from runtime art. Preserve approved rigs, source anatomy,
  registration and independently drawn directions; do not replace them with generated strips.
- Record actual originals, prompts, references, licensing and processing. The central
  [provenance record](PROVENANCE.md) identifies historical sources; it is not a production recipe.

## Scene construction

- Create the fixed scenery as an opaque background. Every depicted object the player can
  interact with must be a separate image with transparency, composited over that background;
  do not paint a duplicate of it into the background.
- Keep complete, clean scenery behind every overlay so removing or moving an object reveals
  the correct background. Non-interactive decoration may remain in the background if it never
  changes; changing scenery must also be separate.
- Characters and foreground occluders are separate layers. Their draw order must allow the
  intended overlaps and depth. State variants retain the same canvas and anchor registration.
- Clickable targets are geometry, distinct from the artwork. One object's image can support
  several actions; it does not need a separate image per verb or an empty image when hidden.

Apply this contract when creating or replacing scene artwork. It does not authorise regenerating
existing art or resuming paused production.

## Produce a delivery

1. Check available image-generation tools before promising generated work. If unavailable,
   report the limitation and continue independent preparation/validation; do not silently
   substitute a provider or claim generation occurred.
2. Work inside `art/inbox/<assignment>/<revision>/`. Preserve originals separately from processed
   candidates and previews. Preparation scripts must target the revision, not installed artwork,
   shared rigs, registration or status. Inspect importer/generator write paths before use.
3. Follow the asset's exact dimensions, transparency, anchor, state/frame ordering and identity.
   Leave clean backing beneath removable parts. Use the source-pack contract rather than a
   universal layer count, walk cadence or mirroring rule.
4. Reject candidates with incorrect anatomy, identity or composition. Inspect final-size and
   enlarged previews for seams, underpainting, clipping, alpha
   edges, contact points, state registration and motion. Measure candidates without installation.
   Runtime `art:check` does not validate an uninstalled candidate; distinguish that evidence.
5. Put the assignment/revision, exact files, input references, measured contract, reproducible
   processing, provenance, checks actually run and limitations in the revision's `HANDOFF.md`.
   Mark ready for review and add its exact path to the integration queue. Changed candidates get
   a new revision rather than overwriting the handed-off revision.

## Integrate an approved revision

1. Verify the approval and scope under WORKFLOW.md before importing. Preserve existing pauses
   and review-only candidates recorded in the work log and queues.
2. Import only intended files. `art/import.mjs` normalizes assets; rig generation and `art/webp.mjs`
   may affect shared outputs. Coordinate scope before running them. Use the smaller appropriate
   WebP encoding, following the existing encoder.
3. Register installed art/status in the manifest and `src/content/art.ts`, with loading/rendering
   wiring in `src/game/assets.ts` where needed. Keep chapter object states, foreground cuts,
   walk geometry and the installed background consistent. Actor geometry and portrait moods
   follow current profiles/metadata, not obsolete universal constants.
4. Update central provenance from the delivery record. Use the testing policy's art and relevant
   Node checks, then inspect scale, depth, portraits and motion through its scratch-preview
   procedure. Record unverified behavior rather than substituting an old published preview.
5. After installation and verification, move the installed revision under `art/inbox/done/` and
   finish its queue task. Preserve uninstalled alternatives and original evidence.

## Tool selection

Run only the scoped tool needed: `art/pixelate.mjs` for legacy derivatives, `art/rig.mjs <id>`
for the selected character, `art/icons.mjs` for procedural icons, and `art/webp.mjs` for encoding.
Read each tool's scope before use. [REPLACING.md](REPLACING.md) is a generated asset-contract
inventory; it does not replace this procedure. Reference generation is documented separately in
REFERENCES.md and never installs art.

After replacing a room painting, `npm run art:outlines` uses Python/OpenCV and NumPy to extract
painted hotspot outlines. Inspect `art/inbox/preview/outlines-<room>.png`; correct missed cuts
through `art/outlines.json` before regeneration. The normal scope/approval rules still apply.
