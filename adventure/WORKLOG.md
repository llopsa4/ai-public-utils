# Work log: Claude and Codex

Both agents read this first, and update their own sections before stopping. Keep it short (under
about 100 lines). Queues live elsewhere: Codex's in `art/CODEX.md`, Claude's in `CLAUDE-INBOX.md`.

Last updated: 2026-11-11 by Claude and Codex (housekeeping).

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
- **Published 2026-11-11** (`a28c8c6` on `main`): the title screen, no "Click to continue" hints,
  Mara's black "Two days earlier…" opening, the perspective cell (cage, door, cloak backgrounds,
  guttering stub, floor wax and Silas's reach through the bars), the steady moonlight, and Silas and
  Sigrid walking off at the intro's end. Codex's cell deliveries are all installed.
- **Not yet seen** (Claude): the cell in the dark and on Low quality, a reload mid-reach for the wax,
  and the steady moonlight in motion.
- **Paused by the user:** Mara's left-facing artwork and Chapter 2. Chapter 2 enemy-size review
  remains for when that work resumes; do not start it during housekeeping.
- **Soft effect:** `intro/objects/stairs-light.png` is marked placeholder because it is not
  palette art. That is intended.

## Next for Claude
See `CLAUDE-INBOX.md`.

## Waiting on Codex
Nothing queued.

## Waiting on the user
No immediate input required. Chapter 2 review waits until the user resumes that chapter.

## Inbox (art/inbox, git-ignored, local only)
Cleared on 2026-11-11: installed/older deliveries are in `art/inbox/done/` (loose files in
`done/loose-2026-11-11/`). Paused `mara-*` folders remain at the top. `reference/`, `preview/` and
`archive/` are retained reference material.

Codex archived superseded full-cell exports in `art/inbox/archive/housekeeping-2026-11-11/`;
`moves.json` there records all 42 moves and their original locations. Forty loose review logs are
in `shots/archive/2026-11-11-logs/`, and the old test-results folder is preserved at
`shots/archive/2026-11-11-test-results/`. No files were deleted; generated `dist/` remains in place.
Housekeeping checks: 157 fast and 35 art tests passed; runtime code and source artwork unchanged.

## Recent decisions (newest first)
- **2026-11-11:**
  - The user discarded Codex's whole "Interaction clarity and material effects" brief (regulator,
    cell puzzles, Tobi's scarf). Don't revive it.
  - Moonlight is steady; only candles and lanterns flicker (`steady` on glows and shafts).
  - The floor wax sits by the table even though Silas's reaching hand stops short of it (accepted).
  - The kneel-reach pose is for the wax pickup only; the general kneel stays.
- **2026-11-10:**
  - Every dialogue line waits for a click (no auto-advance), with no "Click to continue" hint.
  - The mask putty is candle wax kneaded into bread.
  - Kell faces right and catches Silas when he is undisguised.
- **2026-11-09:**
  - Fights play over the room they happen in, with a card strip along the bottom.
  - Enemies have their real size against Mara.
  - MedievalSharp for all lettering except dialogue (Zilla Slab).
- **2026-11-08:** the build budgets were doubled (`scripts/verify-build.mjs`).
- **Standing rules:**
  - Push only when asked, and ask which branch first.
  - Unit tests only, with screenshots for visuals.
  - Codex art that is drawn wrong is not used.
