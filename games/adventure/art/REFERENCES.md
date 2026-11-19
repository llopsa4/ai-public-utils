# Chapter reference workflow

Use [the shared workflow](../../WORKFLOW.md) for assignments and approval,
[PIPELINE.md](PIPELINE.md) for art production, and this document for reference authority.

## Authoritative sources

Kofi's functional prologue now lives in `src/chapters/kofi1/`. Its room positions and images are
temporary labelled test layouts, generated with `npm run art:kofi-placeholders`; they are not
the planned art composition. The tracked `private/kofi1/spec.json` and its references remain the
finished-art planning authority. The test grid does not replace that composition; production and
installation status are recorded in WORKLOG.md and the handoff files.

- Implemented chapters: chapter definitions for targets, conditions and positions; the art manifest
  for appearance and delivery metadata; existing atlas `sourceSize` or image dimensions for frames.
- Unimplemented private chapters: the permanent private specification for visual facts, target
  classification, stages and parent attachments; linked private story scenes for narrative and dialogue.
- Shared drawing conventions: `STYLE.md`, palette, scale and the tent reference. Approved per-room
  exceptions remain explicit, including the existing prison-cage perspective.

Public reference generation never reads private chapter specifications. Those files are optional
local authoring inputs, never imported by the game, public catalogs, builds or save migrations.

## Generate and check

From `games/adventure/`:

```sh
npm run art:briefs -- --chapter intro
npm run art:briefs -- --chapter intro --check
npm run art:briefs -- --private-spec private/kofi1/spec.json
npm run art:briefs -- --private-spec private/kofi1/spec.json --check
```

The public chapter command keeps existing asset brief filenames and JPG layout paths. Its entry
point is [INDEX-intro.md](briefs/INDEX-intro.md); the shared catalog links to that reading order.
The explicit authoring command writes only alongside its input, under `reference/`.
The user approved tracking `private/kofi1/spec.json`, its README and generated references,
including full prologue spoilers. Other private inputs, the complete `STORY.md` and the recovery
archive remain ignored. The folder and command names are retained for compatibility.
Its local index is `private/kofi1/reference/INDEX.md`. The former inbox index is a relocation notice.

`--check` compares generated content without writing and fails when any expected output is stale
or missing. It also checks scene references, dimensions, states, stage names, attachment parents
and duplicate visible instances. Unknown or incomplete command options fail before generation.
The generic full-catalog commands remain available; their implemented intro references use this
same source adapter and renderer, so they cannot restore the old cell description or generic scale.

Full public generation validates deliverable pack/piece metadata and renders every output (including
intro layouts) before writing. `sourceReference` entries document existing sources; their legacy
IDs/paths/statuses are retained, but they are not delivery requests or installation records.
Validation/rendering errors leave existing files unchanged; filesystem write failures are not
transactional. Handoff files are never generated.

Source-only Kofi references: [standing rig](briefs/kofi-standing-rig-source.md),
[village design](briefs/kofi-village-source.md), [travel design](briefs/kofi-travel-source.md),
[village walk](briefs/kofi-village-walk-source.md) and [travel walk](briefs/kofi-travel-walk-source.md).
These document the existing sources without resuming production or installation.

```sh
npm run art:briefs -- --out-dir <tmp>/art    # isolated mirror: briefs/ and spec/
npm run art:briefs -- --out-dir <tmp>/art --check
npm run art:briefs -- --check              # entire current public catalog; read-only
```

For documentation-only changes, add `--markdown-only` to the full, chapter or explicit private
command. It skips SVG/HTML/JPEG output; metadata validation and private-path guards still apply.
The full public catalog's `--out-dir` mirror can stage Markdown for review. Scoped/private
output locations remain fixed; do not redirect private references into public output.

```sh
npm run art:briefs -- --markdown-only --out-dir <tmp>/art
npm run art:briefs -- --markdown-only --check
npm run art:briefs -- --chapter intro --markdown-only --check
npm run art:briefs -- --private-spec private/kofi1/spec.json --markdown-only --check
npm run art:guide -- --markdown-only --out-dir <tmp>/guide
npm run art:guide -- --markdown-only --check
```

