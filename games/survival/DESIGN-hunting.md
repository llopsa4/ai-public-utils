# Survival spec: hunting, camp life and feedback (Phase D)

Settled with the user 2026-11-20 by grilling (one question at a time) and by approving the plan, numbers
included, after an Opus review; the spec itself (with its proposed details) accepted 2026-11-20. Build tasks: [PLAN.md](PLAN.md) *Phase D: hunting and camp life* (rows G1-G15).
Saving stays **parked**: no `SAVE_VERSION` change and no save code. Balance is judged in the G15 playtest.

## Settled by the user

- **Wild game:** deer and bison roam the map and replace the abstract hunt roll. They never attack; wolves stay
  the only enemies.
- **Kills go to the nearest store,** carried on the hunter's back in loads. Meat is **Food** (no new resource).
- **Arrows are drawn** for every bow shot; hunters hold a bow.
- **Right-click an animal** with hunters selected to hunt it; right-click a carcass to fetch a load.
- **No shared standing tile** for people.
- **Right-click feedback** on every order.
- **Ctrl-click:** nothing new (Shift-click already adds or removes one person).
- **Work animations:** hammer, axe, gathering, drying.
- **Carried goods** shown in the selection panel only.
- **Store 4x4** with 4x the capacity; **council fire a 4x4 plaza** where idle people sit.
- **Names** under selected people only.
- **Full store:** orders take over and blocked people find other work.
- **Music:** original, generated in code; war music while wolves are on the map.
- **Old saves are left alone:** a camp saved before this may load with overlapping buildings; start a new camp.

## Wild game

Numbers live in `src/data/animals.json`.

| | Deer | Bison |
|---|---|---|
| hp | 24 (2 bow hits of 12) | 72 (6 hits) |
| meat (Food) | 10 | 30 |
| hides | 1 | 3 |
| speed | wanders 0.03, flees 0.16 tiles/tick once shot | wanders 0.05, flees 0.1 once shot |
| start herds | 2 herds of 3 | 1 herd of 4 |

- Start herds stand 14-22 tiles from the fire. Herds wander slowly as a group and stop fleeing after a while.
- **Respawn:** a new herd (deer or bison, drawn by the seed) every 2 days at a map edge while fewer than 12
  animals live; in winter every 4 days.
- **Movement:** on walkable tiles with `findGridPath` (the river only at fords, round buildings and barricades).
  Wolves, allies and the powers (bison charge, storm) ignore real animals; wolves do not eat carcasses.
- **State:** `GameState.animals` (animals and carcasses), read through a tolerant `animalsOf` (an older state has
  none). Not validated by `parseSave` (saving is parked); `serialize` writes it like any state field.

## Hunting

- A hunter (hunting lodge worker, or any adult given the job) picks the nearest live animal within **spotting
  distance 22 tiles** (**26 with Hunting dogs**) of the fire, walks to bow range, and shoots with the hunter's bow
  (`fighterOf`: range, damage, cooldown, accuracy; Better bows applies). Each shot is a deterministic roll as now.
- With no animal in reach the hunter waits by the fire and looks again every 50 ticks (5 s).
- **Seasons:** the old `huntSuccess` per season now scales the respawn chance (a respawn day spawns a herd with
  probability `huntSuccess`, capped at 1). Dogs no longer change a roll; they widen spotting distance and keep
  `bowAccuracy +0.05`.
- **The kill:** a dead animal becomes a **carcass** on its tile holding its meat and hides. A hunter lifts up to
  **10 meat** (all the hides ride on the first load), walks to the **nearest finished store** (`startDeliver` /
  `doDeliver`) and comes back for the next load until the carcass is empty, then it is gone. A deer is one trip,
  a bison three. Any hunter may take the next load. Carcasses never spoil (for now).
- **Orders:** right-click a live animal with hunters (or adults) selected: they hunt that animal. Right-click a
  carcass: they fetch its next load. Drafted fighters keep attacking wolves only.
- **Drawn:** placeholder deer, bison and carcass; a hunter carrying a load has it on their back.
- Help text, upgrade effect lines and tests that describe the old roll are rewritten.

## Arrows

