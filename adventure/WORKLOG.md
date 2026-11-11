# Work log: Claude and Codex

Both agents read this first, and update their own sections before stopping. Keep it short (under
about 100 lines). Queues live elsewhere: Codex's in `art/CODEX.md`, Claude's in `CLAUDE-INBOX.md`.

Last updated: 2026-11-11 by Claude (housekeeping, with the user's OK).

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
- **Chapter 2 fights** (Claude): the enemy sizes (Bryn's rig about shoulder high, the tunnel
  creatures small) have not been seen in a screenshot. The user should play one.
- **Soft effect:** `intro/objects/stairs-light.png` is marked placeholder because it is not
  palette art. That is intended.

## Next for Claude
See `CLAUDE-INBOX.md`.

## Waiting on Codex
Nothing queued.

## Waiting on the user
- Play a chapter 2 fight and say whether the enemy sizes look right.

## Inbox (art/inbox, git-ignored, local only)
Cleared on 2026-11-11: everything left over went to `art/inbox/done/` (loose files in
`done/loose-2026-11-11/`). Still at the top: the `mara-*` folders (Mara's left-facing set is on hold)
and `cell-full-views`. `reference/`, `preview/` and `archive/` are reference material.

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
