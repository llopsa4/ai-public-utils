# Dead Woods: characters (roster notes)

Settled by the user on 2026-11-23 (Cass, Eli) and 2026-11-25 (Ray, June, Theo). The roster is 7
characters; five are written here.
Stats and names in `src/data/characters.json` are placeholders until a unit wires these in. The
outbreak began 30 days before 2026-11-23.

## Cass Mireles (Fighter), 34

- **History:** grew up in a mining town in the Southwest, eldest of four. Enlisted at 19, served as an
  Army Ranger for two deployments. Discharged after a knee injury on a night jump. Then a hunting guide,
  then a volunteer county search-and-rescue lead.
- **Family:** her younger brother was with her hunting party when it was overrun. She has not said so.
- **Way of being:** few words, said with certainty. Gives orders as statements. Counts exits, rounds,
  minutes and people to stay calm. Rare dry humour, mostly at her own expense. Protective in a
  practical way: checks your gear before your feelings.
- **Flaw:** trusts her own plan over anyone else's, and won't ask for help or admit tiredness.
- **Voice:** short sentences, no filler; military shorthand the player picks up over time.
- **Play:** knife takedowns; a pistol kept for when it counts (knife only in the Intro and Mission 1;
  she takes the pistol back on arriving at Base 1, DESIGN §5). The only knife user on the roster.
  Best stealth on the roster; notices wrong sounds.

### Bio (approved 2026-11-25, DESIGN §24; `src/data/bios.json` copies it verbatim, `tests/bios.test.ts` checks)

- **Background:** Cass Mireles, 34. Grew up in a mining town in the Southwest and enlisted at 19; two
  deployments as an Army Ranger, then a discharge after a knee injury on a night jump. Worked as a
  hunting guide, then led a volunteer county search-and-rescue team. When the outbreak reached her
  county she was running the call at a roadblock, where the team was overrun.
- **`intro`:** Eli said an hour and it was three. I checked the fire and both ways out twice, put the
  knife into something dragging its feet at the edge of camp, and then he walked in with two rounds
  left and news of a house. I told him he was late. I also said thanks.
- **`mission1`:** Quiet first; rounds are for emergencies. If a cluster blocks the way, Eli runs, they
  follow, and I finish them from behind. He calls it being bait. He's not wrong, and he's the fastest
  thing I have.
- **`rescue`:** Six came out of the trees when we thought the house was clear, and I had nothing to put
  my back against but a wall. Two strangers with bows dropped every one. I gave them one night, because
  four hold a house better than two.
- **`base1`:** I told Eli about the pistol in my pack: empty, and out there a shot meant company.
  Tonight we can afford the noise. Door first, then everything else.
- **`herd`:** The birds went quiet. When the birds go quiet, something big is moving, and this wasn't one
  or two. I gave us two minutes and told everyone to seal what they could.
- **`done`:** Last one down. Eli, Ray, June, me: four counted, four standing. Eat, sleep. Tomorrow I find
  out how far we are from anything alive.

## Eli Varga (Scout), 24

- **History:** grew up in a mountain town where the trails were the way out. First ultra at 17; several
  100-mile finishes by 23. Seasonal trail guide and fire-lookout assistant. Has never been in a fight.
- **Family:** his mum, a nurse two valleys away, has been unreachable since the second week. He has not
  said so aloud.
- **Way of being:** easygoing and chatty when calm, precise and quiet when not. Counts miles, pace and
  heart rate under his breath and gives others the numbers to reassure them. Says "I'm scared" openly.
  Gentle with animals and the wounded, and hard on himself afterwards.
- **Flaw:** ignores injury and pushes past his limit, because he has always been able to run further.
- **Voice:** warmer and looser; runner's jargon ("split", "bonk", "the wall") that Cass finds annoying
  and then adopts.
- **Play:** the best runner on the roster. Crouch and crawl are slow for him, but his sprint lasts longer.
  Club and gun work best when he is rested; his hands shake less while he is moving.

### Bio (approved 2026-11-25, DESIGN §24)

