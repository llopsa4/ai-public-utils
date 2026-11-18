# Kota design

Settled decisions only ([AGENTS.md](AGENTS.md#kota-rules)); real-culture claims also follow
[CULTURE.md](CULTURE.md), which is reference, not binding (user, 2026-11-18). Requests follow
[PROMPTING.md](PROMPTING.md). The task plan is [PLAN.md](PLAN.md). Rewritten 2026-11-18 from the
grilling session in which the user pivoted the game (18 decisions, all confirmed). Numbers, names and
lists that are not decided here are specified in `DESIGN-m1.md` (plan task B1) and enter this file
once the user approves them.

Kota is a free, **Brotato-style 2D top-down arena survivor** for **smartphones and tablets** (touch,
landscape), honouring **Dakota culture first**, with Lakota and Nakota to come later. It replaces the
earlier isometric 3D room-chain roguelite, which is being deleted.

## Premise and setting

A **story world** inspired by traditional Dakota stories. Enemies are monsters from stories that are
told publicly and shown being defeated (Double-Face, Iya, later Eya), plus invented spirits of hunger,
winter and sickness. No real historical people or nations are fought. Invention is allowed for game
content when it is plainly fantasy; claims about the real culture (named beings, history, words, what
Dakota people did) need a source in CULTURE.md.

## Core loop

- **One arena per run** and **20 waves** that grow from 20 s to 60 s, about 25–35 minutes. There are
  no doors and no room chain.
- The hero only **moves**; **weapons aim and fire on their own** at the nearest threat.
- Beaten threats drop one **dual pickup** that fills the **experience bar** and is the **money** for
  the shop, and sometimes **food** that heals. The pickup's name and theme are decided in B1.
- **After every wave:** the player picks a **level-up** (if one was earned), then visits a **shop**.
- **Boss waves:** **Double-Face** is an elite on **wave 10** and **Iya** is the final boss on
  **wave 20** (Eya later, as an unlock). Defeating the wave 20 boss wins the run.
- Falling ends the run and the hero is carried home to the camp, keeping progress as the camp allows.

## Weapons

Up to **6 weapons at once**, all auto-firing. Buying duplicates in the shop and **merging two of the
same weapon raises its tier (I–IV)**. Weapons are tools and weapons from Dakota sources (stone axe,
short-handled axe, bow, knife in a beaded case, netted lacrosse stick, and others from later research)
**plus invented ones** to fill out the list. The first milestone has 6 weapons; version 1 about 15.

## Items and the shop

- The shop offers **4 random weapons and items** after each wave, with **lock** (keep an offer for the
  next shop) and a paid **reroll**. Items stack their stat changes. Selling is allowed.
- The first milestone has about 15 items; version 1 about 40. Rarity, prices and stat lists are set in
  B1.

## Heroes

A **roster of named Dakota heroes**, each with their own **starting weapon, stat twist and an ability**
on the ability button. **Ash Wolf** (woman, serious warrior) is the first; more heroes unlock through
play. Lakota and Nakota heroes can join the roster later. Her look and the roster's look are
**serious, grounded and warm, never childish** ([art/STYLE.md](art/STYLE.md)).

## Level-ups and helpers

**Helpers from the stories present the level-up choices**: each of the 4 offers comes from a helper and
is tied to stats that fit their story (for example the muskrat speed, Patkasa armour, the youngest bear
healing, Manstin ranged damage, Skiska dodge, the coyote dash). Approved helpers (CULTURE.md *May
show* and item 18): Skiska the duck, Patkasa the turtle, the muskrat, the coyote, Manstin the rabbit,
the youngest bear, the mink, the water snake, the squirrel and Wabeda the dog. **Camp upgrades add
helpers to the pool.** Each helper's stat list is set in B1.

## Threats

The three invented spirit threats (frost wisp, hunger shade, blight swarm) plus 2 new ones in the first
milestone, and the story monsters **Double-Face** (wave 10 elite) and **Iya** (wave 20 boss), with
**Eya** as a later unlock. Their behaviour in an open arena is set in B1.

## Arenas

**Each run takes place in one place**, picked from the places the player has unlocked. A place is a
painted ground, 4–6 props and a **mild twist** (for example shallow water that slows at the lake, ice at
the winter camp). The first milestone has **prairie before dawn** and **lakeshore**; the maple-sugar
grove, wild-rice lake, winter camp, fish-dam brook and berry meadow unlock through the camp. The home
region is the Minnesota River Valley ([CULTURE.md](CULTURE.md) *May show*).

## Progress between runs

A **growing camp**: goods earned in runs buy **permanent upgrades** and unlock **helpers, places and
heroes**. Elders tell the stories behind the monsters the player has met. The first milestone has 3–4
permanent upgrades. **Danger levels** and challenge unlocks may be added after the first milestone.

## Controls

A **floating joystick** for movement (either side, with the left-handed swap), a **dash** button and
**one ability button**. Weapons auto-aim and auto-fire.

## Art

**Flat 2D top-down view**; the camera follows the hero around a bounded arena. **Hand-painted, serious
2D art**: one painted still per hero, threat, weapon and prop (transparent background, a slight
front view), **animated in code** (bob, squash, flip, hit flash, orbiting weapons); bosses get 2–3
pose stills. Heroes keep their serious warrior direction. The game is built first with **placeholder
shapes**, and art arrives in approved batches (heroes and threats, then weapons and items, then
arenas). **Claude writes the image prompts; the user (or Codex) generates the images; Claude
processes and installs them.** The earlier 3D models, Blender pipeline and rig are retired.
Details: [art/STYLE.md](art/STYLE.md) and [art/PIPELINE.md](art/PIPELINE.md), both rewritten in the plan.

## Engine

**Phaser 3** (MIT, vendored). The game is rebuilt rather than converted; the data files, sound,
settings, save and touch ideas carry over where they fit.

## Language

English text. Native words only where CULTURE.md gives the spelling and meaning, with the translation
available. No native-language voice unless a speaker records it.

## Delivery and software

Free to play on GitHub Pages under `/kota/`; not published to app stores. **Free/open-source software
only** (for example Phaser) and freely licensed assets, each recorded in [LICENSES.md](LICENSES.md).

## Tone

**Serious with warmth.** Heroic and grounded; the animal helpers carry the light, wry humour. Item
names are plain and evocative (for example "Sinew-backed bow", "Ember-hardened axe").

## Milestones

1. **Milestone 1** (placeholder art): Ash Wolf, 6 weapons (tiers I–IV), about 15 items, 5 threats,
   Double-Face, Iya, 2 arenas, the shop, helper level-ups, a camp with 3–4 upgrades, phone controls
   and saves.
2. **Version 1:** 4–5 more heroes, about 15 weapons, about 40 items, Eya, more places, more camp
   upgrades, the painted art and the phone install.

Lakota and Nakota stay out of scope until version 1 is approved.
