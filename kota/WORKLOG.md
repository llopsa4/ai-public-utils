# Kota current status

Updated 2026-11-18. Shared procedure: [process/WORKFLOW.md](../process/WORKFLOW.md).
Per-agent activity and requests: [from Claude](handoff/from-claude.md), [from Codex](handoff/from-codex.md).

## Mode
- **Claude only (Codex paused)** since 2026-11-17, for a few days. Both agents normally work here.
  While Codex is paused only image generation stops (queued as requests for Codex); Claude does the
  other Codex tasks. Returns to Codex + Claude when the user says so.

## State
- 2026-11-17: grilled decisions recorded in DESIGN.md (roguelite, three nations, gifts + framed
  drops, visible equipment, touch controls, low-poly 3D, free software) and CULTURE.md (source
  policy, off-limits, language). Request guide: PROMPTING.md. Plan tasks T1–T9 with model per task.
- T2 research done (thin): drafts in `research/`; 12 items in CULTURE.md *Needs review*.
  Dakota round 2 done. 2026-11-18: Dakota Iya the Camp-Eater approved as boss (May show).
  Recommended first nation: Dakota.

## Next action
- User reviews `research/*.md` and CULTURE.md *Needs review*; approved entries move into CULTURE.md.
- T3: SLICE.md approved 2026-11-18. T4 done: `game/` skeleton (Three.js 0.160 vendored, iso camera,
  grey-box room, capsule hero, touch stick + buttons + dash + hand swap) verified in Chrome at 844×480.
- T5 done 2026-11-18: axe combo, arrow volley (drag-aim), track, 3 grey-box enemies + Iya (lunge,
  phase 2, dawn lightens), land-renews food, 6 helper gifts, 5-room chain + boss, camp screen with
  localStorage save. Data in `game/data/*.json`. Verified in Chrome at 844×480 by a scripted run
  (rooms, gifts, boss, win, death -> Carried home); real-time feel and fps still need a phone.
- T6 done 2026-11-18: `game/data/items.json` (4 items, 3 slots), `game/src/hero/equip.js` attaches
  an item's mesh only while equipped (unequipped = no mesh), camp Equipment screen, modifiers apply
  at run start, winning returns one missing item, gear saved in localStorage. Verified in Chrome.
- T7a 2026-11-18: art/STYLE.md, art/PIPELINE.md, art/ASSETS.md written (Opus); Blender 5.1.2 found,
  glTF export works headless. Guides approved by the user 2026-11-18; CULTURE.md NR 13–15 still open (plain placeholders).
