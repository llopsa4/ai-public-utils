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

**Names and traits** (user, 2026-11-25): everything the player sees says **Cass** and **Eli**
(hints, dialogue speakers, squad cards, options and keys pages, barks), never "Fighter"/"Scout";
internal ids stay `fighter`/`scout`. Each has one passive trait, always on: **Cass runs silently**
(run noise radius 0), and **Eli runs at 6.5 tiles/s**, the fastest survivor. Each trait shows as a
line on the squad card on hover and in a Mission 1 start hint. Together they have the bond
technique (§23).

**Ray and June** (user, 2026-11-25): survivors 3 and 4, a Dakota father and daughter who join at the
end of Mission 1 (§16) and are playable from Base 1 on. Cards in `DESIGN-characters.md`. Internal ids
`hunter` (Ray) and `archer` (June); everything the player sees says **Ray** and **June**. With each
other they use their Dakota names, *Tahca Wanyaka* and *Wakpa Win*, only inside dialogue lines.
- **Bow** (an exception to "pistol plus own melee"): both carry a bow as well as the shared pistol.
  **8 arrows each**, range **8**, **30 damage** (two hits kill a 60 HP zombie), silent (noise 0),
  1.5 s cooldown. An arrow flies visibly (about 0.2 s), then lies on the tile it hit until a survivor
  walks over that tile to pick it up.
- **Melee:** Ray a **hatchet** (range 1.5, 30 damage, silent, 1.5 s); June a **war club** (range 1.5,
  25 damage, silent, 1 s). Cass stays the only knife user; Ray's belt knife is part of his look only.
- **Traits:** Ray, **Tracker**: zombies within 6 tiles of him always show as faint markers, even
  behind walls and outside cones. June, **Quick draw**: her bow cooldown is 0.75 s.
- **Starting numbers** (placeholders; the user judges balance by playing): Ray 110 HP, vision 7; June 90 HP, vision 7; both walk 3, Ray runs 5 and June 5.5 (Eli stays the fastest at 6.5). They live in `src/data/characters.json`.
- The bond technique (§23) stays Cass + Eli only.

**Theo Nakamura** (user, 2026-11-25): survivor 5 of 7, the prepper. Card in `DESIGN-characters.md`; id
`tinkerer`; everything the player sees says **Theo**. A really smart, skinny, glasses-wearing
IT worker who is anxious and over-prepared, and rich. Ray hired him as June's maths tutor over video.
He is sealed in the bunker of his own prepped house, which hostile human squatters hold, and **joins the
squad when the bunker door opens at the end of Mission 2** (§25; this replaces "one base visit first").
Placeholders, numbers set in Z91:
- **Weapons:** the shared pistol + an **entrenching shovel** (weak melee, not a knife).
- **Trait Resourceful:** crates give him more; he can break junk down into parts.
- **Ability Rig:** places a tin-can tripwire or a noise lure from carried junk in a few seconds.
- **Fragile and slow:** about 70 HP, slowest walk and run on the roster, a short sprint.
- Glasses are a look only. The bond technique stays Cass + Eli only.
- **Enemy highlight** (user, 2026-11-25): whenever Theo is in the scene, an action-bar button (and a
  key) toggles it: every zombie and every human is drawn as a coloured outline glow through walls,
  **red for zombies, orange for humans**, in code with no new art. Free toggle, no cooldown or limit.
  Human cones and noise rings are unchanged, and so is Ray's Tracker. In Mission 2 it works from
  Theo's first speaker line (he is a voice, not playable, §25); afterwards, in every scene while he is
  in the squad.

## §6 Tone
Mature, **visible gore**: blood decals, bodies stay on the map. Serious survival tone.

**Dialogue** (2026-11-23): a box across the bottom of the screen, above the action bar (§17), with
speaker name and the speaker's portrait. **Portraits** (2026-11-24): painted Cass and Eli in four
moods (neutral, afraid, determined, hurt); each line in `data/story.json` carries a mood, and hurt
replaces it while that survivor is under 35% HP. The squad card shows the same dialogue portrait,
cropped, with the same rule: hurt under 35% HP, otherwise the mood of that survivor's last line
(2026-11-25). Text is typed letter by letter in the typewriter font
'Special Elite' (free, Apache 2.0, bundled locally in `src/fonts/`), with typewriter blips (see
*Audio* below). Click or Enter completes the line, then advances; **Esc skips the whole beat**
(2026-11-23). The game is paused while a line is shown. Lines live in
`data/story.json`; Claude drafts them and the user approves. Speakers are named Cass and Eli (§5),
and Ray and June from the end of Mission 1 (2026-11-25).