- **Background:** Eli Varga, 24. Grew up in a mountain town where the trails were the way out; ran his
  first ultramarathon at 17 and has finished several 100-mile races. Worked as a seasonal trail guide
  and a fire-lookout assistant, and has never been in a fight. He came down from his lookout station
  when the radio went silent, and met Cass at the roadblock.
- **`intro`:** I went up the ridge, found a house to the north, and came back with two rounds left and
  something right behind me. Cass said I was late, then thanked me, which I'm keeping. Then three more
  came out of the trees, and we stood still and let them walk into us.
- **`mission1`:** The plan: Cass stays quiet, I'm the bait, she finishes them. I run, they follow, and
  I'm winded after once per place. She called me fast, which is the nicest thing she's said to me.
- **`rescue`:** I said it was clear, and then there were six. I'll say it: I was scared. Then arrows,
  from two strangers, Ray and his daughter June, thirty days in the woods, and Cass gave them one night.
- **`base1`:** Rain on the way, so we fixed the door and the windows. Cass has had a pistol in her pack
  this whole time, of course she has. I'm not sure I know what I'm doing, but the door stayed shut.
- **`herd`:** The woods went silent and I couldn't hear anything, which Cass says is the point. Two
  minutes. I counted them, because counting helps. It didn't.
- **`done`:** We held. Against that. My legs are shaking and I could sleep standing, and for the first
  time in thirty days I think four is better than two.

## The pair

- They met about three weeks ago at a roadblock where the rescue team was overrun. Cass was leading the
  call; Eli had come down from a lookout station after the radio went silent.
- They have been on the run since. No settled base yet. Not close friends at the start.
- Each covers the other's weakness: Cass plans and Eli reads the ground; Cass won't ask for help and Eli always does.

## Ray Bluestone (*Tahca Wanyaka*, "Sees the Deer"), 40, id `hunter`

- **History:** Dakota, from a Dakota community in Minnesota. A tribal natural resources technician
  (deer counts, wild-rice lakes). Learned to hunt, track and read the woods from his grandfather and
  uncles; runs the youth deer camp and archery lessons every fall. Divorced; June is his daughter.
- **The outbreak:** it began while the two were bowhunting from a tree stand. They have survived the
  30 days since in the woods, living off the land and keeping away from towns, until they spot Cass
  and Eli at the house.
- **Way of being:** worried and cautious. Plans the way out before going in, counts arrows, thinks
  about noise, tells his daughter to slow down. The one who says "not yet." Watched Cass and Eli for a
  morning before coming down.
- **Names:** "Ray" to outsiders; with June he uses Dakota names. *Tahca Wanyaka* is an unverified
  placeholder until a Dakota speaker checks it.
- **Theo and the hut (2026-11-25):** Ray hired Theo, an IT worker who tutors on the side, to teach June maths over video,
  and remembers Theo mentioning a prepped house in the woods. Ray also has a **hand-built hunting
  shack**, far from everything, which he has kept secret because he did not know Cass and Eli. He offers
  it after Base 2 (DESIGN §25); it becomes the main camp. Nothing sacred in it. The bio text must not
  name it before that beat.
- **Play:** bow (8 arrows) + shared pistol + hatchet; trait **Tracker** (DESIGN §5).

### Bio (approved 2026-11-25, DESIGN §24)

- **Background:** Ray Bluestone, 40. Dakota, from a Dakota community in Minnesota, where he works as a
  tribal natural resources technician, counting deer and monitoring wild-rice lakes. Learned to hunt,
  track and read the woods from his grandfather and uncles, and runs the youth deer camp and archery
  lessons every fall. June is his daughter; they were bowhunting from a tree stand when the outbreak
  began, and have kept to the woods since.
- **`rescue`:** I watched the house from the trees since morning to see what kind of people they were.
  They worked quietly and didn't waste rounds, and when six came for them I stopped watching. June shot
  from too close again. I'll tell her again.
- **`base1`:** Rain building in the west, and nobody should be outside tonight. I counted arrows, eight
  each, and set traps, because four can hold a house if they plan before they go in. Cass wants one
  night. I'll try to make it more.
