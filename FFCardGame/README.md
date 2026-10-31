# Kiln Courier

An original, silent, desktop-first industrial-fantasy card game. Play Mara, a ceramic-armored courier with a pressure gauntlet, through the opening chapter or a standalone battle.

The cinematic combat screen uses an expansive kiln-hall arena, compact HP/MP bars, illustrated cards, and separate energy and strain controls. The prototype uses TypeScript, React, and Vite. Its seeded combat rules run independently of the interface.

Choose **New Story** for the complete opening: guided combat, two branching dungeon sections, card choices, discoveries, rest, a guaranteed workshop, Oren’s protected training and upgrade, and Iven’s bridge encounter. Six battles including the optional tutorial on a chosen route lead to a saved chapter summary. **Standalone battle** retains the original replayable fight; **Continue** resumes a saved lesson, choice or battle. Later chapters and roguelike expeditions are not yet playable.

Campaign actions autosave on this browser. Use **Menu & backups** (or **Menu** during battle) to export a JSON backup or import one with replacement confirmation. Invalid imports preserve current progress. An unreadable stored save is preserved and can be downloaded before choosing to replace it. If storage is unavailable or full, play continues in memory with a session-only notice and backup export. There is no account or cloud save. Standalone battles do not change campaign progress.

## Play the opening

Choose **New Story** to begin; export an existing campaign before replacing it. Follow the highlighted tutorial controls, or choose **Skip tutorial** in the lesson banner or menu to enter the chapter. Tutorial dialogs also offer **Leave tutorial**. Skipping keeps the normal 60 HP, 10 MP and one-time 12 starting salvage. Help offers **Replay combat lesson** afterward; **Leave practice** returns to your campaign without changing resources. During ordinary combat, click a card to play it, or use Tab and Enter/Space; focus or hover previews its effects. Energy refills each turn. MP powers special techniques; strain persists until vented, overloaded or a new fight starts. Inspect Draw/Discard and the visible enemy intention before choosing End Turn.

Between fights, choose one forward map branch, collect or skip card rewards, and compare equipment before confirming a purchase. Free equipment swaps never refill resources. Defeat offers an exact retry from the encounter’s saved starting state. Scenes can be skipped or replayed from reached-scene history. Use Menu to export/import progress; saves belong to this browser and origin, so localhost, GitHub Pages and another browser have separate progress.

## Visual presentation

Short charcoal fades connect scenes and major navigation; combat actions retain their existing 420 ms feedback window. Attacks use grounded lunges and contact recoil, with distinct pressure, guard, vent and ally-support effects. Played cards leave a fixed-size decorative copy while remaining cards keep their dimensions. Lighting, sparse embers/steam and brass/ceramic frames carry through combat, routes, rewards and workshops. Training shows the existing technique costs before and after learning Tempered Flow.

The system’s **Reduce motion** preference removes fades, lunges, flying cards and ambient movement, retaining readable action results and static heat highlights. No animation controls game rules or save data. The release passed 109 automated tests and a complete opening in the browser; reduced-motion checks used a private development fixture. Native preference changes and first-time-player timing remain unverified. Original PNGs are retained; local loading measurements do not establish performance on slow networks.

## Illustrated workbench

The workshop has separate **Equipment** and **Techniques** views. Inspect an illustrated shelf item beside your current equipment; changed stats and tradeoffs appear at the bench. The three equipped slots remain visible. Buying adds ownership, while Equip is a separate free action. Reinforcement has a base/upgrade art preview and retains the existing one-upgrade limit and spending confirmation.

Techniques uses an illustrated card gallery instead of a dropdown. Copy numbers distinguish duplicate cards; selection targets that exact instance. Compare its original and refined effects before spending. Pulse remains reserved for teacher training, and deck removal retains its confirmation and eight-card minimum. Oren's result illustrates Pulse and Tempered Flow alongside permanent HP/MP growth and restored travel resources.

