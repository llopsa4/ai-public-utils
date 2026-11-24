# Dead Woods design record

Settled decisions only (user, grilling 2026-11-22). Proposals stay out until the user accepts them.
Task units cite sections as `DESIGN §n`. Starting numbers for the first slice are in
[PLAN.md](PLAN.md) *Slice spec*; they are tuning values, not decisions.

## §1 Platform
Desktop browsers only, mouse + keyboard (Commandos-style left-click, box-select, hotkeys, WASD/edge
pan, wheel zoom). Static files on GitHub Pages.

**Mouse** (2026-11-23, replaces right-click orders): left-click both selects and orders. With a
survivor selected, left-click on a survivor selects them instead, on a zombie or enemy attacks, on
an object (stove, crate, broken door or window) uses it, and on the ground walks. A drag
box-selects. A **double left-click** on the ground runs (§14): the first click orders a walk at
once and a second click within ~300 ms near the same spot upgrades it to a run, so walking has no
delay. Double-clicking a survivor only selects them. **Right-click** gives no orders; it only
cancels a pending command or targeting mode (V, L, B, T, X). The cursor shows what a click will do
(select, attack, use, move): browser CSS cursors first, cursor art from Codex later.

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

Weapons (2026-11-23): the Fighter carries only a **knife** (pistol removed). The Scout carries a
**gun** (pistol; replaces the bow) and a weak **club** (adjacent, 15 damage, silent, 1 s) for when
ammo runs out. **Ammo** is a shared resource shown in the HUD: a new game starts with 3, each shot
uses 1, at 0 the Gun action is greyed; crates can hold ammo. Takedown stays Fighter-only.

**Every survivor shoots** (2026-11-23, supersedes "pistol removed" above for after the Intro): every
survivor, the five future ones included, carries the **same pistol** (25 damage, loud, 1 shared ammo
per shot) plus **their own melee weapon**, chosen when that character is designed (Eli: club). Cass
is the only one with a knife. In the Intro and Mission 1 Cass has the knife only; on the first
arrival at **Base 1** a short dialogue beat has her take back her pistol, and from then on she has
the Gun action too (saved in the campaign). Every survivor shows a centred holster and shoots with
a two-handed grip centred in front of the chest (art/STYLE.md).

## §6 Tone
Mature, **visible gore**: blood decals, bodies stay on the map. Serious survival tone.

**Dialogue** (2026-11-23): a box across the bottom of the screen, above the action bar (§17), with
speaker name and the speaker's portrait. **Portraits** (2026-11-24): painted Cass and Eli in four
moods (neutral, afraid, determined, hurt); each line in `data/story.json` carries a mood, and hurt
replaces it while that survivor is under 35% HP. The squad card shows a small neutral or hurt head. Text is typed letter by letter in the typewriter font
'Special Elite' (free, Apache 2.0, bundled locally in `src/fonts/`), with typewriter blips (see
*Audio* below). Click or Enter completes the line, then advances; **Esc skips the whole beat**
(2026-11-23). The game is paused while a line is shown. Lines live in
`data/story.json`; Claude drafts them and the user approves. Speakers stay "Fighter" and "Scout"
until the roster (§5) is settled.

**Audio** (2026-11-23): Claude makes all sound **in code** with WebAudio, with no audio files and
nothing from Codex. Effects: shots, knife, club, bite, footsteps by movement state, the noise can,
the spike pit, crates, chewing, zombie groans, UI clicks and typewriter blips. Each sound is
**placed from the camera centre**: panned left and right, fading out about one screen away, so faint
off-screen groans act as a warning. Music is an **adaptive ambience**, not melodies: a calm woods
bed (wind, low drone), a pulse layer while a zombie chases or an alarm is up, and a heavy layer from
the herd warning (§12) until Base 1 is won or lost; layers crossfade.

## §7 Enemies
- **Humans:** long vision cones, patrol routes, notice bodies, raise alarms that call other humans.
- **Zombies** (revised 2026-11-23): **no vision cone.** They wander and walk to any noise that
  reaches them (shots, running, lures, traps); noise draws more zombies. They see a survivor only
  close by: 3 tiles in every direction (2 if the survivor is crouched or crawling), with clear line
  of sight; a survivor in a bush is hidden unless adjacent. Seen → chase; lose track after 5 s.
  A faint grey circle shows each zombie's sight radius. **Reach** (2026-11-24, looks only): a walking
  zombie that is not chasing raises both arms forward within 2 tiles of what it goes for (a survivor,
  its noise spot, or a barricade or fixed opening it heads in to chew); a chaser lurches arms-out
  anyway; a standing one keeps its arms down. Decay level (fresh, decayed, rotting) is looks only.
  **Limp** (2026-11-24, looks only): zombies limp and stand lopsided, each of the three bodies its
  own way, the same at every decay level; their walks are 6-frame cycles at the old cycle length.