- **`herd`:** The birds stopped, and then the whole woods did. I know that silence from the stand, when
  something large is moving upwind. I told June to slow down and keep her arrows.
- **`done`:** The house held, and all four of us are still here. First night indoors in thirty days.
  June says I'm getting slow; I say I counted every arrow back.

## June Bluestone (*Wakpa Win*, "River Woman"), 15, id `archer`

- **History:** Ray's daughter, in her second season hunting at his side. Learned tracking and
  stillness from her grandfather and Ray; an excellent shot. Wears her heritage loudly: she beads,
  sewed her own ribbon-work trim, made her quilled sheath, carved her war club at a culture camp, and
  learned to knap stone points. She made Ray's beaded keychain.
- **Way of being:** unworried, cocky, "let's kick some ass." Grins through the outbreak as the
  challenge she was raised for, charges in while her dad plans, calls him slow, keeps score of kills.
- **Names:** "June" to outsiders; with Ray she uses Dakota names. *Wakpa Win* is an unverified
  placeholder.
- **Play:** bow (8 arrows) + shared pistol + war club; trait **Quick draw** (DESIGN §5).

### Bio (approved 2026-11-25, DESIGN §24)

- **Background:** June Bluestone, 15. Ray's daughter, in her second season hunting at his side; learned
  tracking and stillness from her grandfather and her dad, and is an excellent shot. She beads, sews her
  own ribbon-work trim, made her quilled knife sheath, carved her war club at a culture camp and knaps
  stone points. She was hunting with Ray when the outbreak began and has spent the thirty days since in
  the woods.
- **`rescue`:** I wanted to come down hours ago, but Dad wanted to know who they were. Six came out of
  the trees: four for me, two for him. I keep score.
- **`base1`:** Cass says fix the door first. Fine. Then I'm taking the room with the bed, because I
  called it.
- **`herd`:** Dad went still and said something big was coming. Good. I've waited thirty days for a
  real fight, and I've got eight arrows and a war club.
- **`done`:** We held. I'm keeping count and I'm ahead, whatever Dad says. Now I'm taking that bed.

## Ray and June

- Father and daughter; their banter is caution against confidence. He finds her moccasins
  impractical; she finds his compound bow soulless.
- Respect rules for both: modern people, no feathers, no ceremonial items, nothing sacred in play.
  June's face paint is her own choice, made when they had to fight; its meaning is hers, not a
  claimed tradition.

## Theo Nakamura (`tinkerer`), 31

Card and physical description approved by the user on 2026-11-25 (survivor 5 of 7), the bio on
2026-11-26. The numbers are not approved yet (PLAN Z91). The internal id is `tinkerer`,
in the style of `fighter` and `scout`; the stand-in numbers are in `src/data/characters.json` (PLAN Z90).

- **History:** remote IT / software worker, at home when the outbreak began. Spent years fitting out his
  house as a prepper stash: a bunker below, cameras, wired alarms, labelled bins, a spreadsheet of stock
  with expiry dates. Read everything online; used almost none of it before this.
- **Intelligence:** really smart, and it shows in play. He sees how a room will fail before it does,
  models scenarios, and builds the answer by hand.
