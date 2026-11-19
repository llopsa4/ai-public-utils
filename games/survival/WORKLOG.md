# Survival current status

Updated 2026-11-19. Shared procedure: [WORKFLOW.md](../WORKFLOW.md).
Per-agent activity and requests: [from Claude](handoff/from-claude.md), [from Codex](handoff/from-codex.md).
Finished tasks and their details are in Git history (`git log -- games/survival`).

## Mode
- **Claude only (Codex paused)** since 2026-11-19. The user works only with Claude for now; Codex
  joins later to generate art. Image generation is queued as requests for Codex in
  [handoff/from-claude.md](handoff/from-claude.md).

## Current state
- **Build stage.** [DESIGN-slice.md](DESIGN-slice.md) approved by the user 2026-11-19. C1-C4 done
  2026-11-19: scaffold, map, camera; 20 people who walk, gather, chop, haul, build, hunt and
  deliver; four buildings from a build menu (B, then 1-4, left-click); hunger, two evenly shared
  meals a day, starvation, deaths, Wotakuye with its bands and day-start effects; a HUD with the
  resource bar and the Wotakuye bar. C5 done 2026-11-19: click and box select, right-click move /
  gather / chop / build / assign, draft (R), stance (Z X C), Delete, Space pause, 1-3 speed, a
  selection panel and toasts. Nothing committed or pushed.

## Open items
- CULTURE.md *Needs review* questions for the user.
- Untested by hand: mouse-edge pan and WASD pan; shift-click toggle; Delete on a site; 1-3 speed keys.
- Not done yet from `## UI`: pause/speed buttons (now in plan task C7), the hungry-bowl icon, the
  wave banner (C6). Toasts live in `Select.ts` for now (a later HUD task may move them).
- Decided 2026-11-19 (user delegated): map deviations are now in the spec; drafted people keep
  their worker slot; balance is left to C8.
- Balance to judge at C8: 10 unhoused people cost 10 Wotakuye a day against +4 from meals, so the
  start camp slides into Quarrelling by about day 7 unless tipis are built; people walk 0.5
  tiles/s, so a tipi takes about 2 minutes to supply.

## Next action
- C6 (Sonnet): combat and waves. Reads `## Combat`, `## Waves`; adds the `attack` order.
