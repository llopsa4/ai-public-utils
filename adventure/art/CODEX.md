# Codex tasks

## Kofi 1: prologue logic authorised; finished art on hold

Codex owns story, planning, review, art, implementation, tests and documentation. No Claude
handoff is required. The user authorised implementing chapter logic on 2026-11-14 using only very simple placeholder
art for functionality tests. A subsequent request explicitly authorises the geometric tensed-bow
placeholder for utility shots and combat; its source is `scripts/kofi-placeholders.ts`.
Finished-art production and rig installation remain on hold.

Read the private `STORY.md`, then `private/kofi1/reference/INDEX.md`. The current specification
has six locations; its room/object briefs replace the earlier five-room description here.
Edit `private/kofi1/spec.json` for visual facts and linked story scenes for narrative intent.
Generated briefs and layouts are reference outputs, not a second task queue.

From `adventure/`:

```
npm run art:briefs -- --private-spec private/kofi1/spec.json
npm run art:briefs -- --private-spec private/kofi1/spec.json --check
```

Shared reference conventions and the implemented Silas chapter index are documented in
[REFERENCES.md](REFERENCES.md). The user approved tracking the prologue specification, README
and reference outputs, including prologue spoilers. Keep the complete `STORY.md`, recovery archive
and other private inputs ignored. Do not add planning assets to the runtime manifest before
implementation is requested.

The room-layering rule remains: fixed background with clean backing beneath every removable,
changing or separately drawn object. Targets, visual sprites and foreground cuts are distinct.

### Deferred asset notes — reference only

The existing design/delivery notes below are retained for later production. They do not restart
paused art work or authorise replacing an existing rig.

### Characters and creatures
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

Art production remains on hold. Use the current private index when the user resumes it.