Fifteen original gear images and their prompts are recorded in [equipment provenance](assets/equipment/PROVENANCE.json). Runtime uses precomputed 512 px WebP derivatives (1.15 MB combined versus 29.86 MB of preserved originals). Ordinary builds need no image tooling. To regenerate those derivatives after intentionally editing art, the optional `python scripts/prepare-equipment.py` step requires Pillow. Equipping gear does not change Mara's combat sprite.

## Current limits

- Only the opening chapter and standalone guardian battle are playable; later chapters and roguelike expeditions are unavailable.
- First-time-player pacing and tutorial clarity remain under review; the 20–30 minute goal is not yet verified.
- Desktop is the primary layout. Narrow screens use a fallback; phone-specific design is deferred. The game is silent.
- Runtime files total approximately 53 MB, mostly original PNG illustrations and local fonts. Initial loading can be slower on limited connections. No offline cache or cloud sync is provided.
- Earlier saves retain the legacy route. New Story starts the authored chapter; export first if you want to preserve an older campaign.

## Develop

Install Node.js 22.12 or newer. From this folder:

```powershell
npm ci
npm run dev
```

Open the local URL printed by Vite (normally http://127.0.0.1:5173/). Dependencies are pinned in package-lock.json. No account, API key, backend, or external runtime service is needed.

## Check and build

```powershell
npm run typecheck
npm test
npm run playtest
npm run build
```

`npm run check` runs type checking, the test suite, and the production build together. Tests run directly against the TypeScript engine using Node's test runner through tsx. The playtest compares three policies over 100 seeded battles each for both base and trained signatures, then 100 heat-aware battles for each of the six equipment alternatives (1,200 total), plus the scripted teaching battle and 300 growing-deck routes through training and the final checkpoint. Additional checks cover 300 refined-deck/equipment battles, 600 bridge battles with/without support and 300 complete routes that buy/equip power, defense or speed gear, play scenes, use Iven’s support and resume saved rewards.

The Vite source entry is `client/index.html`. Production output is first generated in ignored `dist/`, then `scripts/build.mjs` updates the generated root `index.html` and `build/`. A build verifier checks asset parity, relative entry URLs, and exclusion of private documents.

Keep the generated `index.html` and `build/` with the source changes when preparing a release: this repository's GitHub Pages deployment serves the root of main directly. The game remains at `/ai-public-utils/FFCardGame/`; the other applications and hosting settings require no changes. Only push on an explicit user instruction.

After building, preview with `npm run preview`, or serve the existing Pages layout from the repository root:

```powershell
python -m http.server 8765 --bind 127.0.0.1
```

Then open http://127.0.0.1:8765/FFCardGame/. Opening HTML through `file:` is unsupported. Editing source requires rebuilding to update this static preview; Vite's dev server reads source directly.

## Code layout

- `client/src/game/`: typed battle state, seeded rules, and pure transitions; no React, DOM, or storage dependencies.
- `client/src/content/`: card, equipment, profile, encounter and checkpoint definitions.
- `client/src/components/`: battlefield, resources, cards, previews, and native dialogs rendered by React.
- `client/src/hooks/useBattle.ts`: synchronous input guards, transient action feedback, and battle orchestration.
- `client/src/persistence/`: versioned campaign save validation/storage and the unchanged optional hint preference.
- `client/src/App.tsx`: screen composition, focus management, and modal selection.
- `client/src/CampaignApp.tsx`: menu, campaign command dispatch, autosave boundaries and backup flows. Combat animations remain transient; they do not own campaign state.
- `style.css`: shared visual layout and reduced-motion rules. Artwork source files and provenance remain in `assets/`; Vite bundles only imported assets.
- `tests/`: combat, preferences, and reproducible balance simulation.

Edit source files rather than generated index.html/build files. The build has no public-directory copying and no source maps; it does not copy planning notes or unrelated repository files. Private design documents and local scratch work remain ignored by Git.

## Configurable battles and development fixtures

`createBattle(profile, encounter, seed)` takes copied character resources/maxima and deck instances plus encounter-specific enemy HP, intentions, energy and hand size. Battle state retains its own configuration; rendering, previews, help, turn transitions and outcome summaries read it. `newBattle(seed)` remains a compatibility entry for the original prototype. App/useBattle consumes setup once per mounted session; remount with a new key to switch setups. Restart retains the session's starting profile/encounter and uses a fresh shuffle; this is not campaign retry or autosave.

With `npm run dev` running, open `/fixtures.html` at its local URL (normally http://127.0.0.1:5173/fixtures.html). Select Original prototype or Cooling rig to exercise the same engine and interface. The synthetic rig uses existing artwork, a seven-card deck, partial 42/48 HP and 3/6 MP, two energy, three-card draws, and a different two-action intention cycle. It is test content, not an opening-chapter encounter. Fixture controls and definitions are absent from the generated production runtime and the normal entry has no fixture selector.

Inputs are validated before starting, including resource bounds, nonempty intentions, nonnegative integer effects, known card types and unique instance IDs. Battle creation and transitions do not mutate the caller's profile, deck or encounter. The authored opening is connected; later chapters remain future work.

## Equipment and campaign preparation

Profiles may supply a three-slot loadout: gauntlet, armor and utility. Missing gear defaults to neutral courier items. Power adds once to an attacking card; defense adds once to a block-granting card. Speed 0–1 draws the normal opening hand, 2–3 adds one card, and 4+ adds two; later turns retain the encounter's normal draw. Heavy Gauntlet adds one strain per attacking card. Maximum-MP gear raises the cap; equipping it never refills MP, and removing it clamps excess MP. Card values, accessible descriptions and effect previews use the same calculation as combat.

The saved campaign starts with neutral equipment. Old workbench sells six alternatives for 24 or 32 salvage; buying adds ownership without equipping. Compare raw bonuses/penalties and resulting power, defense, speed, opening draw and MP cap. The owned collection allows free swaps between encounters. Stock and one-upgrade-per-item limits persist. An upgrade costs 20 salvage; ordinary card refinement costs 16 and removal costs 20, with an eight-card minimum. Pulse stays protected for teacher training. Transactions require confirmation and reject insufficient funds, stale input, duplicates and combat changes. Leaving closes this workshop. The development fixture's Build selector still previews statistics in isolation.

`campaignTransition` owns accepted commands, revisions, current battle, immutable starting snapshot, completion and claim IDs. Campaign retry restores that exact snapshot, including RNG, grown statistics and deck order. Victory commits remaining HP/MP, then reward selection or Skip collects resources once. Standalone restart continues to create a fresh shuffle.

The current save envelope is version 6, content version `systems-preview-6`, stored at `kiln-courier.story-save`. Validation replays accepted commands from the immutable starting snapshot and checks resources, piles, equipment, rewards, scenes, training and support. Imports are limited to 512 KB and 10,000 commands. Version 1–5 saves migrate without resetting battles or resources and retain their existing route; choose New Story to enter the authored opening. Checked-in v1–v6 fixtures cover migration and protected practice. Unsupported or altered saves are rejected without overwriting progress. The old hint-dismissal key remains independent of guided training completion.

Development fixtures also simulate denied storage, full storage and a damaged save without altering the real campaign save. These controls remain excluded from production output.

## Guided combat lesson

New Story starts a real, safe three-turn battle with one outlined control and a short prompt at a time. It teaches enemy intention, attack/energy, guard/block, End Turn, draw/discard inspection, Help, battle log, restart cancellation, and reusable Kiln Pulse/MP/strain. Unrelated actions are disabled and rejected by the pure transition layer; there is no generic Next button or scripted victory. The first draw order is teaching-specific; all twelve cards are conserved, the turn-three discard reshuffle uses seed 101, and ordinary encounter shuffles remain unchanged.

Use the mouse or Tab/Enter/Space. Escape closes the required dialog; during restart confirmation it means Cancel. Focus and instant scrolling follow the required control after each step. The lesson, combat and stable dialog kind save atomically, including during an open modal. Menu → Restart lesson explicitly returns to its beginning. A state mismatch cannot award completion; a safe restart is available.

The teaching sweeper has 30 HP and attacks for 4. Knuckle Drive, Guard, Pulse and Piston Strike produce an actual victory on turn three: 60 HP, 6 MP and 8 strain. First Continue records guided completion separately from hint dismissal, restores campaign starting resources to 60 HP/10 MP and grants 12 salvage exactly once. **Help → Replay combat lesson** unlocks after completion. Replay uses neutral starting resources and deck, pauses the campaign, saves its own lesson progress alongside it and awards nothing. On completion the original campaign resumes unchanged.

The lesson leads directly to the route preview. The teaching machine temporarily reuses existing guardian art. No new character artwork or long narrative scenes are included.

## Branching systems route

The connected kiln map has ten stops and eight forward-only paths. Battle, rest, discovery, workshop, teacher, story and exit symbols show the kinds of stops ahead. Every path meets the teacher and story gates. Inspect any stop for its risk and reward category; only adjacent **Available** stops offer **Travel**. Travelling commits the branch. Visited stops and passed alternatives cannot be replayed or used to backtrack.

Click a map button to inspect it. Arrow keys move between stops; Home/End inspect the first/last stop, and Tab reaches Travel. Node states are written as text as well as distinguished visually. SVG connectors show the chosen route and available connections; walking animation is not needed.

Ashway and Pressure walk start actual machine battles. Victory offers 12 salvage, up to 2 MP recovery and a seeded choice of three cards, or Skip; the final checkpoint offers 20 salvage instead. Choosing or skipping collects those resources once. Five reward techniques add low-strain attacks, protection, hot damage, draw/venting and mixed MP-powered effects. No reward offers an extra Kiln Pulse. Inspect your persistent deck between stops.

Quiet hearth restores 30% of maximum HP, rounded up and capped, and refills effective maximum MP. Forgotten alcove offers 10 salvage or a saved three-card choice; Ember overlook offers 10 salvage or up to 2 MP. The training rig restores pre-training HP/MP after victory, then adds 6 current/maximum HP and 2 current/base maximum MP and upgrades the owned Pulse to Tempered Flow. Gear MP bonuses apply once. Each stop can be completed once.

Old workbench opens equipment and card services. Bridge watch introduces Iven and a 68-HP Cable Warden encounter; its victory grants 20 salvage and capped +2 MP without a card offer. The exit remains a route endpoint, followed by the original checkpoint. Pending destinations and card offers autosave before display, so reload cannot reroll them or reopen abandoned branches. At the exit, **Return to checkpoint** returns to the checkpoint context with earned resources. **Review route** never resets it. The map validator rejects missing edges, dead ends, cycles, unreachable nodes and bypassable/out-of-order gates. This synthetic route is not the full authored chapter; existing guardian artwork temporarily represents the route machines and warden. Distinct environment/character art and the final authored map belong to later integration.

## Signature technique and MP preparation hooks

Kiln Pulse supports an optional `tempered-flow` upgrade on its existing instance. It retains its name, art, 2-energy cost, 16 damage and 6 block, while costing 3 MP and adding 3 strain instead of 4 each. The technique subtitle appears on the card, in piles and in the log. The engine, affordability checks, Help and previews resolve the same definition. Upgraded Pulse still shuffles and can be reused; it has no once-per-battle limit or guaranteed ordinary opening draw.

`learnTemperedFlow(profile, instanceId)` returns an updated profile without changing its input or duplicating the card. Reapplying it to an already trained instance is a no-op. It grants no HP/MP, reward or story progress itself. `recoverMP(profile, amount)` provides explicit capped recovery. Campaign transitions own eligibility, one-time training growth and recovery; pure helpers supply the same calculations to screen previews.

On the development fixture page, choose **Signature technique**, then **Start trained test battle** to compare MP/strain costs in isolation. At 3 MP the base card is disabled and its trained counterpart is playable. This fixture changes no campaign progress. Story mode earns the upgrade through the training rig; the standalone prototype continues with the base signature.

## Brief scenes and ally support

New Story begins with short exchanges and clear actions. Continue advances one exchange; Skip applies the same essential consequence once and never skips combat. Scene position and objective autosave. Menu offers read-only replay of reached scenes between encounters; unreached scenes are unavailable. The renderer is separate from opening scene data. Existing Mara/arena artwork is reused for these functional scene plates; this does not complete the later illustration delivery.

At the bridge Iven arrives before the first player command. His highlighted **Brace · +8 block** button must be used once before ordinary card/End Turn actions unlock. It costs no energy or MP, causes no enemy action, and does not scale with equipment defense. The spent charge survives reload and later turns; normal block expiry applies. Retry restores the exact battle-start snapshot. Fresh subsequent battles grant one new support charge without repeating the first-use lock. Iven has no separate deck, HP or equipment.

The present systems route has fewer battles than the final opening map, so it does not yet provide that map’s guaranteed workshop budget or 20–30 minute pacing. Prices and upgrade effects use the agreed specification; completing the authored route and its economy is the next delivery.

## Controls and rules

- Click a card to play it; attacks automatically target the guardian. Tab and Enter/Space work too. Hover or focus a card for its effect and strain preview.
- Start with 60 HP, 10 MP, 3 energy, and 5 cards. Guardian starts with 72 HP.
- Kiln Pulse is a normal reusable card: 2 energy, 4 MP, 16 damage, 6 block, and +4 strain. It is not guaranteed in the opening hand. MP persists between turns and resets on a fresh battle; basic cards need no MP.
- At 6–9 strain, attacks gain 2 damage, evaluated before adding the card's strain. At 10 strain, lose 6 unblockable HP and reset strain to 4.
- Strain stays between turns. Vent cards reduce it; overload still releases pressure back to 4. Each fresh battle starts at zero.
- The gauntlet indicator uses a ceramic emblem and heat glow instead of visible numeric readings. Heated and Critical states empower attacks; a resolved overload shows red flames and “Pressure released” until your next accepted action. Exact values remain available to screen readers and in card/rule descriptions. Reduced motion keeps the effects static.
- End turn discards your hand and resolves the enemy intention. Then your block expires, energy refills, and you draw 5.
- Guardian repeats 8 attack -> 6 block and 4 attack -> 14 attack. Its block lasts through your turn, then expires before its next action.
- Empty draw piles reshuffle the discard pile. Pressure Cycle cannot draw itself while resolving.
- Complete the card and overload before checking the outcome. Simultaneous defeat is a loss.
- Inspect piles without revealing draw order; the battle log keeps the latest 30 actions. Restart asks for confirmation.
- Reloading returns to the menu; Continue restores the saved campaign exactly. Standalone battles are not saved. The optional hint-dismissal preference retains `kiln-courier.tutorial-complete.v1`; it does not indicate completion of guided combat training.

Actions preserve revision guards and ignore double clicks, repeated keydown, or input during short feedback animations. Attacks use grounded lunges, moving shadows, contact recoil and pressure impacts; Piston Strike and Kiln Pulse have distinct motion. The existing 420 ms action window is unchanged. Motion follows the operating system's reduced-motion preference. Small screens receive a wrapping fallback; desktop remains the primary layout.

## Verification baseline

The current 106 tests cover combat, heat/overload, reusable/upgraded Pulse, equipment, exact retry, rewards/growth, saves/storage failures, tutorial/replay, legacy routes and all sixteen authored opening paths, graph validation, branch commitment and v1–v5→v6 migration. Reward coverage includes saved seeded offers, Skip, claim guards, discovery alternatives, rest/growth caps, new-card interactions and altered-save rejection. Workshop, scene and support tests also cover stock/ownership persistence, all eleven card refinements, legal deck limits, once-only effects, read-only reached-scene replay, support teaching gates, free costs, block expiry, exact retry and spent-charge reload. Type checking and production asset verification run with `npm run check`.

The original TypeScript migration matched every state across 100 seeded battles and 3,022 actions. The subsequent MP/signature addition intentionally changed the starting deck. With the former end-turn cooling rule, base simulations over 100 seeds per policy averaged aggressive 4.06 turns / 43.83 HP, defensive 4.66 / 52.21, and heat-aware 4.21 / 49.72. These are historical comparison values, not the current rules.

The configurable-battle change preserved the pre-change prototype across 100 seeds and 2,593 transitions, including previews, RNG, piles, logs and outcomes. Its three playtest policies also retained identical results.

With cooling still enabled, the optional technique also preserved base parity; trained means were 4.01/4.64/4.11 turns and 46.07/53.27/49.91 HP. Removing automatic cooling intentionally changes that behavior, so old transition parity is no longer an acceptance criterion for this rule change.

Current simulations with strain retained between turns (100 seeds per policy, all 600 battles won): base aggressive 3.95 turns / 37.99 HP, defensive 4.57 / 45.14, heat-aware 4.46 / 44.18; trained aggressive 3.95 / 38.23, defensive 4.59 / 45.94, heat-aware 4.53 / 44.67. Mean overloads are now 1.84/1.45/1.28 for base and 1.86/1.32/1.17 for trained. Keeping heat makes hot attacks and overloads more frequent; deliberate venting is more valuable. No other card/enemy tuning was applied. Simulations do not establish human pacing or campaign balance.

The equipment addition preserves all six neutral baseline results. Across 100 heat-aware seeds each, Heavy Gauntlet averaged 3.77 turns / 44.26 HP, Balanced Gauntlet 3.97 / 45.88, Layered Armor 4.64 / 49.21, Light Armor 4.55 / 46.51, Quick-release Harness 4.28 / 44.90, and Insulated Kit 4.55 / 46.51. All 600 equipped battles won. Power shortened fights, layered armor prevented more damage, and speed improved opening flexibility; these subsystem results do not establish campaign economy balance or player preference.

The 300 growing-deck route simulations finish successfully across three policies. Mean total turns across the route battle, training and checkpoint are 7.74 aggressive, 8.48 defensive and 8.13 heat-aware; mean final HP is 43.14, 51.38 and 49.61 respectively. Existing 1,200 combat results remain unchanged. This validates subsystem compatibility, not the future chapter's human pacing or economy.

Additional integration simulations finish all 300 equipment/scenes/support routes: final HP means 40.30 (heavy gauntlet), 46.81 (layered armor) and 42.01 (quick harness). All 600 bridge comparisons finish; Iven improves mean remaining HP without adding a turn. These remain automated policy checks, not human pacing evidence.

The authored-opening matrix completes 288 seeded routes across three policies and power, defense and speed builds, covering all sixteen paths. Three additional browser playthroughs completed New Story through the ending with different routes/builds, purchases, training and Iven support. These are agent-operated checks: unfamiliar-player completion time, tutorial clarity and the 20–30 minute target remain unverified.

## Opening progression

All paths reach the workshop, Oren and Iven. The guaranteed workshop budget is 36 salvage, or 46 after the first salvage discovery. Oren lends neutral practice equipment and protected HP/MP; play highlighted Tempered Flow first, then finish the rig. Practice spending and damage do not consume travel resources. Completion grants +6 maximum/current HP, +2 base maximum/current MP, and upgrades the owned Pulse once. The second discovery offers salvage or an owned Insulated Kit without equipping or refilling it. The ending records growth, deck, equipment, salvage and chosen route; the next chapter is explicitly unavailable.

## Artwork

Fifteen additional opening assets illustrate Oren, Iven, three maintenance machines, five locations and five reward-card designs. Equipment and story details use original SVG. New machines have grounded silhouettes, proportional scaling and a disabled state after victory. The hero, guardian, environment, and shared card-art atlas were generated for this project using the built-in OpenAI image-generation tool. The atlas contains seven card illustrations and two deck backs; all costs/effects are real rendered text, not baked into artwork. Status frames, character crests, resource gemstones, corner flourishes and the kiln mark use original SVG geometry. Cinzel headings and Cormorant Garamond body text are bundled locally with their SIL Open Font Licenses; the game makes no external font requests. No audio is bundled. See [asset provenance and prompts](assets/PROVENANCE.md).
