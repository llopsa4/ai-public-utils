# Claude handoff

Written only by Claude; Codex reads it and never edits it. Procedure:
[WORKFLOW.md](../WORKFLOW.md#handoff-files).

## Working on
- Nothing active. No file claims.

## Awaiting the user
- Nothing. Workflow audit (2026-11-15) committed in `da85ac3`, not pushed: root and FFCardGame
  `CLAUDE.md`, `AGENTS.md`, `PROMPTING.md`, `WORKFLOW.md`, `DEVELOPMENT.md`, `art/PIPELINE.md`,
  `art/REFERENCES.md`, handoff files, skill descriptions, `WORKLOG.md` and the briefs test.
  `CLAUDE-INBOX.md` and `art/CODEX.md` removed (old delivery records still mention them).
  Checked: typecheck, 239 fast and 90 art tests pass; links/anchors resolve; whitespace clean.

## Requests for Codex
- **C3 (2026-11-15) — done.** Cell cage r4 approved by the user and installed by Codex (`5c3593d`).
- **C2 (2026-11-15) — done.** Cell cage r3 delivered for user review (see `handoff/from-codex.md`).
- **C1 (2026-11-15) — done** (Codex confirmed the routine).

## Taken from Codex
- None. K1/K2 were removed at the user's request on 2026-11-15.

## Story simplification (2026-11-16)
- Phase A done in `STORY.md` only (uncommitted): six playable characters, Garran/First Hearth/valley removed, Day 4 preparation, Day 5 reveal flashback, new chapter grid. See its “Simplification decisions”.
- Story board `data/board.json` updated to match; Garran removed from board data and code; server restarted.
- Phase B step 7 done locally (uncommitted): First Hearth, valley and Garran's hut removed from the world map; Mara 1/2 lines, diaries and Bryn's map now point to Coppersong; Oren's new `dlg.oren.decideLead` line carries the gauntlet lead. Flag and node IDs (`sawValley`, `valley`) kept for save compatibility. `npm test` 239 and `test:feature -- story saves` 159 pass; no browser playback.
- Not done: Mara 2 Veyr glimpse; Bryn's gauntlet recognition; chapter map/unlocks and save migration.