**Audio** (2026-11-23): Claude makes all sound **in code** with WebAudio, with no audio files and
nothing from Codex. Effects: shots, knife, club, bite, footsteps by movement state, the noise can,
the spike pit, crates, chewing, zombie groans, UI clicks and typewriter blips. Each sound is
**placed from the camera centre**: panned left and right, fading out about one screen away, so faint
off-screen groans act as a warning. Music is an **adaptive ambience**, not melodies: a calm woods
bed (wind, low drone), a pulse layer while a zombie chases or an alarm is up, and a heavy layer from
the herd warning (§12) until Base 1 is won or lost; layers crossfade.

**Music** (user, 2026-11-25, supersedes the drone and pulse above): a sinister music track made in
code (low pads or strings, a slow dissonant motif) replaces the drone bed and the heartbeat pulse.
When a zombie sees a survivor it **intensifies and speeds up** (tempo rises, percussion and higher
voices come in), then relaxes about 8 s after the last zombie loses sight. The herd layer stays as
the top intensity. Wind and rain stay as quieter sound effects, and the white-noise hiss is turned
down hard ("too loud").

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
  arrow marks the north edge. At 7:00, 18 zombies (§12 *Four survivors*) enter from the north over 60 s and head for the
  house, following noise and chewing fixed openings and barricades.
  **Herd direction** (2026-11-24, supersedes "from the north"): the herd comes from any of the four
  edges, rolled when Base 1 starts; the warning line and the red arrow name the edge. Retry from
  the warning keeps it (it is in the checkpoint); Restart rolls it again.
- **Win:** every herd zombie dead → dialogue → "To be continued..." (saved as finished, §18).
  **Fail:** any survivor dies → Base 1 restarts from its start, or, after the herd warning, the
  player chooses **Retry from the warning** (a checkpoint of the whole Base state taken at 5:00) or
  **Restart Base 1** (2026-11-23). Built 2026-11-24: Enter retries, R restarts, no auto-restart once a
  checkpoint exists; before the warning any key restarts as before.
- **Guidance** (2026-11-23): at the start, 4–5 short timed key hints (Fix, Cook and Eat, Traps,
  Barricade, hunger), as in Mission 1, re-readable on the pause menu's Controls page (§19). An
  objective line at the top reads "Prepare the house", then from the warning "Survive the herd: n
  left". The herd stays a surprise until the warning.
- **Start position** (user, 2026-11-25): Base 1 starts with each survivor on the tile and facing
  where Mission 1 was won. Both are saved (§18), so Continue uses them too. A tile now blocked falls
  back to the nearest free one.
- **Size** (user, 2026-11-25): the map is 64 × 64 (§16). Roamers scale up with it. The herd stays
  at 12 but starts farther out, so the warning gives more time.
