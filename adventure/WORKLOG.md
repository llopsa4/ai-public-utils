# Work log: Claude and Codex

Both agents read this first, and update their own sections before stopping. Keep it short (under
about 100 lines). Queues live elsewhere: Codex's in `art/CODEX.md`, Claude's in `CLAUDE-INBOX.md`.

Last updated: 2026-11-14 by Codex (interaction and visual polish).

## Lanes (who edits what; the user may reassign, e.g. "Codex: everything")
**Active switch: Codex owns everything end to end.** Codex handles story, design, planning,
review, art, runtime, tests, scripts, configuration and documentation. No Claude handoff is
required; Claude participates only when the user explicitly assigns it work.
Publishing still requires the user's request, and commits and pushes still require explicit instructions.

| Paths | Owner now |
|---|---|
| `art/**` (inbox, sources, src art, briefs, art scripts; art entries in `art/manifest.mjs`) | Codex |
| `src/**`, `tests/**`, `scripts/**`, root config and docs | Codex |
| `build/`, `index.html` (generated) | whoever the user asked to publish |
| this file | each agent edits only its own sections; anyone edits Working on |

Codex also handles review and planning. If explicitly assigned work, Claude uses the existing
queues and claims; this does not change Codex's ownership of the whole project.

## Working on (claims: `agent · path · since · what`; remove when done)
- None.

## Now (built, needs a look)
- **Interaction and visual polish (Codex, 2026-11-14):** installed the described work-glove cursor,
  ceramic regulator board and red-hot strain gauntlet. Regulator fits portrait/short landscape;
  pins reveal labels on hover/focus or first touch tap. Bell Look/Ring and protected battle-popup
  footer work in lessons/free play. Wax/table priority and approved contact placement corrected;
  obsolete plaster debug entries hidden, old saves retained. Sigrid reserves input through exit
  and reload resumes departure. Descriptions/originals: `art/sources/ui-polish/BRIEF.md`.
  Verification: 256 full Node tests, 220 fast tests, typecheck, art check and intro freshness pass.
  Manual screenshots: regulator at 390×844/844×390, release sequence, map and resumed departure,
  guided/free intent footer including phone. Art check reports only existing oversized verb-icon
  notices. No browser test suite, build, commit or push; generated references updated selectively.
- **Tensed-bow placeholder (Codex, 2026-11-14):** one geometric two-direction atlas,
  `art/src/kofi1-test/kofi-test-bow-drawn.{png,json}`, aligned 224×224 frames and common foot anchor.
  Both utility shots use the existing temporary hero-layer command before the target changes;
  combat shows it for normal shots and holds it throughout Aimed shot preparation. Release or
  cancellation restores the resting pose; shot input stays locked during the 900 ms draw.
  No final image, approved rig, save-format change, build, commit or push. Placeholder inspected
  directly; browser inspection confirmed hold, cancellation and normal-shot release. Tests:
  205 fast and 195 combined story/art passed, including pose ordering, direction, loading and atlas
  alignment. Reference source and notes aligned; 182 simple placeholder PNGs total.
- **Pipe font studies (Codex, 2026-11-14):** `fonts/industrial-pipes/` contains the original
  Cinderpipe TTF/WOFF2 (284 mapped characters), source and specimen. Latest request narrows
  medieval exploration to **the Rift** only: separate PNG/SVG sample with pointed shoulders,
  diamond details and pipe collars. Second PNG/SVG direction (`the-Rift-blackletter`) has
  heavier uprights, hooked feet and an ornamental R; both remain word studies only.
  Latest revision: `the-Rift-blackletter-light.png` / `.svg`, 42% thinner strokes and
  proportionally smaller collars; previous samples preserved. Source supports `--light`.
  Samples visually inspected; latest fast run: 205 passed. Game fonts unchanged. No commit/push.
- **Kofi bow and utility arrows (Codex, 2026-11-14):** a mandatory quiet camp exchange with
  Ahyeli names Deyu as the original bow’s maker (replaces self-made origin), explains the folding
  limbs/catch, hunting points, wooden blunt arrow and ordinary cord-carrying arrow. Inventory Use
  folds/unfolds it; Look reports its current state. Blunt arrow dislodges the campfire stick;
  the later cord-arrow rig requires the unfolded bow too. Both arrows are recovered. Both survivor
  routes use the same exchange; the dead neighbour never speaks. Later Nessa upgrades stay distinct.
  Save v12 preserves old preparation and later puzzles. STORY and the 122-asset reference spec,
  hints and diary are aligned. Only two new labelled geometric test images (181 total); no finished
  art or rig changes. Checks: 239 all-Node, 203 fast, 133 story/save passed; reference freshness passed.
  New placeholder labels inspected. No browser/release suite, build, commit or push.
