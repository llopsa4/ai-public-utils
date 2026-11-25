# Codex handoff (Dead Woods)

Written only by Codex; Claude reads it and never edits it. Procedure:
[WORKFLOW.md](../../WORKFLOW.md#handoff-files).

(Claude trimmed this file on 2026-11-24 during cleanup K4: the install logs for A1–A11 were removed;
git history keeps them. Rewrite freely.)

## Working on
- None. A14 installation claims released.

## Awaiting the user
- None. The user requested installation of the reviewed A14 batch.

## Requests for Claude
- **K1 E2 woods brief** (2026-11-25, done): name the first sample and add its generation prompt and approval authority to `handoff/from-claude.md`. Use `art/STYLE.md` (*Environment art*), the manifest contract, and the approved E1 art in `art/frames/env/`. Pending keys are `ground_dirt`, `ground_leaves`, `ground_path`, `tree_b`, `tree_c`, `bush_b`, `tent`, and `campfire`. Codex previews the sample in-game for user approval.

## Taken from Claude
- A14 done (2026-11-25). The user requested installation as reviewed, including the SE bow poses that read as left-handed. Installed 149 approved assets, both survivor atlas pairs and the UI atlas pair, all hash-identical to the preview. The figure, UI and arrow entries are final. The roster check now expects final 2× figures and arrows. The installed checkout passed typecheck, 393 unit tests, the Chromium Base 1 art review (264 figure views, portraits, icons and arrows) and the Mission 1 rescue check (six shots, bow and walk animations, and June's portrait). Verification begins the rescue with the mission marked successful and uses forced poses in Base 1. Evidence is in `art/inbox/A14-install/verification/`. Candidate, prompts and original review are in `art/inbox/A14-full-r1/`. Published output was not rebuilt.
- A14 idle gate approved. Built-in ImageGen strips, exact prompts and reference are in `art/inbox/A14-idles-r1/source/`. Normalized the four idles to 128 × 128 with the project palette and (64,112) anchor, using 100 source px for Ray and 94 for June. The isolated staging pack passed; Chromium verified both drawn and both mirrored facings and checked all four atlas crops against the candidate pixels. Stills and results are in `review/`. The Base 1 review stages a two-facing idle comparison with mirroring controls and uses fixed positions without sim ticks. Checkout typecheck passed. The installed art and published output were not rebuilt.
- E4 props done (2026-11-25). The user approved the full preview. The 12 installed PNGs match the approved hashes and their manifest entries are final. The pack ran in a staging copy and only the approved props and their statuses were transferred. The installed checkout passed typecheck and Chromium checks in Mission 1 and Base 1. The verification captures use debug prop states and placements, a relocated stove and a cover test tile. Evidence is in `art/inbox/E4-install/verification/`. Published output was not rebuilt.
- Z81 coordination (2026-11-25). With the concurrent Base 1 roster and herd changes, the installed checkout's suite had 381 passes and seven gameplay failures. A focused rerun had six failures in hunger, checkpoints, start poses, difficulty and herd placement. Art tests passed. See `art/inbox/E4-install/verification/unit-tests.txt` and `simulation-recheck.txt` for the assertions relevant to Z81.
- E3 house done (2026-11-25). The user approved the wood floor sample and the complete in-game preview. All 12 staged PNGs were installed with final manifest status and match the reviewed hashes. The reviewed roof trim is installed too. Typecheck, 366 unit tests, and Chromium rendering in Mission 1 and Base 1 passed. The browser check used preview hooks to open the roof and switch repaired states. Installed evidence is in `art/inbox/E3-install/verification/`. Published output was not rebuilt.
- E2 woods done 2026-11-25. The user approved the full batch. All eight sprites are final in the manifest and match their preview hashes. The env-only staging pack, typecheck, 349 unit tests and Chromium rendering checks in Intro, Mission 1 and Base 1 passed. Evidence is in art/inbox/E2-install/verification/. Published output was not rebuilt.
- A13 Bond icon done 2026-11-25. The user approved the in-game preview. The final PNG and both UI atlas files match the approved pack byte-for-byte. On the installed checkout, Chromium checked Cass's and Eli's 48 × 48 buttons and the dimmed used state in Mission 1 and Base 1. Used state was set through the debug hook for this art check. Evidence: `art/inbox/A13-review/installed-browser-checks.json`. Published output was not rebuilt.
- A12 Hold icon (2026-11-25), done. The user approved the Mission 1 preview. The installed `art/frames/ui/icon_bar_hold.png` and UI atlas match the preview byte-for-byte. Art packing, typecheck, 321 unit tests and Chromium rendering at 48 × 48 passed on the checkout. Evidence is in `art/inbox/A12-review/installed-browser-checks.json`.
- E1 environment probe (2026-11-25), done. User approved installation. The three final files in `art/frames/env/` match the preview by SHA-256. Packing, typecheck and Chromium rendering checks passed on the checkout. Browser evidence is in `art/inbox/E1-install/verification/`.
