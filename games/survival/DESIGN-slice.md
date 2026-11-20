# Survival slice spec

Plan task B1 (Opus, 2026-11-19). The numbers and data shapes for the first playable slice
([DESIGN.md](DESIGN.md) section 10). **Proposal until the user approves it** (gate in
[PLAN.md](PLAN.md)); once approved, C tasks read only the headings their row names, and the settled
numbers are summarised into DESIGN.md. Code layout, stack and tick model: PLAN.md *Fixed technical
shape*.

Conventions used everywhere below:

- **Time:** 10 ticks per real second at 1x. **1 day = 1200 ticks** (2 min at 1x). A day starts when
  `tick % 1200 == 0`; **half-day** (meal time) when `tick % 600 == 0`. The slice has no seasons.
- **Space:** tile coordinates `(x, y)`, integers for tiles, floats for positions; `x` runs to the
  lower right of the screen, `y` to the lower left. Distances are Euclidean in tiles unless a rule
  says "Chebyshev".
- **Speeds** are tiles per tick; **rates** are units per tick per worker.
- **Working names:** "Wotakuye" and "tiyospaye" wait on [CULTURE.md](CULTURE.md) *Needs review*
  1-2. On screen the slice says **"family"** for a tiyospaye and shows the meter label from
  `resources.json` `labels.unity` (default `"Wotakuye"`), so a later decision is a one-line change.
- All on-screen text is English. Invented family names: **Cottonwood** and **Kingfisher**.

## Map

**Size:** 48 x 48 tiles. **Projection:** screen `sx = (x - y) * 32`, `sy = (x + y) * 16` (tile
centre); inverse `x = sy / 32 + sx / 64`, `y = sy / 32 - sx / 64`, tile = `floor(v + 0.5)`. The whole
map spans 3072 x 1536 px; world origin offset so tile (0, 0) centre is at world (1536, 32).

**Tile types** (`TileType` = string key):

| Type | Walk cost | Passable | Holds | Notes |
|---|---|---|---|---|
| `grass` | 1 | yes | - | the only buildable tile |
| `river` | - | no | - | 2 tiles wide |
| `ford` | 3 | yes | - | shallow crossing, 2 per river |
| `forest` | 2 | yes | 30 wood | becomes `grass` at 0 wood (no regrowth in slice) |
| `berry` | 1 | yes | 40 food (max) | regrows 0.005 food/tick up to max |

Buildings make their footprint impassable; the central fire too. Paths: A* on 8 neighbours,
diagonal cost x1.4, no corner-cutting past impassable tiles, search capped at 4000 nodes (fail =
no path, the order is dropped with a "can't reach" toast).

**Generation** (seeded `mulberry32(seed)`, calls in this order so a seed always gives the same map):

1. Fill with `grass`.
2. **River:** north to south through the west half. `rx = 9 + int(rng*6)` at `y = 0`; for each row
   `y`, set tiles `rx` and `rx+1` to `river`, then `rx += pick(-1: 0.25, 0: 0.5, +1: 0.25)`,
   clamped to 5..16.
3. **Fords:** two rows, `y1 = 8 + int(rng*10)`, `y2 = 30 + int(rng*10)`; both river tiles on each
   row become `ford`.
4. **Camp clearing:** central fire footprint is tiles (23..24, 23..24); every tile within
   Chebyshev distance 7 of (24, 24) is forced `grass` after steps 5-6, except `river` tiles, which stay (the river may cross the
   clearing; fords still apply).
5. **Forest:** 7 clusters. Centre picked uniformly over the map, re-rolled (max 20 tries) until it
   is >= 10 from (24, 24) and not river. Radius `2 + int(rng*3)`; each non-river tile within radius
   becomes `forest` with chance 0.75.
6. **Berry patches:** 3 patches, centre at distance 7..14 from (24, 24) (re-roll as above, not
   river/forest); the centre and its 4 orthogonal neighbours plus 2 random diagonal neighbours
   become `berry` (7 tiles per patch). A patch with any tile inside the camp clearing is re-rolled,
   so every patch keeps all 7 tiles.
7. **Start position:** fire at (23..24, 23..24); prebuilt **2 tipis**, **1 store** placed by the
   rules in `## Buildings` at fixed offsets: tipis at (20, 21) and (27, 21), store at (24, 27)
   (top-left of each 2x2 footprint). People spawn on free tiles within 4 of the fire.

