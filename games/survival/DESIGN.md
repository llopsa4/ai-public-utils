# Survival design

Settled decisions only ([AGENTS.md](AGENTS.md#survival-rules)); real-culture claims also follow
[CULTURE.md](CULTURE.md). Requests follow [PROMPTING.md](PROMPTING.md); the task plan is
[PLAN.md](PLAN.md). Written 2026-11-19 from the grilling session that created the game (12
questions, all confirmed by the user). Numbers not decided here are specified in `DESIGN-slice.md`
(plan task B1) and enter this file once the user approves them.

**Working title: Camp Fire** (placeholder; the folder stays `games/survival/` if it changes).

A **Stronghold-style real-time camp-management game** about a **fictional Dakota camp**: a few
families with no fences or walls grow into a strong camp, manage shared resources, suffer hunger
and pests, and fight enemy waves that grow from animals to rival raiders to the US military, while
the camp unlocks ever stranger allies: spirit fighters and nature allies. It is a fiction made for
the user's own local play.

## 1. Platform
Desktop browser only (mouse and keyboard, no touch). Static files on GitHub Pages, which serves
`main` as-is, so the built game is committed. 2D, Phaser 3 + Vite + TypeScript.

## 2. Camp organization (replaces Stronghold's keep, taxes and popularity)
- **Tiyospaye** (extended families of 10-12 people) are the work units; a run starts with 2-3.
- The player is the **camp council**: decisions, not a king's orders.
- **Societies** (hunters, scouts/warriors, healers, builders) train people into roles.
- **No gold.** Everything goes into a **shared camp store**; the council chooses how it is
  distributed: share evenly, hunters first, or hold reserves.
- **Wotakuye** (kinship and unity) replaces popularity: fed, safe and generous -> faster work and
  newcomers; low -> quarrels and people leaving.
- **Gift value** (generosity) is the currency for upgrades and allies.
- Seasons shape the year.

## 3. Combat
- Real time like Stronghold: click or box-select, right-click to move or attack, hotkey stances
  (hold, defend camp, chase) and abilities.
- Fighters are **drafted workers**; while drafted they do not work (the core trade-off).
- No walls or fences at the start. Defenses come later: lookouts, spike-line barricades, dogs,
  traps, fire. It stays a camp, never a castle.
- Enemies drop no loot: a defeated hunting pack ends the threat; a defeated raid restores what it
  stole.
- **Lose** when all the camp's people or its central fire are lost.

## 4. Resources and hardships
- **Food:** hunting (deer, then moving bison herds), gathering (berries, roots, wild turnips),
  fishing, later wild rice and corn gardens; drying racks turn meat into **pemmican**, which keeps
  through winter.
- **Materials:** wood, hides, flint/stone, bone and sinew. **Water** from river or spring.
  **Medicine herbs.** **Crafted goods:** tools, bows and arrows, travois. **Gift value.**
- **Hardships,** each with a counter to build or assign: hunger and famine, sickness, pests spoiling
  the store, hard winters, drought.

## 5. Enemy waves
- 30 waves, one about every 3 in-game days, each announced by scouts about 30 s ahead with its
  direction. The player may call the next wave early for bonus gift value.
- **Era 1, animals (waves 1-8):** wolves, coyotes, a bear, a cougar, a stampede (can be diverted).
  Wave 1 is a single wolf.
- **Era 2, rival raiders (waves 9-18):** fictional neighbouring bands (scouts, archers, horse
  raiders) who steal food and horses; they can be bargained with using gifts.
- **Era 3, US military (waves 19-30):** fictional riflemen, cavalry and cannon with longer range than
  anything the player starts with.
- A boss ends each era; the final boss is a fictional fort-commander type. No real historical people.
- Waves scale with time and with the camp's strength.

## 6. Progression
Three tiers, unlocked with gift value plus camp size or Wotakuye:
- **Practical (eras 1-2):** better bows, dogs, lookouts, drying racks, bigger tipis, hunter and
  healer societies.
- **Societies (eras 2-3):** warrior classes (archers, lancers, riders), far-seeing scouts, builders
  with barricades, traps and fire pits.
- **Fantasy (era 3+):** invented spirit fighters (ancestors who fight beside the camp) and nature
  allies (a charging bison herd, a guardian wolf pack, storms called by a shaman). Expensive, need
  high Wotakuye. All invented; no real sacred names.
- Every upgrade costs people, food or spirit; not everything can be unlocked in one run.

## 7. Runs, map and saving
- One camp on one **seeded river-valley map** per run (forest, plains, river, hills, bison ranges),
  camp in the middle, fog of war lifted by scouts.
- **Win:** survive 30 waves and beat the final boss (about 90 minutes). **Lose:** see 3.
- Pause and speeds 1x / 2x / 4x.
- **Seasons:** spring newcomers and floods, summer hunting, autumn harvest and drying, winter hunger
  and cold. The camp does not move in early versions; moving camp with travois comes later.
- **Saving:** automatic to the browser's localStorage, 3 slots, export/import as a file. No accounts,
  no network calls. Details: [DESIGN-saves.md](DESIGN-saves.md).
- **Difficulty:** Gentle, Standard, Hard.

## 8. Look and art
- **Isometric 2:1** like Stronghold: 64x32 diamond tiles, upright depth-sorted sprites (people about
  32 px tall, tipis about 96 px wide); camera pans with the screen edge or WASD and zooms with the
  wheel.
- Warm hand-painted 2D sprites, natural colours, clear silhouettes.
- Claude draws **placeholders in code** now. One **asset manifest** lists every sprite; the game loads
  a PNG from `art/` when one exists, else the placeholder, so Codex replaces art one asset at a time.
  Details: [art/SPEC.md](art/SPEC.md), [art/PIPELINE.md](art/PIPELINE.md).

## 9. Content rules
- A fiction: free invention of factions, spirits, allies and enemies; rival bands and the military
  are fictional, hostile and killable on screen. Invented names at first.
- Real words, names and practices need a CULTURE.md entry with a source, or go under *Needs review*.
- Claude's own limits stay: no real historical people, no hateful caricature, slurs or mock war
  cries, no real named sacred ceremonies or objects as mechanics.
- Free software only; no LICENSES.md (user).

## 10. First playable slice
A 48x48 isometric map (grass, river, forest, berry patch); a central fire and 2 tiyospaye of 10
people; 4 buildings (tipi, gathering spot, hunting lodge, store); food, wood and hides; the shared
store with one rule (feed evenly); hunger and a simple Wotakuye bar; select, assign, box-select and
right-click orders; one drafted hunter society against 3 wolf waves (1 wolf, 3 wolves, a pack) with a
30 s warning; the lose condition; a few simulation tests and one browser smoke test. Not in the
slice: seasons, saves, eras 2-3, upgrade tiers, moving camp, audio. All text in English.