Every bow shot (hunters at animals, drafted hunters and archers at wolves) draws a small arrow flying from the
archer to the target; a miss sticks in the ground beside it for a moment. Arrows are **drawn only**: nothing about
them is in the state. Hunters are drawn holding a bow.

## No shared standing tile

- Anyone standing still (working, waiting, idle, sitting, a drafted post, fleeing to the fire, queueing at a store
  or a site) has a tile of their own. People walking may pass through each other.
- A spot picker (ring spots, store and site rings, the fire ring, seats, group moves) skips a tile already held by
  a standing person or chosen as another person's walk goal; ties are broken by the lowest id, so the sim stays
  deterministic. When no tile is free the person waits on the nearest free tile.

## Right-click feedback

- Every right-click draws a ring that grows and fades over about 0.7 s where you clicked: **green** move, **gold**
  work (chop, gather, build, assign, hunt, fetch), **red** attack. It also runs while paused.
- The target pulses: a ring that follows the wolf or animal, a flash outline on a building, a ring on a tree or
  berry tile.
- A **grey** ring and a toast when the click can tell at once that the order is refused (attack with nobody
  drafted: `Nobody is drafted.`; a work order with nobody able to work). Other refusals keep their usual toast.

## Work animations

Code-drawn placeholders, the same for both families, while a person is at work: a **hammer** for builders (only
while the site has its materials and is going up), an **axe** for woodcutters, a **stooping pick** for gatherers,
a **rack-tending** motion for dryers, and the **bow draw** for a hunter shooting.

## Carried goods

The selection panel adds a line: `Carrying: 5 wood`, a hunter's load as `Carrying: 10 meat, 1 hide`; for several
people, the totals per resource. Nothing when the load is empty.

## Names