**Camera and view** (C1): starts centred on the fire at zoom 1. Pan with WASD or the mouse within
16 px of the window edge, 600 screen px/s divided by zoom; clamped so the map centre stays on
screen. Wheel zoom 0.5..2.0 in steps of 0.1, centred on the cursor. Ground tiles drawn in a static
layer; upright sprites (people, trees, buildings, enemies, fire) depth-sorted by anchor screen y.
Fog of war: not in the slice.

**`src/data/map.json`:**

```json
{
  "size": 48,
  "tileWidth": 64,
  "tileHeight": 32,
  "tiles": {
    "grass":  { "cost": 1, "passable": true,  "buildable": true },
    "river":  { "cost": 0, "passable": false, "buildable": false },
    "ford":   { "cost": 3, "passable": true,  "buildable": false },
    "forest": { "cost": 2, "passable": true,  "buildable": false, "wood": 30 },
    "berry":  { "cost": 1, "passable": true,  "buildable": false, "food": 40, "regrow": 0.005 }
  },
  "river": { "startMin": 9, "startSpan": 6, "width": 2, "clamp": [5, 16], "fordRows": [[8, 10], [30, 10]] },
  "forest": { "clusters": 7, "minDistFromCamp": 10, "radius": [2, 4], "density": 0.75 },
  "berry": { "patches": 3, "distFromCamp": [7, 14], "tilesPerPatch": 7 },
  "camp": { "fire": [23, 23], "clearRadius": 7,
            "prebuilt": [ { "type": "tipi", "at": [20, 21] }, { "type": "tipi", "at": [27, 21] },
                          { "type": "store", "at": [24, 27] } ] },
  "start": { "seed": 1, "families": ["Cottonwood", "Kingfisher"],
             "perFamily": { "adult": 6, "elder": 2, "child": 2 }, "spawnRadius": 4 },
  "camera": { "edgePx": 16, "panPxPerSec": 600, "zoom": [0.5, 2.0], "zoomStep": 0.1 }
}
```

`fordRows: [[8, 10], ...]` means `y = 8 + int(rng*10)`. The map grid itself is generated at run
start, never stored in JSON.

## People

**Start:** 20 people, two families of 10: per family 6 adults, 2 elders, 2 children. Display name
`"<Family> <n>"` (e.g. "Cottonwood 4"), `n` = 1..10 within the family.

| Age | Works | Can be drafted | Food per meal | Speed |
|---|---|---|---|---|
| adult | all jobs | yes | 1 | 0.1 |
| elder | gather only, at x0.5 rate | no | 1 | 0.08 |
| child | no | no | 0.5 | 0.1 |

**Health** 0..100, start 100; 0 = dies (removed, Wotakuye event). Regenerates 0.01/tick while
hunger < 70. **Hunger** 0..100 (0 = full), start 20; see `## Economy`. Hunger >= 70 = *hungry*
(work x0.75); hunger 100 = *starving* (health -0.05/tick, dead in ~3.3 min at 1x).

**Runtime shape** (`state.people[]`, plain JSON; C2 owns it):

```json
{
  "id": 7, "name": "Cottonwood 8", "family": 0, "age": "adult",
  "x": 22.5, "y": 25.0, "health": 100, "hunger": 20,
  "job": { "kind": "gather", "building": 3, "tile": null },
  "task": { "step": "walk", "target": [31, 18], "path": [[23, 25], [24, 24]], "timer": 0 },
  "carry": { "res": "food", "amount": 0 },
  "society": null, "drafted": false, "stance": "defend", "attackTarget": null,
  "home": 1, "cooldown": 0
}
```

`job` is the standing assignment (null = idle); `task` is the current step of it (`walk`, `work`,
`deliver`, `flee`, `fight`, `idle`). `society` is `"hunters"` while assigned to a hunting lodge.
`home` is a tipi id or null (unhoused). Idle adults with no order auto-take haul then build work
(`## Jobs`); idle elders and children wander within 3 tiles of their home tipi (or the fire).

People live in `map.json` `start` (counts) and `jobs.json` `ages` (per-age numbers):

