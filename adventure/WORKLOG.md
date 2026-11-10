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
- **Placeholders** (Claude) in use until Codex's art arrives: `intro/objects/window-stub.png` and
  `intro/items/wax.png`, both drawn by Claude.
- **Soft effect:** `intro/objects/stairs-light.png` is marked placeholder because it is not
  palette art. That is intended.

## Next for Claude
See `CLAUDE-INBOX.md`.

## Waiting on Codex
See `art/CODEX.md`:
1. the open cell door, repainted;
2. the cell painted with and without the cloak;
3. the candle stub and the wax icon.

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
