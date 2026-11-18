# Dakota content pack (B1): DRAFT, waiting for the user's review

Written by Claude (Opus) on 2026-11-18 for [PLAN-dakota.md](PLAN-dakota.md) phase B. It builds on
[SLICE.md](SLICE.md) (approved) and [DESIGN.md](DESIGN.md), and every cultural element cites
[CULTURE.md](CULTURE.md) (**CM**). The research it draws on is in
[research/dakota.md](research/dakota.md) (**RD**). Status tags: **✔** approved in CM · **⏳ NR n**
waits on CM *Needs review* item n · **🎮** game invention (no cultural claim). Once the user approves
this pack, each phase C task builds from it without new design questions. Numbers are starting
values for D1 to tune.

**Your decisions in this review (the rest is ready):** NR 23 (the digging stick as a second new
weapon), NR 24 (no second garment is sourced), NR 25 (the draft elder texts in §11) and NR 26 (how
Eya is told without the trickster). Each one has a fallback, so the build is not blocked.

## 1. Sacred check of the round 3 picks (CM 17–22)

The approved picks are usable. These guard rules apply in every phase C task:

- **Double-Face (17a):** always a **male giant** with a face in front and a face behind (Zitkala-Ša,
  RD). He is never shown as a woman and never with "one beautiful, one ugly" faces, so he cannot be
  read as Anog-Ite (CM Off-limits, NR 12). The child is **never hit, hurt or shown suffering**: the
  story's thorn-bush torture and the poisoned arrow are left out (RD, SLICE). He is shot "through the
  heart" (Eastman), which becomes a game rule (arrows hurt him more).
- **Eya (17b):** shells only; the "dried human ears" are dropped (RD). Unktomee (Iktomi) is **not
  shown or named** while CM NR 11 is open (⏳ NR 26). The freed camp walks out; no dance is
  animated (only the text mentions it).
- **Lacrosse stick (19):** a plain netted stick. **No ball is ever shown** (the ball was made by a
  medicine man, RD).
- **Quiver (19):** shows plain arrow shafts and **no fletching** (feathers are banned on every item,
  art/STYLE.md).
- **Parfleche (19):** plain rawhide with **no painted design** (no motif is sourced, as with CM NR 14).
- **Winter camp teepees (20, NR 15):** plain hide with **no painted designs**. The camp is empty
  (its people are inside); nobody fights at a home.
- **Foods (21):** the duck-bill moulded maple-sugar cakes may be drawn (RD). Wild rice stays (user
  decision); no offering to the Water Chief or pit dancing is shown.
- **Words (22):** the game prints no Dakota words except the two approved place names (§12).
- **Helpers (18):** Squirrel's nuts are food, not a charm. Wabeda is Eastman's own dog. A dog is
  not a real person, so the no-real-people rule is not touched.

## 2. Run structure

| Step | What | Notes |
|---|---|---|
| Rooms 1–3 | places chosen by door | early waves (§5) |
| Mini-boss | **Sage hollow: Double-Face** | always 4th; one door only ("Something cries in the sage") |
| Rooms 5–7 | places chosen by door | late waves (two waves each) |
| Boss | **Iya** (dawn prairie) or, once unlocked, a choice of **Iya** or **Eya** (shell flats) | final door |

- The places come from the unlocked pool (§5): 6 places at the start (5 slice places plus the river
  ford, so a run never runs out) and 9 when all are unlocked. Each door shows a place and a reward
  kind, as it does now (gift / rest 30 / goods +2). 🎮