```json
"ages": {
  "adult": { "speed": 0.1, "meal": 1,   "works": "all",    "rate": 1.0, "draft": true },
  "elder": { "speed": 0.08, "meal": 1,   "works": ["gather"], "rate": 0.5, "draft": false },
  "child": { "speed": 0.1, "meal": 0.5, "works": [],       "rate": 0,   "draft": false }
},
"health": { "max": 100, "regen": 0.01, "regenBelowHunger": 70, "starveDamage": 0.05 }
```

## Jobs

Six job kinds. A worker cycles walk -> work -> walk to store -> deliver. Rates are multiplied by age
rate, the Wotakuye multiplier and x0.75 when hungry.

| Job | Ordered by | Work | Carry | Notes |
|---|---|---|---|---|
| gather | right-click a berry tile (x1.0), or assign to a gathering spot (x1.5) | 0.01 food/tick from a berry tile | 5 food | spot workers auto-pick the fullest berry tile within 10 of the spot; tile order stops when that tile is empty |
| hunt | assign to a hunting lodge | trip: walk to a hunt spot, 300 ticks hunting, walk back | 10 food + 1 hide on success | hunt spot = random passable non-river tile 14..22 from the fire; success chance 0.7 (rng); failure brings nothing |
| chop | right-click a forest tile | 0.015 wood/tick | 5 wood | when the tile is empty, moves to the nearest forest tile within 4, else idle |
| build | right-click a construction site, or automatic (idle adults) | 1 build point/tick | - | max 3 builders per site; work starts only after all materials are delivered |
| haul | automatic (idle adults) | carries up to 5 of a missing material from the nearest store to a site | 5 | max 2 haulers per site |
| fight | draft (`## Orders`) | see `## Combat` | - | drafted people drop their job and resume it when undrafted |

Deliver = drop the load at the nearest completed store with room for that resource; if no store has
room, the worker waits there and retries every 50 ticks (the load is not lost). Auto-work priority
for idle adults: haul, then build, nearest site first. Workers flee (task `flee`, to the fire) when a
wolf is within 5 tiles and they are not drafted; they resume 100 ticks after no wolf is within 8.

**`src/data/jobs.json`** (also holds `ages` and `health` from `## People`):

```json
{
  "jobs": {
    "gather": { "res": "food", "rate": 0.01, "carry": 5, "spotBonus": 1.5, "spotRadius": 10 },
    "hunt":   { "food": 10, "hides": 1, "huntTicks": 300, "spotDist": [14, 22], "success": 0.7 },
    "chop":   { "res": "wood", "rate": 0.015, "carry": 5, "searchRadius": 4 },
    "build":  { "rate": 1, "maxPerSite": 3 },
    "haul":   { "carry": 5, "maxPerSite": 2 },
    "fight":  {}
  },
  "flee": { "triggerDist": 5, "safeDist": 8, "resumeTicks": 100 },
  "storeRetryTicks": 50
}
```

## Buildings

All footprints 2x2 tiles, placed by their top-left tile. Valid placement: every footprint tile is
`grass`, inside the map, not occupied, and within Chebyshev distance 14 of (24, 24) so the camp stays
compact. Placing deducts the full cost from the store at once (refused if short); the site then needs
the materials **hauled** to it before building work starts. Cancelling a site refunds 100% (delivered
material goes back to the store instantly). Building HP is for later eras; wolves do not attack
buildings.

| Building | Cost | Build points | Workers | Effect | Prebuilt |
|---|---|---|---|---|---|
| central fire | - | - | - | HP 500; lose at 0; flee and defend-camp point | 1 (fixed) |
| tipi | 20 wood, 8 hides | 300 | - | houses 5 people | 2 |
| gathering spot | 10 wood | 150 | max 4 | gatherers x1.5, auto-pick berry tiles within 10 | 0 |
| hunting lodge | 25 wood, 2 hides | 250 | max 4 | hunt job; workers join the **hunters** society | 0 |
| store | 15 wood | 200 | - | adds caps: food 800, wood 600, hides 160 (4x4 since 2026-11-20, [DESIGN-hunting.md](DESIGN-hunting.md) `## Store`) | 1 |

The start houses 10 of 20, so a third and fourth tipi are the first build choice (unhoused people
cost Wotakuye, see `## Wotakuye`). Housing: at day start each unhoused person is given a free bed,
family members first in the tipi already holding their family.

Runtime shape (`state.buildings[]`):