- Human cones and all noise rings are visible to the player.

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

## §12 Base 1 (replaces the slice camp, 2026-11-23)
Base 1 is the cleared house from Mission 1 (§16), on the same map, and lasts about **10 minutes**.
Resources are what the player carries over from Mission 1.

- **Fix:** 2 broken windows and 1 broken door are passable gaps, marked on the map. A survivor
  clicks one, works 3 s and spends 1 scrap; the fixed opening blocks zombies (HP 100, chewed like a
  barricade). Barricades (`B`, 1 scrap per segment) stay for the open yard.
- **Hunger:** each survivor has a hunger timer of 8 min, shown as a meter on their portrait in the
  action bar. At 2 min left it turns yellow and the survivor says "I need to eat something."; at
  30 s it flashes red. At 0 the survivor starves: −1 HP every 3 s and speed × 0.7 until fed.
- **Cook:** at the stove in the house, 6 s and 1 food make 1 meal, held by the cook (at most 1 meal
  per survivor). **Eat** (action bar) resets that survivor's hunger to 8 min and heals them +60 HP;
  it heals only the eater. Assumed: **Give** hands a meal to an adjacent survivor who has none.
- **Traps** (`T`, pick a type, click a tile, 2 s to build; survivors never trigger traps):
  **Spike pit** (2 scrap): the first zombie to step on it takes 60 damage; re-arming costs 1 scrap.
  **Noise can** (1 scrap): rings a noise of radius 6 when a zombie walks through, pulling others
  there and warning the player.
- **Roamers:** 3 zombies at the start; one more wanders in every 90 s, at most 4 alive.
- **The herd:** at 5:00 the Scout warns (dialogue) that a herd is coming from the north, and a red
  arrow marks the north edge. At 7:00, 12 zombies enter from the north over 60 s and head for the
  house, following noise and chewing fixed openings and barricades.
- **Win:** every herd zombie dead → dialogue → "To be continued..." (saved as finished, §18).
  **Fail:** any survivor dies → Base 1 restarts from its start, or, after the herd warning, the
  player chooses **Retry from the warning** (a checkpoint of the whole Base state taken at 5:00) or
  **Restart Base 1** (2026-11-23). Built 2026-11-24: Enter retries, R restarts, no auto-restart once a
  checkpoint exists; before the warning any key restarts as before.
- **Guidance** (2026-11-23): at the start, 4–5 short timed key hints (Fix, Cook and Eat, Traps,
  Barricade, hunger), as in Mission 1, re-readable on the pause menu's Controls page (§19). An
  objective line at the top reads "Prepare the house", then from the warning "Survive the herd: n
  left". The herd stays a surprise until the warning.

## §13 Hold order (Commandos 2 ambush; renamed from "Watch" 2026-11-23, "Cover" clashed with cover tiles)
A survivor holds position facing a chosen direction with a visible view cone; any enemy that enters
the cone is attacked automatically. Works in the camp and on missions. Hotkey `V`, then click to set
the facing; any other order for that survivor ends it.

**Melee by default** (2026-11-23): Hold strikes only adjacent enemies with the melee weapon. A
per-survivor **Free fire** toggle (action-bar button and key) lets Hold use the gun too; it is off
by default so scarce, loud ammo is not spent by accident. Every survivor who has a gun gets the
toggle (Cass only once her gun unlocks at Base 1, §5).

## §14 Movement states
Four separate states, each with its own animation (art/STYLE.md): **run** (double left-click, §1;
in every scene, Intro and Base 1 included, 2026-11-23; Shift-click no longer runs), **walk**
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

## §15 Story flow and Intro (2026-11-23)
New Game → **Intro** → **Mission 1** (§16) → **Base 1** (§12) → "To be continued...". The Intro is
the improvised woods camp (tent, fire) right after a fight, and doubles as the tutorial in 4 gated
steps, each waiting for the player: (1) select a survivor and left-click the ground to move, (2) Fighter knife
attack on a zombie, (3) Scout shoots a zombie (using scarce ammo), (4) Hold order (`V`) facing the
woods to stop a last zombie. Dialogue (§6) plays between steps: they are out of ammo and food and
must find a place to stay; the Scout has spotted a house in the woods. Crouch, takedown, lure and
carry are taught by short hints when Mission 1 starts.

