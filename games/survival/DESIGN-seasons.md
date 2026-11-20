# Survival seasons spec (Phase D)

Extends `DESIGN.md` section 7 (*Seasons*) and section 4 (*pemmican*, *hardships*). Build tasks:
[PLAN.md](PLAN.md) *Phase D: seasons*. Settled with the user 2026-11-19 by grilling (Q1-Q4, marked
**settled**). **The user approved the numbers and the save-format break on 2026-11-19**; the balance is
judged in the S7 playtest, like the slice's C8.

## Settled by the user

- **Season length:** 3 days (3600 ticks). A year is 12 days. Seasons are generic: Spring, Summer,
  Autumn, Winter (CULTURE.md: no Dakota season or month names).
- **A new camp starts in spring.** The first winter begins on day 10 (after the slice's 3 waves).
- **First cut includes:** gathering and hunting rates, winter hunger and cold, spring newcomers, food
  spoilage and drying (a drying rack and pemmican). Floods, sickness, pests, drought and harsh-winter
  events wait.
- **Winter is painful but survivable:** an attentive player recovers (food low, Wotakuye sinks toward
  Quarrelling, a few people may leave); dying out needs real neglect.

## Calendar

`season(tick) = floor(tick / 3600) % 4` -> 0 Spring, 1 Summer, 2 Autumn, 3 Winter. It is derived from
`tick`, so it is not stored and does not change the save format. `year = floor(tick / 14400) + 1`.
At a day start where the season differs from the day before, a toast names it (`## Text`).

## Seasonal numbers

`src/data/seasons.json`:

```json
{
  "ticksPerSeason": 3600,
  "order": ["spring", "summer", "autumn", "winter"],
  "labels": { "spring": "Spring", "summer": "Summer", "autumn": "Autumn", "winter": "Winter" },
  "gatherRate":  { "spring": 1.0, "summer": 1.2, "autumn": 1.5, "winter": 0.3 },
  "huntSuccess": { "spring": 0.9, "summer": 1.15, "autumn": 1.0, "winter": 0.7 },
  "mealNeed":    { "spring": 1.0, "summer": 1.0, "autumn": 1.0, "winter": 1.25 },
  "unhousedPerDay": { "spring": -1, "summer": -1, "autumn": -1, "winter": -3 },
  "spoilPerDay": { "spring": 0.03, "summer": 0.10, "autumn": 0.03, "winter": 0 },
  "newcomerMinWotakuye": { "spring": 40 },
  "tint": { "spring": null, "summer": [0xffe9a0, 0.05], "autumn": [0xd98a3a, 0.10], "winter": [0xbcd4f0, 0.18] }
}
```

- **Gather:** the `gather` job's work rate is multiplied by `gatherRate` (on top of the spot bonus,
  age and Wotakuye multipliers).
- **Hunt:** the success chance `0.7` is multiplied by `huntSuccess` (0.63 / 0.805 / 0.7 / 0.49). The
  rng is drawn exactly as before, so only the threshold changes.
- **Meals:** a person's meal size is multiplied by `mealNeed` when working out *need* (`## Economy`
  in DESIGN-slice.md). Hunger relief per full meal is unchanged: winter burns more stored food for the
  same relief.
- **Cold:** the per-unhoused-person Wotakuye change at day start is `unhousedPerDay[season]` (-3 in
  winter instead of -1). Housed people are unaffected.
- **Spoilage:** at day start, `floor(store.food * spoilPerDay[season])` raw food is removed
  (never pemmican). A toast `Some food spoiled in the heat.` appears when summer spoils 5 or more.
- **Spring newcomers:** during spring, the daily newcomer rule (`## Wotakuye` in DESIGN-slice.md,
  max 1 a day, needs a free bed and food >= 40) also works at Wotakuye >= 40 (Steady), not only at
  United. Up to 3 newcomers a spring.

## Pemmican and the drying rack

- **Pemmican** is a fourth store resource: `state.store.pemmican`, start 0, cap 100 per completed
  store (so 100 at the start). It never spoils. **1 pemmican feeds 1.5 food units.**
