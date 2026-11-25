# Dead Woods current status

Updated 2026-11-25 (Z82 rescue cutscene; A14 installed). Shared procedure: [WORKFLOW.md](../WORKFLOW.md). Per-agent
activity and requests: [from Claude](handoff/from-claude.md), [from Codex](handoff/from-codex.md).
Per-unit history lives in git log and the PLAN.md rows, not here.

## Mode
- **Codex + Claude** since 2026-11-22 (user): Claude builds code and grey stand-ins; Codex generates
  and installs all art ([modes](../WORKFLOW.md#modes-and-ownership)).

## Current state
- Playable slice: New Game → Intro (tutorial) → Mission 1 (house in the woods) → Base 1 (fix, cook,
  traps, 18-zombie herd, herd checkpoint), all on 64 × 64 maps (Z77) → "To be continued", with saves (v2), pause menu, options,
  key rebinding, squad panel, Commandos-style mouse, code-made audio and adaptive ambience.
- Art installed locally and final: Cass, Eli, the nine zombie sheets (fresh, decayed, rotting), the
  UI kit, icons, portraits, title background and logo (A1–A11), the A12 Hold and A13 Bond icons,
  the 35 E1–E4 environment sprites, and A14 Ray and June animations, portraits, weapon icons and arrows.
- Balance is judged by the user playing; the scripted balance bot was removed on 2026-11-25 (user).
- A12 passed art packing, typecheck, 321 unit tests and a Chromium check in Mission 1. Both e2e
  specs passed at Z63. Gate 3 (playtest) passed
  2026-11-24. The installed E1 batch passed art packing, typecheck and Chromium rendering checks in
  all three world scenes. Hand play remains pending.
- A13's installed icon and UI atlas match the approved preview byte-for-byte. Typecheck, 349 unit tests and Chromium rendering in Mission 1 and Base 1 passed.
- Z64 Difficulty: Easy / Normal / Hard in Options. Typecheck, 357 unit tests and both e2e specs pass; the user accepted it on 2026-11-25.
- Z65 Shuffles + herd direction: 4 Mission 1 layouts, 4 Base 1 roamer layouts, herd from any edge with its own warning line and arrow. Typecheck, 366 unit tests and both e2e specs pass; not yet seen by the user.
- Z79 Roster wiring: Ray and June exist as survivor kinds with stand-in art (not yet in any scene). Typecheck and 373 unit tests pass.
- Z80 Bow, arrows, Tracker: the bow (8 arrows each, dropped and picked up), Weapon 3 key, Hold bow-first, Quick draw, Tracker rings. Typecheck, 385 unit tests, both e2e specs and a Chromium check in Mission 1 (Ray added through `dw.join`) pass; not yet seen by the user.
- Z81 Base 1 with four: Ray and June join Cass and Eli in Base 1 (stand-in art, usual tiles until Z82 hands poses), herd 18 (Easy 12, Hard 24). Typecheck, 388 unit tests and both e2e specs pass; not yet seen by the user.
- Z82 Rescue cutscene: after Mission 1, six zombies, arrows from Ray and June, their walk-in and `m01Rescue`; Base 1 starts with all four on their end tiles. Typecheck, 393 unit tests, both e2e specs and a Chromium run from the win into Base 1 pass; not yet seen by the user.
- E3 installation matches the 12 approved sprite hashes. Typecheck, 366 unit tests and Chromium rendering in Mission 1 and Base 1 passed.
- E4 installation matches the 12 approved hashes. Typecheck, art tests and Chromium in Mission 1 and Base 1 passed. The full suite during Z81 work had 381 passes and seven gameplay failures. A focused simulation rerun had six failures as Z81 work continued. See the Codex handoff for logs.
- A14 installation matches the reviewed 149 assets and all six atlas files. Typecheck, 393 unit tests and Chromium checks in Base 1 and the Mission 1 rescue passed.
- Git: `main` at `09a0c287`, with gameplay changes and E1–E4 and A12–A14 art uncommitted. Published output was not rebuilt. The published `index.html` +
  `build/` may predate the latest art; run `npm run publish` and commit before any push meant to
  change the live site (and only push on the user's request, with the branch named).

## Pending decisions
- The 7-character roster: Cass, Eli, Ray and June are settled (Ray and June grilled 2026-11-25,
  Z78); three more are still to design (PLAN.md *Later*).
- Improvements grilled 2026-11-24 (no new chapters or scenes): DESIGN §20–22, STYLE *Environment
  art*, PLAN rows Z58–Z65 + E1–E4.
- Feedback grilled 2026-11-25 (new Intro start, tutorial pause, music, font, cones, HUD, names,
  traits, bond technique, 64 × 64 maps): DESIGN §5–§19 + §23, PLAN rows Z66–Z77 + A12, A13.

## Next action
- Claude: no unit queued after Z82; the next is the user's call (the 3 remaining roster characters in
  PLAN.md *Later* need grilling). The user checks Z65 and Z78–Z82 by playing.
- Codex: A14 is installed as reviewed. No art unit is queued.