## §16 Mission 1: the house in the woods (2026-11-23)
Stealth mission, zombies only. 32 × 32 woods with bushes and trees; a 2-room wooden house in the
middle with a **roof** that hides its interior (and anything inside) until a survivor enters, then
fades. 5 zombies: 2 inside the house, 3 wandering outside. 4 crates: food 3; ammo 3; scrap 4;
food 2 + ammo 2. **Win:** every zombie dead and every crate opened → short dialogue → Base 1 starts
on the same map. No extract zone. **Fail:** any survivor dies → restart (§8).

## §17 Action bar (2026-11-23)
A bar along the bottom shows the selected survivor's portrait (with hunger meter, §12) and their
available actions as buttons, usable by click or hotkey; unavailable actions are greyed.
Fighter: Knife, Takedown `F`, Carry `G`, Hold `V`, Crouch `C`, plus Gun once it unlocks at Base 1
(§5). Scout: Gun, Club, Lure `L`, Hold `V`, Crouch `C`. Every survivor with a gun gets the
**Free fire** toggle (§13). In Base 1 the bar drops the mission tools
(Takedown, Carry, Lure) and shows Eat, Give, Fix, Trap `T` and Barricade `B` where they apply
(2026-11-23: Base stays a building and defence scene).

**Squad panel** (2026-11-23): one card per survivor with name, HP and hunger, always visible, so an
off-screen survivor can be watched. Click a card selects; double-click centres the camera. `F1`/`F2`
select a survivor, `Tab` cycles, Shift-click adds to the selection. The action bar stays
selection-only.

## §18 Saves (2026-11-23)
The save (`deadwoods.save`) is written at the start of each scene (Intro, Mission 1, Base 1);
Continue resumes there. 2026-11-23: winning Base 1 saves the stage **done** (save still version 2);
Continue then shows the existing "To be continued..." text with **Replay Base 1** and **Menu**. The
Base 1 herd checkpoint (§12) is stored in the save (`checkpoint`, a copy of the whole Base state); Continue
and Retry resume there, Restart Base 1 and every stage change drop it, and a checkpoint that does not fit
the build is ignored on its own. **Replay Base 1** overwrites the finished save with a Base 1 save
(quitting mid-replay then Continues into Base 1, not the end page). A save slot that cannot be read is kept and
ignored, never erased. New Game asks before overwriting a save. The save version is bumped and slice-era saves are discarded. The old
Mission 1 "Ranger station" and the menu's test button are removed; the human-guard AI stays in the
code for later missions.

## §19 Pause, options and feedback (2026-11-23)
- **Pause menu:** Esc opens it in Intro, Mission 1 and Base 1 (Esc first cancels a pending order;
  it does not open over a dialogue, §6): Resume, Restart, Options, Controls, Quit to menu. Restart
  (also `R`) and Quit ask for confirmation. The game pauses when the window loses focus.
- **Options** (stored in `localStorage` key `deadwoods.options`): master, effects and ambience
  volume plus mute; edge scroll on/off; text size 100 / 125 / 150%; shape cues on/off (default on:
  `!` over a chasing zombie, `?` over an investigating one, a dash style per noise kind, a text
  label on the hunger meter); screen shake on/off (default on); key rebinding with reset to
  defaults. Esc, Enter, R, Y, N and the arrow keys are not rebindable (the arrows always pan too);
  a key already in use is refused with the name of its action, never swapped; Free fire, Hold and
  the other actions follow the live map everywhere a key is shown. Restart from the pause menu or `R`
  means from the very beginning of the scene (it drops the Base 1 checkpoint); Quit keeps it.
- **Controls page:** every key, from the live key map, plus each scene's entry hints.
- **Camera zoom** snaps to 1×, 1.5×, 2×, 3×, one step per wheel notch (touchpad scrolling is added
  up until it is worth one step), with pixel rounding on.
- **Hit feedback, no damage numbers:** a white flash on the figure that is hit, a small screen shake
  on shots and bites, short text pops for events only ("Silent kill", "+3 ammo", "Out of ammo"),
  edge-of-screen arrows when a survivor or opening is attacked off-screen, and a stronger herd
  arrival (flash and camera pan north). `U` (rebindable) glides the camera to the newest attacked
  survivor or opening; alert arrows last 6 s after the last hit, at most 4.
- **UI art** (2026-11-24): a painted "worn field kit" (9-slice panels, buttons, cards, sliders); the
  action bar shows an icon per button with its key in a corner and the name on hover; small HUD
  icons sit beside the numbers; a painted title screen (art/STYLE.md *UI art*).
- **HUD:** Mission 1 shows the zombies left; the fail screen names who died and what killed them,
  and any key skips the wait.
- **Balance target for Base 1:** challenging but fair: a scripted careful defence wins 70–80% of
  seeds and a passive one under 20%. Tuning edits data only.