```json
{ "id": 3, "type": "gathering_spot", "x": 26, "y": 19, "done": false,
  "built": 40, "delivered": { "wood": 10 }, "workers": [4, 9], "residents": [], "hp": null }
```

**`src/data/buildings.json`:**

```json
{
  "placement": { "tile": "grass", "maxDistFromFire": 14 },
  "types": {
    "fire":           { "size": [2, 2], "hp": 500, "buildable": false },
    "tipi":           { "size": [2, 2], "cost": { "wood": 20, "hides": 8 }, "buildPoints": 300, "houses": 5 },
    "gathering_spot": { "size": [2, 2], "cost": { "wood": 10 }, "buildPoints": 150, "workers": 4, "job": "gather" },
    "hunting_lodge":  { "size": [2, 2], "cost": { "wood": 25, "hides": 2 }, "buildPoints": 250, "workers": 4, "job": "hunt", "society": "hunters" },
    "store":          { "size": [2, 2], "cost": { "wood": 15 }, "buildPoints": 200, "caps": { "food": 200, "wood": 150, "hides": 40 } }
  }
}
```

## Resources

| Resource | Start | Cap source | Comes from | Used for |
|---|---|---|---|---|
| food | 120 | 200 per store | gather, hunt | meals |
| wood | 40 | 150 per store | chop | building |
| hides | 6 | 40 per store | hunt | tipis, hunting lodge |

The store is one shared pool (`state.store = { food, wood, hides }`); caps are the sum over completed
stores. Start: 1 store, so caps 200 / 150 / 40. Start food lasts about 3 days with no gathering
(36 food per day for 20 people).

**`src/data/resources.json`** (also holds `## Economy` and `## Wotakuye` numbers):

```json
{
  "resources": {
    "food":  { "start": 120, "label": "Food" },
    "wood":  { "start": 40,  "label": "Wood" },
    "hides": { "start": 6,   "label": "Hides" }
  },
  "labels": { "unity": "Wotakuye", "family": "family" },
  "economy": { "...": "see ## Economy" },
  "wotakuye": { "...": "see ## Wotakuye" }
}
```

## Economy

- **Hunger** rises 1/12 per tick (+50 per half-day, +100 per day), clamped 0..100.
- **Meals** at every half-day (`tick % 600 == 0`, not tick 0): the slice's one distribution rule,
  **feed evenly**. Need = sum of each living person's meal size (adult/elder 1, child 0.5; 18 at the
  start). If `store.food >= need`, everyone eats a full meal; else the food left is shared in equal
  fractions: `share = store.food / need`, everyone eats `share` of a meal. A full meal lowers hunger
  by 50; a partial meal by `50 * share`. Food eaten leaves the store.
- **Starvation:** hunger 100 drains health 0.05/tick (`## People`). A death costs Wotakuye.
- **Hungry** (>= 70): work x0.75.
- Planned for later (not slice): "hunters first" and "hold reserves" rules, spoilage, pemmican.

Balance check (1x): 20 people eat 36 food/day. A gatherer at a spot makes about 10 food/day after
walking; a hunter about 7 food + 0.7 hides/day. Four spot gatherers plus three hunters roughly feed
the start camp, leaving 5 adults for wood, building and fighting.

```json
"economy": {
  "hungerPerTick": 0.08333,
  "mealEvery": 600,
  "mealRelief": 50,
  "hungryAt": 70, "hungryWork": 0.75,
  "rule": "even"
}
```

## Wotakuye

One camp meter, 0..100, **start 60**. Shown as a bar with the current band name.

| Event | Change |
|---|---|
| a meal where everyone ate fully | +2 |
| a meal with `share < 1` | `-(1 + 8 * (1 - share))` (so -9 at no food) |
| a person dies (any cause) | -8 |
| per unhoused person at day start | -1 |
| a wave defeated with no camp deaths | +6 |
| a wave defeated with deaths | +2 |

| Band | Range | Work multiplier | Day-start effect |
|---|---|---|---|
| United | 70..100 | x1.2 | a newcomer adult joins the smaller family, if a bed is free and food >= 40 (max 1/day) |
| Steady | 40..69 | x1.0 | - |
| Strained | 20..39 | x0.85 | - |
| Quarrelling | 0..19 | x0.7 | one adult leaves (rng pick from the larger family); a toast names them |