- **Kofi functional prologue (Codex, 2026-11-14):** `src/chapters/kofi1/`, six rooms and eight
  survivor/wildlife routes; opening errands, explicit rescue, camp, both water routes, building,
  rite, three agreements, forest and voluntary robot retrieval. Separate six-card archery with
  cancellable setup, finite/recoverable arrows, telegraphed attacks and retry. Chapter-map choice
  after Silas; direct debug jump to `kofi1`. Save v11 reads earlier formats; historical diary survives
  viewpoint changes. Only 179 simple geometric PNG placeholders (`art/src/kofi1-test/`) generated;
  no approved Kofi art/rig installed or altered. Runtime positions are a temporary grid, separate
  from the planned art composition. Tests: 199 fast, 129 story/save and 235 all-Node passed; 14 dedicated Kofi checks
  exercise all eight routes with save/load after each action, all six errand/dispute orders,
  preparation orders, postponements, checkpoints and no-ammo combat. Existing chapters retain their
  exhaustive graph; Kofi uses the dedicated route/checkpoint suite. Browser inspection confirmed
  loading, click-through dialogue, inventory pin use, aimed-shot setup and fight return. No browser
  suite, published build, commit or push. The 45–60-minute target still needs a timed human playthrough.
- **Kofi tracking (Codex, 2026-11-13):** user approved tracking the prologue-only
  `private/kofi1/spec.json`, README and generated `reference/` pack, including puzzle/ending spoilers.
  Full `STORY.md`, other private inputs and recovery archive remain ignored; 171 prologue files
  verified trackable. Fast tests: 184 passed; art: 67 passed; reference freshness passed. No commit or push.
- **Kofi private reference pack (Codex, 2026-11-13):** `private/kofi1/reference/INDEX.md` (old inbox index redirects here):
  six room briefs, 120 object briefs, 33 inventory-icon briefs and six SVG layout sheets with
  32 stage views; linked from private `STORY.md`. Pack was initially ignored; the user subsequently approved tracking it (see above).
  Reviewed layouts, links, coverage, coordinates and diagram controls. Existing checks: 171 fast /
  114 story passed; Kofi was unbuilt at that review. No game art, runtime, manifest, generated briefs,
  published build, commit or push changes. No Claude handoff required.
- **Kofi prologue script (Codex, 2026-11-13):** expanded the approved design in private,
  git-ignored `STORY.md` with playable dialogue, puzzle chains, alternatives, hints and diary
  entries. Added the requested extra scenario description and aligned locations, hints and
  revisits. Reviewed route continuity and item dependencies. Narrative delivery only; no runtime,
  art, published build, commit or push. Existing checks: 171 fast / 114 story passed; these do
  not execute the unbuilt Kofi chapter.
- **New independent Kofi rig (Codex, 2026-11-13):** from original standing designs only;
  17 registered body/costume/gear layers, original idles, two 16-frame right-facing walking sheets
  and independent distance renderer. `art/inbox/kofi-rig-from-standing/HANDOFF.md`. Existing rigs
  verified unchanged. 171 fast / 54 art checks passed. Review only; no installation, commit or push.
- **Kofi art (Codex, 2026-11-13):** actual eleven-piece village/travel rigs in
  `art/sources/characters/kofi-{village,travel}-layered/`; full elbow-to-hand pieces, joint setup,
  hidden underpainting, rigid bow/quiver bindings. `art/inbox/kofi-layered/HANDOFF.md` has previews,
  prompts and checks. Articulated GIFs replace the earlier flat walk strips (reference only).
  `npm test`: 171 passed; art feature: 48 passed. Standalone animation reviewed; not installed.
  Other directions/action poses remain queued. No commit or push.
- **Worker remarks (Codex, 2026-11-13, local):** Hollis appreciates the collector saving his back;
  Dace resents the sorter's scattered sharp pieces. Ordinary Talk and ambient chatter only.
  `npm test`: 171 passed; `test:feature -- story crowd`: 139 passed. No commit or push.
- **Codex machine workers (2026-11-13, local):** final nonhumanoid ash collector and shard sorter
  installed with directional travel, work and folded-tool poses; purposeful hall routines,
  optional short Look/Talk and a one-time cold-hall refusal saved by `machineRefusalSeen`.
  Human geometry/footsteps stay the default. Machine profiles add low/wide targets and sounds.
  `npm test`: 171 passed; `test:feature -- input crowd story art`: 186 passed. Desktop/phone
  work, dialogue, refusal and cold-load screenshots inspected. Sources/prompts are in
  `art/sources/cinderfold-machines/`; installed delivery and previews are in
  `art/inbox/done/cinderfold-machines/`. No build, browser/release suites, commit or push.
