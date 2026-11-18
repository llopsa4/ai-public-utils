# Kota art style

**Approved by the user, 2026-11-18.**

How Kota looks. Written 2026-11-18 from the user's decisions in [DESIGN.md](../DESIGN.md#art) and
the approved entries in [CULTURE.md](../CULTURE.md). How assets are made, named and approved is in
[PIPELINE.md](PIPELINE.md). Adventure's art guides do not apply here.

**Culture first.** Every asset brief names the CULTURE.md entries it relies on. A detail that no
entry covers (a pattern, a hairstyle, a colour meaning, a dwelling) is not drawn: it goes to
CULTURE.md *Needs review* and the asset uses a plain placeholder there until it is approved.

## Look

- **Heroes only: stylized hand-painted 3D** (user, 2026-11-18). Smooth, softly shaded forms with
  painted colour, wear and a normal map; no photorealism, no outlines. This note applies to the
  two Dakota heroes until another plan extends it. **Everything else stays stylized low-poly:**
  flat-shaded, faceted forms with clear silhouettes, colour from **vertex colours or one small
  palette texture**, not painted detail.
- **Read at phone size first.** At the game camera a character stands about 60–80 px tall on a
  phone. Silhouette and colour blocks must identify every character, item and threat at that size.
  The hero's fine detail is seen in the **close-up view** (a large live hero on the camp and
  Equipment screens). Beadwork and quillwork stay **plain colour bands with no motifs**, never
  modelled bead by bead.
- **Warm people, living land, cold threats.** The hero and camp are warm (hide, wood, ochre); the
  land is muted and natural; spirit threats are cold or dull and slightly glowing, so each reads
  against the ground at a glance.

## Camera and scale

- Fixed orthographic isometric camera looking down the (−1, −1, −1) diagonal; 14 world units fill
  the screen height. Nothing in the art may depend on another viewing angle.
- **1 unit = 1 metre.** The hero is about **1.6 units** tall. Size every object against the hero.
- Rooms are 16 × 16 units. Walls and props along the two **back** edges may be tall; props along the
  two **front** edges stay low so they never hide the hero.

## Palette (homeland: Minnesota River Valley, approved in CULTURE.md)

| Use | Colours |
|---|---|
| Ground: summer woods and shore | moss and reed greens, river mud browns |
| Ground: maple-sugar grove (spring) | birch white, bark grey, thin new green |
| Ground: wild-rice lake (autumn) | rice gold, dry reed tan, lake blue-grey |
| Ground: prairie before dawn / at dawn | sage grey-green, deep blue night → pale gold dawn |
| Hero and camp goods | buckskin tan, hide brown, wood, small accent bands of colour |
| Spirit threats | frost pale blue, hunger dusk violet, blight sour olive; low saturation, faint glow |
| Iya | heavy earth brown, darker than any room floor so he dominates the arena |

The palette is a game choice for readability, not a claim about meaning: **no colour is given a
cultural or spiritual meaning** unless CULTURE.md records one.

## Characters

- **Heroes' look:** serious warriors. Athletic, realistic-heroic proportions (no big head), a
  hard, fierce, unfriendly face with a small healed scar, weathered skin, worn and repaired gear, a
  grounded ready stance, dramatic rim light in the close-up. **Exception for the woman hero (user,
  2026-11-18): invented, intimidating war paint on face and body is allowed**, with no real symbols;
  other characters keep the no-paint rule. **Feathers are allowed on the heroes** (user,
  2026-11-18); full feather headdresses and war bonnets are still not drawn. Dakota fighting gear (guards, wraps, battle hair, shields) is not drawn until
  CULTURE.md *Needs review* 27 is decided. Other characters keep readable, natural, uncaricatured
  low-poly proportions.
- **Dakota woman hero** (user redesign 2026-11-18, overrides the approved dress): an intimidating
  fantasy warrior, nothing friendly. Short fighting dress above the knee with fighting
  enhancements (studded belt, forearm wraps, shoulder guard, strapped leggings), **one** thick
  braid, invented war paint, high laced war moccasins, a cold dark palette. No feathers or
  regalia. Same moveset and rig as the man hero. Details: her brief.
- **Dakota man hero:** fringed buckskin shirt and leggings, two long braids with plain ties, no
  headband, broader shoulders, a fierce (not calm) face.
- **Equipment is separate geometry** that appears only when equipped (DESIGN.md Items): weapon in
  the right hand, garment over the body, accessory at the left hip. The base body must look complete
  with nothing equipped except the starting stone axe.

## Threats

- **Spirit threats (frost wisp, hunger shade, blight swarm)** are game inventions: shapeless,
  drifting forms with no faces, no animal parts and **no cultural symbols**, so they make no claim
  about any being in the stories.
- **Iya, the Camp-Eater** (approved, Dakota telling): a giant whose **thin legs** fail him at dawn
  and whose body holds the swallowed camp (both from the story as researched). Anything beyond that
  (face, hands, clothing) stays plain and undecorated until a source supports it.

## Never

Reference from CULTURE.md *Off-limits* (not binding since 2026-11-18; Claude's limits always apply),
plus rules for art:

- No eagle feathers, headdresses or war bonnets. Feathers otherwise only on the heroes (user,
  2026-11-18); none on items or threats.
- No pipes, ceremonial objects, regalia, or anything shown in ceremony; no sacred beings.
- No trophies, scalps, coup marks or war decoration (Eastman's war dress is marked do-not-use).
- No generic "pan-Indian" props (dream catchers, totem poles, tomahawk clichés) and nothing borrowed
  from another nation's dress.
- No real people's likenesses; no stereotyped expressions or poses.