```json
"wotakuye": {
  "start": 60, "min": 0, "max": 100,
  "events": { "mealFull": 2, "mealShortBase": -1, "mealShortScale": -8, "death": -8,
              "unhousedPerDay": -1, "waveCleanNoDeaths": 6, "waveCleanWithDeaths": 2 },
  "bands": [
    { "name": "Quarrelling", "from": 0,  "work": 0.7,  "dayEffect": "leave" },
    { "name": "Strained",    "from": 20, "work": 0.85, "dayEffect": null },
    { "name": "Steady",      "from": 40, "work": 1.0,  "dayEffect": null },
    { "name": "United",      "from": 70, "work": 1.2,  "dayEffect": "newcomer", "newcomerMinFood": 40 }
  ]
}
```

## Orders

The scenes turn input into **orders**; `src/sim/orders.ts` applies them at the start of the next
tick (so `window.camp.orders(...)` and the mouse behave the same).

| Input | Result |
|---|---|
| left-click a person (within 12 screen px of the sprite) | select them only; shift-click toggles |
| left-drag > 6 px | box-select every person whose anchor is inside; shift adds |
| left-click empty ground / Esc | clear selection (Esc first cancels build placement) |
| right-click ground | `move` (drafted: stay there; undrafted: go there, then idle) |
| right-click berry / forest tile | `assign` gather / chop (undrafted adults; elders gather only) |
| right-click a finished gathering spot / hunting lodge | `assign` to it (up to its free slots, rest ignored with a toast) |
| right-click a construction site | `assign` build |
| right-click a wolf | `attack` (drafted only; undrafted selected people ignore it) |
| R | `draft` toggle for the selection (adults only) |
| Z / X / C | stance `hold` / `defend` / `chase` for drafted selected |
| B | arm the building cards (shown in the panel while an adult who is not drafted is selected); the next 1-7 picks a building; left-click places; right-click/Esc cancels (see DESIGN-hunting.md `## Villager panel and building`) |
| Delete | cancel the selected construction site (refund) |
| Space | pause toggle; `1` / `2` / `3` = speed 1x / 2x / 4x |

**Stances** (drafted only): `hold` = stay put, shoot/strike enemies in range; `defend` (default) =
engage any wolf within 8 tiles of the fire, then return to the drafted position; `chase` = pursue
any wolf within sight (10 tiles) until it dies or flees.

**Order shape** (`src/sim/orders.ts`):

```json
[
  { "type": "move",   "ids": [1, 2], "to": [30.5, 22.0] },
  { "type": "assign", "ids": [3], "job": "gather", "tile": [31, 18] },
  { "type": "assign", "ids": [4, 5], "building": 6 },
  { "type": "attack", "ids": [1, 2], "enemy": 12 },
  { "type": "draft",  "ids": [1, 2], "on": true },
  { "type": "stance", "ids": [1, 2], "stance": "hold" },
  { "type": "place",  "building": "tipi", "at": [18, 26] },
  { "type": "cancel", "building": 9 },
  { "type": "speed",  "value": 2 },
  { "type": "pause",  "on": true }
]
```

Invalid orders (wrong age, full building, unreachable) are dropped and produce a toast message in
`state.messages` (`{ tick, text }`, last 5 kept).

## Combat

Hit = rng roll `< accuracy`; a hit does fixed damage; then the attacker waits `cooldown` ticks.
Ranged attacks resolve instantly (the projectile is only drawn). A fighter attacks when the target is
within `range` (tiles, centre to centre), else walks toward it.

| Fighter | HP | Range | Damage | Cooldown | Accuracy | Speed | Sight |
|---|---|---|---|---|---|---|---|
| drafted hunter (hunters society): bow | 100 (health) | 4.0 | 12 | 15 | 0.75 | 0.1 | 10 |
| other drafted adult: club | 100 (health) | 0.8 | 8 | 12 | 0.8 | 0.1 | 10 |
| wolf | 40 | 0.7 | 10 | 10 | 0.7 | 0.16 | 8 |
| pack leader (wave 3) | 90 | 0.8 | 16 | 10 | 0.75 | 0.16 | 10 |

