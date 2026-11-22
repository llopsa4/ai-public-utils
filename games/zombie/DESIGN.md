# Dead Woods design record

Settled decisions only (user, grilling 2026-11-22). Proposals stay out until the user accepts them.
Task units cite sections as `DESIGN §n`. Starting numbers for the first slice are in
[PLAN.md](PLAN.md) *Slice spec*; they are tuning values, not decisions.

## §1 Platform
Desktop browsers only, mouse + keyboard (left-click select, box-select, right-click order, hotkeys,
WASD/edge pan, wheel zoom). Static files on GitHub Pages.

## §2 Game loop
**Camp hub + linear missions.** At the camp the player spends scavenged resources on upgrades and
deals with the dead, then starts the next story mission; a mission ends in a debrief and returns to
the camp. The camp relocates to new bases at story points (later). Camp defense for now: see §12;
timed waves may come later.

## §3 Mission time model
Real time with a **plain pause** (Space). While paused the player can inspect vision cones and select
survivors but cannot give orders. A tactical order queue (Shadow Tactics style) is a possible later
addition, not planned.

## §4 First slice
Both modes, tiny: camp (tent, fire, 2 survivors, food + scrap, 1 upgrade, 4 roaming zombies) and one
small mission (vision cones, crouch, one ability per survivor, loot crates, 2 zombies + 1 human guard,
extract zone). Grey placeholders only.

## §5 Survivors
The roster will have 7 characters; the user is still designing them. The slice starts with two
placeholder roles (renamable): **Fighter** (silent melee takedown, carry bodies) and **Scout** (throws
a noise lure, sees further, crouches faster).

## §6 Tone
Mature, **visible gore**: blood decals, bodies stay on the map. Serious survival tone. No dialogue for
now.

## §7 Enemies
- **Humans:** long vision cones, patrol routes, notice bodies, raise alarms that call other humans.
- **Zombies:** short vision cones, wander, mostly react to **noise** (shots, running, lures); noise
  draws more zombies.
- Cones and noise rings are visible to the player.

## §8 Failure
Any survivor dying on a mission fails it; the mission restarts from its start.

## §9 Title and art
Working title **Dead Woods**. **Codex draws, Claude never does:** Claude uses flat grey geometric
stand-ins only; Codex makes and installs all art per `art/manifest.json` key
([art/STYLE.md](art/STYLE.md)).

## §10 View and story
Isometric 2:1 with **one fixed view** (no rotation). Story is linear. A new game starts with two
survivors at an improvised camp in the woods: a fire and a tent.

## §11 Technical defaults
Phaser 3 + Vite + TypeScript (as Survival, copied not shared). English text. One `localStorage` save
slot holding campaign progress between scenes. Dev port 5175, e2e port 5185.

## §12 Camp fighting
For now the camp threat is **4 zombies roaming** the woods around the camp (no timed waves).

## §13 Watch order (Commandos 2 ambush)
A survivor holds position facing a chosen direction with a visible view cone; any enemy that enters
the cone is attacked automatically. Works in the camp and on missions. Hotkey `V`, then click to set
the facing; any other order for that survivor ends it.

## §14 Movement states
Four separate states, each with its own animation (art/STYLE.md): **run** (hold Shift), **walk**
(default), **crouch walk** (`C` toggles) and **crawl** (`C` cycles walk → crouch → crawl → walk).
Starting values, tuned in the playtest:

| State | Speed (tiles/s) | Noise radius (tiles) |
|---|---|---|
| Run | 5 | 6 |
| Walk | 3 | 2 |
| Crouch walk | 1.5 | 0 |
| Crawl | 0.8 | 0 |

Crouched and crawling survivors can hide in bushes and low cover; enemies look past them unless
adjacent. The Scout crouches faster (2.2) than the Fighter. Speeds apply to the slice's Fighter;
other characters may differ later.