- **Four survivors** (user, 2026-11-25, supersedes "stays at 12"): Base 1 starts with Cass, Eli, Ray
  and June (§5), each with hunger and a start tile from the end of Mission 1. The herd is **18**;
  starting food stays 5. Easy and Hard scale with it: herd 12 and 24 (Z81, Claude's choice: keep Easy < Normal < Hard; tell me if wrong). Ray and June start at (31, 47) and (32, 47) until Mission 1 hands them poses (Z82). Older saves with two survivors still load. The rain promised in the
  Mission 1 talk is Base 1's existing drizzle-to-rain (§20); no weather change.

- **Food is switched off** (user, 2026-11-25, supersedes **Hunger** and **Cook** above for the bases
  before Ray's hut): Base 1 and Base 2 are purely about defending against enemies. No hunger timers or
  meter, no stove, Cook, Eat or Give, and no hunger hint. The code stays in place, off by a base
  setting, for the hut, where food management first happens (§25). Fixing, barricades and traps stay.
  The "Prepare the house" objective, the herd and the win are unchanged. This also takes the hunger
  parts out of the Base 1 *Guidance* hints, the hunger meter on the action-bar portrait (§17) and the
  squad panel, the hunger option label (§19) and the hunger times per difficulty (§21), for these bases.
- **Food is hidden until the main camp** (user, 2026-11-26): no food mechanic shows anywhere before
  Ray's hut (§25), missions included: no food counter, no food in crate pops, no cooking keys in help
  or rebinding, no Well fed badge. Mission 1 crates still hold food, counted and saved unseen for the
  hut (Claude's reading of "hidden"; tell me if wrong).

## §13 Hold order (Commandos 2 ambush; renamed from "Watch" 2026-11-23, "Cover" clashed with cover tiles)
A survivor holds position facing a chosen direction with a visible view cone; any enemy that enters
the cone is attacked automatically. Works in the camp and on missions. Hotkey `V`, then click to set
the facing; any other order for that survivor ends it.

**Melee by default** (2026-11-23): Hold strikes only adjacent enemies with the melee weapon. A
per-survivor **Free fire** toggle (action-bar button and key) lets Hold use the gun too; it is off
by default so scarce, loud ammo is not spent by accident. Every survivor who has a gun gets the
toggle (Cass only once her gun unlocks at Base 1, §5).
**Bow on Hold** (user, 2026-11-25): Ray and June shoot the bow at enemies in the cone while they have
arrows (it is silent, so no Free fire needed); Free fire still adds the pistol; with no arrows left
they strike with melee as above.

**Cones** (user, 2026-11-25): selecting a survivor shows no cone. While aiming Hold, the cone
follows the pointer live from that survivor until the click sets the facing. Once set, the fixed
Hold cone stays visible for as long as the Hold lasts. Zombie cones are unchanged. **Icon:** a small
crouched figure aiming a pistol, with a pale cone fanning out in front (Codex, UI-kit style).

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
other characters may differ later. Traits (§5, 2026-11-25): Cass's run noise is 0; Eli runs at 6.5.

## §15 Story flow and Intro (2026-11-23)
New Game → **Intro** → **Mission 1** (§16) → **Base 1** (§12) → "To be continued...". The Intro is
the improvised woods camp (tent, fire) right after a fight, and doubles as the tutorial in 4 gated
steps, each waiting for the player: (1) select a survivor and left-click the ground to move, (2) Fighter knife
attack on a zombie, (3) Scout shoots a zombie (using scarce ammo), (4) Hold order (`V`) facing the
woods to stop a last zombie. Dialogue (§6) plays between steps: they are out of ammo and food and
must find a place to stay; the Scout has spotted a house in the woods. Crouch, takedown, lure and
carry are taught by short hints when Mission 1 starts.

**New start** (user, 2026-11-25, supersedes the step order above): Cass is alone at the camp; Eli is
away scouting. The game opens paused on Cass's monologue by the fire, 4–6 lines in her clipped
voice: Eli is overdue, there is no food, she has only the knife and the pistol is empty, she counts
exits and the daylight left, and there is a veiled hint about her brother (never named). Then:
(1) move Cass; (2) Cass knifes a zombie; (3) **rescue shot**: a second zombie closes on Cass and Eli
appears at the edge of the woods. The world freezes with it about 2 tiles from her until you
select Eli and shoot it. A dialogue follows (Eli brings the news of the house), then (4) Hold.
**Tutorial pause:** every step freezes the world while its hint shows. Camera, selection and weapon
switching still work. Only the order the hint asks for is accepted; time resumes once it is given.
**Size:** the map is 64 × 64; the camp stays the same size with more woods around it, and there are
no extra zombies.

## §16 Mission 1: the house in the woods (2026-11-23)
Stealth mission, zombies only. 32 × 32 woods with bushes and trees; a 2-room wooden house in the
middle with a **roof** that hides its interior (and anything inside) until a survivor enters, then
fades. 5 zombies: 2 inside the house, 3 wandering outside. 4 crates: food 3; ammo 3; scrap 4;
food 2 + ammo 2. **Win:** every zombie dead and every crate opened → short dialogue → Base 1 starts
on the same map. No extract zone. **Fail:** any survivor dies → restart (§8).
**Bigger map** (user, 2026-11-25, supersedes the counts above): 64 × 64 tiles (4× the area). The
house stays in the centre, plus a small shed and more bushes and cover. **10 zombies** and
**6 crates**; same win rule.
**The rescue** (user, 2026-11-25, between "win" and the Debrief): a non-interactive cutscene. Eli's
"one more out of the walls" line plays, then **6 zombies** walk out of the treeline toward Cass and
Eli and the camera follows them (`m01Ambush`). Arrows fly in from off-screen and kill them; Ray and
June walk in and the talk plays (`m01Rescue`, which replaced `m01Win` in Z82): introductions, Ray reads rain coming, and all
four agree to spend the night in the house. Then the Debrief, and Base 1 starts with four survivors
(§12). Esc skips a dialogue beat, not the kills. Mission 1 itself stays dry.

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

**Trimmed HUD** (user, 2026-11-25): no life bars over survivors' heads. The action bar no longer
shows the selected survivor's name and HP, only the actions. The squad card is the only health
display: the dialogue portrait (§6) and a health bar with no HP number. The bond technique button
and key are in §23.

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
code for later missions. 2026-11-25: the Base 1 save also holds each survivor's Mission 1 end tile
and facing (§12), and each scene's state holds whether the bond technique was used (§23).

## §19 Pause, options and feedback (2026-11-23)
- **Pause menu:** Esc opens it in Intro, Mission 1 and Base 1 (Esc first cancels a pending order;
  it does not open over a dialogue, §6): Resume, Restart, Options, Controls, Bios (§24), Quit to menu. Restart
  (also `R`) and Quit ask for confirmation. The game pauses when the window loses focus.
- **Options** (stored in `localStorage` key `deadwoods.options`): master, effects and ambience
  volume plus mute; edge scroll on/off; text size 100 / 125 / 150%; shape cues on/off (default on:
  `!` over a chasing zombie, `?` over an investigating one, a dash style per noise kind, a text
  label on the hunger meter); screen shake on/off (default on); **weather and fog** on/off
  (default on; turns off only the rain and fog particles, §20); **difficulty** (§21, "applies on
  restart"); key rebinding with reset to
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
- **One font** (user, 2026-11-25): every text drawn in code uses Special Elite, the dialogue font
  (§6). The painted title logo is unchanged. Small text gets bigger where needed to stay readable.
- **HUD:** Mission 1 shows the zombies left; the fail screen names who died and what killed them,
  and any key skips the wait.
- **Balance** (user, 2026-11-25): challenging but fair, judged by the user playing. No scripted
  balance bot or win-rate runs. Tuning edits data only.

## §20 Atmosphere (user, 2026-11-24; code only, looks only)
Art stays painted in overcast daylight, one version per asset (art/STYLE.md); mood comes from
code-drawn overlays that never change gameplay (cones, sight and noise stay as they are).
- **Dusk:** a tint over Base 1 that deepens from the 5:00 warning to the herd's arrival.
- **Light pools:** flickering warm glow at the Intro campfire and the Base 1 stove.
- **Fog:** low, slow, light fog drifting through the Intro and Mission 1, kept light so cones read.
- **Rain:** Base 1 only: drizzle from the 5:00 warning, building to steady rain with the herd; a rain
  layer in the code ambience (§6 *Audio*).
- The **Weather and fog** option (§19) turns off the rain and fog particles; dusk and light pools stay.
- **Visual pass (user, 2026-11-26; looks only, no map or balance change):** the camera starts at
  1.5× (the wheel still zooms out to 1×); every figure gets a code-drawn soft contact shadow (a flat
  dark ellipse at the feet, not a painted cast shadow); outside every 64 × 64 map a decorative
  forest border (tall trees and undergrowth, not walkable) fades into code fog, so there is no
  black void. Art rules: art/STYLE.md *Environment art* → *Visual pass*.

## §21 Debrief, records, difficulty, variety (user, 2026-11-24)
- **Debrief:** after Mission 1 and Base 1 (not the Intro), a kit panel after the win dialogue and
  before Base 1 or "To be continued...": time, silent kills, shots, damage taken, crates, grade and
  badges.
- **Grades:** Mission 1: **Ghost** (no shots, no damage taken), **Quiet** (at most 1 shot), **Loud**.
  Base 1: **Fortress** (no opening or barricade broken through, nobody under 50% HP), **Held** (won),
  **Scraped by** (won with someone starving or under 25% HP).
- **Challenges** (badges, earned on any difficulty, the badge shows it): Mission 1 **Silent** (no
  shots), **Untouched** (no damage), **Swift** (under 6 min); Base 1 **No breach** (no opening or
  barricade destroyed), **Well fed** (nobody ever starves), **Trapper** (5+ trap kills).
- **Records:** localStorage key `deadwoods.records`, separate from the save so New Game keeps them:
  best grade and best time per scene and difficulty, and badges. The main menu gets a Records page.
- **Difficulty:** Easy / Normal / Hard. Normal is today's tuning. Easy: herd 12, hunger 10 min, +2
  ammo each time Mission 1 or Base 1 starts or restarts, zombie sight 2 tiles (1 crouched). Hard:
  herd 24, hunger 6 min, roamers 6 at the start and at most 9 (Normal +25%, rescaled after Z77's
  5 and 7; user, 2026-11-25), one fewer ammo per Mission 1 crate that holds any. Changeable in
  Options at any time; it applies at the next scene start or restart (a herd checkpoint keeps its
  own), and a record is filed under that scene's difficulty. The Intro always plays on Normal.
- **Run shuffles:** 3–4 hand-made layouts per scene for crate contents and zombie start spots; a seed
  picks one at each new run or restart.

## §22 Barks and transitions (user, 2026-11-24)
- **Barks:** floating one-liners above the speaker's head for ~3 s, in Special Elite with a soft
  blip, never pausing; at most one every 20 s, each line at most once per scene; they follow the text
  size option. Eight triggers, 1–3 lines per survivor: low HP (<35%), first kill, zombie spotted
  close by, out of ammo, opening fixed, trap kill, the herd's first breach, and 20 s idle at the fire
  or stove (the only place for hints of Cass's brother and Eli's mum, never spelled out). Lines live
  in `data/story.json`; Claude drafts, the user approves.
- **Transitions:** a 0.6 s fade to black between scenes, then a 2 s location card over black, skipped
  by any key: "The woods — day 30", "The house in the woods — day 30, afternoon", "The house — day 30,
  evening" (wording approved with the barks). A loading bar on Boot.
- Not taken (2026-11-24): found notes, credits.

## §23 Bond technique (user, 2026-11-25)
A unique Cass + Eli move, **once per scene**, in Mission 1 and Base 1 (not in the Intro). Both must
be alive.
- **Aim:** the bond key (`J`, rebindable; `B` is Barricade) or its action-bar button, shown when
  either survivor is selected, starts aiming. A circle of radius 4 tiles follows the pointer and
  highlights up to the 3 zombies nearest its centre. The centre must be within 10 tiles of both
  survivors. Click starts it; right-click or Esc cancels. In Base 1, herd zombies can't be targeted.
- **Set piece, always succeeds:** the rest of the world freezes. Eli sprints past the marked zombies,
  they turn to chase him, and he runs off. Cass follows and kills each one silently from behind. It
  takes about 4–6 s, with a short camera follow and no noise. Afterwards Cass stands by the last
  body and Eli 3 tiles further on, both walking.
- The button then shows a "used" state until the next scene or restart. It is taught by a hint and a
  short Cass/Eli exchange at the start of Mission 1. Icon (Codex): two figures back to back.

## §24 Bios (user, 2026-11-25)
A **Bios** page: one tab per survivor met so far, with a full-body figure and their story up to now.
- **Where:** a Bios button in the pause menu (story up to that moment) and on the title screen (story
  up to the save's progress; hidden when there is no save).
- **Who:** survivors only (no zombies, no people only mentioned in dialogue). A tab appears when the
  survivor **joins the squad**: Cass at the Intro start, Eli at his Intro arrival, Ray and June when
  Base 1 starts. Survivors not met yet are not shown at all (no "???" tabs). Tabs in join order.
- **Story:** a **background** paragraph (third person, a neutral squad file: age, past job, home, how
  the outbreak found them), then one **entry per story beat reached**, first person in the
  character's own voice: Intro, Mission 1 start, the rescue, Base 1, the herd checkpoint (herd
  warning), surviving the herd. Fixed authored text, no live stats. A character has entries only
  for beats they lived through.
- **Dakota names (user, 2026-11-25):** Ray's and June's Dakota names and their English meanings are
  shown in the header of their bios, on a line under the name and age (*Tahca Wanyaka*, "Sees the
  Deer"; *Wakpa Win*, "River Woman"), not in the background text. They stay unverified placeholders until a Dakota speaker checks them. Everywhere else the
  UI keeps "Ray" and "June".
- **Secrets stay out** (Cass's brother, Eli's mum), in the background and the entries alike, until a
  future scene reveals them; then that scene's beat gets an entry that says it.
- **Image (user, 2026-11-25, replaces the crop plan):** until final, the in-game `idle_se_0` frame
  scaled up with nearest-neighbour. Codex **generates new** `bio_<kind>` figures, all four in the
  same detailed style as the A14 Ray and June sources, with the same quality and detail.
  Three-quarter front (the `idle_se` facing), neutral stand, hands empty, on a transparent
  background. **No pistol or holster on the chest in the bio images**: the character design and the
  in-game sprites keep it. Heights follow one shared scale from the character cards (Ray and Eli
  180 cm, Cass 170, June 165 and visibly younger), shown at 1:1 on a shared baseline.
- **Layout:** tabs across the top (small portrait + name), the figure card on the left half, on the
  right name and age, past role, trait line, then the scrolling story (mouse wheel). Click or ←/→
  switches tabs; Esc or the X closes. Field-kit panels and Special Elite (§19).
- **Text approval:** Claude drafts all text under each card in `DESIGN-characters.md`; the user
  approves it before it goes into the game.
- **Future survivors** get a bio to the same standard: the checklist *Adding a character with a bio* in
  `DESIGN-characters.md` and *Bio figures* in `art/STYLE.md`.
- **Theo** (2026-11-25): his tab appears when the bunker door opens (§25), not at his first speaker line.
  His entries are `bunker` (the door opens), `base2` (Base 2 starts) and `hut` (arrival at Ray's hut).

## §25 Mission 2, Base 2 and Ray's hut (user, 2026-11-25)
The story after Base 1 (§12). Base 1's "To be continued..." ending (§15, §18) is replaced by this flow
when it is built (PLAN Z100): Base 1 → **Mission 2** → **Base 2** → **Ray's hut**.
- **Why they go:** after Base 1 the group is short on food and ammo. Ray remembers that Theo, his
  daughter's maths tutor, mentioned a prepped house in the woods during the video lessons. Cass agrees
  a prepper's house should have supplies. They find squatters in it.
- **Theo and Ray** (card in `DESIGN-characters.md`): Ray hired Theo to teach June maths over video. Ray
  and June know his voice and face on a screen and have never met him in person. Ray recognises the
  voice on the speaker and vouches for him; the first meeting in person is at the bunker door.
- **Mission 2: Theo's house** (stealth): **8 or more** hostile human squatters, in and around a rich
  man's prepped house; no talking and no sparing. The number of zombies outside is open (PLAN Z92).
  Theo is sealed in the bunker with the power off, because the squatters broke his **solar device**. He
  is a **voice on a speaker, not playable**: the squad stays Cass, Eli, Ray and June. He asks for help
  and tells them where the guards are, and the enemy highlight (§5) works from his first line.
  **Complete when every squatter is down.** The bunker door then opens and Theo walks out, ready to go
  because he is out of food, and joins the squad. The bunker holds his weapons cache and building
  materials: a batch of **ammo and scrap**, **no food**, added to the shared pools.
- **Base 2: Theo's house** (defence only, no food, §12): **3 waves** from different sides, each larger
  than the last, with about a minute to repair and set traps between waves. A checkpoint before each
  wave; fail → **Retry from the wave** or **Restart Base 2**, as Base 1. The waves are **human
  scavengers**, the squatters' gang returning: they advance on the house and shoot, and are stopped by
  barricades (they do not chew). Their gunfire draws a few zombies. When wave 3 is cleared, a dialogue:
  the house attracts too much attention, and Ray offers his hut. Then **straight to the hut**, with no
  journey scene.
- **Ray's hut:** a hand-built hunting shack, far from everything. Ray kept it secret because he did
  not know Cass and Eli, and offers it only now that the group has proved itself. A practical shelter;
  nothing sacred in it. It is the **main camp for the rest of the game, and every base scene from then
  on happens there.** **All food management happens for the first time there** (the code kept dormant
  in §12). Its map and all camp mechanics are detailed later, in their own grilled unit (PLAN *Hut
  grill*); nothing is built before it.
- **Open:** how Rig works with Base 2 traps (Z91). Mission 2's detail is §26.

## §26 Mission 2 detail (user, 2026-11-26, Z92)
Fills in §25's Mission 2. Win, fail and checkpoint rules are as §25 and §8.
- **Map:** **80 × 80** woods. In the centre a **fenced estate** with a gate: a large single-storey
  house (about 22 × 16, 5–6 rooms under one roof that hides the inside until a survivor enters, as
  §16), with the **bunker door** in a concrete room inside; a **garage** and a **generator shed** in
  the yard; the **solar field** (the broken solar device: panels and an inverter box) beside the house.
  Woods, bushes and cover all round for the approach. Base 2 (§25) uses the same map.
- **Start:** Cass, Eli, Ray and June together at the **south edge**, out of every guard's sight. The
  "why they go" talk (§25) plays at the end of Base 1; Mission 2 opens straight into play with
  one-line hints for Ray and June's moves.
- **Squatters: 12,** the existing human enemy (§7): **6 outside** on posts and patrols (the gate, the
  fence line, the garage, the solar field), **6 inside** the house (one hammering at the bunker door).
  Patrol routes cross so the squad must time them.
- **Zombies: 6** wandering the woods outside the fence, none inside the estate. Noise draws them as usual.
- **Zombies and squatters fight.** A zombie treats a squatter as it treats a survivor (sight §7,
  chase, attack). A squatter shoots a zombie in its cone. Shots make noise as usual, and anything that
  hears it goes to check. A squatter killed by a zombie counts as down for the win and **rises as a
  zombie 30 s later** (an ordinary zombie, not needed for the win) unless finished. The body shows a
  faint countdown so the player can tell which bodies will rise.
- **Finish** (new action): stops such a body from rising. **Ray and June** finish from range with one
  arrow (spent as a normal shot). **Everyone else** holds 2 s adjacent to the body in the crouch pose
  (no new figure art). Aiming Finish at anything that is not a dead squatter yet to turn shows the
  mouse pointer with a **red cross** on top. A finished body stays a body (guards still notice it).
- **Theo on the speaker** (a battery intercom by the gate and inside the house): bark-style subtitles
  that do not pause the game, each once: (1) a survivor first comes within about 12 tiles of the
  fence: he calls for help, Ray knows the voice, and the enemy highlight (§5) turns on; (2) a tip
  naming where the guards are (gate, fence, garage, solar field, inside); (3) a survivor enters the
  house: where the inside squatters stand; (4) half the squatters are down; (5) the last one down →
  the door scene. Exact lines are written later and need the user's approval (§6).
- **Solar device:** story only. Seen on the map and mentioned by Theo; nothing to do in play.
- **Door scene** (after the last squatter is down; Esc skips a dialogue beat, as §16): the camera goes
  to the bunker door; Theo talks them through the backup power on the speaker; the door opens and he
  walks out. Talk: Ray and Theo meet in person for the first time, June greets her tutor, Theo is out
  of food and comes along. Then the Debrief, then Base 2.
- **Loot:** **no crates.** The bunker cache adds **ammo 12 and scrap 12** (placeholders; the user
  judges by playing) to the shared pools, shown on the Debrief. No food (§25).
- **Art needed** (Codex): squatter figure sheets (the human enemy is a grey stand-in today), a
  turned-squatter zombie sheet, the Finish red-cross pointer, and the estate props (fence, gate,
  garage, generator shed, solar panels and inverter, intercom, bunker door, concrete room, the rich
  house's walls, roof and furniture).
