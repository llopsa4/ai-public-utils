# Survival upgrades spec (Phase D, tier 1)

Extends `DESIGN.md` section 6 (*Progression*, practical tier). Build tasks:
[PLAN.md](PLAN.md) *Phase D: upgrades*. Settled with the user 2026-11-20 by grilling (marked
**settled**). **The user approved the numbers and the save-format break on 2026-11-20**; the balance is judged
in the U6 playtest, like C8 and S7.

## Settled by the user

- **Scope:** tier 1 (practical) only, three upgrades: **hunting dogs**, **better bows**, **healers'
  society**. No lookout. Tiers 2-3 come later.
- **Gift value comes daily from Wotakuye** (no feasts, no wave rewards in this pass).
- **Healers** do the things that already exist in the game: heal wounded people and ease winter
  cold. Sickness is not added.
- **Buying:** an upgrade panel in the HUD; each upgrade costs gift value plus goods.

## Gift value

`state.gift` (number, start 0, no cap). At each day start, after the housing and newcomer rules, the
camp gains gift value by Wotakuye band: **United +2, Steady +1, Strained 0, Quarrelling 0**. A camp
that stays Steady earns about 12 by day 13; one that stays United about 24, so not every upgrade is
affordable in a normal run.

## Upgrades

`state.upgrades` is a list of bought ids (start empty). Each is bought once, from the panel, when
`gift` and the goods are in the store; the goods are taken from the store like a building cost.

| Id | Cost | Effect |
|---|---|---|
| `dogs` | 4 gift + 10 food | hunt success chance x1.15 (after the season multiplier); drafted hunters' bow accuracy +0.05 |
| `bows` | 6 gift + 5 wood + 3 hides | bow range 4.0 -> 5.0, bow damage 12 -> 15 |
| `healers` | 8 gift + 20 wood | unlocks the **healers' lodge** in the Build menu |

**Healers' lodge:** 2x2, cost 20 wood + 3 hides, 220 build points, up to 2 workers, job `heal`,
society `healers`. Placeable like the others (grass, within 14 of the fire); not buildable before the
`healers` upgrade.

- **`heal` job:** a worker picks the most wounded person with health below 80 (ties to the lowest
  id), walks to them, works 50 ticks, and the patient gains 15 health (to a maximum of 100). With no
  one below 80 the worker waits at the lodge and looks again every 50 ticks.
- **Cold:** at day start, each staffed healer worker (a `heal` worker at a completed lodge) eases the
  per-unhoused-person Wotakuye change by 1, never above `-1` (so winter's -3 becomes -2 with one
  healer and -1 with two). Other seasons are unaffected (already -1).

## Data

`src/data/upgrades.json`:

```json
{
  "giftPerDay": { "United": 2, "Steady": 1, "Strained": 0, "Quarrelling": 0 },
  "upgrades": {
    "dogs":    { "label": "Hunting dogs",   "cost": { "gift": 4, "food": 10 },           "huntSuccess": 1.15, "bowAccuracy": 0.05 },
    "bows":    { "label": "Better bows",    "cost": { "gift": 6, "wood": 5, "hides": 3 }, "bowRange": 5.0, "bowDamage": 15 },
    "healers": { "label": "Healers' society", "cost": { "gift": 8, "wood": 20 },         "unlocks": "healers_lodge" }
  }
}
```

`buildings.json` adds
`"healers_lodge": { "size": [2, 2], "cost": { "wood": 20, "hides": 3 }, "buildPoints": 220, "workers": 2, "job": "heal", "society": "healers", "requires": "healers" }`;
`jobs.json` adds `"heal": { "below": 80, "ticks": 50, "amount": 15, "coldEase": 1 }`.

## Save format

`GameState` gains `gift` and `upgrades`, so `SAVE_VERSION` goes from 2 to **3**. As with seasons,
**old v2 saves become unreadable** (no migration); their slot cards show *Unreadable save* and offer
Export and Delete. The feature is unreleased, so this is accepted unless the user asks for a
conversion.

## UI

> Superseded in part by [DESIGN-upgrades-3.md](DESIGN-upgrades-3.md) (2026-11-20): upgrades are bought from
> their home building; the Upgrades panel below is removed.

- **Resource bar:** `Gift n` after Pemmican. The Wotakuye bar keeps its place; shrink the gaps if the
  bar overflows 1280 px.
- **Upgrades panel:** a HUD button **Upgrades** (key U) beside Menu opens a panel of three cards
  (label, effect line, cost, **Buy**). A card shows *Bought* once owned and a greyed Buy with the
  missing items named while unaffordable. The panel does not pause the game and closes with U, Esc or
  its close button; while open it blocks map clicks (`overUi`), like the Menu panel.
- **Build menu:** a sixth entry **Healers' lodge** (key 6), shown only after `healers` is bought;
  placeholder art `building_healers_lodge` (art/ASSETS.md).
- **Toasts:** `Hunting dogs joined the hunters.`, `Hunters' bows are stronger.`, `The healers can build
  a lodge.` on purchase; `<name> was treated.` is not shown (too chatty).

## Wotakuye help

Added 2026-11-20 by grilling (the user asked for the Wotakuye rules to be shown in the game).

- **Where:** a hover tooltip on the HUD Wotakuye bar, hinted by a small `?` at the bar's right end. It
  opens at once, hangs below the bar (right-aligned, 440 px wide), updates live, works while paused and
  closes when the pointer leaves. It is hover-only: clicks pass through.
- **Content:** `src/sim/help.ts` `wotakuyeHelp(state)` returns the band, the **live** lines and the
  **rule** lines; the HUD only draws them. All numbers are read from `resources.json`, `seasons.json` and
  `upgrades.json`, so a rebalance changes the tooltip.
  - Live: the unhoused cost at the next day start (`N people have no bed: -X`, using the season's rate
    and any staffed healers' ease), the next meal (`+2` when the store, food plus pemmican x1.5, covers
    the need, else `F food short, about D`), `Gift tomorrow`, and the gap up to the next band plus the
    floor of the current one. The figures are approximate: meals and the day start interact.
  - Rules: the events (full meal, short meal, a death, no bed, a wave beaten) and the four bands with
    work multiplier, newcomer or leave effect and gift per day; the current band's line starts with `>`.
- **Tests:** `tests/sim/help.test.ts` (live lines, band edges, the rules, and that a changed data value
  changes the text); smoke test 5 hovers the bar.

## Tests

`tests/sim/upgrades.test.ts`: gift per day by band (United 2, Steady 1, Strained 0); buying takes the
cost and refuses when short or already owned; `dogs` multiplies hunt success and adds bow accuracy
(rng draw count unchanged); `bows` changes the bow range and damage used in a duel; the lodge cannot
be placed before `healers` and can after; a `heal` worker raises the most wounded person by 15 and
idles when nobody is below 80; one staffed healer makes winter cold -2 per unhoused person, two make
-1, and summer stays -1; a saved and loaded run keeps `gift` and `upgrades` and equals the unsaved run
(`SAVE_VERSION` 3; a v2 file is unreadable).
`tests/smoke.spec.ts`: open the Upgrades panel with U (via a `window.camp` hook), buy `dogs` after
setting `gift` through the debug state, and see the toast; no console errors.
