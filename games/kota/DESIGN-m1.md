# Kota milestone 1 spec (B1): DRAFT, waiting for the user's approval

Written by Claude (Opus) on 2026-11-18 for [PLAN.md](PLAN.md) task B1, from the settled decisions in
[DESIGN.md](DESIGN.md). Every C task builds from this file without new design questions. Numbers are
starting values for C8 to tune. Tags: **📖** a real-culture element with its [CULTURE.md](CULTURE.md)
entry (reference, not binding) · **🎮** invented game content. Claude's limits (PROMPTING.md
*Standing rules*) apply throughout.

**Your decisions in this review:** approve the spec (or edit any section). Also, the two elder texts
in §13 are still DRAFT (CULTURE.md *Needs review* 25); they stay unpublished until you approve them.

## 1. World, camera and units

- Units are world pixels. The arena is **1600 × 1200**, bounded by a soft painted edge (the hero and
  threats cannot leave it). No obstacles in milestone 1; props are decoration only.
- The camera follows the hero, clamped to the arena, and shows **640 world px of height** (zoom = screen
  height / 640), so the hero (drawn 64 px tall) is about 40 CSS px tall on a 390 px phone.
- Phaser runs at 60 fps with a fixed 1/60 s logic step; cap 90 living threats and 80 projectiles
  (object pools).

## 2. Stats and formulas

