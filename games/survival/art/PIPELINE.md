# Survival art pipeline

How Codex makes, delivers and installs Survival's art. The look is [STYLE.md](STYLE.md), the
numbers are [SPEC.md](SPEC.md), the work list is [BATCHES.md](BATCHES.md), the register is
[ASSETS.md](ASSETS.md), and agent roles and approval fields are in the shared
[workflow](../../WORKFLOW.md).

## Rule 1: Codex draws, Claude never does

- **Codex** generates, models, renders, processes, validates, delivers and, after approval,
  installs every image. If Codex is paused, art waits; nobody else makes or installs it.
- **Claude** writes text (STYLE.md, SPEC.md, BATCHES.md prompts and briefs) and code (the loader,
  animation, `scripts/art/*`), reviews deliveries and approves the batches whose Approval
  authority is Claude. Claude never draws, generates, edits or installs art, and adds no new
  placeholder drawings. Keys without art show grey stand-ins (`npm run art:standins`, into the
  git-ignored `art/standins/`), never shipped.
- This overrides, for Survival art, the shared workflow's "Claude only (Codex paused)" clause.

## Before a batch

1. Read STYLE.md, the batch's section in BATCHES.md and the SPEC.md rows it names. Check the
   batch's *Needs* rows in [PLAN.md](../PLAN.md) are done (the loader and tools exist).
2. First Codex session in Survival: create `.agents/skills/survival-content/` as an identical copy
   of `.claude/skills/survival-content/` ([games/AGENTS.md](../../AGENTS.md)).
3. Claim the batch in [handoff/from-codex.md](../handoff/from-codex.md) *Working on*.
4. Tools: Blender 5.1, Python 3 with Pillow, Node (repo scripts), Codex's image generation. **If a
   tool is missing or a prompt cannot be followed, stop and say why in the handoff; never
   improvise a different method, size or look.**

## Making the art

### Animated models and buildings (Blender)
1. **Concept sheet** (image generation, STYLE.md template) for a new model; it is part of the
   delivery and, for AB0/AB12, of the user's approval.
2. **Textures:** hand-painted seamless textures from image generation (hide, wood, mat, fur,
   bark, stone), saved in `art/source/textures/<name>.png` (1024×1024 or 2048×2048).
3. **Model and rig** in `art/source/<key>.blend` at the real sizes of STYLE.md section 4 (1 m =
   1 unit, ground point at the origin). People share one human rig and one action library
   (`art/source/human_rig.blend`, built in AB12); animals have one rig each.
4. **Animations** as Blender actions named exactly as the SPEC.md animation names.
5. **Render:** `blender -b art/source/<key>.blend -P art/source/render.py -- <key> [<anim>]`.
   `render.py` (built in AB0 with the tipi, extended in AB12 for rigged figures) reads the key's cell,
   anchor, facings, frames and layers from `art/manifest.json` (manifest v2, AC1; before AC1 they are
   passed as `--cell W H --anchor X Y`), sets the SPEC.md section 2 camera,
   renders at 2× and downscales with Lanczos, recolours the shadow, and writes the frames with
   SPEC.md names into `art/inbox/<batch>/<key>/`.
6. Buildings: `stage1`–`stage3` are partial copies of the finished model in the same file
   (collections `stage1`, `stage2`, `stage3`, `finished`); `winter` adds a snow collection.

### Still art (image generation)
1. Generate from the STYLE.md template with the batch's subject wording, on flat #00FF00 (or
   #FF00FF for green subjects).
2. Key out the background (no fringe; despill), trim, scale with Lanczos so the subject matches
   STYLE.md scale, and place it in the SPEC.md cell with its ground point on the anchor pixel.
3. Ground: generate the seamless square, then the tile script (resize 512, rotate 45°, scale
   128×64, diamond mask) makes each tile; variant details stay 8 px from the diamond edge. Banks and
   spills are composed from the season's grass and water tiles with painted blend masks.
4. Seasons: the summer image is made first; the other three are image edits of it that keep the
   silhouette and placement.
5. Keep every prompt used: it goes into `delivery.json`.

## Delivering

Into `art/inbox/<batch>/` (never into `art/atlas/`):
- `<key>/…png`: every frame, named as SPEC.md section 8, RGBA 8-bit sRGB, exact cell size.
- `delivery.json`:
  ```json
  {
    "batch": "AB13", "revision": 1, "brief": "BATCHES.md AB13 rev 1",
    "keys": ["person_man"],
    "tools": { "blender": "5.1", "renderPy": "<sha256>", "imageGen": "<tool name>" },
    "prompts": { "person_man/concept": "<exact prompt>" },
    "notes": "anything that differs from the brief, and why"
  }
  ```
- `contact.png`: every key on one sheet (each animation as a row per facing, stills in a grid),
  on a mid-grey and a dark ground strip, with a 64×32 tile outline under each anchor.
- Run `npm run art:validate -- --inbox <batch>` (AC1): exact cell, 2 px empty border, frame
  counts, names, layers aligned (`cloth` pixels only where `base` is opaque), anchor pixel on the
  ground point (alpha present within 4 px above it). Fix failures before delivering.
- Write the delivery in [handoff/from-codex.md](../handoff/from-codex.md) with the batch ID,
  revision, paths and validator output, and the batch's **Approval authority**. A delivered
  revision is immutable; changes make a new revision.

AB0 delivers only the four summer grass frames. The validator also requires
`concept/person_man.png` as a readable PNG. Keep the concept out of `delivery.json`'s
`keys` list so the packer only reads game assets. AB3 must deliver the complete seasonal set.

## Approval

- **User** approves the style-key batches **AB0** and **AB12**. Their approved look is the
  reference for every later batch.
- **Claude** approves every other batch: it checks the contact sheet and stand-in-free in-game
  screenshots against STYLE.md and the approved keys, then writes "Approved: ABn rev r" (or a
  fix list) in [handoff/from-claude.md](../handoff/from-claude.md). The user sees every contact
  sheet and may reject any batch at any time.
- No approval, no install. Passing the validator is not approval.

## Installing (Codex, after approval)

1. `npm run art:pack -- <batch>` (AC2): packs the batch's frames into `art/atlas/<group>-<n>.png`
   + `<group>.json` (repacking the whole group).
2. In `art/manifest.json`, set each key `status: "final"`, `batch`, `revision`, `approvedBy`.
3. Add or update the key's row in [ASSETS.md](ASSETS.md).
4. `npm run art:validate`, `npm run typecheck`, `npm test`, `npm run e2e`: all pass.
5. In the game (`npm run dev`, `?debug`): screenshots at zoom 0.5, 1 and 2 showing the keys in
   place (feet on the ground, correct depth, family tints, season, stage); no console errors.
   Attach them to the handoff.
6. Move `art/inbox/<batch>/` to `art/inbox/done/<batch>-r<revision>/` (append-only history).
7. Commit only when the user asks (repository rules); never push without the user's request.

## Checks (every delivery)

- Clean alpha, no green or magenta fringe on light or dark ground; 2 px empty border.
- Exact cell, anchor pixel, frame counts and names (validator).
- Same light (upper left), palette and scale as STYLE.md and the approved keys.
- Reads at 1× display size: a person by silhouette at about 32 px; icons at 16 px.
- Loops flow from the last frame into the first; feet do not slide.
- `cloth` layer: only shirt or dress pixels, greyscale, aligned with `base`.
- Nothing from STYLE.md section 11 (*Never draw*).
- Free to use: made by Codex with free software and its own image generation; nothing from an
  asset store or a commercial game.
