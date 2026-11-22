# Codex handoff (Survival)

Written only by Codex; Claude reads it and never edits it. Procedure:
[WORKFLOW.md](../../WORKFLOW.md#handoff-files).

## Working on
- None. Approved AB6 revision 1 installed; claims released.

## Awaiting the user
- None. AB0 and AB12 remain user-approved. Claude's C2-C11/C13 reviews are complete;
  AB2, AB5 and AB9 need their small revision-2 fixes; AB3, AB10, AB11 and AB13 need revisions.
  Family cloth greys stay as approved in AB12 (user); the AC9 performance decision is closed.

## Requests for Claude
- None. C2-C11 and C13 were reviewed in `from-claude.md` *Art reviews*. Completed review
  requests are retired here; follow those verdicts for revisions and installation.

## Taken from Claude
- C7 / AB6 review (2026-11-22), done: approved revision 1 installed (eight keys, 38 frames,
  one 0.8 MB FX atlas page). [Archived immutable delivery](../art/inbox/done/AB6-r1/delivery.json).
  Manifest provenance and ASSETS updated. Placeholder fire and fire-pit textures now omit
  static flame triangles when animated art is loaded; their no-art fallback stays intact.
  Updated smoke expectations for installed effects and made the validator's invalid-provenance
  fixture explicit. TESTING documents `art/source/AB6-r1/install-check.mjs`.
  [1280 camp](../test-results/ab6-installed/camp-1x-1280.png),
  [2560 camp](../test-results/ab6-installed/camp-1x-2560.png),
  [small effects at 0.5x](../test-results/ab6-installed/completion-hit-dust-0.5x-1280.png),
  [checks](../test-results/ab6-installed/browser-checks.json).
  Both resolutions and zoom 0.5/1/2 checked; flying/stuck arrows, spirits, storm, flame,
  hit/dust/build effects and advancing loops verified, no browser errors. Representative
  captures visually inspected; hit/dust remain subtle but visible at 0.5x. Texture pixel
  checks confirm the old static flames are absent. Delivery frames remain unchanged.
  Inbox/manifest validation, typecheck, 293 unit tests and all 24 e2e tests pass.
  No published rebuild, commit or push. Saving parked. Next approved install: AB8.

- C5 / AB7 review (2026-11-22), done: approved revision 1 title installed byte-identically
  as `art/title.jpg` (2560 x 1440 RGB JPEG, 981,637 bytes; delivery SHA-256 verified).
  [Archived immutable delivery](../art/inbox/done/AB7-r1/delivery.json).
  Existing AB1 emblem is identical to AB7's reuse; retained AB1 provenance and atlas unchanged.
  ASSETS and CHANGELOG updated; no runtime changes needed. Title is an external JPEG,
  so no new manifest key or atlas repack was needed.
  [1280 menu](../test-results/ab7-installed/menu-1280.png),
  [2560 menu](../test-results/ab7-installed/menu-2560.png),
  [checks](../test-results/ab7-installed/checks.json): title loads once with HTTP 200,
  exact dimensions, readable code-drawn title and controls, no browser errors; both captures
  visually inspected. Menu art is screen-fixed, so map zoom does not apply.
  Inbox/manifest validation, typecheck, 293 unit tests and all 24 e2e tests pass.
  No published rebuild, commit or push. Saving parked. AB6 installed above; next approved install: AB8.

- C2 / AB1 review (2026-11-22), done: approved revision 1 installed. Five keys, eight delivery
  frames; the UI atlas now has six final keys / nine frames including AB0 food, on one page.
  [Archived immutable delivery](../art/inbox/done/AB1-r1/delivery.json).
  Panels/buttons remain byte-identical to AB0. Manifest status/provenance and ASSETS updated.
  Confirmed `ui_bar_frame` is visible with alpha 1, drawn after the fill, at 0/60/100 Wotakuye
  and both resolutions; carved rails are visible even at full fill. No runtime fix was needed.
  [Full bar](../test-results/ab1-installed/bar-100-1280.png),
  [menu](../test-results/ab1-installed/menu-1280.png),
  [camp](../test-results/ab1-installed/camp-1x-1280.png),
  [automated checks](../test-results/ab1-installed/checks.json).
  Captures cover menu, selection/build cards, minimap, bar levels and zoom 0.5/1/2 at
  1280x720 and 2560x1440, without browser errors; menu and bar crops visually inspected.
  Manifest validation, typecheck, 293 unit tests and all 24 e2e tests pass.
  Source delivery archived unchanged. No published rebuild, commit or push. Saving parked.
  AB8 remains approved and ready for later installation; AB6 and AB7 are installed above.

- Art request (2026-11-20): AB0 revision 1 approved and installed 2026-11-22.
  [Archived delivery](../art/inbox/done/AB0-r1/delivery.json) records the prompts and renderer hash.
  All 15 frames packed into the ground, buildings and UI atlases. Manifest validation,
  typecheck, 292 unit tests and 24 browser tests passed. The HUD debug hook now reports
  the resource frame name for atlas art, and the interface check expects installed button art.
  Screenshots: [summer 0.5×](../test-results/ab0-installed/summer-0.5.png),
  [summer 1×](../test-results/ab0-installed/summer-1.png),
  [summer 2×](../test-results/ab0-installed/summer-2.png),
  [winter 1×](../test-results/ab0-installed/winter-1.png). No browser errors.
  Non-summer grass uses the code fallback pending AB3. Published output was not rebuilt.
- AB2 revision 1 prepared on the user's request, 2026-11-22, while AB1 awaits review.
  Delivery: `art/inbox/AB2/`; paintings and reproducible preparation/preview scripts:
  `art/source/AB2-r1/`. `delivery.json` records final and initial prompts; rejected attempts
  are retained only in the source folder. Used built-in `image_gen.imagegen` and Pillow processing.
  Validation: manifest + all 62 frames pass; typecheck and 292 unit tests pass. Isolated candidate
  atlases load in Chromium at both screen sizes with no browser errors. All cursor CSS includes
  both resolutions and the five specified hotspots. Contact sheet and previews visually inspected.
  No runtime code or installed art changed; no published rebuild, commit or push. C3 awaits Claude.
- AB3 revision 1 delivered 2026-11-22, continuing the art batches while AB1/AB2 await review.
  Sources and reproducible scripts: `art/source/AB3-r1/`; delivery: `art/inbox/AB3/`.
  Built-in image generation made four new summer textures and 15 seasonal edits of summer sources;
  summer grass reuses AB0. All exact prompts are in `delivery.json` and the source folder.
  Manifest/inbox validation passes (80 frames). Source-script checks verify invariant variant
  edges, shared water colours and preserved AB0 bytes. Typecheck and 292 unit tests pass.
  Isolated Chromium previews cover all four seasons at zoom 0.5/1/2 and 1280x720/2560x1440,
  with no browser errors. Contact, repeated fields and representative game views visually inspected.
  No runtime code or installed assets changed; no published rebuild, commit or push. C4 awaits Claude.
- AB7 revision 1 delivered 2026-11-22. Sources and reproducible scripts: `art/source/AB7-r1/`;
  JPEG, unchanged AB1 emblem, contact, measurements and two menu previews: `art/inbox/AB7/`.
  Built-in `image_gen.imagegen` made the initial painting and two composition edits; exact
  prompts and earlier compositions are preserved. Pillow produces the 2560x1440 JPEG within
  the 1 MB budget. Candidate title and emblem were loaded only in an isolated game snapshot.
  Typecheck, 292 unit tests, emblem inbox validation, separate JPEG checks and Chromium menu
  previews at 1280x720/2560x1440 pass. Final menu visually inspected; no browser errors.
  No runtime code or installed assets changed; no published rebuild, commit or push. C5 awaits Claude.
- AB5 revision 1 delivered 2026-11-22: 80 frames across 13 keys, in `art/inbox/AB5/`.
  Original summer paintings, seasonal edits, exact prompts, placement measurements and
  reproducible preparation/preview scripts are in `art/source/AB5-r1/`.
  Built-in `image_gen.imagegen` generated 23 summer/item sources, one boulder replacement
  and 57 seasonal edits of their corresponding summer sources. Pillow keys/despills, aligns,
  scales and recolours cast shadows; contact sheets show both grounds, fixed groves show
  the same layouts in all seasons. Candidate game previews use AB3 ground only in a scratch snapshot.
  Final manifest/inbox validation, typecheck and 292 unit tests pass. Eight seasonal camp views
  and four store views at the two screen sizes pass, with 20/40 props per resource verified
  and no browser errors. Representative sheets, groves, winter camp and store visually inspected.
  No runtime code or installed assets changed; no published rebuild, commit or push. C6 awaits Claude.
- AB6 revision 1 delivered 2026-11-22: 38 frames across eight keys in `art/inbox/AB6/`.
  Built-in `image_gen.imagegen` produced eight bases, thirty selected frame edits and one rejected
  storm-lighting edit. Every animation frame has a generated source and exact retained prompt.
  Source scripts key/despill, apply a common scale/translation per key, normalize alpha and write
  cells, contact strips, GIFs and the review index. No code-generated animation frames.
  Final manifest/inbox validation, typecheck and 292 unit tests pass. Isolated Chromium captures
  at both screen sizes verify normal renderer paths for fire, spirit, storm, flying/stuck arrows,
  hit dust, runner dust and build sparkle, with no browser errors. Representative frames and
  game views visually inspected; animation GIFs and numerical seam checks provided for C7.
  No runtime code or installed assets changed; no published rebuild, commit or push. C7 awaits Claude.
- AB8 revision 1 delivered 2026-11-22: 90 Blender frames for traps, fire pits and all barricade
  masks/states in `art/inbox/AB8/`. Three generated model references and a new painted stone
  texture, exact prompts, packed editable Blender models and reproducible scripts are retained.
  Pole wood reuses AB0. `render_batch.py` calls unchanged AB0 renderer functions and shadow post;
  its output loop handles batch paths and 16 masks. Fixed 1-metre edge endpoints align the joins.
  Final manifest/inbox validation, typecheck and 292 unit tests pass. Candidate Chromium checks
  at both screen sizes cover actual L/T pointer drags, stage rows, winter and flames, with 12
  captures across three zooms and no browser errors. Representative sheets, joins and summer/
  winter game views visually inspected. C8 awaits Claude. No runtime or installed art changes,
  published rebuild, commit or push; saving stays parked.

- AB9 revision 1 delivered 2026-11-22: 26 Blender frames for gathering spot, hunting lodge,
  drying rack and empty horse corral in `art/inbox/AB9/`. Four packed editable models in
  `art/source/`; four generated concepts, new woven-mat painting, five exact prompts,
  source hashes and reproducible scripts in `art/source/AB9-r1/`. AB0 hide and wood reused.
  The AB9 wrapper explicitly selects horizontal sensor fit to satisfy the prescribed
  footprint and anchor; shared renderer and prior art unchanged (details in C9).
  Manifest/inbox validation, source hashes, numeric model/camera checks, typecheck and
  292 unit tests pass. Isolated Chromium checks at both screen sizes verify all stages,
  winter and both four-frame drying loops, with 28 screenshots and no browser errors.
  Contact sheets, representative game views and loop frame differences visually/numerically
  inspected. C9 awaits Claude. Claims released; no installation, published rebuild,
  commit or push. Saving stays parked.


- AB10 revision 1 delivered 2026-11-22: 25 Blender frames across five society lodges in
  `art/inbox/AB10/`. Five generated concepts and exact prompts, packed editable models and
  reproducible scripts retained under `art/source/AB10-r1/` and its parent. Shared AB9 helper
  definitions and painted materials reused without modifying AB9 or the AB0 renderer.
  Manifest/inbox validation, final model/camera checks, source hashes, typecheck and 292
  unit tests pass. Isolated Chromium verifies all stages, winter and three zooms at
  1280x720/2560x1440, with 32 captures and no browser errors. Contact sheets and representative
  summer/winter game views visually inspected. C10 awaits Claude. Claims released; no
  installation, published rebuild, commit or push. Saving stays parked. Next art candidate: AB11.

- AB11 revision 1 delivered 2026-11-22: eight Blender frames for fire plaza, store and open
  store in `art/inbox/AB11/`; three packed editable models in `art/source/`, and two generated
  concepts, bark painting, exact prompts and reproducible scripts in `art/source/AB11-r1/`.
  AB0 renderer and AB9 helper definitions reused unchanged. The store/cutaway share geometry;
  all 8m footprints, (320,576) anchors, hearth prop counts and empty cutaway checked numerically.
  Final manifest/inbox validation, source hashes, typecheck and 292 unit tests pass. Isolated
  Chromium verifies all states, winter, zoom 0.5/1/2, separate flame placement and empty/half/full
  store hover in/out at both screen sizes (38 captures), with no browser errors. Representative
  sheets and game views visually inspected. No full manual construction/seasonal run or full
  e2e-suite rerun. C11 awaits Claude. Claims released; no installation, published rebuild,
  commit or push. Saving stays parked. Next art candidate: AB12 (user approves the figure look).

- AB12 revision 1 delivered 2026-11-22: shared `art/source/human_rig.blend`, figure extension
  in `art/source/render.py`, reproducible/packed sources in `art/source/AB12-r1/`, and 128
  walk frames in `art/inbox/AB12/`. Review includes two tinted GIFs, both-ground contact sheet
  and six in-game captures. Validation, rig/projection/source checks, typecheck, 293 unit tests
  and focused Chromium checks pass. The user approved the figure look on 2026-11-22.
  Claims released; no installation, published rebuild, commit or push. Saving stays parked.

- AB13 revision 1 delivered 2026-11-22 after the user's AB12 approval: 1,408 PNGs in
  `art/inbox/AB13/`, fifteen action plates and 1x/2x tinted loops, review HTML, source hashes
  and 92 game captures. Reproducible sources and immutable model: `art/source/AB13-r1/`;
  canonical `person_man.blend` and `human_rig.blend` share the full action library.
  `render.py` dispatches the complete man to the new reference renderer; the building path
  stays unchanged. Generation adds no new image prompts: approved AB0 concept/hide and
  existing painted wood, stone and weave are reused. All recorded technical checks pass; C13
  was reviewed by Claude: revision 2 required for tools; see C13 in the other handoff. Claims released. No installation, published rebuild, commit or push.
  Saving stays parked. Fix AB13 tools before using it for AB14 (woman); family cloth greys stay unchanged.
