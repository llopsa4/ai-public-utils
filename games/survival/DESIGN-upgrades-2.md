# Survival upgrades spec (Phase D, tier 2: societies)

Extends [DESIGN-upgrades.md](DESIGN-upgrades.md) (tier 1) and `DESIGN.md` section 6 (*Progression*,
societies tier). Build tasks: [PLAN.md](PLAN.md) *Phase D: upgrades tier 2*. Settled with the user
2026-11-20 by grilling (marked **settled**). **The user approved the numbers, the v3 -> v4 save break and the Tab-paged Build menu on 2026-11-20**;
the balance is judged in the V9 playtest.

## Settled by the user

- **Scope:** all four: Akicita scouts, warrior classes, builders' society, faster building.
- **Gating:** gift value + goods + **one tier 1 upgrade** each (no camp-size or Wotakuye minimum).
- **Run length:** add waves 5 and 6 so gift has time to accrue (the run is won after wave 6).
- **Scouts:** a **scouts' lodge** with staffed scouts (warning longer and richer only while staffed).
- **Warriors:** a **warriors' lodge with classes**, the class **picked per lodge** (lancers or archers).
- **Defences:** **traps and fire pits only**; no barricades until wolves can path around buildings.

## Waves 5 and 6

`waves.json` adds `{ "at": 18000, wolf x9 + pack_leader x1, spread 8 }` (day 16) and
`{ "at": 21600, wolf x10 + pack_leader x2, spread 10 }` (day 19); `winAfterWave` becomes 6. Gift by
the end is about 19 (a Steady camp) to 38 (a United one), against 18 for all of tier 1, so a run buys
tier 1 plus one or two tier 2 upgrades, or most of tier 2 if it skips some of tier 1.

## Upgrades

Bought like tier 1 (`buyUpgrade`), once each; **Buy is refused until the required tier 1 upgrade is
owned** (the card names it). Costs are gift + goods taken from the store.

| Id | Needs | Cost | Effect |
|---|---|---|---|
| `scouts` | `dogs` | 8 gift + 10 wood + 5 hides | unlocks the **scouts' lodge** |
| `warriors` | `bows` | 10 gift + 15 wood + 5 hides | unlocks the **lancers' lodge** and the **archers' lodge** |
| `builders` | `healers` | 10 gift + 25 wood | unlocks **traps** and **fire pits** in the Build menu |
| `tools` | `bows` | 6 gift + 10 wood + 4 hides | all construction is 1.5x faster (build points per worker-tick x1.5), for every building |

## Scouts' lodge

2x2, cost 15 wood + 3 hides, 200 build points, up to 2 workers, job `scout`, society `scouts` (the
Akicita word is approved for the scouts and warriors society; the Build label stays *Scouts' lodge*).

- A `scout` worker waits at the lodge and produces nothing (their cost is the work not done).
- The lodge is **staffed** when at least one `scout` worker stands at a completed lodge.
- **Warning:** a wave warns at `at - 600` ticks (60 s) instead of `at - 300` **if the lodge is staffed
  at that tick**; otherwise it warns at `at - 300` as before. The banner then also shows the wolf
  count (`Wolves from the north: 9 and a leader`). The edge is already announced today, so it is not
  part of this upgrade. The count is stored on the wave run (`scouted`), so a saved camp keeps it.

## Warriors' lodges

Two building types, 2x2, 220 build points, up to 4 workers, job `drill`, bought with the one
`warriors` upgrade. A `drill` worker produces nothing. Anyone **assigned to the lodge** gets its
society and, when drafted, fights as that class.

| Building | Cost | Society | Fights as |
|---|---|---|---|
| `lancers_lodge` | 25 wood + 4 hides | `lancers` | lancer: range 1.6, damage 14, cooldown 14, accuracy 0.8, sight 10 |
| `archers_lodge` | 25 wood + 4 hides | `archers` | the bow fighter, like the hunters (so `bows` and `dogs` upgrades apply), without needing a hunting lodge |

A person keeps the society after being unassigned, like the hunters. Riders wait for horses (not in
this pass).

## Builders: traps and fire pits

Both are 1x1, placed on grass within 14 tiles of the fire and built by workers like any site; they
are not buildings with workers. Both need the `builders` upgrade.

| Id | Cost | Build points | Effect |
|---|---|---|---|
| `trap` | 3 wood + 1 hide | 40 | the first wolf within 0.6 tile takes 25 damage and the trap is removed; never harms people |
| `fire_pit` | 5 wood | 60 | wolves within 3 tiles move at half speed; it stays; several do not stack |

## Tools

`tools` multiplies the build progress a worker adds each tick by 1.5 (read from `upgrades.json`
`buildSpeed`), for all sites including traps and pits.

## Data

`upgrades.json`: each upgrade gains `"requires": "dogs"` (and so on); `scouts`, `warriors`,
`builders` carry `"unlocks"`; `tools` carries `"buildSpeed": 1.5`. `buildings.json` adds
`scouts_lodge`, `lancers_lodge`, `archers_lodge` (with `requires`), and `trap` and `fire_pit`
(`size [1,1]`, `requires: "builders"`, `defence` stats). `enemies.json` adds `fighters.lancer` and
`fighters.archer` (a copy of `bow` with `society: "archers"`). `jobs.json` adds `scout` and `drill`
(no output). `waves.json` as above.

## Save format

New buildings, societies and `scouted` on a wave run change the state shape, so `SAVE_VERSION` goes
from 3 to **4**. **Old v3 saves become unreadable** (no migration; their slot cards show *Unreadable
save* and offer Export and Delete), as with seasons and tier 1.

## UI

- **Upgrades panel:** grows from three cards to seven (a two-column grid; it must still fit 1280x720).
  A card with an unmet requirement shows `Needs Hunting dogs`.
- **Build menu:** it has six slots and tier 2 adds five (scouts', lancers' and archers' lodge, trap,
  fire pit). **Tab switches between two pages**: *Camp* (tipi, gathering spot, hunting lodge, store,
  drying rack, healers' lodge) and *Societies* (scouts', lancers', archers', trap, fire pit). Keys 1-6
  pick on the shown page; the Societies page shows only what is unlocked, as the lodge entry does now.
- **Wave banner:** adds the count when scouted. Toasts on purchase: `The scouts can build a lodge.`,
  `The warriors can build lodges.`, `The builders can set traps and fire pits.`, `Building goes faster.`
- **Art:** placeholders for the three lodges, the trap and the fire pit
  ([art/ASSETS.md](art/ASSETS.md)).

## Tests

`tests/sim/upgrades2.test.ts`: buying is refused without the required tier 1 upgrade and allowed
with it; `tools` makes a site finish 1.5x faster; a scout worker at a lodge makes the warning come 600
ticks ahead, an empty lodge 300, and the wave run keeps `scouted` through a save; a lancer outdamages
a club fighter in a duel and an archer fires like a hunter; the trap hurts one wolf once and
disappears; a fire pit halves wolf speed inside 3 tiles and not outside; waves 5 and 6 exist and the
run is won after wave 6; a v3 file is unreadable. `tests/smoke.spec.ts`: buy a tier 2 upgrade via the
debug state, switch the Build page with Tab, no console errors.
