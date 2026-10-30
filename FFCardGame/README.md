# Kiln Courier

An original, silent, desktop-first industrial-fantasy card combat prototype. Play Mara, a ceramic-armored courier with a pressure gauntlet, against the Hollow Kiln.

The cinematic combat screen uses an expansive kiln-hall arena, compact HP/MP bars, illustrated cards, and separate energy and strain controls. The prototype uses TypeScript, React, and Vite. Its seeded combat rules run independently of the interface. This refactor preserves the existing one-battle game; campaign features are developed separately.

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

`npm run check` runs type checking, the test suite, and the production build together. Tests run directly against the TypeScript engine using Node's test runner through tsx. The playtest compares three policies over 100 seeded battles each for both base and trained signatures.

The Vite source entry is `client/index.html`. Production output is first generated in ignored `dist/`, then `scripts/build.mjs` updates the generated root `index.html` and `build/`. A build verifier checks asset parity, relative entry URLs, and exclusion of private documents.

Keep the generated `index.html` and `build/` with the source changes when preparing a release: this repository's GitHub Pages deployment serves the root of main directly. The game remains at `/ai-public-utils/FFCardGame/`; the other applications and hosting settings require no changes. Only push on an explicit user instruction.

After building, preview with `npm run preview`, or serve the existing Pages layout from the repository root:

```powershell
python -m http.server 8765 --bind 127.0.0.1
```

Then open http://127.0.0.1:8765/FFCardGame/. Opening HTML through `file:` is unsupported. Editing source requires rebuilding to update this static preview; Vite's dev server reads source directly.

## Code layout

- `client/src/game/`: typed battle state, seeded rules, and pure transitions; no React, DOM, or storage dependencies.
- `client/src/content/`: card definitions and the explicit prototype profile/encounter fixture.
- `client/src/components/`: battlefield, resources, cards, previews, and native dialogs rendered by React.
- `client/src/hooks/useBattle.ts`: synchronous input guards, transient action feedback, and battle orchestration.
- `client/src/persistence/`: optional tutorial preference storage, retaining its original key.
- `client/src/App.tsx`: screen composition, focus management, and modal selection.
- `style.css`: shared visual layout and reduced-motion rules. Artwork source files and provenance remain in `assets/`; Vite bundles only imported assets.
- `tests/`: combat, preferences, and reproducible balance simulation.

Edit source files rather than generated index.html/build files. The build has no public-directory copying and no source maps; it does not copy planning notes or unrelated repository files. Private design documents and local scratch work remain ignored by Git.

## Configurable battles and development fixtures

`createBattle(profile, encounter, seed)` takes copied character resources/maxima and deck instances plus encounter-specific enemy HP, intentions, energy and hand size. Battle state retains its own configuration; rendering, previews, help, turn transitions and outcome summaries read it. `newBattle(seed)` remains a compatibility entry for the original prototype. App/useBattle consumes setup once per mounted session; remount with a new key to switch setups. Restart retains the session's starting profile/encounter and uses a fresh shuffle; this is not campaign retry or autosave.

