# Kota current status

Updated 2026-11-19. Shared procedure: [WORKFLOW.md](../WORKFLOW.md).
Per-agent activity and requests: [from Claude](handoff/from-claude.md), [from Codex](handoff/from-codex.md).
Finished tasks and their details are in Git history (`git log -- games/kota`).

## Mode
- **Claude only (Codex paused)** since 2026-11-17, for a few days. Both agents normally work here.
  While Codex is paused only image generation stops (queued as requests for Codex); Claude does the
  other Codex tasks. Returns to Codex + Claude when the user says so.

## Current state
- **Play:** the Phaser 3 build in `game/` is playable: camp (save, upgrades, elder stories), a run on
  the prairie or lakeshore, 6 weapons, 16 items, 9 helpers, the shop, wind and water twists, Double-Face
  and Iya, win and fall screens, hints, settings (left-handed, sound, music, shake, quality, fullscreen).
  Public URL: `/games/kota/` (`games/kota/index.html` redirects to `game/`). The root hub links Kota.
- **Balance:** a scripted bot (C8, 2026-11-19) wins about 65% of 20-wave runs. Its death waves are
  6-11, bosses last 20-55 s, and the economy was slowed (shop price factor 0.25 per wave; Double-Face
  2400 HP; Iya 22000 HP). The bot is not a player, so these numbers still need a human playtest.
- **Look and music (2026-11-19):** all drawn in code, no art files. Menu bands, camp backdrop,
  arena props and water, dawn or dusk atmosphere, and procedural fight music.
- **Art (Ash Wolf):** `art/refs/ash_wolf/processed/ash_wolf_walk_1..4.png` (4-frame walk, keyed and
  aligned) is made but not installed in the game. It waits for the user's approval.
- **Design record:** DESIGN-m1.md is the settled spec for the current build. DESIGN-dakota-content.md is
  superseded; its 3D briefs (20) were moved to the Recycle Bin on 2026-11-19 by the audit fix plan.
  The hero brief `art/briefs/hero_dakota_woman.md` is kept for the 2D sprite prompt.
- **Retired 3D game:** removed on 2026-11-18 (in the Recycle Bin, restorable); LICENSES.md lists only
  Phaser and Pillow.
- **Move (2026-11-19, uncommitted):** the game moved from `kota/` to `games/kota/`. Launch Codex and
  Claude from `games/kota/`. Shared procedure is `games/WORKFLOW.md`. Old Codex threads still point at
  the old folder.

## Open items
- **User phone playtest (not done):** feel, the wave 7-9 difficulty, boss length, fps, and fullscreen
  on a real phone. Nothing has been tried on a phone yet.
- **Music:** nobody has listened to it yet; the user judges the music and the look on the phone.
- **Culture drafts:** the elder texts are DRAFT (CULTURE.md NR 16 and 25). Round 3 picks (17-22) and
  NR 13-16 are approved.
- **Ash Wolf walk strip:** approval to install the 4 processed frames, then the game plays them in a
  loop while she moves, with a ground shadow.
- **Tuning left for later:** Iya's lunge interval (5 s) and recovery (0.8 s) were my choices, not from
  the spec. Gnawing hollow bite is 9 damage on wave 7 against 15 base health.
- **Not built yet:** new gift helpers and room types as camp unlocks (DESIGN.md Progression).

## Next action
- The user plays the build on a phone and reports what to change. Claude then takes the requested fixes
  in a new phase; nothing is committed or pushed without an explicit request.
