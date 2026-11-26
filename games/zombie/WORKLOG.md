# Dead Woods current status

Updated 2026-11-26 (Z106 Finish action; Z105 zombies vs squatters; Z93 Mission 2 build; Z92 Mission 2 design; Z99 raider AI; Z89 Theo bio; Z98 enemy highlight; Z97 food off; Z104 house pieces; Z103 trees + forest border; Z102 ground code; Z101 readability + glitch; Z86 Bios half layout; Z85 Bios page). Shared procedure: [WORKFLOW.md](../WORKFLOW.md). Per-agent
activity and requests: [from Claude](handoff/from-claude.md), [from Codex](handoff/from-codex.md).
Per-unit history lives in git log and the PLAN.md rows, not here.

## Mode
- **Codex + Claude** since 2026-11-22 (user): Claude builds code and grey stand-ins; Codex generates
  and installs all art ([modes](../WORKFLOW.md#modes-and-ownership)).

## Current state
- E7 house art is approved and installed locally. All 14 final PNGs match the approved preview. The isolated pack, checkout typecheck, 425 unit tests, and Chromium in Mission 1 and Base 1 passed. Installed preview at http://127.0.0.1:5305/.
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
- Z101 Readability + glitch: the camera starts at 1.5× (wheel still zooms out to 1×); every survivor, zombie and human has a code-drawn contact shadow; the dark rectangle during `m01Start` is gone (empty padded HUD texts and the action bar now start hidden). Typecheck, 405 unit tests, both e2e specs and Chromium checks in Mission 1, Base 1 and the Intro pass; not yet seen by the user.
- Z102 Ground code and E5 art: moss ground with dirt and leaf-litter decals and small scatter pieces placed by a stable hash. The user approved the finished sprites, including a worn-earth path tile. The 15 installed PNGs match the approved preview, and Chromium verified them in Intro, Mission 1 and Base 1.
- Z103 Trees + forest border and E6 art: two tall pines, a leafy birch and a dead snag appear along the far treeline and in thick woods. Each map has a 10-tile decorative forest border that fades into grey mist. All four installed PNGs match the approved preview. Chromium verified tree occlusion and border mist in Intro, Mission 1 and Base 1.
- Z86 Bios half layout: the figure card is half the page, text the other half; a final `bio_<kind>` shows 1:1 on a shared baseline. Typecheck, 405 tests, both e2e specs and Chromium checks (100 / 125 / 150%) pass; not yet seen by the user.
- Z85 Bios page: a Bios button in Pause and on the title (with a save); tabs, figure (idle frame scaled up until `bio_<kind>` is final), header and scrolling story. Typecheck, 405 unit tests, both e2e specs and Chromium checks pass; not yet seen by the user.
- E3 installation matches the 12 approved sprite hashes. Typecheck, 366 unit tests and Chromium rendering in Mission 1 and Base 1 passed.
- E4 installation matches the 12 approved hashes. Typecheck, art tests and Chromium in Mission 1 and Base 1 passed. The full suite during Z81 work had 381 passes and seven gameplay failures. A focused simulation rerun had six failures as Z81 work continued. See the Codex handoff for logs.
- A14 installation matches the reviewed 149 assets and all six atlas files. Typecheck, 393 unit tests and Chromium checks in Base 1 and the Mission 1 rescue passed.
- Local playtest preview opened at http://127.0.0.1:5175/. Typecheck and both Chromium e2e specs passed again. Mission 1 balance and the rescue still await hand play.
- Git: everything from Bios (Z83) through Z106, with the E5–E7, A15, A16 and A18 art, and the rebuilt published output are committed and pushed to `main` (2026-11-26, user request); this supersedes older "uncommitted" notes below and in the handoffs.

## Pending decisions
- The 7-character roster: Cass, Eli, Ray and June are settled (Ray and June grilled 2026-11-25,
  Z78); three more are still to design (PLAN.md *Later*).
- Improvements grilled 2026-11-24 (no new chapters or scenes): DESIGN §20–22, STYLE *Environment
  art*, PLAN rows Z58–Z65 + E1–E4.
- Feedback grilled 2026-11-25 (new Intro start, tutorial pause, music, font, cones, HUD, names,
  traits, bond technique, 64 × 64 maps): DESIGN §5–§19 + §23, PLAN rows Z66–Z77 + A12, A13.

## Next action
- The visual pass is complete (DESIGN §20, STYLE *Visual pass*, PLAN Z101–Z104 and E5–E7).
- Claude: Bios done (Z83–Z85, DESIGN §24); Z86 done (figure card at half the page). The user checks Z65, Z78–Z82 and the Bios page by playing.
- Claude: Theo (survivor 5) carded (Z87) and the Mission 2 → Base 2 → Ray's hut flow recorded (Z96, DESIGN §25); both approved by the user 2026-11-25; Z97 done (food hidden until the main camp, uncommitted, 416 tests and both e2e pass, not yet seen by the user); Z98 done (enemy highlight, key `M`, uncommitted, 421 tests and both e2e pass, not reachable in play until Theo exists, not yet seen by the user); Z90 done (Theo wired as a survivor kind with grey stand-ins, in no scene yet; uncommitted, 425 tests and both e2e pass, not yet seen by the user); Z88 done (Theo's bio text approved 2026-11-26); next Z89 (Sonnet) and Z99 (Opus) (PLAN rows Z87–Z100, A16–A17, Hut grill).
- Claude: Z89 done (Theo bio in the game, tab from the bunker door, uncommitted; 427 tests and both e2e pass; the tab is not reachable in play until Z93). Next: Z99 (Opus).
- Claude: Z99 done (base-wave raider AI, `addRaider`; uncommitted; 437 tests and both e2e pass; not reachable in play until Z94). Next: Z92 (Opus DESIGN, Mission 2 design) or Z91 (Opus).
- Claude: Z92 done (DESIGN §26 Mission 2 detail, approved by the user 2026-11-26; PLAN rows Z105–Z107, A19; Z93, A17 updated). Next: Z93 or Z105 (Opus), or Z91.
- Claude: Z93 done (Mission 2 playable end to end with placeholder lines, from *Mission 2 (preview)* on the "Base 1 held" page; uncommitted; 443 tests, both e2e and Chromium pass; not yet seen by the user). Next: Z105 (Opus), Z107 (Sonnet WRITE) or Z94 (Sonnet). Codex: A17 is open.
- Claude: Z105 done (zombies and squatters fight, squatters killed by zombies rise after 30 s with a faint countdown; uncommitted; 453 tests and both e2e pass; not yet seen by the user). Next: Z106 (Sonnet), Z107 (Sonnet WRITE) or Z94 (Sonnet).
- Claude: Z106 done (Finish, key `N`; uncommitted; 461 tests, both e2e and Chromium pass after a lone rerun of the speed tests; not yet seen by the user). Next: Z107 (Sonnet WRITE) or Z94 (Sonnet). Codex: A19 is open.
- Codex: A18 enemy-highlight icon is approved and installed locally. The isolated art pack, checkout typecheck, all 425 unit tests and the Chromium Mission 1 toggle check passed.
- Codex: E6 and Theo's approved A16 Bios figure are installed locally. The Bios unit suite passed 436 of 437, and all four performance tests passed on the focused rerun. Theo's larger backpack, solar panel and idle revision 2 are approved. The full 67-file animation, portrait and shovel-icon batch awaits in-game approval. Isolated packing and pixel verification, checkout typecheck and Chromium passed. Checkout changes are local and uncommitted on `main` at `cff7f580`. Published output was not rebuilt.
