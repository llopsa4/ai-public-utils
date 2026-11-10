# Claude's inbox

Codex (or the user) writes tasks for Claude here; this is Claude's only queue. Claude deletes each
task once it is done and leaves unfinished ones in place. An empty file means nothing is queued.
Per-delivery notes may stay in their `art/inbox/<folder>/HANDOFF.md`, but each needs an entry here
pointing to it.

## 1. Interaction clarity and material effects (from Codex, 2026-11-10)

This is an implementation brief, not a claim that the changes below already exist. Check the
current code before editing.

The user asked for this handoff so you can implement whatever is feasible from the visual-polish plan agreed in this chat. This document is an implementation brief, not a claim that the changes below already exist. Check current code before editing; other work is active in this checkout.

### Agreed scope and boundaries

The first pass has three groups: **Silas's cell puzzles, Tobi's scarf handover, and the regulator's mechanical operations**. The goal is clear actions and consequences. Targeted new artwork is allowed, but use existing assets first. Complete independent parts without waiting on missing artwork; report any remaining asset work precisely.

- Feedback follows a successful action. No automatic glitters, proximity pulses or other new puzzle-discovery hints.
- Keep existing room views and the existing regulator close-up. Brief staged actions are acceptable; no new camera cutaways.
- Preserve dialogue wording, puzzle solutions, rewards, approved character designs and save compatibility. The one agreed dialogue change is splitting the scarf exchange so the visible transfer happens after Tobi's offer and before Mara's reply.
- Effects play once on the successful transition. Revisits/reloads show the resulting state immediately, without replay or duplicate rewards.
- Mara's deferred source-art work and Chapter 2 remain excluded. Silas reaching through the bars was explicitly discarded; do not revive it.
- Keep changes local. No commit or push unless separately requested by the user. Do not edit the sibling `FFCardGame` project.

Your current combat-display plan owns the adventure combat overrides, card sizing, fighter staging and hit feedback. This pass does not touch those. Leave title/map/opening-card/exterior presentation to your other work as well. The user-selected coloured engraved map is already installed; do not repaint it again.

### 1. Regulator mechanics — start here

Entry point: `src/ui/regulator.ts` and its existing CSS. `operateRegulator()` in chapter 1 progression remains authoritative. Separate bolt, valve, ring and housing artwork, rotations, dial animation and saved stage flags already exist: strengthen their physical feedback instead of rebuilding the puzzle.

- **Bolts:** on each genuinely new successful turn, retain the current rotation and add a small axial withdrawal/lift over **300 ms**.
- **Vent:** after successful venting, emit a small localized steam release at the valve over **650 ms**. Keep the existing safe-pressure needle transition. No full-panel haze.
- **Ring:** withdraw the ring over **450 ms**, revealing its connector beneath. Reuse the current housing where it already supplies the needed detail; request/draw only a genuinely missing exposed connector.
- While an operation animates, disable other mechanisms and final removal. **Close and Escape remain usable.** Invalid or repeated operations keep the existing explanation without success effects.
- Commit/save each valid state change before the animation. Closing during a beat cancels its presentation, not the committed operation. Reopening renders the saved state without replay.
- `ringReleased` completes the close-up stage; actual regulator collection and kiln shutdown still belong to the subsequent chapter interaction. Do not grant the regulator or set `kilnCold` early.

### 2. Cell puzzles

Relevant rules: `src/chapters/intro/interactions.ts`; scene placement/state: `src/chapters/intro/rooms.ts`.

**Plate into window — 800 ms total.** Use the existing plate artwork: **450 ms** placement travel, then **350 ms** reveal/illumination using the existing lit state. Replace the corresponding existing waits rather than adding another delay. The `cellLit` flag already reveals the settled `windowPlate` and lifts darkness. Commit logical state first, but defer the visual refresh until the moving plate lands. Temporarily hide the settled object if necessary to avoid showing two plates. Reload simply shows the installed plate and lit room.

**Taking the candle stub — 600 ms.** (Adapted 2026-11-10: the wall plaster was replaced by a tallow candle stub on the window ledge, `stub` hotspot, `windowStub` object, `tookWax` flag.) On `tookWax` false→true, a soft moonlit glint on the stub, then it lifts off the ledge and fades as it goes into the satchel. No crumbs. Reload simply shows the bare ledge.

**Mask assembly — 800 ms.** On `harrowMade` false→true, show a short strip immediately above the satchel/inventory: existing frame and putty item illustrations (the putty is wax kneaded into bread) combine into the finished mask. No modal window, face-covering panel or new crafting pose. The ingredients and finished item retain their normal inventory semantics. Size the strip for phones, prevent clipping and avoid moving keyboard focus. Use the existing acquisition announcement or an accessible polite status; do not duplicate spoken dialogue.

Leave the existing cloak pickup/dressing fade, sound and costume change intact. Cloak source artwork was delivered separately in `art/inbox/silas-cloak-layered/`; consult its handoff if needed, but this pass does not reopen that pack.

### 3. Tobi's scarf handover

Both the Nell and Tobi farewell routes share the one-time gift node. At present Nell's `cold` node includes four Nell lines, Tobi's offer and Mara's reply, and only then grants bread/scarf and sets `gotBread`/`gotScarf`.

Implement the agreed timing without rewriting the dialogue:

