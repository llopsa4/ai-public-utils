# Survival upgrades spec (Phase D, tier 3: spirits, riders, barricades)

Extends [DESIGN-upgrades.md](DESIGN-upgrades.md) (tier 1), [DESIGN-upgrades-2.md](DESIGN-upgrades-2.md)
(tier 2) and `DESIGN.md` section 6 (*Progression*, Fantasy tier). Build tasks: [PLAN.md](PLAN.md)
*Phase D: upgrades tier 3*. Settled with the user 2026-11-20 by grilling (Q1-Q15b) and by approving the
plan, numbers included. The balance is judged in the W11 playtest.

## Settled by the user

- **Scope:** the Fantasy tier (four powers) **plus** two tier 2 leftovers: riders with horses, and
  spike barricades. Calling a wave early stays deferred.
- **Upgrades live in buildings, for all tiers.** Click a finished building to see its upgrades; the
  global Upgrades panel (key U, its button) is removed.
- **Fantasy gating:** gift + goods + one tier 2 upgrade, and the **United** band to buy; **Steady or
  better** to cast. Riders, horses and barricades are gated like tier 2.
- **Powers:** once per wave, from a power bar.
- **Run length:** waves 7 and 8, the run is won after wave 8.
- **Labels:** every upgrade and building label (tiers 1-3) is shown as **"Dakota (English)"**.
- **UI extras:** an icon per resource in the HUD bar; an open view of the store on hover.

## Waves 7 and 8