- **Meals** eat raw food first, then pemmican for what is still needed (`remaining / 1.5`, fractions
  allowed, as food already is), so spoiling food is spent first. A partial meal's `share`
  counts food plus pemmican (as food units).
- **Drying rack:** new 2x2 building, cost 15 wood + 2 hides, 200 build points, up to 2 workers, job
  `dry`. Placeable like the others (grass, within 14 of the fire).
- **`dry` job:** a trip like `hunt`: walk to the nearest store, take 6 food (if the store has less than
  6, wait and retry every 50 ticks), walk to the rack, work 200 ticks, walk to a store with room and
  deliver 4 pemmican (6 food = 6 food units become 4 x 1.5 = 6: no loss, only a store that never spoils
  and holds more). A worker at a rack with no store room waits and retries, like any delivery.
  About 5 trips a day, so about 20 pemmican (30 food units) per worker per day.
- **Drying rack workers** join no society (slice rule: only hunters have one).

Data: `buildings.json` adds
`"drying_rack": { "size": [2, 2], "cost": { "wood": 15, "hides": 2 }, "buildPoints": 200, "workers": 2, "job": "dry" }`;
`jobs.json` adds `"dry": { "take": 6, "give": 4, "ticks": 200 }`; `resources.json` adds
`"pemmican": { "start": 0, "label": "Pemmican", "foodValue": 1.5 }` and the store caps in
`buildings.json` gain `"pemmican": 100` on the store.

## Save format

`GameState.store` gains `pemmican`, so `SAVE_VERSION` goes from 1 to **2** (`src/sim/save.ts`; the
`store.food/wood/hides` check in `## Reading a save` also requires `store.pemmican`). **Old v1 saves
become unreadable** (no migration, as `DESIGN-saves.md` says): their slot cards show *Unreadable
save* and offer Export and Delete. Day-2 camps saved during the saves playtest are lost this way. The
feature is unreleased, so this is accepted unless the user asks for a v1 to v2 conversion.

## Run length (decided by the user 2026-11-20)

The slice was won by beating wave 3 at tick 10800, the first winter day, so winter was never played.
`waves.json` now has a **wave 4** (tick 14400, day 13: 7 wolves and a pack leader) and
`winAfterWave: 4`. The first winter (days 10-12) is played in full before the end.

## UI

- **Resource bar:** `Pemmican n / cap` after Hides; the day text becomes `Spring, day 2` style
  (`<Season>, day <1-3>`, and `Year <y>` only from year 2): `Day 5` stays the global day in the Menu
  card and the end screen. The Wotakuye bar moved right and shrank (x 750, 170 px wide) to make room;
  the buttons keep their places.
- **Tint:** a full-screen rectangle in the HUD scene (below the bars, no input) in the season's tint
  colour and alpha, none in spring. Presentation only.
- **Build menu:** a fifth entry, **Drying rack** (key 5), placeholder art `building_drying_rack`
  (art/ASSETS.md).

## Text

All English. Season change toasts: `Spring: newcomers may arrive.`, `Summer: good hunting, food spoils
fast.`, `Autumn: gather and dry what you can.`, `Winter: gathering nearly stops, and the cold bites.`

## Tests

`tests/sim/seasons.test.ts`: `season(tick)` boundaries (0, 3599, 3600, 14399, 14400); the season-change
toast fires once per change; gather yields about 0.3 of normal in winter (same seed, same ticks);
hunt success uses the multiplied chance and the rng draw count is unchanged; winter meal need is x1.25;
winter charges -3 per unhoused person; spoilage removes `floor(food * rate)` in summer and nothing in
winter or of pemmican; spring newcomers arrive at Wotakuye 40-69 (and not in summer); a meal eats food
then pemmican (1 pemmican = 1.5 food); a drying rack turns 6 food into 4 pemmican per trip; a saved
and loaded run keeps `pemmican` and equals the unsaved run (extend `tests/sim/save.test.ts`;
`SAVE_VERSION` 2; a v1 file is unreadable).
`tests/smoke.spec.ts`: after `step(10800)` (day 10, winter) the HUD season text reads `Winter` (via a
`window.camp` hook), no console errors.
