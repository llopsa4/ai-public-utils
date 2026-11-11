# Work log: Claude and Codex

Both agents read this first, and update their own sections before stopping. Keep it short (under
about 100 lines). Queues live elsewhere: Codex's in `art/CODEX.md`, Claude's in `CLAUDE-INBOX.md`.

Last updated: 2026-11-10 by Claude.

## Lanes (who edits what; the user may reassign, e.g. "Codex: everything")
| Paths | Owner now |
|---|---|
| `art/**` (inbox, sources, src art, briefs, art scripts; art entries in `art/manifest.mjs`) | Codex |
| `src/**`, `tests/**`, `scripts/**`, root config and docs | Claude |
| `build/`, `index.html` (generated) | whoever the user asked to publish |
| this file | each agent edits only its own sections; anyone edits Working on |

When Codex owns everything, Claude only reviews, plans and writes tasks to `art/CODEX.md`.

## Working on (claims: `agent · path · since · what`; remove when done)
- (none)

## Now (built, needs a look)
- **Cell corrections** (Codex, 2026-11-11): delivered `art/inbox/cell-door-leaf/` (smaller open
  leaf and continuous roof rods, both overlays) and `table-stub-big/` (upright 28×36 PNG/atlas,
  anchor world 444,281). Handed to Claude in `CLAUDE-INBOX.md`; not installed by Codex. Floor wax
  and all Silas poses unchanged. Custom checks and 157 fast / 35 art tests pass; offline previews
  inspected at full, game and phone sizes. Runtime installation/inspection remains Claude's.
- **Perspective cage / wax pickup** (Codex, 2026-11-11): delivered `art/inbox/cell-cage-perspective/`,
  `table-wax/` and `silas-kneel-reach/`; see their handoffs and `CLAUDE-INBOX.md`. Roof rods follow the
  right-side roof edge; roof encloses window; human-sized central door opens outward on left hinges.
  Original general kneel unchanged; first floor-reaching image is wax-only, with split arm layers.
  Custom checks and 157 fast / 35 art tests pass. Offline full/game/phone/contact previews inspected;
  installation and actual gameplay checks remain Claude's. No runtime files changed by Codex.
- **New cage overlays** (Codex): `art/inbox/cell-cage-overlays/` contains newly painted transparent
  1280×720 cage+door states, thicker bars/wider gaps, with identical fixed bars. User clarified that
  these go OVER the existing furnished room. Supersedes the earlier standalone gate and full-scene
  exports for cage integration; see `CLAUDE-INBOX.md` and the delivery handoff. Not installed.
- **Cell art** (Codex): five finished PNGs delivered in `art/inbox/cell-door-open/`,
  `cell-cloak/` and `candle-stub/`, with metadata, prompts, originals and handoffs. Claude integration
  is queued in `CLAUDE-INBOX.md`. Pixel/size/palette checks pass; 155 fast and 35 art tests pass.
  Offline composites inspected at full, game and phone sizes; actual runtime checks remain for Claude.
  Full 1280×720 closed/open cell exports are in `art/inbox/cell-full-views/`; only door pixels differ.
- **Title screen** (Claude): the flag is 30 px higher (y 62), and "The Rift" and "Ashlands" are 20% bigger
  (6.7em and 2.8em, rule scaled to match). Screenshots look fine at desktop and phone widths. Not committed.
- **No "Click to continue" hints** (Claude): removed from the dialogue box and the intro cards; the
  intro's first card now ends with "…". Not committed.
- **Mara's chapter 1 opening** (Claude): pure black, "Two days earlier…" alone first (counted from
  the intro's day), then her lines over black with no room backdrop. Skip ends both. Not committed.
- **Chapter 2 fights** (Claude): the enemy sizes (Bryn's rig about shoulder high, the tunnel
  creatures small) have not been seen in a screenshot. The user should play one.
- **The intro** (Claude), built and covered by unit tests:
  - the three opening cards on black;
  - lines that wait for a click everywhere;
  - a new click that cancels Silas's walk to an earlier target;
  - candle wax instead of the wall's plaster;
  - Kell catching an undisguised Silas;
  - the doorway light at the stairs;
  - a second lantern at the outer door.