- **Way of being:** anxious and over-prepared: backups for the backups, jumpy and funny, with a spine
  when it counts. Nervous, quick, apologises, narrates his contingency plans aloud ("Plan B is a bag,
  Plan C is a bigger bag"). Unlike Cass, Eli and Ray he does not count: he models scenarios.
- **Flaw (user, 2026-11-25, revised):** hoards gear, not food. He rationed his food badly and ran out,
  but he still won't hand over the best of his cache because "this isn't the real emergency yet". Plans
  for scenarios, not people. Arc: the day he gives up the best of his kit.
- **Voice:** fast, technical and hedged ("worst case", "statistically"), a joke when scared.
- **Body:** wears glasses, skinny, not fit. Look only in play; the glasses have no rule.
- **Play (placeholders until Z91; the user judges balance by playing):**
  - Shared pistol + **entrenching shovel** (weak melee, not a knife).
  - Trait **Resourceful**: crates give him more, and he can break junk down into parts.
  - Ability **Rig**: in a few seconds he places a tin-can tripwire or a noise lure from carried junk
    (a distraction in the Commandos style).
  - **Fragile and slow:** lowest HP on the roster (about 70), slowest walk and run, a sprint that runs
    out fast. He needs the others to cover him; his rigging repays it.
- **Rich and out of power (2026-11-25):** his IT work paid for the house and the bunker. The squatters
  broke his solar device, so the bunker has no power. He is also out of food.
- **Ray's tutor:** Ray hired him to teach June maths over video. Ray and June know his voice and face
  on a screen and have never met him in person; the first meeting is at the bunker door.
- **The house (DESIGN §25):** his prepped house, with the bunker below. Hostile squatters (8 or more
  humans, no talking, no sparing) made it their home for a few days. He is a voice on a speaker in
  Mission 2, tells the group where the guards are, and **joins the squad when the bunker door opens**
  (this replaces "one base visit first"). Base 2 is then fought at his house, and the group leaves for
  Ray's hut (the main camp).
- **Secret:** none.
- **Dynamics:** Cass respects the logistics and clashes over command; Eli is the fit one he cannot keep up
  with; Ray plans before going in as he does, but trusts the land where Theo trusts cans; June, who knows
  him as her maths teacher on a screen, teases him until his first meal.

### Bio (approved 2026-11-26, DESIGN §24; PLAN Z89 copies it into `src/data/bios.json`)

- **Background:** Theo Nakamura, 31. A remote IT and software worker who spent years fitting out his own
  house as a prepper's stash, with a bunker underneath, and tutored maths over video; June was one of his
  students. He was at home when the outbreak began. Squatters later took the house, and he sat sealed in
  the bunker with the power off until the squad got to him.
- **`bunker`:** I'd modelled that door opening a lot of ways, and my maths student walking in with her dad
  wasn't one of them. She's taller than on video. I'm out of food, so yes, I'm coming, sorry, one second,
  backpack.
- **`base2`:** Worst case, the squatters' friends come back; statistically, they come back. Plan A is
  barricades, Plan B is tripwires, and no, it isn't time to open the good case.
- **`hut`:** I traded cameras and wired alarms for a shack Ray built by hand. Nobody knows it exists, which
  might be the best security system I've seen. The good case came with me, still shut, because this isn't
  the real emergency yet.

### Physical description (approved 2026-11-25)

Follows the mirror rule above. Round glasses worn level on the centre of the face; nothing on one side only.
- **Build:** about 175 cm, thin, narrow shoulders, a little stooped, long thin arms.
- **Face:** narrow, light skin, dark eyes behind round wire-rimmed glasses, short even stubble grown over
  the month, a worried line between the brows (centred).
- **Hair:** black, centre-parted, a bit overgrown and untidy.
- **Clothes:** charcoal zip-up hoodie, hood down, zipped to the chest, sleeves too long and pushed to the
  same height; dark jeans; plain off-white sneakers, same both feet. Worn and a month dirty.
- **Gear (symmetric):** pistol holster centred on the chest, grip up; two matching tool pouches at the
  hips; the folding shovel is held in the right hand when used and the left hand is empty in the neutral
  pose. For gameplay sprites, the user approved an oversized, overstuffed grey backpack (2026-11-26),
  with a bedroll on top, paired tool bundles and side pockets, a wire coil at the bottom centre, and one
  small solar panel centred on the back flap.
- **Colour:** charcoal, navy, off-white; one orange paracord accent on the zip pull, centred.

## Adding a character with a bio (checklist)

Every new survivor (Theo, the two still to come, any later one) gets a bio to the same standard. This
section owns the procedure; DESIGN §24 owns the page's rules. Grill the character with the user first
(one question at a time); nothing below is built before the card is settled.

1. **Card** (this file): history, family, way of being, flaw, voice, play. Put a secret in the card
   only if no bio text will say it (§24 *Secrets stay out*).
2. **Bio block** under the card, drafted by Claude (Sonnet, WRITE) and **approved by the user before
   it enters the game**: *Background* (third person, a neutral squad file, 2-4 sentences: age, past
   job, home, how the outbreak found them; public facts only) and one first-person *entry* per beat
   the character lived through (1-3 sentences, in their voice, no live stats). Beats are `intro`,
   `mission1`, `rescue`, `base1`, `herd`, `done`, `bunker`, `base2`, `hut`; a character has entries only for beats after they
   join. Add an approval date to the block heading, as for the existing four.
3. **Header facts:** full name, age, past role, a Dakota (or other-language) name only when the card
   has one and the user settled it (shown under the name and age, never in the text; unverified
   names stay marked as placeholders in DESIGN §24).
4. **Data and rules:** copy the approved text verbatim into `src/data/bios.json`; add the kind to
   `BIO_ORDER` (join order) and its join rule to `src/sim/bios.ts` (the beat they join at); extend
   `tests/bios.test.ts` (tabs per stage, verbatim check against this file, no-secrets scan, manifest
   key). The trait line comes from `traitLine(name)` in `src/sim/traits.ts`.
5. **Art:** a `bio_<kind>` item in `art/manifest.json` (group `bio`, 384 x 512, status
   `placeholder`) with a grey stand-in in `art/frames/ui/`, then a Codex request in
   `handoff/from-claude.md` following art/STYLE.md *Bio figures*. Codex generates; the user approves
   the sample first, then the rest; Claude never draws.
6. **Check:** typecheck, tests and a Chromium check of the Bios page (title with a save, pause in
   the scene where they join, every tab, 100 / 125 / 150% text). Add PLAN rows (text, data, art) and
   record the character in memory as `zombie-...` only for facts no guide owns.

## Open (not decided)

- A stamina meter for the Scout (sprint length) and a composure/fatigue meter for the Fighter. An idea only.
- The last two roster characters (Theo is survivor 5 of 7, settled 2026-11-25). Settled for them already
  (2026-11-23): each handles the shared pistol and has their own melee weapon, never a knife (DESIGN §5).

## Physical descriptions (for Codex art)

**Status:** Cass and Eli approved by the user on 2026-11-23.

**Mirror rule for every survivor:** the body, clothes and gear must read the same from left and right.
Anything on one side has a matching twin on the other, or sits on the centre line. Hair is centre-parted
or tied at the back of the head, never swept to one side. No watch, no sling, no asymmetric scars or
tattoos. A carried weapon is held in the hand, and the other hand is empty in a neutral pose, so a
mirrored walk cycle reads the same. Both sides of each figure must be drawable from the same shapes.
Every survivor wears a **pistol holster on the centre line** of the chest or vest, and the pistol
shot is a **two-handed grip, arms out, centred** in front of the chest (2026-11-23).

### Cass Mireles (Fighter), approved 2026-11-23

- **Build:** about 170 cm, lean and strong, square shoulders, straight posture.
- **Face:** oval, olive-brown skin, dark brown eyes, straight brows, a level mouth. Little expression
  at rest; a faint crease at the eyes when she is amused.
- **Hair:** dark brown, pulled into one low braid down the centre of the back. Short, neat fringe
  centred on the forehead.
- **Clothes:** charcoal-grey long-sleeve top with the sleeves pushed to the forearm, both forearms
  equally bare. Dark olive-drab utility trousers with two identical thigh pockets, one each side. Dark
  tan lace-up boots, same height both sides; the knee brace (for the old injury) is on both knees.
- **Gear (symmetric):**
  - Chest rig, centred, with a pistol holstered at the centre front of the chest, grip up.
  - Two matching knife sheaths, one on each thigh at the same height, handles forward.
  - Two matching ammo pouches on the belt, at each hip, same size.
  - A plain canvas belt with a centred buckle.
- **Colour:** dark olive, charcoal, tan. Metal parts dull grey. No red.

### Eli Varga (Scout), approved 2026-11-23

- **Build:** about 180 cm, wiry and long-limbed, narrow hips, light on his feet.
- **Face:** narrow, sun-weathered, light-brown skin, grey-green eyes, a short light-brown beard
  trimmed evenly along the jaw, and a straight nose.
- **Hair:** sandy-brown, short at the sides, a little longer on top, under a centred cap.
- **Clothes:** faded blue-grey running jacket, zipped to the collarbone, with the sleeves at full
  length. Dark navy running shorts over leggings, or long running trousers in the same colour. Trail
  running shoes, same colour and height both feet.
- **Gear (symmetric):**
  - Hydration vest worn centred, with two matching water bottles on the chest at the same height.
  - A matching pair of pouches on the front of the vest, one each side of the zip.
  - A heart-rate chest strap across the centre of the chest (no watch on either wrist).
  - A pistol holster, centred on the front of the vest between the two bottles, grip up (added
    2026-11-23).
  - The club is held in the right hand when used; the left hand is empty in the neutral pose.
- **Colour:** blue-grey, navy, sand. Bright accent only on the cap band, in one colour, centred.

### Ray Bluestone (`hunter`), approved 2026-11-25

A rural bowhunter after 30 days in the woods: worn, muddy, nothing he would have thrown away (no
blaze orange, no phone).
- **Build:** about 180 cm, broad and solid rather than lean, heavy shoulders, a slight belly.
- **Face:** wide and weathered, high cheekbones, brown skin, deep crow's feet, tired brown eyes, a
  short dark beard grown out over the month, an old scar across the bridge of the nose (centred).
- **Hair:** black going grey at both temples, in a short braid at the back of the head.
- **Clothes:** camo softshell hunting jacket (brown and grey woodland pattern) over a grey fleece,
  zipped to the chest; camo hunting pants with matching knee patches on both knees; tall rubber
  hunting boots, mud to the shin on both; thin black fingerless gloves on both hands. Bare head.
- **Gear (symmetric):**
  - Pistol holster centred on the chest, grip up.
  - Back quiver of black carbon arrows, centred between the shoulders, fletchings above the neck.
  - Small camo daypack under the quiver, centred, with a coiled rope clipped at its bottom centre.
  - A fixed-blade hunting knife worn horizontally at the centre back of the belt (look only).
  - A headlamp hanging around the neck, centred.
  - A small blue-and-white beaded keychain on the jacket zip pull, centred.
  - The dark compound bow or the hatchet is held in the right hand when used; the left hand is empty
    in the neutral pose.
- **Colour:** brown-grey camo, grey, black, mud brown. Blue and white only on the keychain.

### June Bluestone (`archer`), approved 2026-11-25

A Dakota teen who wears her heritage loudly, after 30 days in the woods. No pink or purple; no
feathers; no phone or earbuds.
- **Build:** about 165 cm, wiry and quick.
- **Face:** round and expressive, brown skin, dark eyes, a grin. **Face paint:** a band of red ochre
  straight across both eyes and cheekbones, ear to ear, and three thin black charcoal lines down the
  chin (outer two equally spaced from the centre one).
- **Hair:** long and black, one thick braid down the centre of the back, wrapped in red wool trade
  cloth, with a small blue-and-white beaded tie.
- **Clothes:** her dad's old camo jacket, too big, both sleeves rolled to the same height, with red
  and blue ribbon-work trim across the back yoke and down both sleeves; a dark grey hoodie under it;
  camo pants tucked into high-top moose-hide moccasins with beaded uppers, the same on both feet.
  Worn and muddy. Bare head.
- **Gear (symmetric):**
  - Pistol holster centred on the chest, grip up.
  - Back quiver of rawhide and wool, centred, with turkey-fletched arrows.
  - A knife in a porcupine-quill sheath worn horizontally at the centre front of the belt.
  - Beaded blue-and-white earrings, one in each ear, matching.
  - The hand-carved ash bow or the wooden ball-headed war club is held in the right hand when used;
    the left hand is empty in the neutral pose.
- **Colour:** camo brown-grey, dark grey, moose-hide tan; accents red, blue and white only.

### For Codex: sheet checklist

- Both sides of every figure drawn from the same shapes; no hip, wrist, shoulder or pocket appears on one side only.
- Frames for walking are drawn once and mirrored for facing left and right, so the centre line must be exact.
- Grey placeholders remain in code until Codex installs the approved art (`art/manifest.json`).