`art:guide` retains its existing default image-generation behavior. In Markdown-only mode its
`--out-dir` is an art-root mirror containing `REPLACING.md`; `--check` never writes. Shared rules
are linked from generated references; asset-specific frames, anchors, states, sources and chapter
exceptions remain explicit. A Markdown-only refresh does not establish freshness of layout images.

## Ordering and editing

Chapter indexes follow story room order. Within a room: interactive targets in puzzle order,
their sprites, separate visual-only scenery, then foreground cuts. Shared objects have one brief
linked from every room. An inspection target is distinct from the image used to draw it.

Edit source data, not generated Markdown, SVG, HTML or JPG files. A child prop can attach to a
parent placement by offset; this prevents a fitted component drifting away when its parent moves.
State variants retain their frame and anchor. A collected or hidden instance needs no empty PNG;
semantic changes with no visual change reuse the same drawing.

Validation and preview policy: [TESTING.md](../TESTING.md).

## Deferred Kofi source and delivery notes

Reference only; current task status is in the work log and handoff files. The approved prologue spec
owns visual composition. These retained delivery notes do not resume production or installation.

### Sources and outstanding artwork
- **Kofi** (about 27): physically fit Black man; very short close-cropped hair or shaved scalp;
  sparse practical hide and woven cloth, bare torso, small animal-fur accents, earthy colours;
  a goat-bell charm at his belt. Main-character detail and presence matching Silas, with a distinct
  face; no Robin Hood hood, green tunic or European archer costume. Base village design delivered
  at `art/inbox/kofi-design/` (2026-11-13), with matching travelling design (`TRAVEL.md`);
  **Actual eleven-piece village/travel source rigs are delivered** in
  `art/sources/characters/kofi-{village,travel}-layered/`; see `art/inbox/kofi-layered/HANDOFF.md`.
  Separate shoulder/elbow pieces include complete forearm/hands, with registered joint pivots.
  Current GIFs use the same articulated renderer as Silas. The earlier independently drawn strips
  in `art/inbox/kofi-walk/` are superseded as animation inputs (reference only).
  **Separate alternative (2026-11-13):** new rig from original standing designs in
  `art/sources/characters/kofi-standing-rig/`; independent renderer, 17 body/costume/gear layers,
  original idles and right-facing walking sheets. `art/inbox/kofi-rig-from-standing/HANDOFF.md`.
  User requested keeping the earlier rig untouched; this alternative is review-only, not installed.
  **Remaining:** other facing directions, drawn action poses, portraits and full runtime sheet
  assembly/integration. Do not invoke the full sheet assembler until kneel/lie sources exist.
  - *village/building* sheet: no bow or quiver;
  - *travelling* sheet: his rough wooden **folding bow folded along the outside of his leg** (strapped
    like a scabbard) and a **flat quiver tight on his back**, both rigid with the body so the walk
    cycle stays simple.
  - Action poses (shared by both): unfold and draw, aim, shoot a line over a branch, kneel, carry.
- **The robot**: spider-shaped, the size of a small monkey that rides on a shoulder. Round scuffed
  brass body (about a fist and a half), a **cracked cream ceramic plate** on its back, **six** thin
  jointed legs (four to walk, the front two used as hands), **two small amber lamp-eyes** that dim
  and brighten. Poses: trapped under a beam, freed, crouched wary, on Kofi's shoulder.
- **Animals:** goats (with a lead nanny), dogs (Huska, the lead dog, distinct), chickens (loose and in
  baskets); **wolves** (a pack, night); **a bear** (rearing and charging).
- **Villagers:** Oweli (old woman, keeper of the songs), Tohani (goat herder, proud, man), Saluna
  (grower, woman), Ahyeli (young mother) with her children Tali (girl) and Kanu (boy), and a few
  generic villagers for the rite and the crowd. Same community and clothing as Kofi.
- **Fight art** (Kiln Courier screen): the wolf pack and the bear as enemies; card art for Shot,
  Aimed shot, Step back, Fire brand, Huska!, Gather arrows.

Current production/installation status is recorded in the work log and handoff files.