`waves.json` adds two waves, spread 12, each split between **two edges at once** (the two edges are drawn
from `edges` by the wave's seed; groups are split as evenly as possible, leaders alternate):

| Wave | At (tick, day) | Enemies |
|---|---|---|
| 7 | 25200, day 22 | wolf x12 + pack_leader x2 |
| 8 | 28800, day 25 | wolf x14 + pack_leader x3 |

`winAfterWave` becomes 8. A two-edge wave announces both edges (`Wolves from the north and east`); a
scouted one also gives the counts. Bears, cougars and bosses wait for the eras item.

## Upgrade homes

Each upgrade gains a `home` (a building type). Buy is refused unless the camp has a **finished** building
of that type; the Upgrades list appears in that building's selection panel. Requirements and costs of
tiers 1-2 are unchanged.

| Home | Upgrades |
|---|---|
| `fire` (council) | Healers' society, Akicita warriors, Builders' society, Better tools, Spike barricades, Spirit society |
| `hunting_lodge` | Hunting dogs, Better bows, Akicita scouts |
| `horse_corral` | Breed horses |
| `lancers_lodge` | Riders |
| `spirit_lodge` | Spirit warriors, Guardian wolves, Bison charge, Storm caller |

A row shows the label, the cost and **Buy**, or `Needs <label>`, `Needs United`, `Owned`.

## Tier 3 upgrades

| Id | Home | Needs | Cost | Effect |
|---|---|---|---|---|
| `horses` (Breed horses) | `horse_corral` | `warriors` | 6 gift + 20 food | +2 horses; tended corrals breed |
| `riders` | `lancers_lodge` | `horses` | 8 gift + 10 hides | drafted lancers ride |
| `barricades` (Spike barricades) | `fire` | `builders` | 6 gift + 15 wood | unlocks the barricade |
| `spirits` (Spirit society) | `fire` | United | 10 gift + 20 wood | unlocks the Spirit lodge |
| `spirit_warriors` | `spirit_lodge` | `warriors`, United | 12 gift + 10 food | power F1 |
| `guardian_wolves` | `spirit_lodge` | `scouts`, United | 10 gift + 15 food | power F2 |
| `bison_charge` | `spirit_lodge` | `tools`, United | 12 gift + 20 food | power F3 |
| `storm_caller` | `spirit_lodge` | `builders`, United | 10 gift + 5 hides | power F4 |

## Horses and riders

- `horses` is a new store count (no store cap; shown in the resource bar with its icon).
- **Horse corral:** Camp page, 2x2, 20 wood, 220 build points, 1 worker, job `tend`, `requires: "warriors"`.
  While a `tend` worker stands at it, it adds 1 horse every 3 days (3600 ticks of tended time), up to 6
  horses per corral counted against all corrals (cap = 6 x finished corrals). Breed horses also gives 2 at once.
- **Riders:** with `riders` owned, a lancer who is drafted takes a free horse (if any) and gives it back
  when undrafted. Mounted: speed x2.5, range 1.8, damage 18 (on foot: 1.6 and 14). A mounted lancer who
  dies loses the horse. Wolves never target horses.

## Spike barricades

- 1x1 segment, Societies page, 4 wood, 50 build points, **hp 60**, within 14 tiles of the fire,
  `requires: "barricades"`. Placed by **click-and-drag** a straight line (horizontal, vertical or
  diagonal on the tile grid); each segment is its own site.
- They block **people and wolves**, so the player leaves gaps.
- **Wolf pathing:** wolves use A* on the tile grid where only barricades are walls (other buildings, the
  river and trees stay passable to wolves, as now). A wolf replans when a barricade is finished or broken.
  A wolf with no path to its target attacks the nearest barricade on its straight line in, until it breaks.

## Spirit lodge and powers

- **Spirit lodge:** Societies page, 2x2, 25 wood + 5 hides, 250 build points, no workers,
  `requires: "spirits"`.
- Each bought power can be cast **once per wave**: it recharges when the next wave warning starts. Casting
  needs the Steady band or better at that moment. A cast is an order (`cast`), so it works while paused.
  Powers never harm people.

| Power | Key | Aim | Effect |
|---|---|---|---|
| Spirit warriors | F1 | none | 4 spirit fighters at the fire for 60 s (600 ticks): hp 80, range 1.2, damage 12, club cooldown and accuracy |
| Guardian wolves | F2 | none | 5 friendly wolves at the fire for 60 s with the enemy wolf's stats |
| Bison charge | F3 | left-click a point | a herd runs from the nearest map edge through the point, 3 tiles wide, across the map; each wolf it touches takes 40 damage once |
| Storm caller | F4 | left-click a point | radius 5 for 20 s (200 ticks): wolves inside at 40% speed and 2 damage a second |

Allies (spirits, guardian wolves) fight the nearest wolf in sight 10, else wait near the fire; wolves may
target them like people. (Saving allies, storms and charges is parked, user 2026-11-20.)

## Labels (Dakota)

- Every upgrade and building type gets a `dakota` field. The UI shows `displayLabel(id)`:
  "Dakota (English)" when the Dakota word is approved in CULTURE.md, else the English. Hovering a label
  shows the English.
- The words are looked up in a Dakota dictionary (Riggs, Dakota-language projects), **never invented**;
  sacred (wakȟaŋ-) words are avoided for the spirit items. Each candidate goes to CULTURE.md *Needs
  review* with its source; the user approves and accepts some inaccuracy.
- English labels for the new items: Horse corral, Breed horses, Riders, Spike barricades, Spirit society,
  Spirit lodge, Spirit warriors, Guardian wolves, Bison charge, Storm caller.

## Resource icons

Each resource in the HUD bar gets a 16 px icon before its number: food, wood, hides, pemmican, gift, horses.
Code-drawn placeholders (`icon_<res>`), registered in [art/ASSETS.md](art/ASSETS.md) for Codex later.

## Open store on hover

Hovering a **finished** store hides its roof and walls (a cutaway view, `building_store_open`). Inside, one
pile per resource (food, wood, hides, pemmican) shows how full it is: size 0-4 =
`ceil(4 x amount / camp capacity for that resource)` (0 when empty). Proportionate, not exact. Leaving the
store brings the roof back. Visual only: no sim change, nothing saved.

## Save format

**Parked by the user, 2026-11-20, until further notice: no further save work.** What W4-W6 already
changed (`SAVE_VERSION` 5, `horses`, `tended`, `powersUsed`) stays; later tier 3 state is not saved.

Horses, the new buildings, barricade hp, wolf paths, powers used this wave, allies and active effects change
the state shape: `SAVE_VERSION` goes from 4 to **5**. **Old v4 saves become unreadable** (Export and
Delete only), as before.

## UI

- **Building panel:** the selection panel of a finished building lists its upgrades (see *Upgrade homes*).
  The U key, the Upgrades button and the panel are removed; the Wotakuye tooltip stays.
- **Power bar:** bottom left, four buttons for the bought powers (keys F1-F4), greyed while spent this wave
  or below Steady. Bison and storm then wait for a left-click on the map; Esc cancels.
- **Build menu:** Camp page gains the corral; the Societies page grows to 7 (scouts', lancers', archers',
  trap, fire pit, barricade, Spirit lodge; keys 1-7 on the shown page).
- **Toasts:** `Horses joined the camp.`, `The lancers can ride.`, `The builders can raise barricades.`,
  `The spirit society can build a lodge.`, and one per power bought.
- **Art (placeholders):** corral, horse, spirit lodge, spirit warrior, guardian wolf, bison, storm,
  barricade, store cutaway, piles, resource icons.

## Tests

Sim: waves 7-8 from two edges, won after wave 8; buy refused without a finished home building and below
United for Fantasy items; corral breeding and cap; mounted lancer beats one on foot, horse count after
draft/undraft/death; one cast per wave, refused below Steady; allies fight wolves, never people, expire;
bison lane and storm damage and slow; wolves path round a gap, attack a closed line, people blocked; a v4
file is unreadable. Smoke: buy from a building panel, cast a power, hover a store, no console errors.