**Wolf behaviour:** target the nearest person within sight (any age; ties go to the lowest id),
else walk toward the fire. A wolf below 20% HP **flees** to the nearest map edge at speed 0.2 and
counts as defeated when it leaves the map. The pack leader never flees. Wolves do not attack the fire
or buildings in the slice (the fire-loss check still runs for later eras). Enemies drop no loot.

**People** in combat: damage lowers `health`; an injured person heals by the normal regen. Undrafted
people never attack; they flee (`## Jobs`).

**`src/data/enemies.json`** (also holds the people fighter profiles):

```json
{
  "fighters": {
    "bow":  { "range": 4.0, "damage": 12, "cooldown": 15, "accuracy": 0.75, "sight": 10, "society": "hunters" },
    "club": { "range": 0.8, "damage": 8,  "cooldown": 12, "accuracy": 0.8,  "sight": 10 }
  },
  "enemies": {
    "wolf":        { "hp": 40, "range": 0.7, "damage": 10, "cooldown": 10, "accuracy": 0.7,  "speed": 0.16, "sight": 8,  "fleeBelow": 0.2, "fleeSpeed": 0.2 },
    "pack_leader": { "hp": 90, "range": 0.8, "damage": 16, "cooldown": 10, "accuracy": 0.75, "speed": 0.16, "sight": 10, "fleeBelow": 0 }
  },
  "stances": { "defendRadius": 8, "chaseSight": 10 }
}
```

## Waves

| Wave | Arrives at tick (day) | Enemies | Spread |
|---|---|---|---|
| 1 | 3600 (start of day 4) | 1 wolf | - |
| 2 | 7200 (day 7) | 3 wolves | 6-tile segment |
| 3 | 10800 (day 10) | 5 wolves + 1 pack leader | 8-tile segment |
| 4 | 14400 (day 13) | 7 wolves + 1 pack leader | 8-tile segment |
| 5 | 18000 (day 16) | 9 wolves + 1 pack leader | 8-tile segment |
| 6 | 21600 (day 19) | 10 wolves + 2 pack leaders | 10-tile segment |
| 7 | 25200 (day 22) | 12 wolves + 2 pack leaders, two edges at once | 12-tile segment each |
| 8 | 28800 (day 25) | 14 wolves + 3 pack leaders, two edges at once | 12-tile segment each |

- **Warning:** at arrival - 300 ticks (30 s at 1x) the wave banner shows "Scouts: wolves coming from
  the <north|east|south>" with a countdown.
- **Spawn edge:** chosen by rng when the warning starts, from north (`y = 0`), east (`x = 47`),
  south (`y = 47`); never west (the river side). The segment is centred on the edge middle +/- 10
  tiles (rng); spawns land on passable tiles of that edge.
- A wave is **defeated** when every enemy is dead or has fled. Waves do not wait for each other: a
  wave still alive when the next arrives just adds to it.
- **End of the run:** wave 8 defeated (wave 4 from 2026-11-20 so the first winter is played; waves 5-6 added 2026-11-20 with upgrades tier 2, see DESIGN-upgrades-2.md; waves 7-8 with tier 3, see DESIGN-upgrades-3.md) -> "The camp held" screen with day, people left and Wotakuye,
  and a "Play again" button.
- **Lose:** no living people, or fire HP 0 -> "The camp is lost" screen, same summary and button.
- Not in the slice: calling a wave early (needs gift value), difficulty, waves scaling with strength.

**`src/data/waves.json`:**

```json
{
  "warningTicks": 300,
  "edges": ["north", "east", "south"],
  "edgeJitter": 10,
  "waves": [
    { "at": 3600,  "groups": [ { "enemy": "wolf", "count": 1 } ], "spread": 1 },
    { "at": 7200,  "groups": [ { "enemy": "wolf", "count": 3 } ], "spread": 6 },
    { "at": 10800, "groups": [ { "enemy": "wolf", "count": 5 }, { "enemy": "pack_leader", "count": 1 } ], "spread": 8 },
    { "at": 14400, "groups": [ { "enemy": "wolf", "count": 7 }, { "enemy": "pack_leader", "count": 1 } ], "spread": 8 },
    { "at": 18000, "groups": [ { "enemy": "wolf", "count": 9 }, { "enemy": "pack_leader", "count": 1 } ], "spread": 8 },
    { "at": 21600, "groups": [ { "enemy": "wolf", "count": 10 }, { "enemy": "pack_leader", "count": 2 } ], "spread": 10 },
    { "at": 25200, "groups": [ { "enemy": "wolf", "count": 12 }, { "enemy": "pack_leader", "count": 2 } ], "spread": 12, "edges": 2 },
    { "at": 28800, "groups": [ { "enemy": "wolf", "count": 14 }, { "enemy": "pack_leader", "count": 3 } ], "spread": 12, "edges": 2 }
  ],
  "winAfterWave": 8
}
```