- **Codex visual polish (2026-11-13, local):** brown/brass action rings with keyboard focus;
  notebook map plates refit on activation/fonts/resize with 12px town and 14px location text;
  measured scene labels avoid overlap and edges, with connectors only when displaced.
  Checked desktop and phone screenshots, keyboard navigation and high contrast using the local
  development preview. `npm test`: 164 passed; `test:feature -- input story`: 124 passed.
  No browser/release suites, published build changes, commit or push. Kofi remains excluded.
- **Published 2026-11-11** (`a28c8c6` on `main`): the title screen, no "Click to continue" hints,
  Mara's black "Two days earlier…" opening, the perspective cell (cage, door, cloak backgrounds,
  guttering stub, floor wax and Silas's reach through the bars), the steady moonlight, and Silas and
  Sigrid walking off at the intro's end. Codex's cell deliveries are all installed.
- **Small improvements** (Claude, 2026-11-11, published): the dead auto-advance setting and six
  unused plaster lines are gone (`name.plaster`/`name.wetPlaster` and their icons stay for old saves);
  the table stub shows in the dark too. Checked: the cell dark and lit on High and Low, the moonlight
  holds still, a load mid-reach leaves the wax on the floor. `tests/e2e/cell-visuals.spec.ts` is
  updated for the perspective cell but **not yet run** (the user stopped the run).
- **Paused by the user:** Mara's left-facing artwork and Chapter 2. Chapter 2 enemy-size review
  remains for when that work resumes; do not start it during housekeeping.
- **Soft effect:** `intro/objects/stairs-light.png` is marked placeholder because it is not
  palette art. That is intended.

## Next for Claude
See `CLAUDE-INBOX.md`.

## Waiting on Codex
- Kofi 1 art (`art/CODEX.md`): static room backgrounds with every interactive object as a separate
  layer, Kofi's two sheets, the spider robot, animals, villagers, wolves, bear, fight art.

## Waiting on the user
- **Kofi 1 is designed, not built** (grilled 2026-11-13, written into `STORY.md`). Building waits
  until the user says so; then: unlocks, shell and title cards, rooms, puzzles, rite and quarrels,
  fights and deck, the robot scene (easiest first, placeholders until Codex's art lands).
- Chapter 2 waits until the user resumes that chapter.

## Inbox (art/inbox, git-ignored, local only)
Cleared on 2026-11-11: installed/older deliveries are in `art/inbox/done/` (loose files in
`done/loose-2026-11-11/`). Paused `mara-*` folders remain at the top. `reference/`, `preview/` and
`archive/` are retained reference material.

Codex archived superseded full-cell exports in `art/inbox/archive/housekeeping-2026-11-11/`;
`moves.json` there records all 42 moves and their original locations. Forty loose review logs are
in `shots/archive/2026-11-11-logs/`, and the old test-results folder is preserved at
`shots/archive/2026-11-11-test-results/`. No files were deleted; generated `dist/` remains in place.
Housekeeping checks: 157 fast and 35 art tests passed; runtime code and source artwork unchanged.

## Recent decisions (newest first)
- **2026-11-13:**
  - The story file moved to `adventure/STORY.md` (git-ignored, never publish).
  - Kofi 1 is a prologue four years before Day 1 (title card per scene); Mara 1 opens both Kofi 1
    and Mara 2. The weaving rule is dropped. The current `src/engine/unlock.ts` still chains ch1 → ch2.
- **2026-11-11:**
  - The user discarded Codex's whole "Interaction clarity and material effects" brief (regulator,
    cell puzzles, Tobi's scarf). Don't revive it.
  - Moonlight is steady; only candles and lanterns flicker (`steady` on glows and shafts).
  - The floor wax sits by the table even though Silas's reaching hand stops short of it (accepted).
  - The kneel-reach pose is for the wax pickup only; the general kneel stays.
- **2026-11-10:**
  - Every dialogue line waits for a click (no auto-advance), with no "Click to continue" hint.
  - The mask putty is candle wax kneaded into bread.
  - Kell faces right and catches Silas when he is undisguised.
- **2026-11-09:**
  - Fights play over the room they happen in, with a card strip along the bottom.
  - Enemies have their real size against Mara.
  - MedievalSharp for all lettering except dialogue (Zilla Slab).
- **2026-11-08:** the build budgets were doubled (`scripts/verify-build.mjs`).
- **Standing rules:**
  - Push only when asked, and ask which branch first.
  - Unit tests only, with screenshots for visuals.
  - Codex art that is drawn wrong is not used.