- **The cell** (Claude, not committed): Codex's perspective cage (split into the fixed `cell-cage`
  foreground at depth 334 and the `cell-gate` door, open at depth 357), the cell with and without the
  cloak (`backgroundWhen` on `tookCloak`), the wax icon, the guttering table stub (with a small glow)
  and the floor drop. The whole cage floor is walkable; once open, out through the front door and
  round to the stairs. Caged, Silas takes the wax kneeling at the cage's right side with Codex's
  two-layer reach (`heroLayers` command, `silas-kneel-reach` sheet); once out, a plain kneel. The
  agreed "still warm" lines are in. 157 fast + 138 story/art tests pass; checked in screenshots
  (lit, reach, door open, walking out in front of the cage, bare wall).
- **Cell tweaks** (Claude, 2026-11-11): the floor drop moved closer to the table (world 432,322; the
  reach's hand no longer touches it, which the user accepted); the moonbeam and the window's glow are
  steady (`steady` on shafts and glows), the candles still flicker. Not committed.
- **Intro ending** (Claude, 2026-11-11): after "Walk with me", Sigrid and Silas both walk off the
  right edge (`step` with `together`) before the fade to the Ashlands. Not committed.
- **Cell corrections installed** (Claude, 2026-11-11): Codex's smaller open door leaf (door object at
  183,338), the mended roof rods and the bigger guttering stub (x 444). Checked in screenshots. Not committed.
- **Soft effect:** `intro/objects/stairs-light.png` is marked placeholder because it is not
  palette art. That is intended.

## Next for Claude
See `CLAUDE-INBOX.md`.

## Waiting on Codex
Nothing queued.

## Waiting on the user
- Play a chapter 2 fight and say whether the enemy sizes look right.

## Inbox items to check (art/inbox, git-ignored, local only)
Installed deliveries are in `art/inbox/done/`. These top-level folders were left in place because
their install state was not confirmed:
- `char-guard`, `char-tobi`, `char-warden`
- `mara-*` (Mara's left-facing set is on hold)
- `pending-art-review`, `satchel-review`, `silas-ui-review`, `standing-gauntlet`
- `walk-adjustment`, `walk-polish`
- `world-map-engraved`, `world-map-night` (one of them is the installed coloured map)
- `sign-lettering-preview`, `read-refinement`, `medium-neck`
- `chapter1-improvements`, `ch1-*`
- about 60 loose files

`reference/`, `preview/` and `archive/` are reference material, not deliveries.

## Recent decisions (newest first)
- **2026-11-11:** the user discarded Codex's whole "Interaction clarity and material effects" brief
  (regulator, cell puzzles, Tobi's scarf); it is removed from `CLAUDE-INBOX.md`. Don't revive it.
- **2026-11-10:**
  - Every dialogue line waits for a click (the auto-advance setting is gone).
  - The mask putty is candle wax kneaded into bread; the wall plaster is gone.
  - Kell faces right and catches Silas when he is undisguised.
  - Silas passes behind the open cell door.
  - Codex repaints the open door, paints the cell with and without the cloak, and paints the
    candle stub.
- **2026-11-10:** Benn's and Kell's worried and angry faces (Codex) are installed, with a mood
  chosen for each of their lines.
- **2026-11-09:**
  - Fights play over the room they happen in: no full-screen backdrop, and a card strip along
    the bottom that slims down on phones.
  - Enemies have their real size against Mara.
- **2026-11-09:**
  - MedievalSharp for all lettering except dialogue (Zilla Slab).
  - A new synthesized battle theme.
  - The title banner is repainted by Codex.
- **2026-11-08:** the build budgets were doubled (`scripts/verify-build.mjs`).
- **Standing rules:**
  - Push only when asked, and ask which branch first.
  - Unit tests only, with screenshots for visuals.
  - Codex art that is drawn wrong is not used.