- T7b 2026-11-18: `art/models/kota_lib.py`, `hero_dakota_woman.py`, `stone_axe.py` built with Blender
  5.1.2; `.glb` files in `game/assets/models/`; GLTFLoader vendored (importmap in index.html). The
  game now shows the woman hero with 10 animations and the stone axe; short axe, robe and knife are
  still grey boxes (robe = back drape). Equipment attaches to `attach_*` bones via a mount group in
  `hero/equip.js` (cancels the exporter's -90 degree bone rotation). Briefs + ASSETS.md written.
  Verified in Chrome: loads without errors; attack/run/dash/down animate; gear shows/hides.
- Hero look and stone axe approved by the user 2026-11-18. T7c done: short_axe, buffalo_robe,
  beaded_knife, frost_wisp, hunger_shade, blight_swarm, iya built and installed (all within budget);
  combat uses enemy models with per-enemy materials; idle motion is code (bob/spin/falter).
- Threat looks and Iya approved by the user 2026-11-18 (Iya still needs the community check).
- T8 done 2026-11-18: `game/src/camp/camp.js` + `game/data/camp.json`. Goods returned to the people
  (1 per room, 5 for freeing the camp) buy two permanent upgrades (maple-sugar grove +10 food heal,
  practice ground +20% volley); an Elder screen tells the Iya story once Iya has been met; all saved
  in localStorage. Verified in Chrome incl. reload. Elder text is DRAFT (CULTURE.md NR 16).
  Not built yet: new gift helpers and room types as camp unlocks (DESIGN.md Progression).
- T9 done 2026-11-18 (nothing committed or pushed): `kota/index.html` redirects `/kota/` to `game/`;
  README has play notes; the `window.kota` test hook now needs `?debug`; the elder story shows its
  credit; verified from a `/kota/game/` subfolder copy (full run, no external requests, 1.8 MB).
  The root `index.html` hub does NOT link Kota yet: add a line there only when the user decides to
  publish.
- 2026-11-18 user decisions: build **only the Dakota nation, fully**, before Lakota/Nakota. Iya
  community check done by the user. A little invention is fine for CULTURE.md NR 13-16 (resolved,
  recorded there); slightly exaggerated features welcome. The root `index.html` now links Kota (not
  pushed). Hero rebuilt with long front braids, a beaded headband and a fringed hem (1,000 tris).
  User already handles push caution; still push only on explicit request with the branch confirmed.
- Dakota full build, [PLAN-dakota.md](PLAN-dakota.md), started 2026-11-18 (user said "implement plan";
  P0 phone check skipped for now, do it any time at `http://192.168.4.92:8765/`).
  Done: **A1** settings menu (sound, left-handed, shake, quality), pause while open; **A2** obstacle
  collision; **A3** door choice (2 doors, rewards gift/rest/goods); **A4** hit feedback (numbers,
  hit pause, shake, puffs); **A5** sound (WebAudio effects + ambience, no music). **A6** research
  round 3 is running (Sonnet agent writes "## Round 3" in research/dakota.md).
  Dev server: `devserver.py` in the session scratchpad serves `game/` with no-cache headers (needed
  because the browser cached old modules); after edits use Ctrl+Shift+R in the browser.
- A6 done: Round 3 picks (CULTURE.md 17-22) APPROVED in full by the user 2026-11-18.
- **B1 done 2026-11-18 (Opus), awaiting the user's review:** [DESIGN-dakota-content.md](DESIGN-dakota-content.md)
  (run of 3 rooms + Double-Face + 3 rooms + Iya/Eya, 3 new spirits, 9 places with layouts, 6 gifts,
  6 items, camp unlocks, elder drafts, hints, place names), 12 new briefs in `art/briefs/`, CULTURE.md NR 23-26.
- 2026-11-18 the user said "continue" after switching to Sonnet: treated as go-ahead for phase C on the pack as
  written (fallbacks for NR 23-26: no digging stick built, elder texts stay DRAFT, no Iktomi). Pack review still welcome.
- **C1 done:** `game/src/ui/hints.js` (12 hints, skippable, `kota.hints`, Settings "Hints" toggle), place banners
  (Mni Sota Makoce at run start, room name + `season` from rooms.json), camp titled "Camp in Cansa'yapi" with its
  translation. Verified in Chrome by stepping `kota.hints.update`; no console errors.
- Next: C2 (gifts and items data, then models), then C3-C7 per PLAN-dakota.md.
- Hero art upgrade (plan in the user's .claude/plans, tasks T1-T7) 2026-11-18: **T1 done** (DESIGN, STYLE, PIPELINE, both hero briefs, LICENSES, ASSETS, CULTURE NR 27 rewritten for hand-painted warrior heroes; the low-poly hero stays installed until T5-T6 are approved) and **T2 done** (4 Gemini prompts in the woman's brief, `art/refs/hero_dakota_woman/README.md`). Next: T3 combat feel, T4 close-up, T5-T7 builds. Dakota C2 paused. Nothing committed.
- 2026-11-18 user redesigned the woman hero for Gemini: intimidating fantasy warrior (short fighting dress, one braid, invented war paint, war moccasins); recorded in her brief and STYLE.md; the man is unchanged for now.
- 2026-11-18 the user named the woman hero **Ash Wolf** (English name; recorded in her brief).
- **2026-11-18 PIVOT (user, grilled):** Kota becomes a Brotato-style 2D top-down arena survivor (Phaser 3,
  hand-painted stills). The 18 decisions and the task plan are in [PLAN.md](PLAN.md), which supersedes
  PLAN-dakota.md, SLICE.md, DESIGN-dakota-content.md and the hero art plan T1-T7. **Next: the user approves
  PLAN.md, then A1.** A4 deletes the old 3D game only after a final yes on the exact path list.
- **A1 done (Haiku, 2026-11-18):** invention allowed; CULTURE.md, AGENTS.md, PROMPTING.md, art/STYLE.md now
  call the rules reference, not binding; Claude's limits stated. The *Off-limits* headings are kept (links),
  and their lists are reference notes. A2 done: PLAN-dakota.md and SLICE.md marked superseded.
- **A3 done (Sonnet):** DESIGN.md rewritten from the 18 decisions; kota/AGENTS.md, ../AGENTS.md and README
  intro updated. PLAN-dakota.md and SLICE.md are NOT deleted yet (CULTURE.md links to SLICE.md; they are
  untracked, so deletion is permanent): add them to A4's confirmed delete list. The public hub blurb in
  ../index.html still says "isometric"; change it when the new game is published.
- **A4 done (user chose the Recycle Bin, 2026-11-18):** `game/src/`, `game/assets/models/` and `art/models/`
  are in the Windows Recycle Bin (restorable); `game/carry/` holds audio.js, settings.js, touch.js and
  hints.js; the Three.js and Blender rows are out of LICENSES.md. Kept: `game/data/*.json`, `game/index.html`
  (stale, C1 rewrites it), all art briefs, `art/refs/`, SLICE.md, PLAN-dakota.md, DESIGN-dakota-content.md
  (B1 deletes the last one). The game does not run right now: there is no code until C1.
- **A5 done (Sonnet):** art/PIPELINE.md rewritten (painted stills; flat-green-background prompt template,
  Pillow chroma-key processing, rembg only as a fallback, sprite sizes and budgets, check and approval
  steps); art/ASSETS.md reset; Pillow row in LICENSES.md. art/STYLE.md is still the 3D-era text until D1.
  **Phase A is complete.**
- **B1 written (Opus, 2026-11-18), waiting for the user's approval:** [DESIGN-m1.md](DESIGN-m1.md) (world and
  camera, 14 stats and formulas, Ash Wolf with dash and "Ash circle", 6 weapons I-IV, 16 items, 5 threats,
  20-wave table, embers as the pickup, helper level-ups, shop "the makers' fire", Double-Face, Iya, 4 camp
  upgrades, 2 arenas, texts, hints, HUD, JSON shapes, debug hook). DESIGN-dakota-content.md is kept until the
  user approves B1; deleting it then needs their yes (untracked file).
