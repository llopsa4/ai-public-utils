# Kota current status

Updated 2026-11-22 (documentation reconciliation). Shared procedure: [WORKFLOW.md](../WORKFLOW.md).
Per-agent activity and requests: [from Claude](handoff/from-claude.md), [from Codex](handoff/from-codex.md).
Task status is in PLAN.md. Earlier verification and bot figures below are historical, not rerun checks.

## Mode
- **Codex + Claude** since 2026-11-20 (user): Codex generates and installs art and does routine work;
  Claude does the rest ([modes](../WORKFLOW.md#modes-and-ownership)).

## Checkout
- Reconciled on `main` at `b456e1a`; Kota already had uncommitted documentation edits and the
  LICENSES.md deletion. Preserved them. This reconciliation changes documentation only.
- The move to `games/kota/` is already tracked at HEAD; old threads and launch paths may be stale.
  Launch from this folder; shared procedure is `games/WORKFLOW.md`.

## Current state
- **Play:** the Phaser 3 build in `game/` is playable: camp (save, upgrades, elder stories), a run on
  the prairie or lakeshore, 6 weapons, 16 items, 9 helpers, the shop, wind and water twists, Double-Face
  and Iya, win and fall screens, hints, settings (left-handed, sound, music, shake, quality, fullscreen).
  Public URL: `/games/kota/` (`games/kota/index.html` redirects to `game/`). The root hub links Kota.
- **Balance:** a scripted bot (C8, 2026-11-19) wins about 65% of 20-wave runs. Its death waves are
  6-11, bosses last 20-55 s, and the economy was slowed (shop price factor 0.25 per wave; Double-Face
  2400 HP; Iya 22000 HP). The bot is not a player, so these numbers still need a human playtest.
- **Look and music (2026-11-19):** runtime visuals are drawn in code; painted candidates remain outside the game. Menu bands, camp backdrop,
  arena props and water, dawn or dusk atmosphere, and procedural fight music.
- **Art (Ash Wolf):** `art/refs/ash_wolf/processed/ash_wolf_walk_1..4.png` (4-frame walk, keyed and
  aligned) is made but not installed in the game. It waits for the user's approval.
- **Design record:** DESIGN-m1.md is the settled spec for the current build. DESIGN-dakota-content.md is
  superseded; its 3D briefs (20) were moved to the Recycle Bin on 2026-11-19 by the audit fix plan.
  The hero brief `art/briefs/hero_dakota_woman.md` is kept for the 2D sprite prompt.
- **Retired 3D game:** removed on 2026-11-18 (in the Recycle Bin, restorable). LICENSES.md was deleted
  on 2026-11-20 (user): free software only, no licence register.

## Open items
- **User phone playtest (not done):** feel, the wave 7-9 difficulty, boss length, fps, and fullscreen
  on a real phone. Nothing has been tried on a phone yet.
- **Music:** nobody has listened to it yet; the user judges the music and the look on the phone.
- **Culture review:** CULTURE.md records NR 13–16 approved (including the Iya elder text), and
  Round 3 picks 17–22 approved. NR 25's Double-Face text remains unresolved. `camp.json` contains
  that draft and `src/camp/camp.js` exposes it after meeting the boss: approval and runtime differ.
  No cultural approval or runtime correction is implied by this reconciliation. Other unresolved
  entries stay in CULTURE.md; retired 3D pack review is no longer a milestone gate.
- **Ash Wolf walk strip:** approval to install the 4 processed frames, then the game plays them in a
  loop while she moves, with a ground shadow.
- **Tuning left for later:** Iya's lunge interval (5 s) and recovery (0.8 s) were my choices, not from
  the spec. Gnawing hollow bite is 9 damage on wave 7 against 15 base health.
- **Future progression:** four camp upgrades already exist, including helper and lakeshore unlocks.
  More heroes, helpers and arenas remain later scope (DESIGN.md); room-chain work is retired.
- **Art guide:** D1's full 2D rewrite is not complete. The generic outline-free template and Ash
  Wolf's thin-outline brief differ; keep the hero-specific choice and settle other families in D1.
- **Stale Claude handoff:** T1/T1–T7 and the old Dakota B1 pack gate are superseded. K1's sources
  already exist; no repeat generation is queued. Codex records the reconciliation in its own
  handoff; Claude owns edits to `handoff/from-claude.md`.

## Latest verification
- 2026-11-22: inspected source/data, existing sprite files, documentation links and documentation
  diff. No gameplay, browser, phone, music or performance checks run; runtime and published files unchanged.

## Next action
- User: phone playtest for C8 and review the existing Ash Wolf walk strip.
- Claude: D1 style-guide reconciliation before new art families; address requested playtest fixes.
- Codex: install the exact Ash Wolf candidate only after user approval; no repeated K1 generation.
