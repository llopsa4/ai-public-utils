# Survival cultural reference

Survival is a **fiction** about an invented Dakota camp (user, 2026-11-19, [DESIGN.md](DESIGN.md)
section 9). Game content may be invented freely. This file holds only the small real-culture
reference the game draws on (camp organization, seasonal life, real words used as names). A real
word, name or practice used in the game needs an entry here with a source; anything unsourced is
listed under *Needs review* and asked of the user. Only the user approves entries. Claude's own
limits always apply ([PROMPTING.md](PROMPTING.md) *Standing rules*).

Kota keeps its own CULTURE.md; nothing in it is binding here, and it has no sourced entry yet for
any term below (checked 2026-11-19).

## Sources

Preferred: nation-authored sources first (Dakota nations' and tribal colleges' own sites, Dakota
authors such as Ella Deloria and Charles Eastman/Ohiyesa); museum and academic sources only to
corroborate. One source link per claim.

- [Minnesota Historical Society, oral history with Dallas Ross (Dakota)](https://www.mnhs.org/usdakotawar/stories/contributors/dallas-ross/1103)
- [Howe and Katz, Traditional Lakota Governance](https://rootstalk.grinnell.edu/issues/volume-i-issue-1/howe-katz/)
- [Encyclopedia of the Great Plains, Lakota law](https://plainshumanities.unl.edu/encyclopedia/doc/egp.law.022.html)

Approved by the user 2026-11-19 for the *akicita* entry below. Claude read search summaries only,
not the full pages; check them before relying on any detail beyond that entry.

## May show

Decided by the user on 2026-11-19.

- **Tiyospaye** keeps its name for the camp's work units, spelled as in the game now. No source
  linked yet.
- **Wotakuye** keeps its name for the camp-unity meter, spelled as in the game now. No source
  linked yet.
- **Akicita** (spelled so) is the name of the scouts/warriors society. Meaning: the camp police and
  warrior-society officers who keep order, run the hunt and move camp, a one-year duty drawn from
  the warrior societies; "guard, police" fits better than "soldier". Sources: the three above (most
  are Lakota, one Dakota).
- **Dakota labels** (user, 2026-11-20): four dictionary words are approved for `Dakota (English)`
  labels: **tipi** (Tipi), **wakihnakapi** (Store), **wihmuƞke** (Trap), **akaƞyaƞka** (Riders, filled
  when the Riders upgrade is built). Source: the Dakota Online Dictionary, see *Needs review* below.
  Every other label stays English until the user approves a word.
- **Other societies** (hunters, healers, builders) keep their English game names. Only names with a
  source here may be used; add one when a source is found.

## Decided: keep invented or generic

- **Camp layout** stays free-form (no circle of tipis required).
- **Seasonal round** keeps generic game seasons; no Dakota season or month names.
- **Generosity as currency** ("gift value") stays an abstract game currency; no real giving custom
  is named.

## Needs review

### Dakota labels (W2, 2026-11-20): candidates and what was approved

The UI is to show `Dakota (English)` ([DESIGN-upgrades-3.md](DESIGN-upgrades-3.md) *Labels*). Every
`dakota` field in `upgrades.json` and `buildings.json` is **empty until the user approves a word**; an
empty field shows the English alone. Words below are **headwords copied from the dictionary, never
composed or inflected by Claude**. Where the dictionary has no word for the thing, the row says *none
found* and lists the nearest single words only as parts. Spellings are exactly as the dictionary prints
them (its own letters, e.g. `ƞ` for nasal n, `ṡ`, `ḣ`, `ġ`). Words that are sacred (`wakaƞ`) or name
spirits are not offered for the spirit items.

Source for every row: the [Dakota Online Dictionary](https://dictionary.swodli.com/info.html)
(Sisseton-Wahpeton Oyate Dakotah Language Institute and Ultralingua), which combines the 2015 SWODLI
*English to Dakotah Dictionary* ("SWO") with Williamson's *An English-Dakota Dictionary*, 1902, public
domain ("W"). Looked up 2026-11-20 through the dictionary's own search endpoint, English to Dakota. No
terms of use are published there. Not checked against Riggs or a speaker; the user accepts some
inaccuracy ([DESIGN-upgrades-3.md](DESIGN-upgrades-3.md)).

| Id | English label | Candidate | Dictionary entry | Note |
|---|---|---|---|---|
| `tipi` | Tipi | **tipi** | SWO "house / building" | the game already uses this word |
| `store` | Store | **wakihnakapi** | W "storage" (SWO has `wakihnakapi tipi`, "storage shed") | |
| `trap` | Trap | **wihmuƞke** | SWO "trap, n." (W has `hmuƞ'ka`, "to trap") | |
| `fire` (council) | Council fire | **omniciye** | W "council"; SWO "council, to council; a meeting" | names the council, not the fire |
| `gathering_spot` | Gathering spot | none found | W "gather" is `wi'taya` (people) and `pahi` (pick) | verbs only |
| `hunting_lodge` | Hunting lodge | none found | "hunter" is `wihnis'a` (SWO) / `wotihnisa` (W) | |
| `drying_rack` | Drying rack | none found | "dry" is `puza`; "dried meat" is `papa` (SWO) | |
| `healers_lodge`, `healers` | Healers' lodge, Healers' society | none found | "heal" is `asniyaƞ`, `okizi`, `wapiya` (verbs); "society" is `okodakiciye` (SWO) | no noun for "healer" |
| `scouts_lodge`, `scouts` | Scouts' lodge, Akicita scouts | none found for "lodge" | "scout" is `toƞweya` (SWO, W); **akicita** is already approved above | keep `Akicita scouts` as is |
| `warriors` | Akicita warriors | **akicita** (already approved) | SWO "warrior" | keep as is |
| `lancers_lodge` | Lancers' lodge | none found | "spear" is `uḣaka` (SWO), `wahukeza` (W) | not the same as a lance |
| `archers_lodge` | Archers' lodge | none found | "bow" is `itazipe` (SWO, W) | no noun for "archer" |
| `bows` | Better bows | none found | "bow" is `itazipe` | "better" has no single word |
| `dogs` | Hunting dogs | none found | "dog" is `ṡuƞka` (SWO, W) | |
| `builders` | Builders' society | none found | "builder" is `ticaġe` (SWO, W); "society" is `okodakiciye` | two words, not combined |
| `tools` | Better tools | none found | "tool" is `wikicaƞye` (SWO) | |
| `fire_pit` | Fire pit | none found | "fire" is `peta` / `ide`; "pit" is `makaḣdoka` ("earth pit") | |
| `horse_corral` (new) | Horse corral | none found | "fence; pen" is `cuƞkaṡke` (SWO, W as `coƞ'kaṡke`) | `cuƞkaṡke` is a fence, not a corral |
| `horses` (new) | Breed horses | none found | "horse" is `ṡuƞktaƞka` (W); `ṡuƞgbdoka` is "stallion" (SWO) | `ṡuƞwakaƞ`, `ṡuƞkawakaƞ` also listed; both contain `wakaƞ`, so not offered |
| `riders` (new) | Riders | **akaƞyaƞka** | W "rider, n." (SWO: `ṡuƞwakaƞ akan yaƞke`, "horse rider") | |
| `barricades` (new) | Spike barricades | none found | "fence" is `cuƞkaṡke` | |
| `spirits`, `spirit_lodge` (new) | Spirit society, Spirit lodge | none offered | "spirit" is `naġi`; "sacred" and "great spirit" use `wakaƞ` | sacred words avoided |
| `spirit_warriors` (new) | Spirit warriors | none offered | as above, plus **akicita** | |
| `guardian_wolves` (new) | Guardian wolves | none found | "wolf" is `ṡuƞktokeca` (SWO, W) and `ṡuƞgmanitu` (SWO, "primarily Lakotah"); "guard" is `awaƞyaka` | |
| `bison_charge` (new) | Bison charge | none found | "buffalo" is `tataƞka` (SWO, W) | |
| `storm_caller` (new) | Storm caller | none found | "storm" is `ibobdu`, `icamna` (SWO); "thunder" is `wakiƞyaƞ` | `wakiƞyaƞ` may name a sacred being (Claude's caution, unsourced), so not offered |

Approved by the user 2026-11-20: **tipi**, **wakihnakapi**, **wihmuƞke**, **akaƞyaƞka** (see *May show*).
**omniciye** was offered and not taken. Everything else stays English until the user names a word or
phrase (then it needs a source here).

Optional later: a sourced real name for the hunters, healers and builders societies (the names found
so far, Kit Fox, Strong Heart and Elk, are Plains Lakota warrior societies and do not fit those roles).