## UI

Designed at **1280 x 720** (Phaser scale mode FIT, centred). The HUD is a separate scene (`Hud.ts`)
above the game camera; it never scrolls or zooms. Panels: dark translucent (`#1d1a16` at 85%),
text 14 px sans-serif, warm off-white.

| Element | Box (x, y, w, h) | Content |
|---|---|---|
| resource bar | 0, 0, 1280, 32 | food / wood / hides as `amount / cap`, people `adults / total`, `Day n` |
| Wotakuye bar | 760, 6, 240, 20 | fill 0..100, label from `labels.unity` + band name; red < 20, amber < 40 |
| pause / speed | 1016, 4, 256, 24 | four buttons: pause, 1x, 2x, 4x (active one highlighted) |
| wave banner | 400, 44, 480, 40 | warning text + countdown seconds; "Wave n" while enemies remain; hidden otherwise |
| toasts | 16, 520, 400, 72 | last 3 `state.messages`, fade after 5 s |
| selection panel | 0, 600, 1280, 120 | see below |
| building cards | right part of the panel | one card per unlocked building (icon, cost, hotkey), shown only while a selected adult can build; greyed if unaffordable |

**Selection panel:** one person -> name, family, age, job, health bar, hunger bar, society. Several ->
count, counts by job, and how many drafted. Buttons: **Draft / Undraft** (R), **Hold / Defend /
Chase** (Z / X / C, shown when any selected is drafted). A selected building -> type, build progress
or workers `n / max`, **Cancel** for a site. Nothing selected -> hint line "Left-click to select,
right-click to order. Select adults, then B to build".

**In the world:** selected people get a pale ring under the feet; drafted people a red ring; hungry
people a small bowl icon; health bar above anyone hurt. Build placement shows a ghost footprint,
green if valid, red if not. Wolves show a health bar when hurt.

**Menu scene** (C7): title "Camp Fire", buttons **Start** (seed 1) and **Random seed**, and the
controls list from `## Orders`.

## Tests

Simulation tests (`node --import tsx --test`), no Phaser:

- `tests/iso.test.ts` (C1): tile -> screen -> tile round-trips for all four map corners and
  (24, 24); a map from seed 1 has a 2-wide river, 2 fords, a clear camp radius 7 and 3 berry
  patches of 7 tiles; the same seed gives the same map.
- `tests/sim/people.test.ts`: the same seed gives an identical `state` after `step(100)` twice;
  20 people start, 12 adults; a hungry person works at x0.75.
- `tests/sim/buildings.test.ts`: placement is refused off-grass, out of range, overlapping or short
  of cost; a valid place deducts the cost; a site completes after hauling + build points; workers
  above the max are refused.
- `tests/sim/economy.test.ts`: a gatherer's delivery raises `store.food`; a meal removes 18 food for
  the start camp; a short meal shares evenly and lowers Wotakuye by the formula; hunger 100 drains
  health; Quarrelling makes one adult leave at day start; United adds a newcomer only with a free bed.
- `tests/sim/orders.test.ts`: move, assign (tile and building), draft (adults only), stance and
  cancel change state as specified; invalid orders leave a message.
- `tests/sim/combat.test.ts`: a drafted hunter at range 4 hits a wolf with a fixed seed; a club
  fighter must close in; a wolf below 20% flees; the pack leader does not.
- `tests/sim/waves.test.ts`: the warning starts at tick 3300 with an allowed edge; wave 3 spawns 6
  enemies; defeating wave 6 sets `state.result = "won"` (waves 3-5 do not); killing every person sets `"lost"`.

Browser smoke test (`tests/smoke.spec.ts`, Playwright, C7): open the dev server with `?debug`,
click **Start**, check the canvas renders and `window.camp.state.people.length === 20`, call
`window.camp.step(3300)`, check the wave banner is visible, and fail on any console error.