With `npm run dev` running, open `/fixtures.html` at its local URL (normally http://127.0.0.1:5173/fixtures.html). Select Original prototype or Cooling rig to exercise the same engine and interface. The synthetic rig uses existing artwork, a seven-card deck, partial 42/48 HP and 3/6 MP, two energy, three-card draws, and a different two-action intention cycle. It is test content, not an opening-chapter encounter. Fixture controls and definitions are absent from the generated production runtime and the normal entry has no fixture selector.

Inputs are validated before starting, including resource bounds, nonempty intentions, nonnegative integer effects, known card types and unique instance IDs. Battle creation and transitions do not mutate the caller's profile, deck or encounter. Equipment bonuses, campaign progression, teacher scenes and saves remain separate work.

## Signature technique and MP preparation hooks

Kiln Pulse supports an optional `tempered-flow` upgrade on its existing instance. It retains its name, art, 2-energy cost, 16 damage and 6 block, while costing 3 MP and adding 3 strain instead of 4 each. The technique subtitle appears on the card, in piles and in the log. The engine, affordability checks, Help and previews resolve the same definition. Upgraded Pulse still shuffles and can be reused; it has no once-per-battle limit or guaranteed ordinary opening draw.

`learnTemperedFlow(profile, instanceId)` returns an updated profile without changing its input or duplicating the card. Reapplying it to an already trained instance is a no-op. It grants no HP/MP, reward or story progress. `recoverMP(profile, amount)` provides explicit capped recovery; callers can request partial recovery or `profile.maxMp` for a full refill. Neither helper is automatically called after combat. Campaign eligibility, one-time claims, training scenes and recovery economy belong to later packages.

On the development fixture page, choose **Signature technique**, then **Start trained test battle**. It compares MP/strain costs and starts a fresh test with the same owned signature. Its normal seeded opening hand happens to contain Pulse; this does not change ordinary draws. At 3 MP the base card is disabled and its trained counterpart is playable. This is a development demonstration, not an implemented teacher encounter or player-facing upgrade menu. The normal prototype continues with the base signature.

## Controls and rules

- Click a card to play it; attacks automatically target the guardian. Tab and Enter/Space work too. Hover or focus a card for its effect and strain preview.
- Start with 60 HP, 10 MP, 3 energy, and 5 cards. Guardian starts with 72 HP.
- Kiln Pulse is a normal reusable card: 2 energy, 4 MP, 16 damage, 6 block, and +4 strain. It is not guaranteed in the opening hand. MP persists between turns and resets on a fresh battle; basic cards need no MP.
- At 6–9 strain, attacks gain 2 damage, evaluated before adding the card's strain. At 10 strain, lose 6 unblockable HP and reset strain to 4.
- End turn discards your hand, cools 3 strain, and resolves the enemy intention. Then your block expires, energy refills, and you draw 5.
- Guardian repeats 8 attack -> 6 block and 4 attack -> 14 attack. Its block lasts through your turn, then expires before its next action.
- Empty draw piles reshuffle the discard pile. Pressure Cycle cannot draw itself while resolving.
- Complete the card and overload before checking the outcome. Simultaneous defeat is a loss.
- Inspect piles without revealing draw order; the battle log keeps the latest 30 actions. Restart asks for confirmation.
- Reloading starts a fresh battle. Only tutorial dismissal persists, using `kiln-courier.tutorial-complete.v1`. Unavailable storage does not interrupt play.

Actions preserve revision guards and ignore double clicks, repeated keydown, or input during short feedback animations. Motion follows the operating system's reduced-motion preference. Small screens receive a wrapping fallback; desktop remains the primary layout.

## Verification baseline

The current 39 tests cover combat, resource costs, reusable Kiln Pulse, Tempered Flow identity/effects, capped MP preparation, configurable profiles/encounters, input isolation/validation, reshuffling, input revisions, terminal outcomes, card conservation, and optional storage. Type checking and production asset verification run with `npm run check`.

The original TypeScript migration matched every state across 100 seeded battles and 3,022 actions. The subsequent MP/signature addition intentionally changes the starting deck. Current balance simulations over 100 seeds per policy: aggressive 4.06 turns / 43.83 HP remaining; defensive 4.66 turns / 52.21 HP; heat-aware 4.21 turns / 49.72 HP. All three policies won 100 battles. These simulations do not establish human pacing.

The configurable-battle change preserved the pre-change prototype across 100 seeds and 2,593 transitions, including previews, RNG, piles, logs and outcomes. Its three playtest policies also retained identical results.

After adding the optional technique, base-signature results and that transition parity remain unchanged. Trained-signature simulations at the same HP/MP maxima: aggressive 4.01 turns / 46.07 HP, defensive 4.64 / 53.27, heat-aware 4.11 / 49.91; all won 100/100. Mean overloads fell from 0.70/0.37/0.35 to 0.43/0.15/0.22 respectively. These compare the technique alone, without milestone growth, and do not establish human pacing or campaign balance.

## Artwork

The hero, guardian, environment, and shared card-art atlas were generated for this project using the built-in OpenAI image-generation tool. The atlas contains seven card illustrations and two deck backs; all costs/effects are real rendered text, not baked into artwork. The kiln mark is original SVG geometry. No third-party fonts or audio are bundled. See [asset provenance and prompts](assets/PROVENANCE.md).