1. Keep the four Nell lines and Tobi's existing offer in `cold`.
2. Keep its existing bread/scarf rewards and flags there; they now commit immediately after the offer.
3. Point it to `scarfReply`, containing only the unchanged `dlg.hero.tobiScarf` line, then end. Include that node in both Nell's tree and the shared `DIALOGUES.farewell.nodes`.
4. On the newly committed `gotScarf` transition, use the normal scripted **walk** handler/pathfinder to move Mara to **(195,300)**, face left toward Tobi, and sync his saved position. Leave Mara there. Do not use a straight `step` movement that skips pathfinding/state synchronization.
5. Show a **700 ms** physical scarf transfer, then play Mara's reply. Restore Tobi's normal pose/task afterward.

Tobi stands near **(155,300)**; Nell near **(250,300)**. Talking to Nell can leave Mara around **(290,302)**, so do not assume the actors are already beside one another. Freeze/resume Tobi's ambient task during the offer as needed.

Preferred asset addition: one short Tobi offering pose using the existing action-tag/sheet mechanism, plus an independent orange scarf cutout. Preserve his approved face, child scale and patched clothes. **If that pose is unavailable, implement the staging and a restrained scarf-object transfer with the existing standing sprite, and report the offering pose as remaining art.** Reuse/crop the existing scarf artwork; do not substitute a conspicuous placeholder or redraw Mara.

### 4. Shared implementation and lifecycle

Use a small presentation-only helper for these specific beats, not a new general effects framework or save schema.

- `src/game/room/commands.ts` → `storyChange()`: compare the relevant flag before/after `applyCommand()`. Trigger only the intended false→true transition in the correct chapter/room. This covers `cellLit`, `tookPlaster`, `harrowMade`. Avoid triggering from `refreshObjects()` or scene construction.
- `src/game/room/runner.ts` → `runDialogue()`: capture `gotScarf` before `applyDialogueEffects()`, commit effects, then await the handover before continuing to `scarfReply`. `DialogueNode.run` happens before its lines, so it is not the reward/transfer hook.
- Capture the scene and state identity. An awaited helper must return completion/cancellation. After awaits, do not continue old dialogue, rewards or cleanup against a newly loaded game/scene. Propagate cancellation through the dialogue command handler; the current runner also ignores false results from `node.run` commands, so account for that when adding asynchronous presentation.
- On shutdown, stop pending scripted movement, cancel timers/tweens, destroy temporary images/particles/DOM and settle every promise. Restore actor state only if that actor still belongs to the captured live scene. The existing `wait()` uses a scene timer that can disappear on shutdown without resolving; do not copy that lifecycle for the new effects.
- Use existing busy locking; block overlapping interactions during the short beats. Persist committed flags/items before presentation so interruption cannot duplicate or lose a reward.
- Do not add save fields/migrations. Existing flags are sufficient. Existing saves with completed flags show final visual states immediately.

### 5. Optional material polish, after core behaviour works

The user also asked about glitters, noises and effects. The following are proposed additions, **not equally required features**. Implement useful low-cost details within the three groups without delaying the core pass:

- A brief glint across a **handled** plate/brass frame/bolt, synchronized with contact. No idle glitter marking undiscovered objects.
- A quiet ceramic tap, a soft waxy squish, small brass assembly click, scarf cloth rustle and localized vent hiss. Reuse existing sound helpers where suitable; respect mute and avoid duplicate pickup sounds. No music/combat-audio changes.
- Localized steam that quickly settle/disappear. Avoid full-screen flashes, bloom, heavy grain or haze; the game artwork is already textured.

Read reduced-motion settings at playback. Preserve final-state feedback and the same timing using stationary imagery; suppress travel, shake and moving particles. The basic action/result must stay readable on Low graphics quality. Do not make success identifiable only by sound, motion or colour.

### Validation and reporting

- Fast tests: genuine transition selection, repeated actions/revisits, state committed before feedback, cleanup and cancellation settling.
- Cell: light/settled plate appear at landing; bare ledge survives reload; mask consumes/grants the existing items once; strip fits phone layouts.
- Scarf: both entry routes preserve the same six-line order, rewards occur exactly once after the offer/before reply, pathfinding/sync place Mara correctly, cancellation cannot continue an old exchange or grant again.
- Regulator: both bolt orders, unsafe actions, duplicate/rapid clicks, Close/Escape during every operation, reopen/reload at each stage, no early regulator collection/shutdown.
- Run `npm test` and relevant feature suites. **Shared runner/command changes require `npm run test:all`**, per `TESTING.md`. Run art checks for changed assets. Keep new tests classified in the suite catalog; retain the headless driver's strict unknown-command handling.
- Inspect screenshots at desktop/phone sizes, intermediate/final states and reduced motion/Low quality. Do not run browser suites, full journeys or release suites unless the user requests them. Build once when needed to inspect new runtime assets and verify current size budgets.
- Report completed parts, remaining artwork/limitations, checks actually run and any overlap with concurrent work. Do not imply the entire broad visual wish list was implemented.

## 2. Integrate Codex's art for `art/CODEX.md` tasks 1–3 when it arrives

- **The open door** (`art/inbox/cell-door-open/`): replace `art/src/intro/objects/cell-gate.png`,
  then check that Silas passes behind it.
- **The cell with and without the cloak** (`art/inbox/cell-cloak/`):
  - Add a room background chosen by flag: a `backgroundWhen` field in `RoomDef`, read in
    `src/game/scenes.ts`. `tookCloak` switches to the bare picture.
  - Retire the `cloak` object (`cell-cloak`); the hotspot stays.
  - Add both pictures to the manifest and run `npm run art:check`.
- **The candle stub and wax** (`art/inbox/candle-stub/`): replace Claude's placeholders
  `intro/objects/window-stub.png` and `intro/items/wax.png`, and mark them final.