- **Boss choice** 🎮 (from SLICE premise ✔ and CM 17b): after the first win, the elder says the
  story is told two ways; from then on the last door offers *"Open prairie at dawn: Iya (Zitkala-Ša's
  telling)"* or *"Shell flats at first light: Eya (Eastman's telling)"*. Eya is harder and gives
  +3 goods more.
- **Rewards:** each room returns 1 good (+1 with the parfleche). Double-Face gives 3 goods and an
  always-gift. A win gives 5 goods (Eya: 8) and one missing item, as now.
- **Falling** carries the hero home, as now.

## 3. Difficulty curve

- `i` = fights finished this run before the current one (0–6; the mini-boss counts).
  Room enemy HP ×(1 + 0.12·i), damage ×(1 + 0.05·i). Bosses and the mini-boss do not scale.
- Early rooms (1–3): one wave. Late rooms (5–7): two waves; the second spawns 1 s after the first
  is cleared, at the far side from the hero.
- Hero: 100 HP. Healing: food 15 (+10 maple grove), rest door 30, youngest-bear gift 20 per room.
- Boss HP: **Iya 480** (was 420; runs are now longer, with more gifts), **Double-Face 260**,
  **Eya 540**.
- Target for D1: the first win comes on run 2–4, and a full camp after about 10–12 runs.

## 4. New threats (all 🎮, shapeless spirits; CM *May show*: "invented, shapeless spirit enemies make no cultural claim")

Same rules as the slice spirits: no faces, no animal parts, no symbols; cold and dull, faintly glowing
(art/STYLE.md). Beaten, they make the **land renew** (a food drop), as now.

| Id | Kind | Behaviour (`behaviour` field) | Stats |
|---|---|---|---|
| `sleet_spirit` | winter, ranged | `ranged`: keeps 5–7 units from the hero and backs away if the hero is within 3. It winds up 0.8 s (a thin line shows the shot), then fires one ice shard (speed 7, life 1.6 s, damage 9, effect `slow`). Shards stop at obstacles; dash dodges them. Cooldown 2.2 s. | hp 26, speed 2.2, size 0.55, drop 0.5 |
| `gnawing_hollow` | hunger, burrower | `burrow`: underground for 2.0 s (only a faint moving ripple shows; it cannot be hit). Then it surfaces under the hero's position with a 0.9 s ring (radius 1.2; damage 14, effect `healBlock` 3 s). It stays exposed for 1.8 s and sinks again. **Underground, it swallows any food it passes; beaten, it releases all of it** plus its own drop (*released, not taken*, DESIGN Progression). | hp 36, speed 3.0 underground, size 0.8, drop 0.5 |
| `fever_mist` | sickness, hazard | `trail`: drifts slowly toward the hero and leaves a sickness patch every 1.5 s (radius 1.0, lasts 6 s, 6 damage per second to the hero only). Its touch strike: windup 0.8, reach 1.0, damage 8. Beaten, all its patches fade. | hp 44, speed 1.4, size 0.8, drop 0.6 |

The coyote's gift now also clears patches the hero rolls through (§7). A marked (tracked) hollow
shows its ripple brightly.

## 5. Places and room layouts

The room is 16 × 16 (x and z from −8 to 8). The back edges (z = −8, x = −8) may hold tall props; the
front edges (z = +8, x = +8) hold only low props. The hero enters at (0, 5), and a 2.5-unit circle
around it stays clear.

**New data fields:**
- **Obstacles** are `{x, z, hx, hz, prop}`, where `hx` and `hz` are half extents (the old `half` is
  shorthand for a square).
- **Zones** are `{kind, x, z, w, d}`: `shallow` slows everyone who walks (×0.7; floating spirits
  ignore it), and `ice` makes the hero slide (the move direction eases in over 0.35 s).
- Props come from the kit in [art/briefs/props_dakota.md](art/briefs/props_dakota.md).

In the wave lists below: W frost wisp · H hunger shade · B blight swarm · S sleet spirit ·
G gnawing hollow · F fever mist.

| Id | Name (banner) and season | Source | Obstacles (prop @ x,z, half extents) | Zones | Early wave | Late waves | Ambience |
|---|---|---|---|---|---|---|---|
| `lakeshore` | Lakeshore, summer | ✔ May show, region | boulder −4,−3 (0.7); boulder 3,−5 (0.6); birch_canoe 5,−0.5 (1.1×0.4) | shallow 0,−6.5 16×3 | W W B B B | W W B B B S · G B B B | water |
| `woodland` | River-valley woodland, summer | ✔ region | tree_birch −5,−4 · −2,−1 · 3,−3 · 5,2 · −4,3 (each 0.45) | none | H W W | H W W S · H S S | woods |
| `maple_grove` | Maple-sugar grove, spring thaw | ✔ region; CM 20 | tree_maple −5,−5 · 0,−4 · 5,−5 · −5,1 · 5,1 (0.45); sap_kettle 0,−0.5 (0.6) | none (sap_trough is decoration) | H B×5 | H B×5 · F G | woods |
| `rice_lake` | Wild-rice lake edge, late summer | ✔ region; CM 20, 21 | birch_canoe −4,−4 (1.2×0.4); boulder 4,−3 (0.6) | shallow −4,−2 8×12 | W W W H | W W W H · S S G | water |
| `prairie` | Prairie before dawn, night | ✔ region | sage_bush −5,−2 · −1,−5 · 4,−1 · 6,−6 (0.5) | none | H W B B B | H H W W B B B · F F | night |
| `river_ford` | River ford, summer (**base pool**) | CM 20 (generic ford only) | ford_stones −3,−1 · 1,−0.5 · 4,−1.5 (0.5); willow_shrub −6,−5 (0.6) | shallow 0,−1 16×4 | S W B B | S S W B B · G G W | water |
| `fish_dam_brook` | Fish-dam brook, autumn (unlock) | CM 20 | fish_dam −2,−4.5 (1.5×0.3) and −2,−1.5 (1.5×0.3), leaving a gap at z −3; willow_basket −0.6,−3 (0.4); boulder 4,−4 (0.6) | shallow −2,0 3×16 | G B B B | G G B B B · S W H | water |
| `winter_camp` | Winter camp by the frozen lake, winter (unlock) | CM 15, 20 | teepee 2,−6 (1.2); teepee 6,−5 (1.0); firewood −2,−2 (0.5); rib_sled 3,−1 (0.8×0.35); snowdrift 5,3 (0.6) | ice −4,−4 8×8 | W W S | W W W S · S S W W | wind |
| `berry_meadow` | Drying-rack meadow, summer (unlock) | CM 20, 21 | drying_rack −4,−4 (1.0×0.3); drying_rack 2,−5 (1.0×0.3); berry_bush −5,1 (0.6) · 4,0 (0.6) · 6,−2 (0.5) | none | F B B B | F F B B B · G H H | woods |

**Arenas:**

| Id | Name | Layout | Ambience |
|---|---|---|---|
| `sage_hollow` | Sage hollow (Double-Face) | sage_bush −4,−3 · 4,−3 · −4,3 · 4,3 (0.6); open centre | wind |
| `dawn_prairie` | Open prairie at dawn (Iya) | sage_bush −6,−6 · 6,−6 (0.5); open | wind |
| `shell_flats` | Shell flats at first light (Eya) | boulder −6,−6 · 6,−6 (0.6); shallow 0,−7 16×2; shell spots −5,−2 · 5,−2 · −4,3 · 4,3 | water |

## 6. Mini-boss and bosses

### Double-Face (mini-boss; ✔ CM 17a; mechanics 🎮)
- **Look:** a tall gaunt male giant (2.6 units) with a plain face in front and one behind, and a
  hide bundle (the stolen child) on his left hip. See the
  [brief](art/briefs/double_face.md).
- **Two faces:** his swipe hits **in front and behind** at once (two 120° arcs, reach 2.4, windup
  0.8, damage 16). **His sides are open.** He turns slowly (90°/s), so the hero can circle to a side.
- **The lure** (he lures children away, Eastman): every 8 s he beckons for 1.5 s. The hero is pulled
  toward him at 2.5 units/s unless dashing. A beckoning arm and a soft pull line show it.
- **Through the heart** (Eastman): arrows do ×1.6 damage to him, and the axe does ×0.85.
- **Phase 2** (≤ 50% HP): he makes **one false double** (1 HP, the same look but no bundle; its
  strikes do half damage). The two swap places every 6 s. A hit dissolves the double in a puff, and a
  new one comes 6 s later. **Track** marks only the real one.
- **Defeat:** he falls, and the bundle is set down gently: *"The child is free. He will grow up
  among the people."* +3 goods, then an always-gift. The child is never in an attack's path, and no
  hit can touch the bundle.
- Data: `double_face` in enemies.json, `boss: "mini"`, hp 260, speed 2.4, size 1.1, height 2.6.

### Iya, the Camp-Eater (final boss; ✔ CM May show; slice mechanics kept)
As built, with HP 480. Win text unchanged.

### Eya (final boss, second telling; ✔ CM 17b; mechanics 🎮)
The same monster as Iya in Eastman's telling. The **iya.glb model is reused**; the shells and the
helpless pose come from code and the kit.
- **Phase 1** (> 50%): the Iya lunge (as built), plus a **swallow**: windup 1.2 s, then a cone
  (90°, length 4) pulls the hero in for 1.0 s. If the hero ends within 1.2 of him, she or he is
  swallowed: hidden 1.5 s, takes 20 damage, then spat out at a random clear spot.
- **Shells:** 3 mussel-shell piles sit on 3 of the 4 shell spots. If a swallow cone covers a pile,
  **he swallows the shells instead** (shells take priority) and is **helpless for 5 s**: he slumps,
  cannot attack and takes ×2 damage. The pile comes back on a free spot after 15 s. The tactic:
  stand behind a pile.
- **Phase 2** (≤ 50%): **he screams** every 10 s: an expanding ring (dash through it, or take 12
  damage and a knockback). Only 2 piles remain; helpless lasts 4 s; speed ×1.15.
- **Defeat:** *"Heavy with shells, Eya falls. Everyone he swallowed pours out onto the plain,
  singing."* Win: 8 goods and one missing item.
- Data: `eya` in enemies.json, `boss: true`, `model: "iya"`, hp 540.

## 7. Gifts (6 new; ✔ CM 18 and May show helpers; effects 🎮)

| Id | Helper | Name | Text | Effect | Where from (CM / RD) | Available |
|---|---|---|---|---|---|---|
| `mink` | The mink | Break the hunt | Axe or arrow hits on a threat winding up cancel its strike. | `interruptWindup` (bosses: windup −0.3 s instead) | CM 18; breaks up the Crane's hunt (Eastman) | camp: Fish dam |
| `water_snake` | The water snake | Slip through | Your dash passes through threats and strikes each one for 12. | `dashStrike` 12 | CM 18; same story | camp: Fish dam |
| `squirrel` | The squirrel | Nuts put by | Beaten threats leave food 50% more often. | `dropMul` 1.5 (cap 1) | CM 18; nuts as food | camp: Drying racks |
| `wabeda` | Wabeda the dog | Watchful | Every threat shows where it will strike. | `showAllRings` | CM 18; warns of danger (Eastman) | camp: Wabeda by the fire |
| `manstin_heart` | Manstin the rabbit | Through the heart | Your arrows fly on through the first threat they hit. | `volleyPierce` 1 | CM 17a, May show; shoots Double-Face through the heart | after Double-Face is first beaten |
| `patkasa_leap` | Patkasa the turtle | Long leap | Your dash carries 30% farther. | `dashDistMul` 1.3 | May show; wins a jumping contest (Zitkala-Ša) | from the start |

- **Changed:** the coyote's gift text becomes *"Dashing shakes off cold and slowing, and clears
  sickness patches you roll through."* (the coyote survives the fire by rolling, RD).
- **Offer rule:** at most one gift per helper in an offer; locked gifts are never offered. Gifts
  get an optional `requires` field (an unlock id or a progress flag).

## 8. Items (✔ CM 19; mods 🎮)

| Id | Slot | Name | Text | Mods | Where it shows | Made at camp |
|---|---|---|---|---|---|---|
| `lacrosse_stick` | weapon | Netted lacrosse stick | A wide sweeping swing that drives threats back. | `axeMul` 0.9, `wideArc` (arc to a half circle), `knockMul` 2 | right hand | 6 goods, needs Practice ground |
| `digging_stick` ⏳ NR 23 | weapon | Digging stick | A long reach, but slower strikes. | `reachAdd` 0.8, `axeMul` 1.1, `gapMul` 1.15 | right hand | 5 goods, needs Drying racks |
| `fringed_quiver` | accessory | Fringed quiver | Two more arrows in each volley. | `volleyCount` +2, spread ×1.2 | back (`attach_back`, new, on `chest`) | 5 goods |
| `parfleche_bag` | accessory | Parfleche bag | Carry more home: +1 goods for each room cleared. | `goodsPerRoom` +1 | left hip (`attach_accessory`) | 4 goods, needs Drying racks |
| `long_snowshoes` | accessory | Long snowshoes | Straight toes: you move 12% faster and stay steady on ice. | `speedMul` 1.12, `iceGrip` | both feet (skinned to `foot.L/R`, like a garment) | 6 goods, needs Winter lodges |
| `short_snowshoes` | accessory | Short snowshoes | Upturned toes: your dash recharges 20% faster, and you stay steady on ice. | `dashCooldownMul` 0.8, `iceGrip` | both feet (skinned) | 6 goods, needs Winter lodges |

- **Garment slot:** the fringed buckskin shirt and leggings (CM 19, "for the man hero") become the
  **man hero's base clothing**, because a base body must look complete with nothing equipped
  (art/STYLE.md). No other garment is sourced, so the slot keeps only the buffalo robe (⏳ NR 24).
- **Making items** 🎮: the Equipment screen lists missing items with *"Make (cost)"* once their
  `needs` unlock is built. Making spends goods. A win still returns one missing item for free.
  Existing items get costs too: short axe 5, buffalo robe 6, beaded knife 5.
- **Gear fits both heroes:** garments are skinned by bone name; the robe is built to fit the wider
  hero (the man).

## 9. Camp growth (DESIGN Progression ✔; unlock contents per CM entries listed)

| Id | Name | Cost | Needs | Adds | CM |
|---|---|---|---|---|---|
| `maple_grove` | Maple-sugar grove | 3 | none | food heals +10 (exists) | region, food |
| `wabeda` | Wabeda by the fire | 4 | none | gift: Wabeda | 18 |
| `practice_ground` | Practice ground | 6 | none | volley +20% (exists); lacrosse stick can be made | May show (archery, lacrosse) |
| `fish_dam` | Fish dam on the brook | 6 | none | place: fish-dam brook; gifts: mink, water snake | 18, 20 |
| `drying_racks` | Drying racks | 8 | none | place: drying-rack meadow; gift: squirrel; parfleche and digging stick can be made | 18, 20, 21 |
| `winter_lodges` | Winter lodges by the lake | 10 | none | place: winter camp by the frozen lake; snowshoes can be made | 15, 19, 20 |
| `lacrosse` | Lacrosse games | 12 | practice_ground | dash cooldown ×0.85 | May show (lacrosse) |

Data: each unlock gets `adds: { places: [], gifts: [], items: [] }` and `needs`. The run's place
pool and gift pool read the built unlocks. Saves stay compatible: older saves have none of the new
unlocks built.

**Elder stories** (Elder screen): `iya` (as now, after meeting Iya); `double_face` (after meeting
Double-Face); `eya` (after the first win; this also opens the boss choice). Texts are in §11.

## 10. Man hero and hero choice (DESIGN Characters ✔)

- **Man hero** ([brief](art/briefs/hero_dakota_man.md)): a fringed buckskin shirt, fringed leggings
  and beaded moccasins (CM 19; Eastman via RD). Plain, invented hair: two long braids with plain
  leather ties (invention allowed, CM NR 13 decision). No headband, so he is told apart from the
  woman at a glance; no otter skin, feathers or paint. Same rig, bone names, animations and attach
  points; budget 3,000 triangles.
- **Hero choice:** a camp option *"Hero: Woman / Man"* swaps the model at once. It is saved as
  `kota.hero`. Moveset, stats and equipment are shared; gear moves to the other model.

## 11. Text (WRITE; ⏳ NR 25: drafts for the user's approval)

**Elder: "Old Double-Face"** (credit: *From Zitkala-Ša, Old Indian Legends (1901), and Charles
Eastman (Ohiyesa) with Elaine Goodale Eastman, Wigwam Evenings.*)
> Old Double-Face was a giant with a face in front and a face behind, so no one could creep up on
> him. He lured children away from the camps. Once he carried off a baby boy and kept him far from
> his people. Manstin the rabbit hid behind a sage bush and shot him through the heart. The boy was
> free, and he grew up to be a young man.

**Elder: "Eya, the Devourer"** (credit: *From Charles Eastman (Ohiyesa) with Elaine Goodale Eastman,
Wigwam Evenings.*)
> The story is told another way too. A baby was found and taken in, but he was never satisfied, and
> when he screamed, people saw the swallowed in his throat. The camp fled before dawn. Eya followed,
> and he was fooled into swallowing mussel shells, thinking them food. Heavy and helpless, he was cut
> open with knives, and everyone he had swallowed poured out onto the plain, singing and dancing in
> thanks.

**Elder line that opens the boss choice:** *"You freed the camp. The old people tell Iya's story
more than one way. Next time, you may meet him as Eya."*

**Unlock texts** (camp screen):
- Wabeda by the fire: *"Wabeda the dog keeps watch. A new helper may offer a gift."*
- Fish dam on the brook: *"Willow baskets wait at the dam. A new place, and the mink and the water snake may help."*
- Drying racks: *"Meat dries in the summer sun. A new place, and the squirrel may help."*
- Winter lodges by the lake: *"The lodges stand ready for winter. A new place, and snowshoes can be made."*
- Lacrosse games: *"Running the long field: your dash recharges faster."*

## 12. Place names in the UI (✔ CM May show: place names; ✔ Language rule)

- At the start of each run, a banner shows **Mni Sota Makoce** with *"the land where the waters
  reflect the sky"* under it. The camp title is **Camp in Cansa'yapi**, with *"where they marked the
  trees red: the Minnesota River Valley"* under it. Both are spelled as on the Lower Sioux site
  (RD); the translation is always shown.
- On room entry, a banner shows the English place name and season (§5) for 2 s. No other Dakota
  words are used.

## 13. Tutorial hints (first run; skippable)

Hints are small banners at the top centre; none of them pauses play. Each is shown once and
disappears after 4 s or when the player does the action. The first hint has a *"Skip hints"*
button, and Settings gets *"Hints: on/off"*. Seen hints are saved as `kota.hints`.

| Id | When | Text |
|---|---|---|
| move | first room starts | Drag on the left side to move. |
| attack | 1.5 s later | Tap the axe to strike. Hold it to keep swinging. |
| dash | first enemy windup | A glowing threat is about to strike. Tap dash to roll away. |
| volley | first kill | Bow: tap to shoot the nearest threat, or drag the button to aim. |
| track | second room starts | Track marks nearby threats: they take more damage and show where they will strike. |
| food | first food drop | The land renews where a threat is beaten. Walk over the food to heal. |
| gift | first gift screen | Helpers from the stories offer gifts. A gift lasts for this run. |
| door | first door screen | Each door shows the place ahead and what you will find after it. |
| hollow | first gnawing hollow | A gnawing hollow eats food on the ground. Beat it and the food comes back. |
| double_face | Double-Face appears | Double-Face strikes in front and behind. Hit his sides, and use arrows: they reach his heart. |
| eya | Eya appears | Stand behind the shells. If he swallows them, he is helpless for a while. |
| carried | first fall | You are carried home. Goods you brought back stay with the camp. |

## 14. Art needs (briefs written; models are built in phase C)

| Asset | Brief | Task |
|---|---|---|
| Man hero | [hero_dakota_man](art/briefs/hero_dakota_man.md) | C4 |
| Sleet spirit, gnawing hollow, fever mist | [sleet_spirit](art/briefs/sleet_spirit.md), [gnawing_hollow](art/briefs/gnawing_hollow.md), [fever_mist](art/briefs/fever_mist.md) | C3 |
| Double-Face | [double_face](art/briefs/double_face.md) | C5 |
| Eya | reuses iya.glb; shells in the props kit | C5 |
| Lacrosse stick, digging stick, quiver, parfleche, 2 snowshoes | [lacrosse_stick](art/briefs/lacrosse_stick.md), [digging_stick](art/briefs/digging_stick.md), [fringed_quiver](art/briefs/fringed_quiver.md), [parfleche_bag](art/briefs/parfleche_bag.md), [long_snowshoes](art/briefs/long_snowshoes.md), [short_snowshoes](art/briefs/short_snowshoes.md) | C2 |
| Room props | [props_dakota](art/briefs/props_dakota.md) | C3 |

## 15. What each phase C task reads

| Task | Sections |
|---|---|
| C1 tutorial and place names | §12, §13 |
| C2 gifts and items | §7, §8, item briefs |
| C3 threats and layouts | §3, §4, §5, threat briefs, props kit |
| C4 man hero and choice | §10, man hero brief |
| C5 mini-boss and second boss | §2, §6, double_face brief |
| C6 camp growth | §2 (boss choice), §8 (making items), §9, §11 |
| C7 phone install | none (the plan only) |
