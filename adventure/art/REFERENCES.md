# Chapter reference workflow

Read `AGENTS.md`, `WORKLOG.md` and the pointers in `art/CODEX.md`, then the chapter index, room,
puzzle targets, object states and inventory briefs. The active ownership switch assigns Codex
the whole project. A generated reference is documentation, not an instruction to produce art.

## Authoritative sources

Kofi's functional prologue now lives in `src/chapters/kofi1/`. Its room positions and images are
temporary labelled test layouts, generated with `npm run art:kofi-placeholders`; they are not
the planned art composition. The tracked `private/kofi1/spec.json` and its references remain the
finished-art planning authority. Do not replace that plan with the temporary grid or install a rig.

- Implemented chapters: chapter definitions for targets, conditions and positions; the art manifest
  for appearance and delivery metadata; existing atlas `sourceSize` or image dimensions for frames.
- Unimplemented private chapters: the permanent private specification for visual facts, target
  classification, stages and parent attachments; linked private story scenes for narrative and dialogue.
- Shared drawing conventions: `STYLE.md`, palette, scale and the tent reference. Approved per-room
  exceptions remain explicit, including the existing prison-cage perspective.

Public reference generation never reads private chapter specifications. Those files are optional
local authoring inputs, never imported by the game, public catalogs, builds or save migrations.

## Generate and check

From `adventure/`:

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

## Ordering and editing

Chapter indexes follow story room order. Within a room: interactive targets in puzzle order,
their sprites, separate visual-only scenery, then foreground cuts. Shared objects have one brief
linked from every room. An inspection target is distinct from the image used to draw it.

Edit source data, not generated Markdown, SVG, HTML or JPG files. A child prop can attach to a
parent placement by offset; this prevents a fitted component drifting away when its parent moves.
State variants retain their frame and anchor. A collected or hidden instance needs no empty PNG;
semantic changes with no visual change reuse the same drawing.

Normal Node tests use public-safe fixtures and do not require private files. Run `npm test` and
the relevant `test:feature` suites after tooling changes; use all Node checks for broad changes.
No art import, rig installation, gameplay change, published build, commit or push is implied by
reference regeneration. Existing browser/release-suite restrictions still apply.