Hero stats (all start at 0 unless given; a hero's twist and items change them). Shown in the shop's
stats panel with the names in brackets.

| Id | Shown as | Base | Effect |
|---|---|---|---|
| `maxHp` | Health | 15 | maximum health; the hero is **fully healed at the start of every wave** |
| `regen` | Mending | 0 | r > 0 heals 1 HP every 6 / r seconds |
| `melee` | Melee | 0 | flat damage added to melee weapons × their melee scaling |
| `ranged` | Ranged | 0 | flat damage added to ranged weapons × their ranged scaling |
| `dmgPct` | Damage % | 0 | all damage × (1 + dmgPct / 100) |
| `atkSpdPct` | Attack speed % | 0 | cooldown ÷ (1 + atkSpdPct / 100); the factor never goes below 0.5 |
| `critPct` | Crit % | 0 | added to each weapon's crit chance |
| `range` | Range | 0 | added to every weapon's range (px); ranged and thrust weapons get the full value, swings half |
| `armour` | Armour | 0 | damage taken × 15 / (15 + armour); negative armour (down to −10) raises it |
| `dodgePct` | Dodge % | 0 | chance to take no damage from a hit; capped at 60 |
| `speedPct` | Speed % | 0 | move speed = 220 px/s × (1 + speedPct / 100), never below 110 |
| `luck` | Luck | 0 | raises rarity chances (§7) and food drops (§6) |
| `gather` | Gathering | 0 | at the end of each wave gain `gather` embers and experience; then gather grows 5% (rounded) |
| `pickupRange` | Reach | 0 | pickup magnet radius = 80 px + pickupRange |

- **Damage** of a hit = max(1, round((weapon damage + scaling × melee-or-ranged) × (1 + dmgPct/100))),
  then × the weapon's crit multiplier on a crit.
- **Damage taken** = max(1, round(hit × 15 / (15 + armour))) unless dodged. After any hit the hero is
  untouchable for **0.5 s** (the sprite flashes).
- Threats deal **contact damage** when they touch the hero; each threat can hurt the hero at most once
  per 0.8 s.

## 3. Controls and Ash Wolf

- **Stick:** floating, either side (left-handed swap). **Dash** and **ability** buttons on the other side.
- **Dash:** 170 px in 0.18 s in the stick direction (or facing), untouchable for 0.25 s, cooldown
  **3 s**, 1 charge. Passes through threats.
- **Ash Wolf** 🎮 (the first hero; look in [her brief](art/briefs/hero_dakota_woman.md)):
  - **Starting weapon:** stone axe (tier I).
  - **Twist "Close fighter":** +2 Melee, +5 Speed %, −30% damage with ranged weapons (applied to their
    final damage).
  - **Ability "Ash circle":** she strikes the ground and a ring of ash bursts out to 200 px: each threat
    in it takes 10 + 100% Melee damage and is knocked back 140 px; she is untouchable for 0.5 s.
    Cooldown **12 s** (not reduced by attack speed). No voice or cry sound: a deep thud and a rush of air.

## 4. Weapons (6; tiers I–IV)

Up to **6 weapons**, each shown hovering around the hero in a ring (radius 44 px, evenly spaced).
Each weapon aims on its own at the **nearest threat within its range** and fires when its cooldown is
ready; with no threat in range it rests. Behaviours:
- `swing`: an arc toward the target (hits every threat in the arc and range; the sprite sweeps).
- `thrust`: a line toward the target (hits every threat along it, up to the range).
- `shoot`: a projectile toward the target (stops at the first threat unless it pierces).
- `lob`: a projectile arcing to the target's position, bursting in a radius; may set threats burning.

| Id | Name | Kind | Tags | Damage I/II/III/IV | Cooldown s | Range | Other | Scaling | Price I |
|---|---|---|---|---|---|---|---|---|---|
| `stone_axe` 📖 | Stone axe | swing 100° | melee | 10 / 15 / 22 / 32 | 1.10 / 1.00 / 0.90 / 0.80 | 110 | crit 5% ×1.5; knock 30 | melee 1.0 | 15 |
| `bow` 📖 | Bow | shoot | ranged | 7 / 10 / 15 / 22 | 0.90 / 0.85 / 0.80 / 0.70 | 420 | crit 5% ×2; pierce 0/0/1/1; speed 900 | ranged 1.0 | 15 |
| `beaded_knife` 📖 | Knife in a beaded case | thrust | melee | 5 / 7 / 10 / 15 | 0.50 / 0.46 / 0.42 / 0.36 | 90 | crit 25/30/35/40% ×2 | melee 0.8 | 12 |
| `lacrosse_stick` 📖 | Netted lacrosse stick | swing 180° | melee | 6 / 9 / 13 / 19 | 1.20 / 1.10 / 1.00 / 0.90 | 130 | knock 90 | melee 0.6 | 14 |
| `bone_spear` 🎮 | Bone-tipped spear | thrust | melee | 12 / 18 / 26 / 38 | 1.40 / 1.30 / 1.20 / 1.05 | 180 | crit 10% ×1.5 | melee 1.0 | 18 |
| `ember_sling` 🎮 | Ember sling | lob | ranged | 8 / 11 / 16 / 24 | 1.60 / 1.50 / 1.40 / 1.25 | 380 | burst radius 60/65/70/80; burn 3/4/6/8 per s for 2 s | ranged 0.6 | 20 |

- 📖 stone axe, bow and knife in a beaded case: CULTURE.md *May show* (tools); netted lacrosse stick:
  item 19 (a plain stick, **no ball ever shown**).
- **Prices:** tier II = 2×, tier III = 4×, tier IV = 7.5× the tier I price, then × the wave factor (§7).
- **Merging:** two weapons with the same id and tier merge into one of the next tier (max IV). In the
  shop, tap a weapon in your row and pick *Merge* when it has a pair. Buying a weapon with all 6 slots
  full is allowed only when it merges at once with one you carry.
- **Selling:** 40% of its current shop price (rounded down).
- **Burn:** a burning threat takes the burn damage each 0.5 s (half per tick); a new burn refreshes
  the time and keeps the higher damage.

## 5. Items (16)

Items stack (buy the same one again to add it again) unless marked *max n*. Rarity: **common**,
**uncommon**, **rare** (none legendary in milestone 1). All are 🎮 inventions except where 📖 shows.

| Id | Name | Rarity | Price | Effect |
|---|---|---|---|---|
| `dried_meat` 📖 | Dried meat | common | 12 | +3 Health |
| `maple_cake` 📖 | Maple-sugar cake | common | 14 | +2 Mending |
| `sinew_string` | Sinew bowstring | common | 15 | +2 Ranged |
| `whetstone` | Whetstone | common | 15 | +2 Melee |
| `wristguard` | Bead-banded wristguard | common | 16 | +6 Attack speed % |
| `light_moccasins` | Light moccasins | common | 15 | +8 Speed %, −1 Armour |
| `rawhide_pouch` 📖 | Rawhide pouch | common | 18 | +5 Gathering, +20 Reach |
| `squirrel_nuts` 📖 | A squirrel's nuts | common | 12 | +10 Luck |
| `rice_kettle` 📖 | Kettle of wild rice | common | 16 | food heals +2; *max 3* |
| `hide_plate` | Hardened-hide plate | uncommon | 30 | +3 Armour, −3 Speed % |
| `smoke_cloak` | Smoke-dark cloak | uncommon | 30 | +6 Dodge % |
| `tracking_stick` | Tracking stick | uncommon | 28 | +40 Range, +3 Crit % |
| `ember_stone` | Ember stone | uncommon | 34 | hits have a 15% chance to set threats burning (3 per s for 2 s); *max 1* |
| `long_snowshoes` 📖 | Long snowshoes | uncommon | 32 | +10 Speed %; shallow water does not slow you; *max 1* |
| `hide_shield` | Painted hide shield | rare | 60 | +4 Armour, +5 Dodge %, −8 Attack speed % |
| `campfire_ash` | Ash of the camp fire | rare | 55 | +10 Damage %, −3 Health |

📖 sources: dried meat, maple sugar, wild rice (CULTURE.md *May show*, food; item 21); rawhide pouch
(item 19, parfleche); nuts as food (item 18, squirrel); snowshoes (item 19). The shield and its paint
are invented: a plain painted hide with no real symbol.

## 6. Threats (5)

Threats spawn at **spawn marks** that appear 0.8 s before (a faint ring; at least 260 px from the hero).
They chase the hero unless their behaviour says otherwise; they push softly apart so they do not stack.
Stats grow each wave: `hp = hp0 + hpPerWave × (wave − 1)`, the same for damage. On death a threat
drops `value` embers (each ember is 1 experience + 1 money) and, with a **3% chance (+ luck/10 %)**,
one food (heals 3 HP; drawn as wild rice, a maple-sugar cake or berries 📖).

| Id | Kind | hp0 / per wave / per wave² | Contact dmg / per wave / per wave² | Speed | Value | Behaviour | First wave |
|---|---|---|---|---|---|---|---|
| `frost_wisp` 🎮 | winter | 4 / 1.8 / 0.1 | 1 / 0.3 / 0.03 | 120 | 1 | chaser; a hit slows the hero 30% for 1 s; floats (ignores water) | 1 |
| `blight_swarm` 🎮 | sickness | 2 / 0.9 / 0.05 | 1 / 0.2 / 0.015 | 165 | 1 (60% chance) | spawns as a cluster of 5 on one mark | 2 |
| `hunger_shade` 🎮 | hunger | 10 / 3.6 / 0.2 | 2 / 0.35 / 0.04 | 95 | 2 | tough chaser; a hit stops Mending and halves food healing for 3 s | 3 |
| `sleet_spirit` 🎮 | winter, ranged | 6 / 2.2 / 0.12 | 1 / 0.25 / 0.02 (shard) | 100 | 2 | keeps 300–420 px from the hero; every 2.4 s winds up 0.6 s (a thin line shows the aim) and fires a shard (260 px/s, 3 s life); no contact damage; floats | 4 |
| `gnawing_hollow` 🎮 | hunger, burrower | 14 / 4.5 / 0.25 | 2 / 0.4 / 0.03 (bite) | 140 under ground | 3 | under ground 2.0 s (only a ripple shows; cannot be hit) and swallows any embers or food it passes; then surfaces under the hero's position (0.8 s ring, radius 50) and bites; stays up 2.0 s, then sinks; **beaten, it releases everything it swallowed** | 7 |

*C8 tuning (2026-11-19):* hp and damage are `base + per wave·(w−1) + per wave²·(w−1)²` (the third number is optional); waves 7–9 carry fewer gnawing hollows (6, 6, 11) and wave 9 is 4 per 0.9 s.

## 7. Waves, pickups, level-ups and the shop

**Wave length:** wave n lasts min(20 + 5·(n − 1), 60) s (waves 9–19: 60 s). **Wave 10** also holds
Double-Face; **wave 20** has no timer and ends when Iya falls.

| Wave | Spawn every (s) | Group | Mix (percent of groups) |
|---|---|---|---|
| 1 | 1.6 | 2 | wisp 100 |
| 2 | 1.5 | 2 | wisp 80, swarm 20 |
| 3 | 1.4 | 3 | wisp 60, swarm 25, shade 15 |
| 4 | 1.3 | 3 | wisp 50, swarm 20, shade 20, sleet 10 |
| 5 | 1.2 | 3 | wisp 40, swarm 25, shade 25, sleet 10 |
| 6 | 1.2 | 4 | wisp 35, swarm 25, shade 25, sleet 15 |
| 7 | 1.1 | 4 | wisp 30, swarm 20, shade 25, sleet 15, hollow 10 |
| 8 | 1.0 | 4 | wisp 30, swarm 20, shade 25, sleet 15, hollow 10 |
| 9 | 1.0 | 5 | wisp 25, swarm 20, shade 25, sleet 15, hollow 15 |
| 10 | 1.5 | 4 | as wave 9; **Double-Face** spawns at 3 s |
| 11–13 | 0.95 | 5 | wisp 20, swarm 20, shade 25, sleet 20, hollow 15 |
| 14–16 | 0.85 | 6 | wisp 15, swarm 25, shade 25, sleet 20, hollow 15 |
| 17–19 | 0.75 | 7 | wisp 15, swarm 25, shade 25, sleet 20, hollow 15 |
| 20 | 2.5 | 3 | wisp 50, swarm 50; **Iya** spawns at 2 s |

- **Pickups:** embers fly to the hero inside the Reach radius. When a wave ends, every ember still on
  the ground flies to the hero.
- **Experience:** reaching level L + 1 needs (L + 3)² experience in total for that level (level 1 → 2
  needs 16). Level-ups earned in a wave are picked one by one after it ends.
- **Level-up (helpers):** 4 offers from 4 different helpers in the pool; each helper offers one of its
  stats (§8) at a tier: I always possible; II from level 5, III from level 10, IV from level 15, with
  chance tier II 30%, III 15%, IV 5% when unlocked, each × (1 + luck/100), checked IV → I.
- **Shop ("the makers' fire")** after the level-ups: **4 offers**, each a weapon (35%) or an item (65%).
  - **Wave price factor:** × (1 + 0.25 · (wave − 1)), rounded.
  - **Weapon tier** offered: I; II from wave 4; III from wave 8; IV from wave 12 (chances like the
    level-up tiers, by wave instead of level).
  - **Item rarity:** uncommon chance = min(40%, 4% × (wave − 2)) × (1 + luck/100); rare chance =
    min(25%, 2% × (wave − 5)) × (1 + luck/100); otherwise common.
  - **Reroll:** the first costs wave + 1 embers (at least 2), each further reroll in the same shop +1.
  - **Lock:** a locked offer stays for the next shop at its old price.
  - The panel shows the hero's stats and weapons (sell, merge). *Next wave* starts the next wave.

## 8. Helpers (level-up offers)

Each helper offers one of its two stats (picked at random). Values per tier I / II / III / IV:
Health 3/6/9/12 · Mending 2/3/4/5 · Melee 1/2/3/4 · Ranged 1/2/3/4 · Damage % 5/8/12/16 ·
Attack speed % 5/10/15/20 · Crit % 3/5/7/9 · Range 15/30/45/60 · Armour 1/2/3/4 · Dodge % 3/6/9/12 ·
Speed % 3/6/9/12 · Luck 5/10/15/20 · Gathering 5/8/10/12 · Reach 20/30/40/50.

| Id | Helper 📖 | Stats | Line on the card (light, wry) | Pool |
|---|---|---|---|---|
| `skiska` | Skiska the duck | Dodge %, Luck | "Keep one eye open." | start |
| `patkasa` | Patkasa the turtle | Armour, Health | "Slow is not the same as beaten." | start |
| `muskrat` | The muskrat | Speed %, Reach | "I won that race. Ask anyone." | start |
| `coyote` | The coyote | Crit %, Attack speed % | "Roll first. Think after." | start |
| `manstin` | Manstin the rabbit | Ranged, Range | "Aim for the heart." | start |
| `youngest_bear` | The youngest bear | Mending, Melee | "There is always enough to share." | start |
| `wabeda` | Wabeda the dog | Reach, Armour | "Something is coming. I'll tell you." | camp: Wabeda by the fire |
| `mink` | The mink | Attack speed %, Damage % | "Break the hunt before it starts." | camp: Canoes on the shore |
| `water_snake` | The water snake | Damage %, Range | "Slip in. Slip out." | camp: Canoes on the shore |

📖 helpers: CULTURE.md *May show* (Zitkala-Ša) and item 18; their stats and lines are 🎮.

## 9. Double-Face (wave 10 elite) 📖 item 17a, mechanics 🎮

- A tall gaunt male giant with a face in front and a face behind, a hide bundle (the stolen child) at
  his hip (never a woman, never one beautiful and one ugly face, so he is not Anog-Ite; the child is
  never hit or hurt). HP **2400** (fixed), speed 110, contact damage 4.
- **Two faces:** every 3 s he winds up 0.8 s and swipes **in front and behind** (two 120° arcs, 140 px,
  6 damage). His **sides are safe**. He turns at 90°/s.
- **The lure:** every 8 s he beckons for 1.5 s: the hero is pulled toward him at 90 px/s unless dashing.
- **Through the heart:** ranged weapons do ×1.5 to him, melee ×0.85.
- **Below 50%:** one false double (dies to any hit, same look without the bundle, half damage, made again
  6 s after it dies); the two swap places every 6 s.
- **Beaten:** the bundle is set down: *"The child is free. He will grow up among the people."* He drops
  30 embers, and the next shop adds a fifth offer: **a free item** (1 of 3 shown, rarity at least
  uncommon). If wave 10's timer ends first, he leaves the arena (no reward).

## 10. Iya, the Camp-Eater (wave 20 boss) 📖 CULTURE.md *May show*, mechanics 🎮

- A huge heavy earth-brown giant on thin legs. HP **22000** (fixed), speed 90, contact damage 5.
  The sky starts at night and **brightens toward dawn as his health falls** (the story: his thin legs
  fail him at dawn).
- **Lunge:** winds up 1.0 s (a line shows the path), then rushes 300 px (8 damage on the way).
- **Swallow:** every 9 s winds up 1.0 s, then a cone (90°, 260 px) pulls the hero in for 1.0 s; ending
  within 70 px means being swallowed: hidden 1.5 s, 6 damage, then spat out to a clear spot.
- **Below 50% (dawn rising):** speed × 0.6, recovery × 1.6, takes ×1.3 damage, legs falter (the sprite
  sways; his *helpless* pose shows during recoveries).
- **Beaten:** *"Iya falls at dawn, and the swallowed people step out into the light."* The run is won.

## 11. Run, camp and goods

- **A run:** the camp → choose the place (unlocked arenas) → waves 1–20 → win, or fall and be carried
  home.
- **Goods** at the end of a run: 1 per wave cleared, +3 for beating Double-Face, +8 for beating Iya.
- **Camp upgrades** (permanent, bought with goods):

| Id | Name | Cost | Effect |
|---|---|---|---|
| `maple_grove` 📖 | Maple-sugar grove | 4 | food heals +1 and drops 1% more often |
| `wabeda_fire` 📖 | Wabeda by the fire | 5 | Wabeda the dog joins the helpers |
| `practice_ground` 📖 | Practice ground | 6 | every run starts with +1 Melee and +1 Ranged |
| `shore_canoes` 📖 | Canoes on the shore | 8 | the **lakeshore** arena unlocks; the mink and the water snake join the helpers |

  📖 maple-sugar groves, archery games and the practice ground, the lakeshore and birch canoes: CULTURE.md
  *May show* and item 20; Wabeda, the mink and the water snake: item 18.
- **Elder stories** in the camp: Iya (after meeting Iya) and Double-Face (after meeting him); texts §13.
- **Camp screen:** title *Camp in Cansa'yapi* with *"Cansa'yapi: where they marked the trees red (the
  Minnesota River Valley)."* 📖 (CULTURE.md *May show*, place names), options *Begin a run*, *Camp*
  (upgrades), *Elder* (when a story is open), *Settings*. Runs, wins, best wave and goods shown.

## 12. Arenas (2)

| Id | Name | Ground and props | Twist |
|---|---|---|---|
| `prairie` 📖 | Prairie before dawn | sage grey-green ground, a few sage bushes and willow (decoration) | **Wind:** every 20 s a 3 s gust pushes the hero and all threats 40 px/s one way; grass sways and an arrow shows it 1 s before |
| `lakeshore` 📖 | Lakeshore | moss and mud ground, reeds and a beached birch canoe (decoration) | **Shallow water** along the top quarter of the arena: walkers move × 0.7 (wisps and sleet spirits float; long snowshoes ignore it) |

📖 CULTURE.md *May show*: Minnesota River Valley region (lakes, prairie with sage and willow); item 20.
On the first wave of a run a banner shows **Mni Sota Makoce** with *"the land where the waters reflect
the sky"* 📖 (place names), then the arena name.

## 13. Text

- **Fall screen "Carried home":** *"You are carried back to camp to rest."* Waves cleared, goods earned,
  threats beaten; *Return to camp*.
- **Win screen "The camp walks out freed":** the Iya line from §10, the run's numbers; *Return to camp*.
- **Elder: "Iya, the Camp-Eater"** (as in the old game's camp.json, credit *From Zitkala-Ša, Old Indian
  Legends (1901).*):
  > Iya came to a camp disguised as a baby, and from inside the camp he swallowed it. A young mother
  > noticed the strange sounds the baby made, and the people slipped away at midnight. At dawn Iya
  > chased them, but his thin legs could not carry his great body, and warriors with long knives
  > brought him down. The whole camp walked out of him, free.
- **Elder: "Old Double-Face"** (DRAFT, NR 25; credit *From Zitkala-Ša, Old Indian Legends (1901), and
  Charles Eastman (Ohiyesa) with Elaine Goodale Eastman, Wigwam Evenings.*):
  > Old Double-Face was a giant with a face in front and a face behind, so no one could creep up on
  > him. He lured children away from the camps. Once he carried off a baby boy and kept him far from
  > his people. Manstin the rabbit hid behind a sage bush and shot him through the heart. The boy was
  > free, and he grew up to be a young man.
- **Hints** (first runs, skippable, saved as `kota.v2.hints`; same banner rules as the carried
  `hints.js`):

| Id | When | Text |
|---|---|---|
| move | first wave starts | Drag on either side to move. |
| weapons | 2 s later | Your weapons strike on their own. Stay close enough for them to reach. |
| dash | first time the hero is hit | Tap dash to roll through threats. |
| ability | first time the ability is ready in a fight | Ash circle knocks back everything around you. |
| embers | first ember dropped | Gather embers: they fill your bar and trade at the makers' fire. |
| food | first food dropped | Walk over food to heal. |
| levelup | first level-up screen | A helper from the stories offers to help. Choose one. |
| shop | first shop | Buy weapons and items. Lock an offer to keep it; reroll for new ones. |
| merge | first time two matching weapons are carried | Two of the same weapon merge into a stronger one. |
| double_face | Double-Face appears | He strikes in front and behind. Stay at his sides, and trust your ranged weapons. |
| iya | Iya appears | Watch for his lunge and keep out of his swallow. He weakens as dawn comes. |
| carried | first fall | You are carried home. Goods you earned stay with the camp. |

## 14. HUD and screens

- **HUD:** health bar (top left), experience bar under it with the level, embers (top left, below),
  wave number and timer (top centre), boss bar (top centre, under the timer), *Settings* (top right),
  dash and ability buttons with cooldown fill.
- **Screens:** Camp, Choose place, Level-up (4 helper cards), Shop (4 offers, lock and reroll,
  weapons row with sell and merge, stats panel, *Next wave*), Fall, Win, Elder, Settings (sound,
  left-handed, shake, quality, hints). All buttons are at least 48 px tall.

## 15. Data files (shapes)

All in `game/data/`. Ids are lowercase with underscores; sprite ids match (art/PIPELINE.md).

```js
// rules.json
{ "arena": [1600, 1200], "viewHeight": 640, "hero": { "speed": 220, "iframes": 0.5,
  "dash": { "distance": 170, "time": 0.18, "iframes": 0.25, "cooldown": 3 } },
  "pickup": { "baseReach": 80 }, "food": { "chance": 0.03, "heal": 3 },
  "caps": { "threats": 90, "projectiles": 80 }, "weaponSlots": 6, "sellRate": 0.4,
  "tierPriceMul": [1, 2, 4, 7.5], "waveCount": 20 }
// heroes.json
[{ "id": "ash_wolf", "name": "Ash Wolf", "startWeapon": "stone_axe",
   "stats": { "melee": 2, "speedPct": 5 }, "rangedFinalMul": 0.7,
   "ability": { "id": "ash_circle", "radius": 200, "damage": 10, "meleeScale": 1.0, "knock": 140,
     "iframes": 0.5, "cooldown": 12 } }]
// weapons.json
[{ "id": "stone_axe", "name": "Stone axe", "kind": "swing", "arc": 100, "tags": ["melee"],
   "tiers": [ { "damage": 10, "cooldown": 1.1, "range": 110, "crit": 0.05, "critMul": 1.5, "knock": 30 }, … ],
   "scaling": { "melee": 1.0 }, "price": 15 }]
// items.json
[{ "id": "hide_plate", "name": "Hardened-hide plate", "rarity": "uncommon", "price": 30,
   "stats": { "armour": 3, "speedPct": -3 }, "max": null, "special": null }]
// helpers.json
[{ "id": "muskrat", "name": "The muskrat", "stats": ["speedPct", "pickupRange"],
   "line": "I won that race. Ask anyone.", "requires": null }]
// helperValues.json  { "maxHp": [3, 6, 9, 12], "regen": [2, 3, 4, 5], … }
// threats.json
{ "frost_wisp": { "name": "Frost wisp", "hp": [4, 1.8, 0.1], "damage": [1, 0.3, 0.03], "speed": 120, "value": 1,
   "behaviour": "chaser", "onHit": { "slow": 0.3, "time": 1 }, "floats": true, "size": 18 }, … }
// waves.json
[{ "wave": 1, "every": 1.6, "group": 2, "mix": { "frost_wisp": 100 } }, …,
 { "wave": 10, "every": 1.5, "group": 4, "mix": { … }, "elite": { "id": "double_face", "at": 3 } },
 { "wave": 20, "every": 2.5, "group": 3, "mix": { … }, "boss": { "id": "iya", "at": 2 }, "timer": false }]
// arenas.json
[{ "id": "prairie", "name": "Prairie before dawn", "ground": "prairie_ground", "props": ["sage_bush", …],
   "twist": { "kind": "wind", "every": 20, "time": 3, "push": 40, "warn": 1 }, "requires": null },
 { "id": "lakeshore", …, "twist": { "kind": "water", "rect": [0, 0, 1600, 300], "mul": 0.7 },
   "requires": "shore_canoes" }]
// camp.json: upgrades (id, name, cost, text, mods or adds), stories (id, when, title, text, credit)
```

- **Save:** `kota.v2.camp` = { goods, built: [], met: [], runs, wins, bestWave } and `kota.v2.hints`.
  Settings keep the carried `kota.settings` key. Old `kota.*` keys from the 3D game are ignored.
- **Debug hook** (`?debug`): `window.kota` with `step(dt)`, `setWave(n)`, `give(id)`, `killAll()`,
  `state` (stats, weapons, embers, wave), so a scripted run can be stepped in the 2 fps test browser.

## 16. What each C task reads

| Task | Sections |
|---|---|
| C1 Phaser skeleton | §1, §3 (controls, dash), §14 (HUD frame), §15 (rules, save, debug) |
| C2 waves, threats, pickups | §2, §6, §7 (waves, pickups, experience), §12 (arena bounds) |
| C3 weapons | §2, §3 (Ash Wolf), §4 |
| C4 level-ups and shop | §5, §7 (level-up, shop), §8 |
| C5 bosses | §9, §10, §13 (fall and win) |
| C6 camp and save | §11, §13 (elder, hints), §14 (screens), §15 (save) |
| C7 arenas | §12 |