- 2026-11-18 the user said "Continue" after switching to Sonnet: treated as approval of B1 and the go-ahead for C1
  (the spec is still open to edits). DESIGN-dakota-content.md is NOT deleted (needs their yes).
- **C1 done (Sonnet):** Phaser 3.90.0 vendored (`game/vendor/`, MIT, LICENSES row); `game/index.html`; scenes
  Boot, Camp, Run, Between (stub) in `game/src/scenes/`; `src/main.js` (helpers, Settings menu, `?debug` hook with
  fps); arena 1600x1200 with camera follow (zoom = height/640); stick plus dash and ability buttons
  (`input/touch.js`, left-handed swap); settings, sound and hints ported (hints text and key `kota.v2.hints` per
  B1); `data/rules.json`, `data/heroes.json`, `run/stats.js`. The ability only draws a placeholder ring until C3.
  Verified in Chrome (stepped with `kota.run().advance(sec)`): walk 231 px in 1 s, dash 189 px with a 3 s cooldown,
  edge clamp, pause in Settings, Leave run, quality change, 58 fps, no page errors. NOT yet tried on a phone or at
  844x390. The old `game/data/{camp,enemies,gifts,items,rooms}.json` are stale 3D-era files that C2-C7 overwrite.
  The README Play section still lists the old controls (update with C8).