*Superseded 2026-11-20 by [Villager panel and building](#villager-panel-and-building): names and families are no
longer drawn under people's feet, only in the details panel. The name pool below still stands.*
People have **invented plain names** from a pool in `map.json` (`start.names`: nature words such as Wren,
Willow, Heron), not the old `Cottonwood 3`; the user chose this 2026-11-20 (no claim about real Dakota names,
so no CULTURE.md entry). A person gets the first pool name no living person has; after 50, a number is added.

## Store

- Footprint 2x2 -> **4x4**; capacity x4: food **800**, wood **600**, hides **160**, pemmican **400**. Cost (15 wood)
  and build points (200) unchanged.
- New, bigger sprites for the store and its open view. Its stock shows as small counted items (`## Stock items`).

## Council plaza

- The council fire grows from 2x2 to a **4x4 plaza**: a bigger fire in the middle, hide mats and log seats round
  it, decoration (drying poles, a drum, baskets). Fire hp, the upgrades list and the wolves' goal are unchanged.
- **Sitting:** anyone idle (no job or nothing to do; elders and children too) walks to a free tile on the ring
  round the plaza and sits; they leave when given work. When the ring is full the rest wait nearby as today.

## Start camp

Both 4x4 buildings need a free ring row round them, so the start layout changes (checked in G4 against
`clearRadius` and the map): fire plaza at **[22, 22]** (tiles 22-25), tipis at **[18, 22]** and **[28, 22]**, store at
**[22, 17]** (tiles 22-25 x 17-20, **north, behind the fire**; user, 2026-11-20: from the south its roof hid part of the plaza,
behind the fire it cannot). Every building keeps at least one free ring row. Stores the player builds later may stand
anywhere; there is no placement rule for the plaza.

## Full store

When a person holds goods and every store is full:
- **Your order wins:** any order (build, chop, move, hunt...) starts at once; the person keeps the goods and
  delivers them later when a store has room. A builder holding wood or hides drops them at a site that needs them.
- **With no order,** after one failed delivery the person stops waiting and takes other free work such as building
  (`findAutoWork`). Toast `Store is full` (once per blocked person).

## Music

- Original music generated in code with Web Audio (no files): a calm **ambient** bed (a soft wooden-flute-like
  melody on a pentatonic scale, a low hand-drum heartbeat, light wind) and a **war** track (a faster driving drum,
  a tense low drone).
- **War music plays only while wolves are on the map:** from the first spawn until about 5 s after the last wolf
  is dead or fled; about 2 s crossfades. Ambient otherwise.
- Sound starts after the first click (the browser's rule; the menu click counts). The HUD menu has a music on/off
  toggle and a volume control, remembered in the browser.
- `CULTURE.md` gets a note that the music is original and only inspired by the sound world, not traditional or
  sacred music and not a recording; the user decides the wording.

## Tests

- Unit: herds spawn and respawn under the cap, a deer falls in about 2-3 hits and a bison in about 6, a bison
  takes three trips, meat and hides reach the store, spotting distance with dogs, the hunt and fetch orders;
  distinct tiles for 3 builders, 4 deliverers, 4 fleeing, a group move and seated idle people; the full-store
  rules (forced with a full store); the carry text; music mode switching (pure helpers).
- Smoke (`npm run e2e`): the 4x4 store open view, a right-click ping on ground, a tree and a wolf, a hunt order on
  an animal, the music toggle and mode, no console errors.

## Stock items

Decided with the user 2026-11-20 (grilling Q3, Q4, Q7). The open store (hover) no longer shows four flat piles in four
sizes but **small counted items in the store's own isometric view**:

| Stock | Item | One item is (one store) | Full store |
| --- | --- | --- | --- |
| Food (fruit; meat too once hunting arrives, it is the same Food) | basket of fruit | 20 | 40 baskets |
| Wood | log | 15 | 40 logs |
| Hides | hide bundle | 4 | 40 bundles |
| Pemmican | pemmican bag | 10 | 40 bags |

- The count is `ceil(40 x amount / camp capacity)`, so a non-empty stock always shows at least one item, and with
  more stores each item stands for more (the camp's whole store is shown, as before).
- Props are drawn in the 2:1 projection (a basket with an elliptical rim, a log lying along the grid, a folded
  hide, a flat-based bag), about a tenth of the old pile size (16 x 16 canvases), depth-sorted. Each resource owns
  one quarter of the open floor, a 5 x 4 grid of slots filled back to front; items 21-40 sit on a second layer.
  Nothing is drawn outside the floor diamond.
- The HUD resource icons stay flat 16 px interface icons.

## People icon and berry patch panel

- The bar shows the head count as an icon (`icon_people`, a head and shoulders) and the number; hovering it says
  `People`. The count is everyone, adults and children (the old `12 / 20` adults-over-total confused the user).
- Left-clicking a berry bush (no building or person on it) selects it: the bottom panel reads `Berry patch` and
  `17 of 40 fruit left` (what is left on that bush, and the most it holds). Esc or another click closes it.

## Villager panel and building

Settled by the user 2026-11-20 (grilled). Replaces the labels in [Names](#names) and the B build menu in
`DESIGN-slice.md` `## UI` and `DESIGN-upgrades-2.md` `## UI`.

- **No labels on the map.** Selected people show only their selection ring. Name and family appear only in the
  details panel.
- **Title.** The panel title (a person's name, a building, `N people selected`, `Berry patch`) is 20 px bold serif
  in warm gold, with a thin rule under it. The detail text keeps its current style. For one person, the first detail
  line (`<Family> family · <age>`) is drawn in the family's colour.
- **One way to build.** The standalone build menu and its `Build (B)` corner button are removed. You cannot build
  while nothing is selected.
- **Cards in the panel.** The details panel spans the whole bottom strip (1280 px). When at least one selected
  person can build (an adult who is not drafted), the building cards fill the right part of the panel, with the
  Camp / Societies pages and Tab as before. They are hidden when no selected person can build (only children, or
  only drafted people).
- **Keys.** B arms the cards (they highlight). The next 1-7 picks a building, and Esc disarms or cancels placing.
  When the cards are not armed, 1-3 still set game speed. Clicking a card always works.
- **Builders at once.** Placing a site makes up to 3 of the selected able people its builders (the existing cap).
  The rest of the selection keeps their current jobs, and a toast says how many joined (`3 of 5 joined the build`).
  The builders are the people selected when the card was picked. Clearing the selection cancels placing.
- **Barricade lines.** Up to 3 selected builders build the first site of a dragged line. When it is done, they go
  on to the next unfinished site of the same line until the line is complete. Saving stays parked: the line link is
  not written to saves.