- **C2 done (Sonnet):** `data/threats.json`, `data/waves.json` (20 waves from B1 section 7), `src/run/threats.js`
  (chaser, cluster, ranged sleet spirit with shards, burrowing gnawing hollow that swallows and releases),
  `src/run/pickups.js` (embers with magnet and wave-end fly-in, food), `src/run/waves.js` (wave length, spawner with
  0.8 s spawn marks, spot >= 260 px from the hero), HUD (health, level bar, embers, wave and timer), hero damage
  (armour formula, dodge, 0.5 s iframes, slow and no-heal effects), Mending, wave-start full heal, level counter
  (`pendingLevels` waits for C4), a stand-in fall screen and "held the arena" screen, placeholder textures.
  Waves 10 and 20 run as normal 60 s waves until C5 adds Double-Face and Iya. Wave end goes straight to the next
  wave until C4 adds the level-up and shop. Debug: `kota.run().advance(s)`, `debugKillAll()`, `debugSetWave(n)`,
  `debugSpawn(id, n)`, `debugCounts()`. Verified in Chrome by scripted runs (counts, drops, level-up, wave end,
  armour 15 -> 3 damage, contact cap one hit per 0.8 s, sleet holds 300 px and fires, hollow cycle and release, food
  3 / 2 heal, fall screen). Tuning note for C8: a gnawing hollow's bite is 9 damage on wave 7 against 15 base health.
- **C3 done (Sonnet):** `data/weapons.json` (6 weapons, tiers I-IV from B1 section 4), `src/combat/weapons.js` (ring of
  up to 6 hovering weapons, nearest-target auto-fire, swing / thrust / shoot (pierce) / lob (burst, burn), crit, knock,
  stat scaling, Range and Attack speed stats, `add` (merges when slots are full), `pairs`, `merge`, `remove` for the
  shop), burn ticks and hit flash in threats.js, Ash circle with real damage and knockback (`useAbility`), placeholder
  weapon textures, hints `weapons`, `ability` and `merge`. Verified in Chrome with a scripted run: per-hit damage equals
  the formula for all 6 weapons, hit counts equal 10 s / cooldown (within 1) at tiers I and IV, Range, Attack speed and
  Damage % stats apply, merge and the full-slot rules, Ash circle 12 damage / 140 knock inside 200 px only; screenshot
  of all 6 weapons in a fight at 62 fps. Tiers are shown by a placeholder tint. Not yet tried on a phone.
  Debug: `kota.run().debugGive(id, tier)`, `kota.run().weapons.merge(i, j)`. **Next: C4 (level-ups and shop).**
- **C4 done (Sonnet):** `data/items.json` (16 items), `helpers.json` (9 helpers), `helperValues.json`; `src/between/between.js`
  (helper level-up cards with tiers by level and luck; the shop "the makers' fire": 4 offers, weapon 35% / item 65%, wave
  price factor, rarity and weapon-tier chances, lock keeps an offer at its old price, reroll wave+1 then +1 each, sell 40%
  with a confirm tap, merge, full-slot rule, item `max`, stats panel). The shop uses the wave just cleared for prices and
  rarity. `RunScene` phase `between` runs it after wave end (`addStats`, `refreshSpecials`: rice kettle food heal, ember
  stone burning hits; snowshoes' `water` flag waits for C7). `ui.showPanel` shows a ready-made element. The `Between`
  stub scene was deleted. Verified in Chrome by a scripted run: level-up picks apply, buying and stacking, lock across
  waves, reroll costs 2 then 3, merge, sell 12, full-slot and max-item refusals, Settings over the shop; the shop fits
  an 844x390 frame (332 px) with six weapons. Not yet tried on a phone. Camp-unlocked helpers read `app.camp.built` (C6
  must set it). **Next: C5 (Double-Face and Iya, win and fall screens).**
